import { useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";

function AuthTest() {
  const auth = useAuth();

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
    default:
      break;
  }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        Hello, {auth.user?.profile.name} <br />
        You&rsquo;re logged in and your keycloak ID is {
          auth.user?.profile.sub
        }{" "}
        <br />
        <button onClick={() => void auth.signoutRedirect()}>Log out</button>
      </div>
    );
  }

  return <button onClick={() => void auth.signinRedirect()}>Log in</button>;
}

export default function FooPage() {
  const params = useParams();

  return (
    <div id="foo page">
      <h1>Protected: Foo page {params.fooId}!</h1>

      <AuthTest />
    </div>
  );
}
