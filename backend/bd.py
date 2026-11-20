"""Base de datos OPCIONAL (SQLAlchemy 2.0).

DATABASE_URL vacía o ausente -> BD "desactivada": no se conecta a nada y la app funciona igual.
DATABASE_URL=postgresql://usuario:clave@host:5432/base -> se usa psycopg 3 (se reescribe a postgresql+psycopg://).
Las tablas se crean solas la primera vez que la BD responde (Postgres puede arrancar después del backend).

Nunca se registra la URL en los logs: contiene la contraseña.
"""

import logging
import os

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session

registro = logging.getLogger("zeroday.bd")

_motores: dict[str, Engine] = {}  # un motor por URL (permite cambiar DATABASE_URL en pruebas)
_tablas_listas: set[str] = set()  # URLs donde create_all ya funcionó


class Base(DeclarativeBase):
    """Base de todos los modelos ORM (ver modelos.py)."""


class ErrorBaseDatos(Exception):
    """La BD está activada pero no responde. main.py la traduce a 503 {codigo: bd_error}."""


def url_bd() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    for prefijo in ("postgresql://", "postgres://"):
        if url.startswith(prefijo):
            return "postgresql+psycopg://" + url[len(prefijo) :]
    return url


def bd_activa() -> bool:
    return bool(url_bd())


def _motor() -> Engine | None:
    url = url_bd()
    if not url:
        return None
    if url not in _motores:
        argumentos = {"connect_timeout": 5} if url.startswith("postgresql") else {}
        try:
            _motores[url] = create_engine(url, pool_pre_ping=True, connect_args=argumentos)
        except Exception as error:  # URL mal escrita o driver faltante
            registro.warning("DATABASE_URL inválida (%s). La BD queda con error.", type(error).__name__)
            return None
    return _motores[url]


def preparar_tablas() -> bool:
    """Crea las tablas una sola vez. Si falla (BD aún apagada), se reintenta en la próxima llamada."""
    motor = _motor()
    if motor is None:
        return False
    if url_bd() in _tablas_listas:
        return True
    import modelos  # noqa: F401  (registra los modelos en Base.metadata)

    try:
        Base.metadata.create_all(motor)
    except Exception as error:
        registro.warning("No se pudo conectar a la base de datos (%s). Se reintentará.", type(error).__name__)
        return False
    _tablas_listas.add(url_bd())
    return True


def estado_bd() -> str:
    """'desactivada' | 'conectada' | 'error'."""
    if not bd_activa():
        return "desactivada"
    if not preparar_tablas():
        return "error"
    try:
        with _motor().connect() as conexion:
            conexion.execute(text("SELECT 1"))
    except Exception as error:
        registro.warning("La base de datos no responde (%s).", type(error).__name__)
        return "error"
    return "conectada"


def abrir_sesion() -> Session:
    """Sesión lista para usar con `with`. Lanza ErrorBaseDatos si la BD no está disponible."""
    if not preparar_tablas():
        raise ErrorBaseDatos("La base de datos no está disponible.")
    return Session(_motor(), expire_on_commit=False)
