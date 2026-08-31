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

            advisoriesHistory.push({
              revisionNumber,
              actorName,
              displayText,
              date,
            });
          }

          if (advisories && advisories.length > 0) {
            advisories.forEach((ad) => {
              const status = ad.advisoryStatus?.code || "";
              let statusActorName = ad.modifiedByName;

              const creatorIsPublisher =
                !!ad.publishedByName && ad.createdByName === ad.publishedByName;
              const creatorIsEditor =
                !!ad.modifiedByName && ad.createdByName === ad.modifiedByName;
              const editorIsPublisher =
                !!ad.modifiedByName && ad.modifiedByName === ad.publishedByName;

              if (status === "PUB") {
                statusActorName = ad.publishedByName || ad.modifiedByName;
              } else if (status === "UNP") {
                statusActorName = ad.unpublishedByName || ad.modifiedByName;
              }

              if (ad.revisionNumber === 1) {
                let creatorName = ad.createdByName || "";
                let creationText = "drafted";
                let includeRequestedBy = false;
                let requesterName = "";
                let statusDate; // override for "scheduled" and "submitted" events

                if (status === "PUB") {
                  if (creatorIsPublisher && editorIsPublisher) {
                    creatorName = ad.publishedByName;
                    creationText = "created and published";
                  } else if (ad.publishedByName) {
                    creatorName = ad.createdByName;
                    creationText = "created";

                    if (
                      ad.modifiedByName &&
                      !creatorIsEditor &&
                      !editorIsPublisher
                    ) {
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
                        editorIsPublisher && !creatorIsEditor
                          ? "updated and published"
                          : "published",
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
                  creationText = "scheduled";
                  statusDate = ad.modifiedDate;
                }

                if (status === "HQR") {
                  creatorName = ad.modifiedByName || ad.createdByName || "";
                  creationText = "submitted";
                  statusDate = ad.modifiedDate;
                }

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
                    ? `${creationText} by ${creatorName} requested`
                    : creationText,
                  actorName: requesterName || creatorName,
                  date: statusDate || ad.createdDate || ad.createdAt,
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
                  if (!editorIsPublisher && ad.modifiedByName) {
                    pushHistory({
                      revisionNumber: ad.revisionNumber,
                      displayText: "updated",
                      actorName: ad.modifiedByName,
                      date: ad.modifiedDate,
                    });
                  }
                  pushHistory({
                    revisionNumber: ad.revisionNumber,
                    displayText: editorIsPublisher
                      ? "updated and published"
                      : "published",
                    actorName:
                      ad.publishedByName === "system"
                        ? "system based on posting date"
                        : statusActorName,
                    date: ad.publishedDate || ad.modifiedDate,
                  });
                }

                if (status === "UNP") {
                  // Do not output anything for unpublished records. The
                  // logging is handled by the previous published record.
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

              if (ad.unpublishedByName && status !== "UNP") {
                pushHistory({
                  revisionNumber: ad.revisionNumber,
                  displayText: "unpublished",
                  actorName:
                    ad.unpublishedByName === "system"
                      ? "system based on expiry date"
                      : ad.unpublishedByName,
                  date: ad.unpublishedDate,
                });
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

            // Sort in the opposite order of the display order to prepare for duplicate removal
            advisoriesHistory.sort((a, b) => advisoryHistoryCompare(b, a));

            function normalizeDisplayText(text) {
              return text === "updated and published" ? "updated" : text;
            }

            function isSameEvent(event1, event2) {
              return (
                normalizeDisplayText(event1.displayText) ===
                  normalizeDisplayText(event2.displayText) &&
                event1.actorName === event2.actorName &&
                event1.date === event2.date
              );
            }

            const uniqueAdvisoryHistory = [];

            // Remove duplicates, keeping the lowest revision number
            advisoriesHistory.forEach((ah) => {
              if (!uniqueAdvisoryHistory.some((uah) => isSameEvent(uah, ah))) {
                uniqueAdvisoryHistory.push(ah);
              }
            });

            // Reverse the array to have the most recent first for display purposes
            setAdvisoryHistory([...uniqueAdvisoryHistory.reverse()]);
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
            {formatTimestamp(ah.date)} {"\u2013"} Revision {ah.revisionNumber}{" "}
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
