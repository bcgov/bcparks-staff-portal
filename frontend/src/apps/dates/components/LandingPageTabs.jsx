import { useMemo, useContext } from "react";
import { Outlet } from "react-router-dom";
import useAccess from "@/hooks/useAccess";
import UserContext from "@/contexts/UserContext";
import PageLayout from "@/components/PageLayout";
import { NoParkAccess } from "./NoParkAccess";

export default function LandingPageTabs() {
  const { ROLES, checkAccess, hasAnyRole, isAuthenticated } = useAccess();

  const { data: userData } = useContext(UserContext);

  // Check user permissions
  const { hqStaff, hasAllParkAccess } = useMemo(
    () => ({
      hqStaff: hasAnyRole([ROLES.DOOT_APPROVER]),
      hasAllParkAccess: checkAccess(ROLES.DOOT_ALL_PARK_ACCESS),
    }),
    [checkAccess, hasAnyRole, ROLES.DOOT_APPROVER, ROLES.DOOT_ALL_PARK_ACCESS],
  );

  // Only HQ staff have access to more than one tab
  const tabs = useMemo(
    () => [
      { label: "Submit", to: "/dates/submit" },
      ...(hqStaff
        ? [
            { label: "Publish", to: "/dates/publish" },
            { label: "Edit published", to: "/dates/edit-published" },
            { label: "Export", to: "/dates/export" },
          ]
        : []),
    ],
    [hqStaff],
  );

  // This prevents flashing the tabs layout to unauthenticated users
  if (!isAuthenticated) return <></>;

  // If this user has no access to any parks, show "Access Pending"
  if (!hasAllParkAccess && userData?.accessGroups?.length === 0) {
    return <NoParkAccess />;
  }

  return (
    <PageLayout title="Dates management" tabs={tabs}>
      <Outlet />
    </PageLayout>
  );
}
