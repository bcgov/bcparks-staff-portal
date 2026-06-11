import moment from "moment";
import { isEmpty } from "@/lib/advisories/utils/AppUtil";

export function validateOptionalNumber(field) {
  field.setError("");
  if (field.value === "" || !/^0$|^[1-9]\d{0,3}$/.test(field.value)) {
    field.setError("Enter a valid number");
    return false;
  }
  return true;
}

export function validateRequiredText(field) {
  field.setError("");
  if (field.value !== 0 && !field.value) {
    field.setError(`Enter ${field.text}`);
    return false;
  }
  return true;
}

export function validateRequiredSelect(field) {
  field.setError("");
  if (!field.value) {
    field.setError(`Select ${field.text}`);
    return false;
  }
  return true;
}

export function validateRequiredMultiSelect(field) {
  field.setError("");
  if (isEmpty(field.value)) {
    field.setError(`Select ${field.text}`);
    return false;
  }
  return true;
}

/**
 * Checks that at least one of the two fields ("Protected area" or "Recreation resources") has a value.
 * If neither field has a value, sets an error message and returns false. Returns true if valid.
 * @param {Object} field An object containing the values and error handling metadata for the fields
 * @param {Array} field.protectedAreaFields Arrays of selected values for BC Parks "Protected areas"
 * @param {Array} field.recreationResourcesFields Arrays of selected values for "Recreation resources"
 * @param {Function} field.setError Function to set the error message for the fields
 * @param {string} field.text The error message text to display if validation fails
 * @returns {boolean} - True if at least one field has a value, otherwise false.
 */
export function validateRequiredAffectedResources({
  protectedAreaFields,
  recreationResourcesFields,
  setError,
  text,
}) {
  setError("");

  // Check that at least one of the two fields has a selected value
  const hasValue = [...protectedAreaFields, ...recreationResourcesFields].some(
    (values) => Array.isArray(values) && values.length > 0,
  );

  if (hasValue) return true;

  // If none of the checked inputs have a value, set the error message and return false
  setError(text);

  return false;
}

export function validateOptionalDate(field) {
  field.setError("");
  if (field.value) {
    return validateDate(field);
  }
  return true;
}

export function validateRequiredDate(field) {
  field.setError("");
  return validateDate(field);
}

export function validateDate(field) {
  const date = moment(field.value);

  if (!date.isValid()) {
    field.setError("Enter a valid date");
    return false;
  }
  return true;
}

export function validateLinks(links, linkErrorsStatus) {
  let isValid = true;
  const newLinkTypeErrors = [...linkErrorsStatus.linkTypeErrors];
  const newLinkTitleErrors = [...linkErrorsStatus.linkTitleErrors];
  const newLinkUrlErrors = [...linkErrorsStatus.linkUrlErrors];
  const newLinkFileErrors = [...linkErrorsStatus.linkFileErrors];

  links.forEach((link, idx) => {
    if (!link.type) {
      newLinkTypeErrors[idx] = true;
      isValid = false;
    } else {
      newLinkTypeErrors[idx] = false;
    }
    if (!link.title) {
      newLinkTitleErrors[idx] = true;
      isValid = false;
    } else {
      newLinkTitleErrors[idx] = false;
    }
    if (!link.url && !link.file) {
      newLinkUrlErrors[idx] = true;
      newLinkFileErrors[idx] = true;
      isValid = false;
    } else {
      newLinkUrlErrors[idx] = false;
      newLinkFileErrors[idx] = false;
    }
  });
  linkErrorsStatus.setLinkTypeErrors(newLinkTypeErrors);
  linkErrorsStatus.setLinkTitleErrors(newLinkTitleErrors);
  linkErrorsStatus.setLinkUrlErrors(newLinkUrlErrors);
  linkErrorsStatus.setLinkFileErrors(newLinkFileErrors);
  return isValid;
}

export function validateLink(link, index, field, setErrors) {
  let hasError = false;

  if (field === "type" && !link.type) {
    hasError = true;
  } else if (field === "title" && !link.title) {
    hasError = true;
  } else if (field === "url" && !link.url) {
    hasError = true;
  } else if (field === "file" && !link.file) {
    hasError = true;
  }

  setErrors((prevErrors) => {
    const newErrors = [...prevErrors];

    newErrors[index] = hasError;
    return newErrors;
  });
}
export function validateDisplayedDate(field) {
  const obj = field.value;

  if (
    (obj.displayedDateOption === "" || obj.displayedDateOption === "posting") &&
    !obj.advisoryDate
  ) {
    field.setError("Choose a date to display");
    return false;
  }
  if (obj.displayedDateOption === "start" && !obj.startDate) {
    field.setError("Enter a date for 'Start date'");
    return false;
  }
  if (obj.displayedDateOption === "updated" && !obj.updatedDate) {
    field.setError("Enter a date for 'Updated date'");
    return false;
  }
  if (obj.displayedDateOption === "event" && (!obj.startDate || !obj.endDate)) {
    field.setError("Enter dates for 'Start date' and 'End date'");
    return false;
  }
  field.setError("");
  return true;
}

export function validAdvisoryData(
  advisoryData,
  linksRef,
  mode,
  linkErrorsStatus,
) {
  advisoryData.formError("");
  const validListingRankNumber = validateOptionalNumber(
    advisoryData.listingRank,
  );
  const validHeadline = validateRequiredText(advisoryData.headline);
  const validEventType = validateRequiredSelect(advisoryData.eventType);
  const validUrgency = validateRequiredSelect(advisoryData.urgency);
  const validAffectedResources = validateRequiredAffectedResources(
    advisoryData.affectedResources,
  );
  const validAdvisoryDate = validateRequiredDate(advisoryData.advisoryDate);
  const validStartDate = validateOptionalDate(advisoryData.startDate);
  const validEndDate = validateOptionalDate(advisoryData.endDate);
  const validExpiryDate = validateOptionalDate(advisoryData.expiryDate);
  const validLinks = validateLinks(linksRef.current, linkErrorsStatus);
  const validDisplayedDate = validateDisplayedDate(advisoryData.displayedDate);
  let validData =
    validListingRankNumber &&
    validHeadline &&
    validEventType &&
    validUrgency &&
    validAffectedResources &&
    validAdvisoryDate &&
    validStartDate &&
    validEndDate &&
    validExpiryDate &&
    validDisplayedDate &&
    validLinks;

  if (mode === "update") {
    const validUpdatedDate = validateOptionalDate(advisoryData.updatedDate);

    validData = validData && validUpdatedDate;
  }
  if (!validData) {
    advisoryData.formError("Complete the required fields");
  }
  return validData;
}
