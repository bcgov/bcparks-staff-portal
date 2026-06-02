import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryHistory.css";
import { format } from "date-fns";
import { useAuth } from "react-oidc-context";
import useCms from "@/hooks/useCms";
import { dateCompare } from "@/lib/advisories/utils/AppUtil";

function formatTimestamp(date) {
  const datePart = format(date, "MMMM dd, yyyy");
  const timePart = format(date, "h:mm aaa");

  return `${datePart} at ${timePart}`;
}

export default function AdvisoryHistory({
  advisoryNumber,
  latestRevisionNumber,
  reviewedDate,
}) {
  const [advisoryHistory, setAdvisoryHistory] = useState([]);
  const auth = useAuth();
  const { cmsGet } = useCms();

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading && advisoryNumber) {
      cmsGet(`public-advisory-audits/history/${advisoryNumber}`, {}, "").then(
        (advisories) => {
          const advisoriesHistory = [];

          function pushHistory({
            revisionNumber,
            actorName,
            displayText,
            date,
          }) {
            if (!date) return;
            const ts = new Date(date).valueOf();

            if (Number.isNaN(ts)) return;

            advisoriesHistory.push({
              revisionNumber,
              actorName,
              displayText,
              displayDate: formatTimestamp(ts),
              dateToCompare: ts,
            });
          }

          if (advisories && advisories.length > 0) {
            advisories.forEach((ad) => {
              const status = ad.advisoryStatus?.code || "";
              let statusActorName = ad.modifiedByName;

              if (status === "PUB") {
                statusActorName = ad.publishedByName || ad.modifiedByName;
              } else if (status === "UNP") {
                statusActorName = ad.unpublishedByName || ad.modifiedByName;
              }

              if (ad.revisionNumber === 1) {
                let actor = ad.createdByName || "";
                let text = "drafted";
                let includeRequestedBy = false;

                if (status === "PUB") {
                  actor = ad.publishedByName || "";
                  text = "published";
                }

                if (status === "SCH") {
                  actor = ad.modifiedByName || "";
                  text = "scheduled";
                }

                let actorName = actor || "";

                if (actor && actor !== ad.submittedByName) {
                  includeRequestedBy = true;
                  actorName = ad.submittedByName || "";
                }

                pushHistory({
                  revisionNumber: ad.revisionNumber,
                  displayText: includeRequestedBy
                    ? `${text} by ${actor} requested`
                    : text,
                  actorName,
                  date: ad.modifiedDate || ad.createdDate,
                });
              } else {
                if (status === "SCH") {
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: "scheduled",
                    actorName: ad.modifiedByName,
                    date: ad.modifiedDate,
                  });
                }

                if (status === "PUB") {
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: "published",
                    actorName:
                      ad.publishedByName === "system"
                        ? "system based on posting date"
                        : statusActorName,
                    date: ad.publishedDate || ad.modifiedDate,
                  });
                }

                if (status === "UNP") {
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: "unpublished",
                    actorName:
                      ad.unpublishedByName === "system"
                        ? "system based on expiry date"
                        : statusActorName,
                    date: ad.unpublishedDate || ad.modifiedDate,
                  });
                }

                if (status === "HQR") {
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: "updated",
                    actorName: ad.modifiedByName,
                    date: ad.modifiedDate,
                  });
                }

                if (status === "DFT") {
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: "drafted",
                    actorName: ad.modifiedByName,
                    date: ad.modifiedDate,
                  });
                }
              }

              if (ad.reviewedByName && ad.reviewedByName !== statusActorName) {
                pushHistory({
                  revisionNumber: ad.revisionNumber,
                  displayText: "reviewed",
                  actorName: ad.reviewedByName,
                  date: ad.reviewedDate,
                });
              }
            });

            advisoriesHistory.sort(dateCompare);
            setAdvisoryHistory([...advisoriesHistory]);
          }
        },
      );
    }
  }, [
    advisoryNumber,
    // Re-fetch data if the revision number changes, which indicates new versions and history to display
    latestRevisionNumber,
    // Re-fetch when reviewed date changes without a revision bump
    reviewedDate,
    auth.isAuthenticated,
    auth.isLoading,
    setAdvisoryHistory,
    cmsGet,
  ]);
  return (
    <div className="act-history-container">
      {advisoryHistory.length > 0 &&
        advisoryHistory.map((ah, index) => (
          <div
            key={`revision-${ah.revisionNumber}-idx-${index}`}
            className="mb-2"
          >
            Revision number {ah.revisionNumber} {ah.displayText}{" "}
            {ah.actorName ? <> by {ah.actorName} on </> : null}{" "}
            <span className="text-nowrap">{ah.displayDate}</span>
          </div>
        ))}
    </div>
  );
}

AdvisoryHistory.propTypes = {
  advisoryNumber: PropTypes.number.isRequired,
  latestRevisionNumber: PropTypes.number.isRequired,
  reviewedDate: PropTypes.string,
};
