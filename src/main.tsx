import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts and vendor CSS come in through JS so Vite resolves their asset URLs.
import "@fontsource-variable/martian-mono";
import "@fontsource-variable/instrument-sans";
import "keen-slider/keen-slider.min.css";
import "./index.css";
import App from "./App.tsx";

// The theme is applied by an inline script in index.html, before first paint.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
