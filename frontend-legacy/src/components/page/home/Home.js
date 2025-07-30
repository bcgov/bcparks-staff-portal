import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { useKeycloak } from "@react-keycloak/web";
import { Button } from "../../shared/button/Button";
import Header from "../../composite/header/Header";
import "./Home.css";
import config from "../../../utils/config";
import OpenInNew from "@material-ui/icons/OpenInNew";

export default function Home({ page: { setError } }) {
  const { initialized, keycloak } = useKeycloak();
  const [toDashboard, setToDashboard] = useState(false);

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
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
  }, [initialized, keycloak]);

  if (toDashboard) {
    return (
      <Redirect
        to={{
          pathname: `/advisories`,
          index: 0,
        }}
      />
    );
  }

  return (
    <main>
      <Header />
      <div className="Home" data-testid="Home">
        <div className="container hm-container">
          <h1>Staff web portal</h1>
          <p>Select the ID you want to use to log into the Staff web portal</p>
          <div className="row">
            <div className="col-lg-4"></div>
            <div className="col-lg-4">
              <form className="form-home">
                <div className="container-fluid ad-form">
                  {/* <div className="row hm-row ">
                    <Button
                      onClick={() =>
                        keycloak.login({
                          redirectUri: `${config.REACT_APP_FRONTEND_BASE_URL}/advisories`,
                          idpHint: "bcsc",
                        })
                      }
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
                      onClick={() =>
                        keycloak.login({
                          redirectUri: `${config.REACT_APP_FRONTEND_BASE_URL}/advisories`,
                          idpHint: "bceid",
                        })
                      }
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
                      onClick={() =>
                        keycloak.login({
                          redirectUri: `${config.REACT_APP_FRONTEND_BASE_URL}/advisories`,
                          idpHint: "idir",
                        })
                      }
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
