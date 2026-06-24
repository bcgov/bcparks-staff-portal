import { useState } from "react";
import PropTypes from "prop-types";
import "./AdvisorySummaryView.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCopy,
  faChevronDown,
  faChevronUp,
} from "@fa-kit/icons/classic/regular";
import { format } from "date-fns";
import AdvisoryHistory from "@/components/advisories/composite/advisoryHistory/AdvisoryHistory";
import getEnv from "@/config/getEnv";

// Presentational component for displaying form field values with their labels.
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <div className="mb-1 fw-bold">{label}</div>
      <div>{children}</div>
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default function AdvisorySummaryView({
  data: {
    advisory,
    parkUrls,
    siteUrls,
    handleOpenSnackBar,
    showOriginalAdvisory,
  },
}) {
  const publicUrl = getEnv("VITE_BCPARKS_PUBLIC_URL");
  const [showParks, setShowParks] = useState(false);
  const [showSites, setShowSites] = useState(false);

  function getDisplayedDate(advisoryData) {
    if (
      !advisoryData.isEffectiveDateDisplayed &&
      !advisoryData.isEndDateDisplayed &&
      !advisoryData.isAdvisoryDateDisplayed &&
      !advisoryData.isUpdatedDateDisplayed
    ) {
      return "No date";
    }
    if (
      !advisoryData.isEffectiveDateDisplayed &&
      !advisoryData.isEndDateDisplayed &&
      advisoryData.isAdvisoryDateDisplayed &&
      !advisoryData.isUpdatedDateDisplayed
    ) {
      return "Posting date";
    }
    if (
      !advisoryData.isEffectiveDateDisplayed &&
      !advisoryData.isEndDateDisplayed &&
      !advisoryData.isAdvisoryDateDisplayed &&
      advisoryData.isUpdatedDateDisplayed
    ) {
      return "Updated date";
    }
    if (
      advisoryData.isEffectiveDateDisplayed &&
      !advisoryData.isEndDateDisplayed &&
      !advisoryData.isAdvisoryDateDisplayed &&
      !advisoryData.isUpdatedDateDisplayed
    ) {
      return "Start date";
    }
    if (
      advisoryData.isEffectiveDateDisplayed &&
      advisoryData.isEndDateDisplayed &&
      !advisoryData.isAdvisoryDateDisplayed &&
      !advisoryData.isUpdatedDateDisplayed
    ) {
      return "Event date range";
    }
    return null;
  }

  return (
    <>
      <section>
        <h3>Affected resource(s)</h3>

        {advisory.recreationResources.length > 0 && (
          <Field label="Recreation Sites and Trails recreation resource(s)">
            <div>
              {advisory.recreationResources.map((resource) => (
                <div key={resource.id} className="mb-3">
                  {resource.recResourceId ? (
                    <a
                      href={`https://www.sitesandtrailsbc.ca/resource/${resource.recResourceId}`}
                      rel="noreferrer"
                      target="_blank"
                      className="act-anchor"
                    >
                      {`${resource.resourceName} (${resource.recResourceId})`}
                      <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="launchIcon"
                      />
                    </a>
                  ) : (
                    resource.resourceName
                  )}
                </div>
              ))}
            </div>
          </Field>
        )}

        {advisory.protectedAreas.length > 0 && (
          <Field label="BC Parks park(s)">
            <div>
              {(showParks
                ? advisory.protectedAreas
                : advisory.protectedAreas.slice(0, 5)
              ).map((p) => (
                <div key={p.id} className="mb-3">
                  {p.url ? (
                    <a
                      href={p.url.replace("https://bcparks.ca", publicUrl)}
                      rel="noreferrer"
                      target="_blank"
                      className="act-anchor"
                    >
                      {p.protectedAreaName}
                      <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="launchIcon"
                      />
                    </a>
                  ) : (
                    p.protectedAreaName
                  )}
                </div>
              ))}

              {advisory.protectedAreas.length > 5 && (
                <p>
                  <button
                    type="button"
                    className="btn mt-2 btn-link btn-boolean with-icon"
                    onClick={() => setShowParks(!showParks)}
                  >
                    {showParks ? "Hide" : "Show"} all parks affected
                    <FontAwesomeIcon
                      icon={showParks ? faChevronUp : faChevronDown}
                    />
                  </button>
                </p>
              )}

              <button
                type="button"
                className="btn-outline-primary btn"
                onClick={() => {
                  navigator.clipboard
                    .writeText(parkUrls)
                    .then(() => {
                      handleOpenSnackBar("Park urls copied to clipboard");
                    })
                    .catch(() => {
                      handleOpenSnackBar("Failed to copy to clipboard");
                    });
                }}
              >
                <FontAwesomeIcon icon={faCopy} className="me-2" />
                Copy all URLs
              </button>
            </div>
          </Field>
        )}

        {advisory.sites.length > 0 && (
          <Field label="Site(s)">
            <div>
              {(showSites ? advisory.sites : advisory.sites.slice(0, 5)).map(
                (s) => (
                  <div key={s.id} className="mb-3">
                    {s.url ? (
                      <a
                        href={s.url.replace("https://bcparks.ca", publicUrl)}
                        rel="noreferrer"
                        target="_blank"
                        className="act-anchor"
                      >
                        {s.siteName}
                        <FontAwesomeIcon
                          icon={faArrowUpRightFromSquare}
                          className="launchIcon"
                        />
                      </a>
                    ) : (
                      s.siteName
                    )}
                  </div>
                ),
              )}

              {advisory.sites.length > 5 && (
                <p>
                  <button
                    type="button"
                    className="btn mt-2 btn-link btn-boolean with-icon"
                    onClick={() => setShowSites(!showSites)}
                  >
                    {showSites ? "Hide" : "Show"} all sites affected
                    <FontAwesomeIcon
                      icon={showSites ? faChevronUp : faChevronDown}
                    />
                  </button>
                </p>
              )}

              <button
                type="button"
                className="btn-outline-primary btn"
                onClick={() => {
                  navigator.clipboard
                    .writeText(siteUrls)
                    .then(() => {
                      handleOpenSnackBar("Site urls copied to clipboard");
                    })
                    .catch(() => {
                      handleOpenSnackBar("Failed to copy to clipboard");
                    });
                }}
              >
                <FontAwesomeIcon icon={faCopy} className="me-2" />
                Copy all URLs
              </button>
            </div>
          </Field>
        )}

        {advisory.fireCentres.length > 0 && (
          <Field label="Fire Centre(s)">
            <div>
              {advisory.fireCentres.map((f) => (
                <div key={f.id}>{f.fireCentreName}</div>
              ))}
            </div>
          </Field>
        )}

        {advisory.fireZones.length > 0 && (
          <Field label="Fire Zone(s)">
            <div>
              {advisory.fireZones.map((f) => (
                <div key={f.id}>{f.fireZoneName}</div>
              ))}
            </div>
          </Field>
        )}

        {advisory.naturalResourceDistricts.length > 0 && (
          <Field label="Natural Resource District(s)">
            <div>
              {advisory.naturalResourceDistricts.map((n) => (
                <div key={n.id}>{n.naturalResourceDistrictName}</div>
              ))}
            </div>
          </Field>
        )}

        {advisory.regions.length > 0 && (
          <Field label="Region(s)">
            <div>
              {advisory.regions.map((r) => (
                <div key={r.id}>{r.regionName} Region</div>
              ))}
            </div>
          </Field>
        )}

        {advisory.sections.length > 0 && (
          <Field label="Section(s)">
            <div>
              {advisory.sections.map((s) => (
                <div key={s.id}>{s.sectionName} Section</div>
              ))}
            </div>
          </Field>
        )}

        {advisory.managementAreas.length > 0 && (
          <Field label="Management Area(s)">
            <div>
              {advisory.managementAreas.map((m) => (
                <div key={m.id}>{m.managementAreaName} Management Area</div>
              ))}
            </div>
          </Field>
        )}
      </section>

      <section className="shown-on-public-site">
        <h3>Public advisory / closure content</h3>
        <p>This information is displayed on the public website.</p>

        <Field label="Headline">
          <div dangerouslySetInnerHTML={{ __html: advisory.title }}></div>
        </Field>

        {advisory.eventType && (
          <Field label="Event type">{advisory.eventType.eventType}</Field>
        )}

        {advisory.urgency && (
          <Field label="Urgency level">{advisory.urgency.urgency}</Field>
        )}

        {advisory.listingRank !== null && advisory.listingRank >= 0 && (
          <Field label="Listing rank">{advisory.listingRank}</Field>
        )}

        {advisory.accessStatus && (
          <Field label="Public access status">
            {advisory.accessStatus.accessStatus}
          </Field>
        )}

        {!showOriginalAdvisory &&
          advisory.standardMessages &&
          advisory.standardMessages.length > 0 && (
            <Field label="Standard message(s)">
              <div>
                {advisory.standardMessages.map((m, index) => (
                  <div key={index}>{m.title}</div>
                ))}
              </div>
            </Field>
          )}

        {advisory.description && (
          <Field label="Description">
            <div
              dangerouslySetInnerHTML={{ __html: advisory.description }}
            ></div>
          </Field>
        )}

        {!showOriginalAdvisory &&
          advisory.standardMessages &&
          advisory.standardMessages.length > 0 && (
            <Field label="Standard message preview">
              <div>
                {advisory.standardMessages.map((m, index) => (
                  <div
                    key={index}
                    dangerouslySetInnerHTML={{ __html: m.description }}
                  ></div>
                ))}
              </div>
            </Field>
          )}

        {advisory.links.length > 0 && (
          <Field label="Attach file(s)">
            <div>
              {advisory.links.map((l) => (
                <div key={l.id}>
                  {l.url && (
                    <a
                      href={l?.file?.url ? l.file.url : l.url}
                      rel="noreferrer"
                      target="_blank"
                      className="d-block act-anchor"
                    >
                      {l.type &&
                        advisory.linkTypes.find((t) => t.id === l.type).type}
                      {l.type && " - "}
                      {l.title}
                      <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="launchIcon"
                      />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Field>
        )}
      </section>

      <section>
        <h3>Advisory / closure dates</h3>

        <h4>Post date(s)</h4>

        {advisory.advisoryDate && (
          <Field label="Posting date">
            <div>{format(advisory.advisoryDate, "MMMM dd, yyyy h:mm aaa")}</div>
          </Field>
        )}

        {advisory.expiryDate && (
          <Field label="Expiry date">
            <div>{format(advisory.expiryDate, "MMMM dd, yyyy h:mm aaa")}</div>
          </Field>
        )}

        <h4>Event date(s)</h4>

        {advisory.effectiveDate && (
          <Field label="Start date">
            <div>
              {format(advisory.effectiveDate, "MMMM dd, yyyy h:mm aaa")}
            </div>
          </Field>
        )}

        {advisory.endDate && (
          <Field label="End date">
            <div>{format(advisory.endDate, "MMMM dd, yyyy h:mm aaa")}</div>
          </Field>
        )}

        {advisory.updatedDate && (
          <Field label="Updated date">
            <div>{format(advisory.updatedDate, "MMMM dd, yyyy h:mm aaa")}</div>
          </Field>
        )}

        <Field label="Displayed date">{getDisplayedDate(advisory)}</Field>
      </section>

      <section>
        <h3>Internal details</h3>

        {advisory.advisoryStatus && (
          <Field label="Advisory status">
            {advisory.advisoryStatus.advisoryStatus}
          </Field>
        )}

        <Field label="Requested by">{advisory.submittedByName}</Field>

        <Field label="Public safety related">
          {advisory.isSafetyRelated ? "Yes" : "No"}
        </Field>

        {advisory.note && (
          <Field label="Internal notes">
            <div dangerouslySetInnerHTML={{ __html: advisory.note }}></div>
          </Field>
        )}
      </section>

      <section style={{ maxWidth: "inherit" }}>
        <h3>History</h3>
        <AdvisoryHistory
          latestRevisionNumber={advisory.revisionNumber}
          advisoryNumber={advisory.advisoryNumber}
          reviewedDate={advisory.reviewedDate}
        />
      </section>
    </>
  );
}

AdvisorySummaryView.propTypes = {
  data: PropTypes.shape({
    advisory: PropTypes.object,
    isPublished: PropTypes.bool,
    parkUrls: PropTypes.string,
    siteUrls: PropTypes.string,
    handleOpenSnackBar: PropTypes.func.isRequired,
    showOriginalAdvisory: PropTypes.bool,
  }).isRequired,
};
