import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import store from "./store";
import { Provider as StoreProvider } from "react-redux";
import { AuthProvider } from "react-oidc-context";
import oidcConfig from "./config/keycloak.js";

import "./global.scss";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <StoreProvider store={store}>
        <RouterProvider router={router} />
      </StoreProvider>
    </AuthProvider>
  </StrictMode>,
);
