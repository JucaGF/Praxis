/**
 * Ponto de entrada da aplicação React
 * 
 * Este arquivo é o ponto de entrada principal da aplicação frontend.
 * Responsável por:
 * - Renderizar o componente App na raiz do DOM
 * - Configurar React StrictMode para desenvolvimento
 * - Importar estilos globais
 * 
 * @module main
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./App.css";

/**
 * Renderiza a aplicação React na raiz do DOM
 * 
 * Usa ReactDOM.createRoot (React 18+) para renderização concorrente.
 * React.StrictMode ajuda a identificar problemas durante desenvolvimento.
 * 
 * @see https://react.dev/reference/react/StrictMode
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
