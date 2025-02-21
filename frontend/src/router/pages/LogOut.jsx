// src/App.jsx
import { useAuth } from "react-oidc-context";
// import getEnv from "@/config/getEnv";

function App() {
  const auth = useAuth();

  function logOut() {
    auth.stopSilentRenew();
    auth.clearStaleState();
    auth.signoutRedirect();
  }

  // function logOutManual() {
  //   // Manually clear cookies
  //   const cookiesToClear = [
  //     "AUTH_SESSION_ID",
  //     "AUTH_SESSION_ID_LEGACY",
  //     "FAILREASON",
  //     "KEYCLOAK_IDENTITY",
  //     "KEYCLOAK_IDENTITY_LEGACY",
  //     "KEYCLOAK_SESSION",
  //     "KEYCLOAK_SESSION_LEGACY",
  //     "SMSESSION",
  //   ];

  //   cookiesToClear.forEach((cookieName) => {
  //     document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  //   });

  //   // Manually clear session storage
  //   sessionStorage.clear();

  //   // Manually go to the logout page
  //   window.location.href = `${getEnv("VITE_OIDC_AUTHORITY")}/protocol/openid-connect/logout?redirect_uri=${window.location.origin}`;
  // }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Auth error: {auth.error.message}</div>;
  }

  return (
    <div>
      <button type="button" onClick={logOut}>
        Log out {auth.user?.profile.sub}
      </button>
    </div>
  );
}

export default App;
