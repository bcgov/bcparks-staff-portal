import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import router from "@/router";
import ProtectedRoute from "@/router/ProtectedRoute";
import { AuthProvider } from "react-oidc-context";
import { oidcConfig, onSigninCallback } from "@/config/keycloak.js";

// include global styles
import "@/styles/global.scss";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider onSigninCallback={onSigninCallback} {...oidcConfig}>
      <QueryClientProvider client={queryClient}>
        <ProtectedRoute>
          <RouterProvider
            router={router}
            future={{
              // eslint-disable-next-line camelcase -- vendor flag
              v7_startTransition: true,
            }}
          />
        </ProtectedRoute>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
