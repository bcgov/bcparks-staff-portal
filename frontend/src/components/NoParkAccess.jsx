export function NoParkAccess() {
  return (
    <div className="layout my-5">
      <div className="container">
        <h1 className="mt-3 mb-4">Access pending</h1>
        <p>
          You’ve successfully signed in, but your account hasn’t yet been
          granted access to any parks.
        </p>
        <p>
          If this message continues to appear after a couple of days, please
          contact{" "}
          <a href="mailto:parksweb@gov.bc.ca?subject=No%20park%20access%20assigned">
            parksweb@gov.bc.ca
          </a>
          .
        </p>
      </div>
    </div>
  );
}
