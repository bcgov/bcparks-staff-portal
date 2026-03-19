import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "react-oidc-context";
import { Button } from "@/components/advisories/shared/button/Button";
import "./Home.css";
import getEnv from "@/config/getEnv";
import OpenInNew from "@mui/icons-material/OpenInNew";

export default function Home({ page: { setError } }) {
  const auth = useAuth();
  const initialized = !auth.isLoading;
  const [toDashboard, setToDashboard] = useState(false);

  // function to redirect to Keycloak for the selected login provider
  function handleLogin(idp) {
    // redirect to Keycloak login with the selected IDP hint

    auth.signinRedirect({
      // eslint-disable-next-line camelcase -- 'redirect_uri' is required by Keycloak
      redirect_uri: `${getEnv("VITE_FRONTEND_BASE_URL")}/advisories`,
      // eslint-disable-next-line camelcase -- 'kc_idp_hint' is required by Keycloak
      extraQueryParams: { kc_idp_hint: "idir" },
    });
  }

  useEffect(() => {
    if (initialized && auth.isAuthenticated) {
      setToDashboard(true);
    } else {
      // If the user is logged out,
      // Remove keycloak tokens from session storage (used by the v2 staff portal).
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("oidc.")) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [initialized, auth.isAuthenticated]);

  if (toDashboard) {
    return (
      <Navigate
        to={{
          pathname: `/advisories`,
          index: 0,
        }}
      />
    );
  }

  return (
    <main>
      <div className="Home" data-testid="Home">
        <div className="container hm-container">
          <h1>Staff web portal</h1>
          <p>Use one of the following methods to log in</p>
          <div className="row">
            <div className="col-lg-4"></div>
            <div className="col-lg-4">
              <form className="form-home">
                <div className="container-fluid ad-form">
                  {/* <div className="row hm-row ">
                    <Button
                      onClick={() => handleLogin("bcsc")}
                      label="Log in with BC Services Card"
                      styling="bcgov-normal-blue btn"
                    />
                    <a
                      className="mt-1"
                      href="https://www2.gov.bc.ca/gov/content/governments/government-id/bcservicescardapp/setup"
                    >
                      <OpenInNew className="me-1" />
                      Set up the BC Services Card App
                    </a>
                  </div> */}
                  <div className="row hm-row ">
                    <Button
                      onClick={() => handleLogin("bceid")}
                      label="Log in with BCeID"
                      styling="bcgov-normal-blue btn"
                    />
                    <a
                      className="mt-1"
                      href="https://www.bceid.ca/os/?11849"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNew className="me-1" />
                      Register for a BCeID
                    </a>
                  </div>
                  <div className="row hm-row">
                    <Button
                      onClick={() => handleLogin("idir")}
                      label="Log in with IDIR"
                      styling="bcgov-normal-blue btn"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div>
            <p>
              Can't login? Contact the web team at{" "}
              <a href="mailto:parksweb@gov.bc.ca">parksweb@gov.bc.ca</a>.
            </p>
            <p>
              If you are a park operator looking to report an advisory,
              <br />
              please contact your regional staff representative.
              <br />
              <br />
              Business hours of the web team: <br />
              Monday&ndash;Friday, 8:30am&ndash;4:30pm
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

Home.propTypes = {
  page: PropTypes.shape({
    setError: PropTypes.func.isRequired,
  }).isRequired,
};
