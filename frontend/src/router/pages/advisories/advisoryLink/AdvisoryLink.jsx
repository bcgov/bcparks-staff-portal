import { useEffect } from "react";
import { cmsAxios } from "@/lib/advisories/axios_config";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import getEnv from "@/config/getEnv";

/*
  This component is used with React Router to create email redirect links to the
  advisory-summary page based on advisoryNumber instead of publicAdvisoryAuditId
*/
export default function AdvisoryLink() {
  const navigate = useNavigate();
  const auth = useAuth();
  const initialized = !auth.isLoading;
  const keycloakToken = auth.user?.access_token;
  const { advisoryNumber } = useParams();

  useEffect(() => {
    if (Number.parseInt(advisoryNumber, 10)) {
      if (initialized) {
        if (!auth.isAuthenticated) {
          auth.signinRedirect({
            // eslint-disable-next-line camelcase -- 'redirect_uri' is required by Keycloak
            redirect_uri: `${getEnv("VITE_FRONTEND_BASE_URL")}/advisory-link/${advisoryNumber}`,
            // eslint-disable-next-line camelcase -- 'kc_idp_hint' is required by Keycloak
            extraQueryParams: { kc_idp_hint: "idir" },
          });
          return;
        }
        Promise.resolve(
          cmsAxios.get(
            `public-advisory-audits?filters[advisoryNumber]=${advisoryNumber}&filters[isLatestRevision]=true`,
            {
              headers: { Authorization: `Bearer ${keycloakToken}` },
            },
          ),
        )
          .then((res) => {
            navigate(`/advisory-summary/${res.data.data[0].documentId}`, {
              replace: true,
            });
          })
          .catch(() => {
            navigate(`/advisories`, { replace: true });
          });
      }
    } else {
      navigate(`/`, { replace: true });
    }
  }, [initialized, advisoryNumber, auth, keycloakToken, navigate]);

  return <main></main>;
}
