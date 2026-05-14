import AdvisoryDashboard from "../advisoryDashboard/AdvisoryDashboard";

export default function AdvisoryReviewDashboard() {
  return (
    <AdvisoryDashboard
      filterStorageKey="advisoryReviewFilters"
      isReviewDashboard
    />
  );
}
