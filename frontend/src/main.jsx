import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "@/router";
import ProtectedRoute from "@/router/ProtectedRoute";
import { AuthProvider } from "react-oidc-context";
import { oidcConfig, onSigninCallback } from "@/config/keycloak.js";

// include global styles
import "@/styles/global.scss";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider onSigninCallback={onSigninCallback} {...oidcConfig}>
      <ProtectedRoute>
        <RouterProvider router={router} />
      </ProtectedRoute>
    </AuthProvider>
  </StrictMode>,
);
