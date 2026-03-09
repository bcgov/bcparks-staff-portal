import React, { useEffect } from "react";
import { cmsAxios } from "../../../axios_config";
import { useParams, useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import Header from "../../composite/header/Header";
import config from "../../../utils/config";

/*
  This component is used with React Router to create email redirect links to the
  advisory-summary page based on advisoryNumber instead of publicAdvisoryAuditId
*/
export default function AdvisoryLink() {
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  const { advisoryNumber } = useParams();

  useEffect(() => {
    if (parseInt(advisoryNumber)) {
      if (initialized) {
        if (!keycloak.authenticated) {
          keycloak.login({
            redirectUri: `${config.REACT_APP_FRONTEND_BASE_URL}/advisory-link/${advisoryNumber}`,
            idpHint: "idir",
          });
        }
        Promise.resolve(
          cmsAxios.get(
            `public-advisory-audits?filters[advisoryNumber]=${advisoryNumber}&filters[isLatestRevision]=true`,
            {
              headers: { Authorization: `Bearer ${keycloak.token}` },
            },
          ),
        )
          .then((res) => {
            navigate(`/advisory-summary/${res.data.data[0].documentId}`);
          })
          .catch((err) => {
            navigate(`/advisories`);
          });
      }
    } else {
      navigate(`/`);
    }
  }, [initialized, advisoryNumber, keycloak, navigate]);

  return (
    <main>
      <Header />
    </main>
  );
}
