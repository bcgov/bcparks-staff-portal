import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fa-kit/icons/classic/solid";
import PropTypes from "prop-types";

import "./NavBack.scss";

// Navigational link to go back to the parent page
export default function NavBack({ routePath, children }) {
  return (
    <div className="nav-back mb-4">
      <Link to={routePath}>
        <FontAwesomeIcon className="icon-back me-2" icon={faArrowLeft} />
        <span>{children}</span>
      </Link>
    </div>
  );
}

NavBack.propTypes = {
  routePath: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
