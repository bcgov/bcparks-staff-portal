export function NoParkAccess() {
  return (
    <div className="layout my-5">
      <div className="container error-page-container">
        <h1>No parks found</h1>
        <p>
          You’ve successfully signed in, but your account hasn’t yet been
          granted access to any parks.
        </p>
        <p>
          To add parks, contact{" "}
          <a href="mailto:cardweb@gov.bc.ca?subject=No%20park%20access%20assigned">
            cardweb@gov.bc.ca
          </a>
          .
        </p>
      </div>
    </div>
  );
}
