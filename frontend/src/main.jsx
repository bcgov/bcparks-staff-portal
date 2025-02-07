import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { AuthProvider } from "react-oidc-context";
import oidcConfig from "./config/keycloak.js";

// include global styles
import "@/styles/global.scss";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
