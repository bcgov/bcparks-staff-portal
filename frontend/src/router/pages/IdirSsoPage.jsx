import { useEffect } from "react";
import { useAuth, hasAuthParams } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function IdirSsoPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const hasError = params.has("error");

  // If auth succeeds (callback lands here), navigate to home
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    // Don't redirect if already authenticated, if there's an error, or if we're
    // processing an auth callback (code + state in the URL)
    if (auth.isAuthenticated || hasError || hasAuthParams()) return;

    auth.signinRedirect({
      extraQueryParams: { kc_idp_hint: "idir" },
      redirect_uri: `${window.location.origin}/idir-sso`,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  return (
    <div className="container text-center mt-5">
      <h2>Please wait...</h2>
      <p>
        You are being redirected for single sign-on with IDIR.
        <br />
        {hasError ? (
          <>
            <span>Automatic sign-in failed. </span>
            <a href="/login">Log in here</a>.
          </>
        ) : (
          <span>
            If nothing happens, <a href="/login">log in here</a>.
          </span>
        )}
      </p>
    </div>
  );
}
