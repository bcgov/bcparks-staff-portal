export function formatDate(date) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  };

  return new Date(date).toLocaleDateString("en-US", options);
}
export function formatDateRange(dateRange) {
  const startDate = formatDate(dateRange.startDate);
  const endDate = formatDate(dateRange.endDate);

  return `${startDate} - ${endDate}`;
}
