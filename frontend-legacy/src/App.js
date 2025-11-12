import React from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./components/keycloak";
import AppRouter from "./routes/AppRouter";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();
const isFirefox = typeof InstallTrigger !== 'undefined';

// detect the identity provider (IDP) from the Keycloak token
function onAuthSuccess(keycloak) {
  const pu = keycloak?.tokenParsed?.preferred_username || "";
  let idp = "";
  if (pu.endsWith("@idir")) idp = "idir";
  else if (pu.endsWith("@bcsc")) idp = "bcsc";
  else if (pu.endsWith("@bceidboth")) idp = "bceid";
  if (idp) {
    sessionStorage.setItem("login_idp", idp);
  }
}

function App() {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={isFirefox ? { checkLoginIframe: false } : {}}
      onEvent={(event) => {
        if (event === "onAuthSuccess") {
          onAuthSuccess(keycloak);
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <AppRouter />
        </div>
      </QueryClientProvider>
    </ReactKeycloakProvider>
  );
}

export default App;
