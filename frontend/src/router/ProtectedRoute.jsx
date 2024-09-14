import { withAuthenticationRequired } from "react-oidc-context";
import PropTypes from "prop-types";

// Higher-order component that wraps a route component for authentication
// Wrap a "layout" component in this component to protect all of its children
export default function ProtectedRoute({
  component: Component,
  ...otherProps
}) {
  if (!Component) {
    throw new Error("Component prop is required");
  }

  const ComponentWithAuth = withAuthenticationRequired(Component, {
    onRedirecting: () => <div>Redirecting you to log in...</div>,
  });

  return <ComponentWithAuth {...otherProps} />;
}

// Define prop types for ProtectedRoute
ProtectedRoute.propTypes = {
  component: PropTypes.elementType.isRequired,
};
