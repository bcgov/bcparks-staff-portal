export default function Footer() {
  return (
    <footer className="bcparks-global py-2 py-md-0 d-flex justify-content-md-end align-items-center container-fluid text-bg-primary-nav">
      <div className="quick-links d-flex flex-column flex-md-row me-md-4">
        <span>Quick links:</span>

        <a href="https://attendance-revenue.bcparks.ca/">
          Attendance and Revenue
        </a>

        <a href="https://reserve-admin.bcparks.ca/dayuse/">
          Day-use Pass admin
        </a>

        <a href="https://staff.sitesandtrailsbc.ca/">RecSpace</a>

        <a href="mailto:parksweb@gov.bc.ca">Contact us</a>
      </div>
    </footer>
  );
}
