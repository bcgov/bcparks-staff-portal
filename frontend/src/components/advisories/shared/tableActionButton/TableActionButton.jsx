import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Dropdown from "react-bootstrap/Dropdown";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fa-kit/icons/classic/solid";
import {
  faCircleCheck,
  faEyeSlash,
  faMemo,
  faPen,
} from "@fa-kit/icons/classic/regular";

import "./TableActionButton.scss";

const ACTION_DROPDOWN_OPEN_EVENT = "table-action-dropdown-open";
const ACTION_MENU_POPPER_CONFIG = {
  strategy: "fixed",
  modifiers: [
    {
      name: "preventOverflow",
      options: {
        altAxis: true,
        tether: false,
      },
    },
  ],
};

export function TableActionButton({
  rowId,
  canUnpublish = false,
  viewPath,
  editPath,
  onUnpublish,
  onMarkReviewed,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  function action(callback) {
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
    <div className={classNames("action-button", className)}>
      <Dropdown
        show={isOpen}
        onToggle={handleToggle}
        className="action-button__dropdown-button"
      >
        <Dropdown.Toggle id={`action-button-${rowId}`} size="sm">
          <span className="visually-hidden">Actions</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="action-button__icon"
            aria-label="Actions"
          />
        </Dropdown.Toggle>

        <Dropdown.Menu renderOnMount popperConfig={ACTION_MENU_POPPER_CONFIG}>
          <Dropdown.Item
            as={Link}
            to={viewPath}
            onClick={() => setIsOpen(false)}
          >
            <FontAwesomeIcon icon={faMemo} />
            View
          </Dropdown.Item>
          <Dropdown.Item
            as={Link}
            to={editPath}
            onClick={() => setIsOpen(false)}
          >
            <FontAwesomeIcon icon={faPen} />
            Edit
          </Dropdown.Item>
          <Dropdown.Item
            disabled={!canUnpublish}
            onClick={() => action(onUnpublish)}
          >
            <FontAwesomeIcon icon={faEyeSlash} />
            Unpublish
          </Dropdown.Item>
          {onMarkReviewed && (
            <Dropdown.Item onClick={() => action(onMarkReviewed)}>
              <FontAwesomeIcon icon={faCircleCheck} />
              Mark reviewed
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}

TableActionButton.propTypes = {
  rowId: PropTypes.string.isRequired,
  canUnpublish: PropTypes.bool,
  viewPath: PropTypes.string.isRequired,
  editPath: PropTypes.string.isRequired,
  onMarkReviewed: PropTypes.func,
  onUnpublish: PropTypes.func.isRequired,
  className: PropTypes.string,
};
