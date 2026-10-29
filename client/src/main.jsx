import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
            fontFamily: "Onest, system-ui, sans-serif",
            fontSize: "14px",
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
