import { Link } from "react-router-dom";
import logo from "@/assets/min-env-and-parks-logo.svg";
import logoVertical from "@/assets/bc-parks-logo-vertical.svg";

export default function HeaderTitle() {
  return (
    <Link
      to="/"
      className="d-inline-block d-flex align-items-center align-items-md-end logo-link"
    >
      <img
        className="d-block d-md-none"
        src={logoVertical}
        height="60"
        alt="BC Parks logo"
      />
      {/* swap logo images on larger screens */}
      <img
        className="d-none d-md-block"
        src={logo}
        height="68"
        alt="BC Parks logo"
      />

      <div className="app-title text-white mx-3 mx-md-1">
        Parks and Recreation staff web portal
      </div>
    </Link>
  );
}
