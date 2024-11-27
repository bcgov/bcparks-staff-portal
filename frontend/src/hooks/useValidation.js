import { useState } from "react";
import { omit, mapValues, minBy, maxBy } from "lodash";
import { differenceInCalendarDays } from "date-fns";

// Validation functions for the SubmitForm component
export default function useValidation(dates, notes, season) {
  // Validation errors
  const [errors, setErrors] = useState({});
  // @TODO: Track if the form has been submitted, and validate on change after that
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Add field key and error message to `errors`
  function addError(fieldId, message) {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldId]: message,
    }));
    return false;
  }

  // Remove field key from `errors`
  function clearError(fieldId) {
    setErrors((prevErrors) => omit(prevErrors, fieldId));
  }

  // Returns true if innerStart and innerEnd are within outerStart and outerEnd
  function checkWithinRange(outerStart, outerEnd, innerStart, innerEnd) {
    return outerStart <= innerStart && outerEnd >= innerEnd;
  }

  // Calculates the extents of each date type for each campsite grouping
  function getDateExtents(datesObj = dates) {
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
  }

  // Validates the notes textarea field
  function validateNotes(value = notes) {
    clearError("notes");

    if (!value && ["approved", "published"].includes(season.status)) {
      return addError(
        "notes",
        "Required when updating previously approved dates",
      );
    }

    return true;
  }

  // validates the start and end datepicker fields in a date range
  function validateDateRange({
    dateRange,
    start,
    startDateId,
    end,
    endDateId,
    datesObj = dates,
  }) {
    clearError(startDateId);
    clearError(endDateId);

    // If both dates are blank, ignore the range
    if (!start && !end) {
      return true;
    }

    // Both dates are required if one is set
    if (!start) {
      return addError(startDateId, "Enter a start date");
    }

    if (!end) {
      return addError(endDateId, "Enter an end date");
    }

    // Parse date strings
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Check if the start date is before the end date
    if (startDate > endDate) {
      return addError(
        endDateId,
        "Enter an end date that comes after the start date",
      );
    }

    const operatingYear = season.operatingYear;

    // Date must be within the year for that form
    if (
      startDate.getFullYear() !== operatingYear ||
      endDate.getFullYear() !== operatingYear
    ) {
      // startDate =< endDate check happens first, so the end date will never fail this check
      return addError(startDateId, `Enter dates for ${operatingYear} only`);
    }

    const dateType = dateRange.dateType.name;
    const { dateableId } = dateRange;

    const dateExtents = getDateExtents(datesObj);

    // Get the extent of dates for each type
    const operationExtent = dateExtents[dateableId].Operation;
    const reservationExtent = dateExtents[dateableId].Reservation;

    // Check if the reservation dates are within the operating dates
    // @TODO: Check for gaps if operating dates is non-contiguous
    const withinRange = checkWithinRange(
      operationExtent.minDate,
      operationExtent.maxDate,
      reservationExtent.minDate,
      reservationExtent.maxDate,
    );

    // Validate rules specific to Reservation dates
    if (dateType === "Reservation") {
      // Date selected is within the operating dates
      if (!withinRange) {
        return addError(
          endDateId,
          "Enter reservation dates that fall within the operating dates selected.",
        );
      }
    }

    // Validate rules specific to Operation dates
    if (dateType === "Operation") {
      // Date selected encompasses reservation dates
      if (!withinRange) {
        // @TODO: Highlight the latest extent instead of the one being changed
        return addError(
          endDateId,
          "Enter operating dates that are the same or longer than the reservation dates selected.",
        );
      }
    }

    // End date is one or more days after reservation end date
    const daysBetween = differenceInCalendarDays(
      operationExtent.maxDate,
      reservationExtent.maxDate,
    );

    // The "within range" check above will ensure that the operation end date
    // is after the reservation end date, so we only need to check the number of days between the them

    if (dateType === "Operation") {
      if (daysBetween < 1) {
        return addError(
          endDateId,
          "Operating end date must be one or more days after reservation end date.",
        );
      }
    }

    if (dateType === "Reservation") {
      if (daysBetween < 1) {
        return addError(
          endDateId,
          "Reservation end date must be one or more days before the operating end date.",
        );
      }
    }

    return true;
  }

  // Validates all date ranges for a dateable feature from `dates`
  function validateFeatureDates(dateableId, datesObj = dates) {
    const dateableFeature = datesObj[dateableId];

    const dateTypeGroups = Object.values(dateableFeature);

    // Clear all errors for this dateable feature:
    // Build a list of all field IDs to clear from `errors`
    const fieldIds = dateTypeGroups.flatMap((dateRanges) =>
      dateRanges.flatMap((dateRange, index) => {
        const dateRangeId = `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`;

        return [`start-date-${dateRangeId}`, `end-date-${dateRangeId}`];
      }),
    );

    // Remove any errors for this dateable feature before revalidating
    setErrors((prevErrors) => omit(prevErrors, fieldIds));

    const dateTypeGroupsValid = dateTypeGroups.every((dateRanges) =>
      // Loop over date ranges for the date type
      dateRanges.every((dateRange, index) =>
        validateDateRange({
          dateRange,
          start: dateRange.startDate,
          startDateId: `start-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          end: dateRange.endDate,
          endDateId: `end-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          datesObj,
        }),
      ),
    );

    return dateTypeGroupsValid;
  }

  function validateForm() {
    // Clear errors from previous validation
    setErrors({});

    // Validate notes
    if (!validateNotes()) return false;

    // Validate all dates:
    // Loop over dateable features from `dates` (campsite groupings)
    const dateableIds = Object.keys(dates);
    const validDates = dateableIds.every((dateableId) =>
      validateFeatureDates(dateableId),
    );

    // @TODO: Scroll the first error into view

    return validDates;
  }

  // Validates a date range, then its parent dateable feature
  function onUpdateDateRange({
    dateRange,
    start,
    startDateId,
    end,
    endDateId,
    // Allow overriding dates during state updates
    datesObj = dates,
  }) {
    const { dateableId } = dateRange;

    // Validate the date range that changed
    const rangeValid = validateDateRange({
      dateRange,
      start,
      startDateId,
      end,
      endDateId,
      datesObj,
    });

    // If the changed dateRange is invalid, don't validate anything else
    if (!rangeValid) return false;

    // If the changed dateRange is valid, validate the whole campsite grouping feature
    // to resolve any inter-dependent date range validations.

    // @TODO: This unnecessarily validates the changed dateRange twice;
    // Consider refactoring to validate once, but only show relevant errors.

    return validateFeatureDates(dateableId, datesObj);
  }

  return {
    errors,
    setErrors,
    formSubmitted,
    setFormSubmitted,
    addError,
    clearError,
    checkWithinRange,
    getDateExtents,
    validateNotes,
    validateDateRange,
    validateFeatureDates,
    validateForm,
    onUpdateDateRange,
  };
}
