import { useState } from "react";
import { omit, mapValues, minBy, maxBy, orderBy } from "lodash";
import { differenceInCalendarDays, parseISO, isBefore, max } from "date-fns";

// Validation functions for the SubmitForm component
export default function useValidation(dates, notes, season) {
  // Validation errors
  const [errors, setErrors] = useState({});
  // Track if the form has been submitted, and validate on change after that
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
        "The dates you are editing have already been Approved or Published. Please provide a note explaining the reason for this update.",
      );
    }

    return true;
  }

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

  // Returns true if all reservation date ranges are within the operating date ranges
  function validateReservationDates(dateableFeature) {
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
  }

  // Validates the start and end datepicker fields in a date range
  function validateDateRange({
    start,
    startDateId,
    end,
    endDateId,
    dateRangeId,
  }) {
    // Skip validation for empty ranges
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
        dateRangeId,
        "Enter an end date that comes after the start date",
      );
    }

    const operatingYear = season.operatingYear;

    // Date must be within the year for that form
    if (startDate.getFullYear() !== operatingYear) {
      return addError(startDateId, `Enter dates for ${operatingYear} only`);
    }

    if (endDate.getFullYear() !== operatingYear) {
      return addError(endDateId, `Enter dates for ${operatingYear} only`);
    }

    return true;
  }

  // Validates all date ranges for a dateable feature from `dates`
  function validateFeatureDates(dateableId, datesObj = dates) {
    const dateableFeature = datesObj[dateableId];

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
    const dateTypeGroupsValid = dateTypeGroups.every((dateRanges) =>
      // Loop over date ranges for the date type
      dateRanges.every((dateRange, index) =>
        validateDateRange({
          start: dateRange.startDate,
          startDateId: `start-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          end: dateRange.endDate,
          endDateId: `end-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          dateRangeId: `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
        }),
      ),
    );

    // If any date range is invalid, return and don't validate anything further
    if (!dateTypeGroupsValid) return false;

    // Validate rules rules that involve the entire feature

    // Check if the reservation dates are all within the operating dates
    if (!validateReservationDates(dateableFeature)) {
      return addError(
        dateableId,
        "Enter reservation dates that fall within the operating dates selected.",
      );
    }

    // Get the extent of dates for each type
    const dateExtents = getDateExtents(datesObj);
    const operationExtent = dateExtents[dateableId].Operation;
    const reservationExtent = dateExtents[dateableId].Reservation;

    // End date is one or more days after reservation end date
    const daysBetween = differenceInCalendarDays(
      operationExtent.maxDate,
      reservationExtent.maxDate,
    );

    // The "within range" checks earlier will ensure that the operation end date
    // is after the reservation end date, so we only need to check the number of days between the them

    if (daysBetween < 1) {
      return addError(
        dateableId,
        "Reservation end date must be one or more days before the operating end date.",
      );
    }

    return true;
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

  // Validates a dateable feature after a date range has been updated
  function onUpdateDateRange({
    dateRange,
    // Allow overriding dates during state updates
    datesObj = dates,
  }) {
    // Don't validate until the form has been submitted
    if (!formSubmitted) return true;

    const { dateableId } = dateRange;

    // Validate the whole campsite grouping feature
    // to resolve any inter-dependent date range validations.
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
