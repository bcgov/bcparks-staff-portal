import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fa-kit/icons/classic/solid";
import { faEyeSlash, faMemo, faPen } from "@fa-kit/icons/classic/regular";

import "./TableActionButton.scss";

const ACTION_DROPDOWN_OPEN_EVENT = "table-action-dropdown-open";

export function TableActionButton({
  rowId,
  canUnpublish = false,
  onView,
  onEdit,
  onUnpublish,
}) {
  const [isOpen, setIsOpen] = useState(false);

  function action(event, callback) {
    // Prevent triggering row click handler
    event.stopPropagation();
    setIsOpen(false);
    callback();
  }

  // Don't allow root-close to reopen the dropdown immediately after it's closed
  function handleToggle(nextIsOpen, _event, metadata) {
    if (!nextIsOpen && !isOpen && metadata?.source === "rootClose") {
      return;
    }

    setIsOpen(nextIsOpen);

    if (nextIsOpen) {
      window.dispatchEvent(
        new CustomEvent(ACTION_DROPDOWN_OPEN_EVENT, { detail: { rowId } }),
      );
    }
  }

  // Close this dropdown when another dropdown is opened
  useEffect(() => {
    function handleOtherDropdownOpen(event) {
      if (event.detail?.rowId !== rowId) {
        setIsOpen(false);
      }
    }

    window.addEventListener(
      ACTION_DROPDOWN_OPEN_EVENT,
      handleOtherDropdownOpen,
    );

    return () => {
      window.removeEventListener(
        ACTION_DROPDOWN_OPEN_EVENT,
        handleOtherDropdownOpen,
      );
    };
  }, [rowId]);

  return (
    <div className="action-button" onClick={(event) => event.stopPropagation()}>
      <DropdownButton
        id={`action-button-${rowId}`}
        show={isOpen}
        onToggle={handleToggle}
        title={
          <>
            <span className="visually-hidden">Actions</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="action-button__icon"
              aria-label="Actions"
            />
          </>
        }
        className="action-button__dropdown-button"
        size="sm"
      >
        <Dropdown.Item onClick={(event) => action(event, onView)}>
          <FontAwesomeIcon icon={faMemo} />
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

TableActionButton.propTypes = {
  rowId: PropTypes.string.isRequired,
  canUnpublish: PropTypes.bool,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
};
