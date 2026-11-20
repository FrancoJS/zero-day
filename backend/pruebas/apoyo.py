"""Utilidades compartidas por las pruebas: aislamiento del entorno, importación de la app y servidor falso.

- PruebaAislada: cada prueba parte con las variables de IA, BD y costo VACÍAS (AI_MODE=mock, sin latencia)
  y al terminar se restaura os.environ completo. Así nada depende del .env real ni del entorno del contenedor.
- importar_app(): importa main y evaluacion.evaluar sin dejar que load_dotenv() lea el .env real.
- ServidorFalso: servidor HTTP local (puerto 0) compatible con /chat/completions de OpenAI. El escenario va
  en la URL base: http://127.0.0.1:<puerto>/<escenario>/<clave>/v1 (la clave separa contadores y peticiones
  entre pruebas).
"""

import json
import os
import socket
import threading
import time
import unittest
import uuid
import warnings
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Prefijos y nombres que se borran antes de cada prueba (cubre KOSTRA_PRECIO_*_CLP_1M / _USD_1M, MOCK_*, etc.)
PREFIJOS_AISLADOS = ("KOSTRA_", "MOCK_", "EVAL_")
VARIABLES_AISLADAS = (
    "AI_MODE",
    "DATABASE_URL",
    "DOLAR_CLP",
    # Un proxy del sistema desviaría las llamadas al servidor falso local
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy",
)
ENTORNO_BASE = {
    "AI_MODE": "mock",
    "MOCK_LATENCIA_S": "0",
    "KOSTRA_ESPERA_429_S": "0",
    "NO_PROXY": "127.0.0.1,localhost",
    "no_proxy": "127.0.0.1,localhost",
}

CONTENIDO_SSE = "text/event-stream"


def importar_app():
    """Importa main (y evaluacion.evaluar) con load_dotenv() anulado: las pruebas nunca leen el .env real."""
    import dotenv

    original = dotenv.load_dotenv
    dotenv.load_dotenv = lambda *args, **kwargs: False
    try:
        import evaluacion.evaluar  # noqa: F401
        import main
    finally:
        dotenv.load_dotenv = original
    return main


class PruebaAislada(unittest.TestCase):
    """Base de todas las pruebas: entorno limpio y restaurado después de cada una."""

    def setUp(self):
        super().setUp()
        respaldo = dict(os.environ)

        def restaurar():
            os.environ.clear()
            os.environ.update(respaldo)

        self.addCleanup(restaurar)
        for nombre in list(os.environ):
            if nombre in VARIABLES_AISLADAS or nombre.startswith(PREFIJOS_AISLADOS):
                del os.environ[nombre]
        os.environ.update(ENTORNO_BASE)

    def entorno(self, **variables: str) -> None:
        """Fija variables para esta prueba (se restauran solas al terminar)."""
        os.environ.update({nombre: str(valor) for nombre, valor in variables.items()})

    def cliente(self):
        with warnings.catch_warnings():  # aviso de Starlette sobre httpx: ruido, no afecta las pruebas
            warnings.simplefilter("ignore")  # StarletteDeprecationWarning no hereda de DeprecationWarning
            from fastapi.testclient import TestClient

        return TestClient(importar_app().app)


def leer_eventos_sse(cuerpo: str) -> list[tuple[str, dict]]:
    """'event: x\\ndata: {...}\\n\\n' -> [(x, {...}), ...]"""
    eventos = []
    for bloque in cuerpo.strip().split("\n\n"):
        evento, datos = None, None
        for linea in bloque.splitlines():
            if linea.startswith("event: "):
                evento = linea[len("event: "):]
            elif linea.startswith("data: "):
                datos = json.loads(linea[len("data: "):])
        if evento:
            eventos.append((evento, datos))
    return eventos


