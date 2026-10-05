import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts come in through JS so Vite resolves their asset URLs.
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/martian-mono";
import "@fontsource-variable/instrument-sans";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
