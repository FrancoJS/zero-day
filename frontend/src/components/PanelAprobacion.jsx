import Boton from "./Boton";
import Icono from "./Iconos";
import Insignia from "./Insignia";

/**
 * Propuesta de acción con humano en el circuito (DESING.md §2.1, §2.2, §6.2).
 * La IA propone; la persona encargada aprueba, edita o rechaza.
 */
export default function PanelAprobacion({
  accion,
  riesgo,
  ficha = [],
  onAprobar,
  onEditar,
  onRechazar,
  textoAprobar = "Aprobar y ejecutar",
  simulado,
  deshabilitado,
  motivoDeshabilitado,
}) {
  const iconoRiesgo = riesgo?.tono === "ok" ? "check" : riesgo?.tono === "critico" ? "error" : "alerta";
  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">{accion}</p>
      {riesgo && (
        <Insignia tono={riesgo.tono} icono={iconoRiesgo} className="self-start">
          {riesgo.texto}
        </Insignia>
      )}
      {ficha.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-xl border border-rose-200/80 bg-rose-50/25 px-4 py-3 text-sm dark:border-rose-900/40 dark:bg-gray-800/40">
          {ficha.map((fila) => (
            <div key={fila.etiqueta} className="contents">
              <dt className="font-semibold text-[#8C1D28] dark:text-rose-300">{fila.etiqueta}</dt>
              <dd className="text-gray-800 dark:text-gray-200">{fila.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-1">
        <Boton
          variante="primario"
          tamano="grande"
          icono="check"
          ancho
          className="col-span-2"
          onClick={onAprobar}
          disabled={deshabilitado}
          motivoDeshabilitado={motivoDeshabilitado}
        >
          {deshabilitado && motivoDeshabilitado ? `Aprobar · ${motivoDeshabilitado.toLowerCase()}` : textoAprobar}
        </Boton>
        {onEditar && (
          <Boton
            icono="editar"
            ancho
            onClick={onEditar}
            disabled={deshabilitado}
            className={onRechazar ? "" : "col-span-2"}
          >
            Editar
          </Boton>
        )}
        {onRechazar && (
          <Boton
            variante="peligro"
            icono="cruz"
            ancho
            onClick={onRechazar}
            disabled={deshabilitado}
            className={onEditar ? "" : "col-span-2"}
          >
            Rechazar
          </Boton>
        )}
      </div>
      <p className="flex items-start gap-2 text-xs leading-snug text-gray-500 dark:text-gray-400">
        <Icono nombre="candado" className="mt-0.5 h-4 w-4 text-[#8C1D28]/80 dark:text-rose-300" />
        <span>
          Nada se ejecuta sin tu aprobación{simulado ? " · ejecución simulada en la demo" : ""}
        </span>
      </p>
    </div>
  );
}
