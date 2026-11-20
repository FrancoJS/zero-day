import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// /?galeria muestra el kit de componentes con datos de ejemplo (sin router: solo este chequeo).
const Galeria = lazy(() => import("./Galeria.jsx"));
const esGaleria = new URLSearchParams(window.location.search).has("galeria");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {esGaleria ? (
      <Suspense fallback={null}>
        <Galeria />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
