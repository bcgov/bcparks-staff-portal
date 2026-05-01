import PropTypes from "prop-types";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faChevronUp } from "@fa-kit/icons/classic/solid";
import { faPen, faEyeSlash } from "@fa-kit/icons/classic/regular";

import "./ActionButton.scss";

export function ActionButton({
  rowId,
  canUnpublish,
  onView,
  onEdit,
  onUnpublish,
}) {
  function action(event, callback) {
    // Prevent triggering row click handler
    event.stopPropagation();
    callback();
  }

  return (
    <div className="action-button" onClick={(event) => event.stopPropagation()}>
      <DropdownButton
        id={`action-button-${rowId}`}
        title={
          <>
            <span>Actions</span>
            <FontAwesomeIcon
              icon={faChevronUp}
              className="action-button__icon"
            />
          </>
        }
        className="action-button__dropdown-button"
        size="sm"
      >
        <Dropdown.Item onClick={(event) => action(event, onView)}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          View
        </Dropdown.Item>
        <Dropdown.Item onClick={(event) => action(event, onEdit)}>
          <FontAwesomeIcon icon={faPen} />
          Edit
        </Dropdown.Item>
        <Dropdown.Item
          disabled={!canUnpublish}
          onClick={(event) => action(event, onUnpublish)}
        >
          <FontAwesomeIcon icon={faEyeSlash} />
          Unpublish
        </Dropdown.Item>
      </DropdownButton>
    </div>
  );
}

ActionButton.propTypes = {
  rowId: PropTypes.string.isRequired,
  canUnpublish: PropTypes.bool,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onUnpublish: PropTypes.func,
};

ActionButton.defaultProps = {
  canUnpublish: false,
  onView() {},
  onEdit() {},
  onUnpublish() {},
};
