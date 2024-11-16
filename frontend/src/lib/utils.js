export function formatDate(date) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  };

  return new Date(date).toLocaleDateString("en-US", options);
}

export function formatDateRange(dateRange) {
  const startDate = formatDate(dateRange.startDate);
  const endDate = formatDate(dateRange.endDate);

  return `${startDate} - ${endDate}`;
}

export function formatTimestamp(timestamp) {
  // Parse the timestamp into a Date object
  const date = new Date(timestamp);

  // Get the options for formatting the date and time
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Vancouver",
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  };

  // Format the date and time using the options
  return date.toLocaleString("en-US", options);
}

export function formatDatetoISO(date) {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}
