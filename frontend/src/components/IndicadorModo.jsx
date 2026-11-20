import { useEffect, useState } from "react";
import { obtenerSalud } from "../api";
import Insignia from "./Insignia";

/**
 * Muestra siempre si la IA es real (Kostra LIVE) o simulada (MOCK) y el estado de la base de datos.
 * Consulta /api/health al montarse. Para mostrarlo con datos fijos (galería) usar InsigniasModo.
 */
export default function IndicadorModo() {
  const [salud, setSalud] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    obtenerSalud()
      .then(setSalud)
      .catch(() => setError(true));
  }, []);

  return <InsigniasModo salud={salud} error={error} />;
}

/**
 * Vista sin red del indicador.
 * @param {object} props
 * @param {{modo_ia: "live"|"mock", modelo: string, base_datos: "conectada"|"error"|"desactivada"} | null} props.salud  null = conectando
 * @param {boolean} [props.error]  backend sin conexión
 */
export function InsigniasModo({ salud, error }) {
  if (error) {
    return (
      <Insignia forma="pastilla" tono="critico" icono="cruz">
        Backend sin conexión
      </Insignia>
    );
  }
  if (!salud) {
    return (
      <Insignia forma="pastilla" tono="neutro" punto>
        Conectando…
      </Insignia>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {salud.modo_ia === "live" ? (
        <Insignia forma="pastilla" tono="ok" punto pulso>
          Kostra LIVE · {salud.modelo}
        </Insignia>
      ) : (
        <Insignia forma="pastilla" tono="adv" punto>
          MOCK · respuestas simuladas
        </Insignia>
      )}
      <InsigniaBaseDatos estado={salud.base_datos} />
    </div>
  );
}

function InsigniaBaseDatos({ estado }) {
  if (estado === "conectada") {
    return (
      <Insignia forma="pastilla" tono="ok" punto>
        BD conectada
      </Insignia>
    );
  }
  if (estado === "error") {
    return (
      <Insignia forma="pastilla" tono="critico" icono="alerta">
        BD con error
      </Insignia>
    );
  }
  return (
    <Insignia forma="pastilla" tono="neutro" punto>
      BD desactivada
    </Insignia>
  );
}