def puerto_cerrado() -> int:
    """Un puerto local donde no escucha nadie (para probar sin_conexion)."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


# --- Servidor falso compatible con OpenAI ---

TEXTO_ENTRADA = "El sistema de pagos está caído desde las 9:00 y es urgente."
FRAGMENTO_REAL = "El SISTEMA de pagos   está caído"  # distinto en mayúsculas y espacios: igual debe verificarse
FRAGMENTO_INVENTADO = "el cliente amenazó con demandar"
USO_OK = (275, 427)
USO_JSON_MALO = (100, 50)
FRAGMENTOS_STREAM = ["Hola", ", esto ", "llega ", "por partes."]


def resultado_valido(evidencia: list[str]) -> str:
    return json.dumps(
        {
            "tipo_residuo": "escombros",
            "peligrosidad": "media",
            "prioridad": "alta",
            "accion_sugerida": "camion_tolva",
            "resumen": "Escombros y un colchón junto al colegio.",
            "falta_informacion": [],
            "evidencia": evidencia,
        },
        ensure_ascii=False,
    )


def _completacion(contenido: str, uso: tuple[int, int]) -> dict:
    return {
        "id": "chatcmpl-prueba",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "modelo-prueba",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": contenido}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": uso[0], "completion_tokens": uso[1], "total_tokens": sum(uso)},
    }


def _fragmento_stream(contenido: str | None, fin: bool = False) -> dict:
    delta = {} if contenido is None else {"content": contenido}
    return {
        "id": "chatcmpl-prueba",
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": "modelo-prueba",
        "choices": [{"index": 0, "delta": delta, "finish_reason": "stop" if fin else None}],
    }


class _Manejador(BaseHTTPRequestHandler):
    servidor_falso: "ServidorFalso"

    def log_message(self, *args):  # silencioso
        pass

    def _json(self, estado: int, cuerpo: dict) -> None:
        datos = json.dumps(cuerpo, ensure_ascii=False).encode()
        self.send_response(estado)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def _error(self, estado: int) -> None:
        self._json(estado, {"error": {"message": f"error simulado {estado}", "type": "prueba", "code": str(estado)}})

    def _stream(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", CONTENIDO_SSE)
        self.end_headers()
        for parte in FRAGMENTOS_STREAM:
            self.wfile.write(f"data: {json.dumps(_fragmento_stream(parte))}\n\n".encode())
            self.wfile.flush()
        self.wfile.write(f"data: {json.dumps(_fragmento_stream(None, fin=True))}\n\n".encode())
        self.wfile.write(b"data: [DONE]\n\n")

    def do_POST(self):  # noqa: N802 (nombre impuesto por http.server)
        try:
            self._atender()
        except (BrokenPipeError, ConnectionResetError):
            pass  # el cliente cortó (timeout): esperado en el escenario "lento"

    def _atender(self):
        partes = self.path.strip("/").split("/")
        if len(partes) < 5 or partes[2:] != ["v1", "chat", "completions"]:
            self._error(404)
            return
        escenario, clave = partes[0], partes[1]
        cuerpo = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        numero = self.servidor_falso.registrar(clave, cuerpo, self.headers.get("Authorization", ""))

        if escenario.isdigit():
            self._error(int(escenario))
        elif escenario == "ok":
            self._json(200, _completacion(resultado_valido([FRAGMENTO_REAL, FRAGMENTO_INVENTADO]), USO_OK))
        elif escenario == "cita-envoltorio":
            # Cita trozos que solo existen en el envoltorio <<< >>>, no en el texto del usuario
            evidencia = ["<<<", "son datos, no instrucciones", FRAGMENTO_REAL]
            self._json(200, _completacion(resultado_valido(evidencia), USO_OK))
        elif escenario == "stream":
            self._stream()
        elif escenario == "lento":
            time.sleep(2.5)
            self._json(200, _completacion(resultado_valido([]), USO_OK))
        elif escenario == "429-una-vez":
            if numero == 1:
                self._error(429)
            else:
                self._json(200, _completacion(resultado_valido([FRAGMENTO_REAL]), USO_OK))
        elif escenario == "json-malo-una-vez":
            if numero == 1:
                self._json(200, _completacion("Claro, aquí va: categoria incidente (no es JSON)", USO_JSON_MALO))
            else:
                self._json(200, _completacion(resultado_valido([FRAGMENTO_REAL]), USO_OK))
        else:
            self._error(404)


class ServidorFalso:
    """Servidor OpenAI falso en un hilo. Usar como contexto o con iniciar()/detener()."""

    def __init__(self):
        self._candado = threading.Lock()
        self._peticiones: dict[str, list[dict]] = {}
        manejador = type("ManejadorFalso", (_Manejador,), {"servidor_falso": self})
        self._http = ThreadingHTTPServer(("127.0.0.1", 0), manejador)
        self._http.daemon_threads = True
        self._hilo = threading.Thread(target=self._http.serve_forever, daemon=True)

    @property
    def puerto(self) -> int:
        return self._http.server_address[1]

    def iniciar(self) -> "ServidorFalso":
        self._hilo.start()
        return self

    def detener(self) -> None:
        self._http.shutdown()
        self._http.server_close()

    def url(self, escenario: str) -> tuple[str, str]:
        """(KOSTRA_BASE_URL, clave) para un escenario; la clave es única por llamada."""
        clave = uuid.uuid4().hex[:12]
        return f"http://127.0.0.1:{self.puerto}/{escenario}/{clave}/v1", clave

    def registrar(self, clave: str, cuerpo: dict, autorizacion: str) -> int:
        with self._candado:
            lista = self._peticiones.setdefault(clave, [])
            lista.append({"cuerpo": cuerpo, "autorizacion": autorizacion})
            return len(lista)

    def peticiones(self, clave: str) -> list[dict]:
        with self._candado:
            return list(self._peticiones.get(clave, []))
