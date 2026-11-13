import { quickLinks } from "./shared/navItems";

export default function Footer() {
  return (
    <footer className="bcparks-global py-2 py-md-0 d-flex justify-content-md-end align-items-center container-fluid text-bg-primary-nav">
      <div className="quick-links d-flex flex-column flex-md-row me-md-4">
        <span>Quick links:</span>

        {quickLinks.map(({ label, href }) => (
          <a key={label} href={href}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
