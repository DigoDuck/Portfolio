import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"
import "./i18n/index.js"

const savedPrefs = JSON.parse(localStorage.getItem('portfolio-preferences') || '{}')
if (savedPrefs?.state?.theme === 'dark') {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)