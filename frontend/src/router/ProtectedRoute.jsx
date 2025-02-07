import { useAuth, withAuthenticationRequired } from "react-oidc-context";
import PropTypes from "prop-types";
import AccessProvider from "@/router/AccessProvider";

// Higher-order component that wraps a route component for authentication
// Wrap a "layout" component in this component to protect all of its children
export default function ProtectedRoute({
  component: Component,
  ...otherProps
}) {
  if (!Component) {
    throw new Error("Component prop is required");
  }

  const auth = useAuth();

  const ComponentWithAuth = withAuthenticationRequired(Component, {
    onRedirecting: () => <div>Redirecting...</div>,
  });

  return (
    <AccessProvider auth={auth}>
      <ComponentWithAuth {...otherProps} />
    </AccessProvider>
  );
}

// Define prop types for ProtectedRoute
ProtectedRoute.propTypes = {
  component: PropTypes.elementType.isRequired,
};
