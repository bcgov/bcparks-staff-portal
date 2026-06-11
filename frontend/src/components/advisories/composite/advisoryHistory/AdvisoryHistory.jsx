import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryHistory.css";
import { format } from "date-fns";
import { useAuth } from "react-oidc-context";
import useCms from "@/hooks/useCms";
import { advisoryHistoryCompare } from "@/lib/advisories/utils/AppUtil";

function formatTimestamp(date) {
  const datePart = format(date, "MMMM d, yyyy");
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
                let creatorName = ad.createdByName || "";
                let text = "drafted";
                let includeRequestedBy = false;

                if (status === "PUB") {
                  if (
                    ad.publishedByName &&
                    ad.publishedByName === ad.createdByName
                  ) {
                    creatorName = ad.publishedByName;
                    text = "created and published";
                  } else if (ad.publishedByName) {
                    creatorName = ad.createdByName;
                    text = "created";
                    pushHistory({
                      revisionNumber: ad.revisionNumber,
                      displayText: "published",
                      actorName:
                        ad.publishedByName === "system"
                          ? "system based on posting date"
                          : ad.publishedByName,
                      date: ad.publishedDate || ad.modifiedDate,
                    });
                  }
                }

                if (status === "SCH") {
                  creatorName = ad.modifiedByName || ad.createdByName || "";
                  text = "scheduled";
                }

                if (status === "HQR") {
                  creatorName = ad.modifiedByName || ad.createdByName || "";
                  text = "submitted";
                }

                let requesterName = "";

                if (
                  creatorName &&
                  ad.submittedByName &&
                  creatorName !== ad.submittedByName
                ) {
                  includeRequestedBy = true;
                  requesterName = ad.submittedByName || "";
                }

                pushHistory({
                  revisionNumber: ad.revisionNumber,
                  displayText: includeRequestedBy
                    ? `${text} by ${creatorName} requested`
                    : text,
                  actorName: requesterName || creatorName,
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
                  if (ad.publishedByName !== ad.modifiedByName) {
                    pushHistory({
                      revisionNumber: ad.revisionNumber,
                      displayText: "updated",
                      actorName: ad.modifiedByName,
                      date: ad.modifiedDate,
                    });
                  }
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText:
                      ad.publishedByName !== ad.modifiedByName
                        ? "published"
                        : "updated and published",
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

                if (status === "HQR" || status === "DFT") {
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: "updated",
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

            advisoriesHistory.sort(advisoryHistoryCompare);
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
            {ah.displayDate} {"\u2013"} Revision {ah.revisionNumber}{" "}
            {ah.displayText} {ah.actorName ? <> by {ah.actorName}</> : null}
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
