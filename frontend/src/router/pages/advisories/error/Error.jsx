import { useState } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import "@/router/pages/advisories/page.scss";
import { Button } from "@/components/advisories/shared/button/Button";

export default function Error({ error }) {
  const [toHome, setToHome] = useState(false);

  if (toHome || error?.status === 401) {
    return <Navigate to="/" />;
  }

  if (error?.status === 403 && error?.message === "Unauthorized") {
    return <Navigate to="/unauthorized" />;
  }

  let errorContent;

  if (!error) {
    errorContent = (
      <div>
        <h1>Service is currently unavailable</h1>
        <p>Please try again later.</p>
      </div>
    );
  } else if (error.status === 403) {
    if (error.message === "Login failed") {
      errorContent = (
        <div>
          <h1>Login failed</h1>
          <p>Unable to login, please try again later.</p>
        </div>
      );
    } else {
      errorContent = (
        <div>
          <h1>Unauthorized entry</h1>
          <p>
            Unauthorized user entry, please return to the home page and begin
            your session again.
          </p>
        </div>
      );
    }
  } else if (error.status === 590) {
    errorContent = (
      <div>
        <h1>Your session has expired</h1>
        <p>Please return to the home page and begin your session again.</p>
      </div>
    );
  } else {
    errorContent = (
      <div>
        <h1>An unknown error has occurred</h1>
        <p>
          The error description is below. If this error persists, please try
          again later.
          <br />
          <br />
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <main className="advisories-styles">
      <div className="page" data-testid="Error">
        <div className="container error-page-container">
          <br />
          {errorContent}
          <br />
          <div className="buttons">
            <Button
              label="Home"
              styling="btn-primary btn"
              onClick={() => {
                setToHome(true);
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

Error.propTypes = {
  error: PropTypes.object.isRequired,
};
