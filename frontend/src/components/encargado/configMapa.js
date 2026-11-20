// Configuración del mapa del encargado (Leaflet + OpenStreetMap oficial sin API key).
export const CONFIG_MAPA = {
  centro: [-34.1705, -70.7407], // Plaza de los Héroes, Rancagua
  zoomInicial: 13,
  zoomMaximoAjuste: 14,
  margenAjuste: [36, 36],
  tiles: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    atribucion: "© OpenStreetMap",
    zoomMaximo: 18,
  },
};
