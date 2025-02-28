import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApiGet } from "@/hooks/useApi";
import LoadingBar from "@/components/LoadingBar";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import FlashMessage from "@/components/FlashMessage";

import "./ExportPage.scss";

function ExportPage() {
  const successFlash = useFlashMessage();
  const errorFlash = useFlashMessage();

  const { data: options, loading, error } = useApiGet("/export/options");
  const [exportYear, setExportYear] = useState();
  const [exportFeatures, setExportFeatures] = useState([]);
  const exportTypes = [
    { value: "all", label: "All dates" },
    { value: "bcp-only", label: "BCP reservations only" },
  ];
  const [exportDateTypes, setExportDateTypes] = useState([]);
  const [exportType, setExportType] = useState("all");

  const { generating, fetchData: fetchCsv } = useApiGet("/export/csv", {
    instant: false,
    params: {
      type: exportType,
      year: exportYear,
      "features[]": exportFeatures,
      "dateTypes[]": exportDateTypes,
    },
  });

  // Set the initial values when options are loaded
  useEffect(() => {
    // Initially select the latest year from the data
    if (options?.years) {
      setExportYear(options.years.at(-1));
    }
  }, [options]);

  // Selects every feature type's ID
  function selectAllFeatures() {
    if (options?.featureTypes?.length) {
      setExportFeatures(options.featureTypes.map((feature) => feature.id));
    }
  }

  // Returns a function to handle checkbox group changes
  function onCheckboxGroupChange(setter) {
    // Adds or removes an value from the selection array
    return function (event) {
      const { checked } = event.target;
      const value = +event.target.value;

      setter((previousValues) => {
        if (checked) {
          return [...previousValues, value];
        }

        return previousValues.filter((feature) => feature !== value);
      });
    };
  }

  // Fetches the CSV as plain text, and then saves it as a file.
  async function getCsv() {
    try {
      const csvData = await fetchCsv();

      // Build filename
      const displayType =
        exportType === "bcp-only" ? "BCP reservations only" : "All dates";

      let dateTypes = "All types";

      // If any date types are unselected, display a list
      if (exportDateTypes.length < options.dateTypes.length) {
        dateTypes = exportDateTypes
          .map((id) => options.dateTypes.find((t) => t.id === id).name)
          .join(", ");
      }

      const filename = `${exportYear} season - ${displayType} - ${dateTypes}.csv`;

      // Convert CSV string to blob and save in the browser
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

      saveAs(blob, filename);

      successFlash.openFlashMessage(
        "Export complete",
        "Check your Downloads for the Excel document.",
      );
    } catch (csvError) {
      console.error("Error generating CSV", csvError);

      errorFlash.openFlashMessage(
        "Export failed",
        "There was an error generating the Excel document. Please try again.",
      );
    }
  }

  if (error) {
    return <p className="px-3">Error loading options data: {error.message}</p>;
  }

  if (loading)
    return (
      <div className="p-3 pt-0">
        <LoadingBar />
      </div>
    );

  const disableButton =
    exportFeatures.length === 0 || exportDateTypes.length === 0 || generating;

  return (
    <div className="page export">
      <FlashMessage
        title={successFlash.flashTitle}
        message={successFlash.flashMessage}
        isVisible={successFlash.isFlashOpen}
        onClose={successFlash.handleFlashClose}
      />

      <FlashMessage
        title={errorFlash.flashTitle}
        message={errorFlash.flashMessage}
        isVisible={errorFlash.isFlashOpen}
        onClose={errorFlash.handleFlashClose}
        variant="error"
      />
      <p>Select the format of your export:</p>

      <div className="row">
        <div className="col-md-6 col-lg-5">
          <fieldset className="section-spaced">
            <legend className="append-required">Export type</legend>
            {exportTypes.map((option) => (
              <div className="form-check" key={option.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="exportType"
                  id={`type-${option.value}`}
                  value={option.value}
                  checked={exportType === option.value}
                  onChange={(e) => setExportType(e.target.value)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`type-${option.value}`}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </fieldset>
          <fieldset className="section-spaced">
            <legend className="append-required">Year</legend>
            <div className="input-with-append col-8 col-sm-6">
              <select
                id="year"
                className="form-select"
                value={exportYear}
                onChange={(ev) => setExportYear(+ev.target.value)}
              >
                {options.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                className="append-content"
                icon={faCalendarCheck}
              />
            </div>
          </fieldset>
          <fieldset className="section-spaced">
            <legend className="append-required">Park features</legend>

            <div className="mb-2">
              <button
                onClick={selectAllFeatures}
                type="button"
                className="btn btn-text text-primary"
              >
                Select all
              </button>
              |
              <button
                onClick={() => setExportFeatures([])}
                type="button"
                className="btn btn-text text-primary"
              >
                Clear all
              </button>
            </div>

            {options.featureTypes.map((feature) => (
              <div className="form-check" key={feature.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="features"
                  id={`features-${feature.id}`}
                  value={feature.id}
                  checked={exportFeatures.includes(feature.id)}
                  onChange={onCheckboxGroupChange(setExportFeatures)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`features-${feature.id}`}
                >
                  {feature.name}
                </label>
              </div>
            ))}
          </fieldset>
          <fieldset className="section-spaced">
            <legend className="append-required">Type of date</legend>

            {options.dateTypes.map((dateType) => (
              <div className="form-check" key={dateType.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="features"
                  id={`date-types-${dateType.id}`}
                  value={dateType.id}
                  checked={exportDateTypes.includes(dateType.id)}
                  onChange={onCheckboxGroupChange(setExportDateTypes)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`date-types-${dateType.id}`}
                >
                  {dateType.name}
                </label>
              </div>
            ))}
          </fieldset>
          <fieldset className="d-flex">
            <button
              role="button"
              className="btn btn-primary"
              disabled={disableButton}
              onClick={getCsv}
            >
              Export report
            </button>

            {generating && (
              <span
                className="spinner-border text-primary align-self-center ms-2"
                aria-hidden="true"
              ></span>
            )}
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;
