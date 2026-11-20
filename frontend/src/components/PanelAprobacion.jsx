import Boton from "./Boton";
import Icono from "./Iconos";
import Insignia from "./Insignia";

/**
 * Propuesta de acción con humano en el circuito (diseño 04, columna derecha). Va dentro de una Tarjeta.
 * La IA propone; la persona aprueba, edita o rechaza. Nada se ejecuta sin aprobación.
 * @param {object} props
 * @param {React.ReactNode} props.accion  qué se propone hacer (una frase)
 * @param {{tono: "ok"|"adv"|"parcial"|"critico", texto: string}} [props.riesgo]  se muestra como Insignia con ícono
 * @param {{etiqueta: string, valor: React.ReactNode}[]} [props.ficha]  ej. Afecta, Responsable, Reversa, Éxito si
 * @param {() => void} [props.onAprobar]
 * @param {() => void} [props.onEditar]  si falta, no se muestra el botón
 * @param {() => void} [props.onRechazar]  si falta, no se muestra el botón
 * @param {string} [props.textoAprobar="Aprobar y ejecutar"]
 * @param {boolean} [props.simulado]  agrega "ejecución simulada en la demo" a la nota (decirlo SIEMPRE si lo es)
 * @param {boolean} [props.deshabilitado]  ej. mientras no hay diagnóstico
 * @param {string} [props.motivoDeshabilitado]  ej. "Esperando diagnóstico"
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
    <div className="flex h-full flex-col gap-3.5">
      <p className="text-[22px] font-bold leading-snug text-texto">{accion}</p>
      {riesgo && (
        <Insignia tono={riesgo.tono} icono={iconoRiesgo} className="self-start">
          {riesgo.texto}
        </Insignia>
      )}
      {ficha.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-xl bg-sutil px-4 py-3 text-base">
          {ficha.map((fila) => (
            <div key={fila.etiqueta} className="contents">
              <dt className="font-semibold text-texto2">{fila.etiqueta}</dt>
              <dd className="text-texto">{fila.valor}</dd>
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
          <Boton icono="editar" ancho onClick={onEditar} disabled={deshabilitado} className={onRechazar ? "" : "col-span-2"}>
            Editar
          </Boton>
        )}
        {onRechazar && (
          <Boton variante="peligro" icono="cruz" ancho onClick={onRechazar} disabled={deshabilitado} className={onEditar ? "" : "col-span-2"}>
            Rechazar
          </Boton>
        )}
      </div>
      <p className="flex items-start gap-2 text-[15px] leading-snug text-texto2">
        <Icono nombre="candado" className="mt-0.5 h-[18px] w-[18px]" />
        <span>
          Nada se ejecuta sin tu aprobación{simulado ? " · ejecución simulada en la demo" : ""}
        </span>
      </p>
    </div>
  );
}
