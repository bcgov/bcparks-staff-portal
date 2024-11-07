import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";

const FORMAT_DEFAULT = "MMMM d, yyyy";
const FORMAT_SHORT = "EEE, MMM d";

// Parses an ISO date string and provides formatting utilities
export default function useDate(initialDate) {
  const [date, setDate] = useState(parseISO(initialDate));

  // Returns the formatted date string
  const formatted = useCallback(
    (dateFormat = FORMAT_DEFAULT) => format(date, dateFormat),
    [date],
  );

  return { date, setDate, formatted, FORMAT_DEFAULT, FORMAT_SHORT };
}
