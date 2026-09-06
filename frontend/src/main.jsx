import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"
// Importar o i18n carrega o store, que reidrata de forma síncrona e já aplica o
// tema e o idioma persistidos. Por isso não há leitura de localStorage aqui: uma
// segunda cópia dessa lógica só voltaria a divergir (e um JSON inválido derrubava
// o boot inteiro).
import "./i18n/index.js"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
