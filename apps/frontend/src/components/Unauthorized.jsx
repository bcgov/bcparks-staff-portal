export function Unauthorized() {
  return (
    <div className="container">
      <h1 className="mt-3 mb-4">You are not authorized to log in yet</h1>
      <p>
        If this is your first time logging in to the staff web portal dates of
        operation tool, you&#39;re in the right place! Email us at{" "}
        <a href="mailto:parksweb@gov.bc.ca?subject=First%20login%20to%20Staff%20Portal">
          parksweb@gov.bc.ca
        </a>{" "}
        and we&#39;ll set up your account permissions.
      </p>
      <p>
        If you&#39;re here for another reason and you&#39;re unable to log in,
        contact{" "}
        <a href="mailto:parksweb@gov.bc.ca?subject=Unable%20to%20log%20into%20Staff%20Portal">
          parksweb@gov.bc.ca
        </a>{" "}
        and we&#39;ll help you out.
      </p>
    </div>
  );
}
