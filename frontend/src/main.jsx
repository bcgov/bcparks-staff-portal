import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import store from "./store";
import { Provider as StoreProvider } from "react-redux";
import { AuthProvider } from "react-oidc-context";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import oidcConfig from "./config/keycloak.js";

// include global styles
import "./global.scss";

// include fontawesome icons globally
library.add(fas, far);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <StoreProvider store={store}>
        <RouterProvider router={router} />
      </StoreProvider>
    </AuthProvider>
  </StrictMode>,
);
