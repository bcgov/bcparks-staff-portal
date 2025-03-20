import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { omit, mapValues, minBy, maxBy, orderBy } from "lodash";
import { differenceInCalendarDays, parseISO, isBefore, max } from "date-fns";

// Returns a chronological list of date ranges with overlapping ranges combined
function consolidateRanges(ranges) {
  // Parse ISO date strings (and filter out any missing values)
  const parsedRanges = ranges
    .filter((range) => range.startDate && range.endDate)
    .map((range) => ({
      startDate: parseISO(range.startDate),
      endDate: parseISO(range.endDate),
    }));

  // Sort ranges by start date
  const sorted = orderBy(parsedRanges, ["startDate"]);

  // Combine overlapping ranges
  const consolidated = sorted.reduce((merged, current) => {
    const lastRange = merged.at(-1);

    // If the start date of the current range is before the end date of the last range,
    // combine the ranges
    if (lastRange && isBefore(current.startDate, lastRange.endDate)) {
      lastRange.endDate = max([lastRange.endDate, current.endDate]);
    } else {
      merged.push(current);
    }

    return merged;
  }, []);

  return consolidated;
}

// Returns true if innerStart and innerEnd are within outerStart and outerEnd
function checkWithinRange(outerStart, outerEnd, innerStart, innerEnd) {
  return outerStart <= innerStart && outerEnd >= innerEnd;
}

