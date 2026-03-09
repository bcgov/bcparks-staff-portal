import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "@digitalspace/bcparks-bootstrap-theme/dist/css/bootstrap-theme.min.css";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "./components/page.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
