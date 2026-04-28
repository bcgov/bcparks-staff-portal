import Badge from "react-bootstrap/Badge";
import CloseButton from "react-bootstrap/CloseButton";
import PropTypes from "prop-types";

export default function FilterBadge({ label, onRemove }) {
  return (
    <div
      data-bs-theme="dark"
      className="filter-badge fs-5 d-flex align-items-center"
    >
      <Badge
        pill
        bg="primary"
        className="px-2 py-1 d-flex align-items-center fw-normal"
      >
        <span>{label}</span>
        <CloseButton
          className="ms-2"
          onClick={onRemove}
          aria-label={`Remove filter: ${label}`}
        />
      </Badge>
    </div>
  );
}

FilterBadge.propTypes = {
  label: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
};