// Validation functions for the SubmitForm component
export default function useValidation(dates, notes, season) {
  // Validation errors
  const [errors, setErrors] = useState({});
  // Track if the form has been submitted, and validate on change after that
  const formSubmitted = useRef(false);

  // Add field key and error message to `errors`
  function addError(fieldId, message, overwrite = true) {
    setErrors((prevErrors) => {
      // Add and overwrite any existing errors for that field
      if (overwrite) {
        return {
          ...prevErrors,
          [fieldId]: message,
        };
      }

      // Add the error, but don't overwrite any existing errors
      return {
        [fieldId]: message,
        ...prevErrors,
      };
    });
  }

  // Remove field key from `errors`
  function clearError(fieldId) {
    setErrors((prevErrors) => omit(prevErrors, fieldId));
  }

  // Calculates the extents of each date type for each campsite grouping
  const getDateExtents = useCallback(
    (datesObj = dates) => {
      const mapped = mapValues(datesObj, (campsiteDates) =>
        mapValues(campsiteDates, (dateTypeDates) => {
          // Get the dateRange with the earliest start date for this campground & date type
          const minDateRange = minBy(
            dateTypeDates,
            (dateRange) => new Date(dateRange.startDate),
          );
          const minDate = minDateRange?.startDate
            ? new Date(minDateRange?.startDate)
            : null;

          // Get the dateRange with the latest end date for this campground & date type
          const maxDateRange = maxBy(
            dateTypeDates,
            (dateRange) => new Date(dateRange.endDate),
          );
          const maxDate = maxDateRange?.endDate
            ? new Date(maxDateRange.endDate)
            : null;

          return { minDate, maxDate };
        }),
      );

      return mapped;
    },
    [dates],
  );

  // Validates the notes textarea field

  const validateNotes = useCallback(
    (value = notes) => {
      clearError("notes");

      if (!season?.status) return;

      if (!value && ["approved", "on API"].includes(season.status)) {
        addError(
          "notes",
          "The dates you are editing have already been Approved or Published. Please provide a note explaining the reason for this update.",
        );
      }
    },
    [notes, season],
  );

  // Returns true if all reservation date ranges are within the operating date ranges
  const validateReservationDates = useCallback((dateableFeature) => {
    // Consolidate any overlapping date ranges for comparison
    const operatingRanges = consolidateRanges(dateableFeature.Operation);
    const reservationRanges = consolidateRanges(dateableFeature.Reservation);

    // Check if each reservation ranges is within an operating range
    const withinRange = reservationRanges.every((reservationRange) =>
      operatingRanges.some((operatingRange) =>
        checkWithinRange(
          operatingRange.startDate,
          operatingRange.endDate,
          reservationRange.startDate,
          reservationRange.endDate,
        ),
      ),
    );

    return withinRange;
  }, []);

  // Validates the start and end datepicker fields in a date range
  const validateDateRange = useCallback(
    ({ start, startDateId, end, endDateId, dateRangeId }) => {
      // Track errors for synchronous validation (on submit)
      let valid = true;

      // Skip validation for empty ranges
      if (!start && !end) return true;

      // If the form has been submitted, both fields are required
      if (formSubmitted.current) {
        if (!start) {
          valid = false;
          addError(startDateId, "Enter a start date");
        }

        if (!end) {
          valid = false;
          addError(endDateId, "Enter an end date");
        }
      } else if (!start || !end) {
        // If the form has not been submitted, don't validate until both fields are filled
        return true;
      }

      // Parse date strings
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Check if the start date is before the end date
      if (startDate > endDate) {
        valid = false;
        addError(
          dateRangeId,
          "Enter an end date that comes after the start date",
        );
      }

      const operatingYear = season?.operatingYear;

      if (!operatingYear) return valid;

      // Date must be within the year for that form
      if (startDate.getUTCFullYear() !== operatingYear) {
        valid = false;
        addError(startDateId, `Enter dates for ${operatingYear} only`, false);
      }

      if (endDate.getUTCFullYear() !== operatingYear) {
        valid = false;
        addError(endDateId, `Enter dates for ${operatingYear} only`, false);
      }

      return valid;
    },
    [season?.operatingYear, formSubmitted],
  );

  // Validates all date ranges for a dateable feature from `dates`
  const validateFeatureDates = useCallback(
    (dateableId, datesObj = dates) => {
      const dateableFeature = datesObj[dateableId];

      // Track errors for synchronous validation (on submit)
      let valid = true;

      // If the feature has no dates, skip validation
      if (
        dateableFeature.Operation.length === 0 &&
        dateableFeature.Reservation.length === 0
      ) {
        return true;
      }

      const dateTypeGroups = Object.values(dateableFeature);

      // Clear all errors for this dateable feature:
      // Build a list of all field IDs to clear from `errors`
      const fieldIds = dateTypeGroups.flatMap((dateRanges) =>
        dateRanges.flatMap((dateRange, index) => {
          const dateRangeId = `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`;

          return [
            dateRange.dateableId,
            dateRangeId,
            `start-date-${dateRangeId}`,
            `end-date-${dateRangeId}`,
          ];
        }),
      );

      // Remove any errors for this dateable feature before revalidating
      setErrors((prevErrors) => omit(prevErrors, fieldIds));

      // Validate rules for individual dates and ranges
      const groupsValid = dateTypeGroups.flatMap((dateRanges) =>
        // Loop over date ranges for the date type
        dateRanges.map((dateRange, index) =>
          validateDateRange({
            start: dateRange.startDate,
            startDateId: `start-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
            end: dateRange.endDate,
            endDateId: `end-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
            dateRangeId: `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          }),
        ),
      );

      // If any date range is invalid, the entire feature is invalid
      if (groupsValid.some((test) => !test)) {
        valid = false;
      }

      // Validate rules rules that involve the entire feature

      // Check if the reservation dates are all within the operating dates
      if (!validateReservationDates(dateableFeature)) {
        valid = false;
        addError(
          dateableId,
          "Enter reservation dates that fall within the operating dates selected.",
        );
      }

      // Get the extent of dates for each type
      const dateExtents = getDateExtents(datesObj);
      const operationExtent = dateExtents[dateableId].Operation;
      const reservationExtent = dateExtents[dateableId].Reservation;

      if (operationExtent.maxDate && reservationExtent.maxDate) {
        // End date is one or more days after reservation end date
        const daysBetween = differenceInCalendarDays(
          operationExtent.maxDate,
          reservationExtent.maxDate,
        );

        // The "within range" checks earlier will ensure that the operation end date
        // is after the reservation end date, so we only need to check the number of days between the them

        if (daysBetween < 1) {
          valid = false;
          addError(
            dateableId,
            "Reservation end date must be one or more days before the operating end date.",
          );
        }
      }

      return valid;
    },
    [dates, getDateExtents, validateDateRange, validateReservationDates],
  );

  // Validates the entire form
  const validateForm = useCallback(() => {
    // Clear errors from previous validation
    setErrors({});

    // Validate notes
    validateNotes();

    // Validate all dates:
    // Loop over dateable features from `dates` (campsite groupings)
    const dateableIds = Object.keys(dates);

    const validationResults = dateableIds.map((dateableId) =>
      validateFeatureDates(dateableId),
    );

    // Return true if all features passed validation
    return validationResults.every((result) => result);
  }, [validateNotes, dates, validateFeatureDates]);

  // Validate the form when the dates change
  useEffect(() => {
    // Skip validation until the dates have loaded
    if (!dates) return;

    validateForm();
  }, [notes, dates, validateForm, formSubmitted]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Export a special non-fatal error for handling validation errors
  class ValidationError extends Error {}

  return {
    errors,
    setErrors,
    formSubmitted,
    addError,
    clearError,
    checkWithinRange,
    getDateExtents,
    validateNotes,
    validateDateRange,
    validateFeatureDates,
    validateForm,
    ValidationError,
    isValid,
  };
}
