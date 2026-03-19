import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryHistory.css";
import moment from "moment";
import { cmsAxios } from "@/lib/advisories/axios_config";
import { useAuth } from "react-oidc-context";
import { dateCompare } from "@/lib/advisories/utils/AppUtil";

export default function AdvisoryHistory({ data: { advisoryNumber } }) {
  const [advisoryHistory, setAdvisoryHistory] = useState([]);
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading && advisoryNumber) {
      cmsAxios
        .get(`public-advisory-audits/history/${advisoryNumber}`, {
          headers: { Authorization: `Bearer ${auth.user?.access_token}` },
        })
        .then((res) => {
          const advisories = res.data; // for info: data obj - just once
          const advisoriesHistory = [];

          if (advisories && advisories.length > 0) {
            advisories.forEach((ad) => {
              if (ad.modifiedBy && ad.modifiedBy === "system") {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.modifiedBy,
                  submittedTime: moment(ad.modifiedDate).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Published by",
                  dateToCompare: moment(ad.modifiedDate).valueOf(),
                };

                if (ad.removalDate) {
                  record.displayText = "Removed by";
                }
                advisoriesHistory.push(record);
              } else if (!ad.modifiedDate && ad.createdDate) {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.submittedBy,
                  submittedTime: moment(ad.createdDate).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Requested by",
                  dateToCompare: moment(ad.createdDate).valueOf(),
                };

                advisoriesHistory.push(record);
              } else if (ad.modifiedDate) {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.modifiedBy,
                  submittedTime: moment(ad.modifiedDate).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Updated by",
                  dateToCompare: moment(ad.modifiedDate).valueOf(),
                };

                advisoriesHistory.push(record);
              }
            });
            advisoriesHistory.sort(dateCompare);
            setAdvisoryHistory([...advisoriesHistory]);
          }
        });
    }
  }, [
    advisoryNumber,
    auth.isAuthenticated,
    auth.isLoading,
    auth.user?.access_token,
    setAdvisoryHistory,
  ]);
  return (
    <div className="ad-history-container px-3">
      {advisoryHistory.length > 0 &&
        advisoryHistory.map((ah, index) => (
          <div key={index} className="row">
            Revision number {ah.revisionNumber} {ah.displayText.toLowerCase()}{" "}
            {ah.submitter} at {ah.submittedTime}
          </div>
        ))}
    </div>
  );
}

AdvisoryHistory.propTypes = {
  data: PropTypes.shape({
    advisoryNumber: PropTypes.number,
  }).isRequired,
};
