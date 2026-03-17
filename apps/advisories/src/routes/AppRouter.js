import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../components/page/home/Home";
import Error from "../components/page/error/Error";
import Advisory from "../components/page/advisory/Advisory";
import AdvisorySummary from "../components/page/advisorySummary/AdvisorySummary";
import AppDashboard from "../components/page/appDashboard/AppDashboard";
import ParkInfo from "../components/page/parkInfo/ParkInfo";
import { PrivateRoute } from "../auth/PrivateRoute";
import AdvisoryLink from "../components/page/advisoryLink/AdvisoryLink";

function AppRouter() {
  const [error, setError] = useState({});
  const [cmsData, setCmsData] = useState({});

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home page={{ setError }} />} />
          <Route
            path="/advisories"
            element={
              <PrivateRoute roles={["submitter", "approver"]}>
                <AppDashboard page={{ setError, cmsData, setCmsData }} />
              </PrivateRoute>
            }
          />
          <Route
            path="/park-access-status"
            element={
              <PrivateRoute roles={["submitter", "approver"]}>
                <AppDashboard page={{ setError, cmsData, setCmsData }} />
              </PrivateRoute>
            }
          />
          <Route
            path="/activities-and-facilities"
            element={
              <PrivateRoute roles={["submitter", "approver"]}>
                <AppDashboard page={{ setError, cmsData, setCmsData }} />
              </PrivateRoute>
            }
          />
          <Route
            path="/park-info/:id"
            element={
              <PrivateRoute roles={["approver"]}>
                <ParkInfo page={{ setError, cmsData, setCmsData }} />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-advisory"
            element={
              <PrivateRoute roles={["submitter", "approver"]}>
                <Advisory
                  mode="create"
                  page={{ setError, cmsData, setCmsData }}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/update-advisory/:documentId"
            element={
              <PrivateRoute roles={["submitter", "approver"]}>
                <Advisory
                  mode="update"
                  page={{ setError, cmsData, setCmsData }}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/advisory-summary/:documentId"
            element={
              <PrivateRoute roles={["submitter", "approver"]}>
                <AdvisorySummary page={{ setError, cmsData, setCmsData }} />
              </PrivateRoute>
            }
          />
          <Route
            path="/advisory-link/:advisoryNumber"
            element={<AdvisoryLink />}
          />
          <Route path="/error" element={<Error page={{ error }} />} />
          <Route path="/dates" element={<p>/dates</p>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default AppRouter;
