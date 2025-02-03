import LoadingBar from "@/components/LoadingBar";
import PropTypes from "prop-types";

export default function ExpandableContent({
  expanded,
  loading,
  error,
  errorMsg = "Error loading dates: ",
  children,
}) {
  if (!expanded) return null;

  if (loading)
    return (
      <div className="p-3 pt-0">
        <LoadingBar />
      </div>
    );

  if (error)
    return (
      <p className="px-3">
        {errorMsg}
        {error.message}
      </p>
    );

  return children;
}

ExpandableContent.propTypes = {
  expanded: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
  }),
  errorMsg: PropTypes.string,
  children: PropTypes.node,
};
