import { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Dropdown from "react-bootstrap/Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fa-kit/icons/classic/solid";
import { faCircleCheck, faEyeSlash } from "@fa-kit/icons/classic/regular";

import "./SummaryActionButton.scss";

// Overflow menu for actions on the Advisory summary page.
// Similar to TableActionButton, but displays in place of separate buttons on smaller screens.

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

export default function SummaryActionButton({
  canUnpublish = false,
  onUnpublish,
  canMarkReviewed = false,
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
  }

  return (
    <div
      className={classNames(
        "action-button",
        "summary-action-button",
        className,
      )}
    >
      <Dropdown
        show={isOpen}
        onToggle={handleToggle}
        className="action-button__dropdown-button d-flex"
      >
        <Dropdown.Toggle
          className="bcgov-button flex-grow-1"
          id="action-button"
        >
          <span>Actions</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="action-button__icon ms-2"
            aria-label="Actions"
          />
        </Dropdown.Toggle>

        <Dropdown.Menu renderOnMount popperConfig={ACTION_MENU_POPPER_CONFIG}>
          <Dropdown.Item
            disabled={!canUnpublish}
            onClick={() => action(onUnpublish)}
          >
            <FontAwesomeIcon icon={faEyeSlash} />
            Unpublish
          </Dropdown.Item>

          <Dropdown.Item
            disabled={!canMarkReviewed}
            onClick={() => action(onMarkReviewed)}
          >
            <FontAwesomeIcon icon={faCircleCheck} />
            Mark reviewed
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}

SummaryActionButton.propTypes = {
  canUnpublish: PropTypes.bool,
  canMarkReviewed: PropTypes.bool,
  onMarkReviewed: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
  className: PropTypes.string,
};
