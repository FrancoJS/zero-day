// Configuración del mapa del encargado (Leaflet + OpenStreetMap). Cambiar aquí, no en MapaSectores.jsx.
// Las tiles las descarga el NAVEGADOR directo del proveedor: la demo necesita internet.
// Política de OpenStreetMap: uso liviano y atribución visible. Para un piloto: proveedor con cuenta o tiles propias.
export const CONFIG_MAPA = {
  centro: [-34.1705, -70.7407], // Plaza de los Héroes, Rancagua
  zoomInicial: 13,
  zoomMaximoAjuste: 14, // tope al encuadrar los sectores (fitBounds)
  margenAjuste: [48, 48],
  tiles: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    atribucion: "© OpenStreetMap",
    zoomMaximo: 18,
  },
};
