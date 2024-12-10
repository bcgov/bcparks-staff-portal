import { useEffect, useState } from "react";
import classNames from "classnames";
import { faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApiGet } from "@/hooks/useApi";
import LoadingBar from "@/components/LoadingBar";
import getEnv from "@/config/getEnv";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import FlashMessage from "@/components/FlashMessage";

function ExportPage() {
  const {
    flashTitle,
    flashMessage,
    openFlashMessage,
    handleFlashClose,
    isFlashOpen,
  } = useFlashMessage();

  const { data: options, loading, error } = useApiGet("/export/options");
  const [exportYear, setExportYear] = useState();
  const [exportFeatures, setExportFeatures] = useState([]);

  // Set the initial values when options are loaded
  useEffect(() => {
    // Initially select the latest year from the data
    if (options?.years) {
      setExportYear(options.years.at(-1));
    }

    // Initially select all feature types
    if (options?.featureTypes?.length) {
      setExportFeatures(options.featureTypes.map((feature) => feature.id));
    }
  }, [options]);

  function onExportFeaturesChange(event) {
    const { checked } = event.target;
    const value = +event.target.value;

    setExportFeatures((prevFeatures) => {
      if (checked) {
        return [...prevFeatures, value];
      }

      return prevFeatures.filter((feature) => feature !== value);
    });
  }

  const exportTypes = [
    { value: "all", label: "All dates" },
    { value: "bcp-only", label: "BCP reservations only" },
  ];
  const [exportType, setExportType] = useState("all");

  function getExportUrl() {
    const url = new URL(getEnv("VITE_API_BASE_URL"));
    const params = new URLSearchParams();

    url.pathname += "/export/csv";

    params.append("type", exportType);
    params.append("year", exportYear);
    exportFeatures.forEach((featureId) => {
      params.append("features[]", featureId);
    });

    url.search = params.toString();

    return url;
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

  return (
    <div className="page export">
      <FlashMessage
        title={flashTitle}
        message={flashMessage}
        isVisible={isFlashOpen}
        onClose={handleFlashClose}
      />
      <p>Select the format of your export:</p>

      <div className="row">
        <div className="col-md-6 col-lg-5">
          <fieldset className="mb-3">
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
          <fieldset className="mb-3">
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
          <fieldset className="mb-3">
            <legend className="append-required">Park features</legend>
            {options.featureTypes.map((feature) => (
              <div className="form-check" key={feature.id}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="features"
                  id={`features-${feature.id}`}
                  value={feature.id}
                  checked={exportFeatures.includes(feature.id)}
                  onChange={onExportFeaturesChange}
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
          <fieldset>
            <a
              href={getExportUrl()}
              target="_blank"
              rel="noopener"
              className={classNames({
                btn: true,
                "btn-primary": true,
                disabled: exportFeatures.length === 0,
              })}
              onClick={(ev) => {
                if (exportFeatures.length === 0) {
                  ev.preventDefault();
                } else {
                  // Show success flash message
                  openFlashMessage(
                    "Export complete",
                    "Check your Downloads for the Excel document.",
                  );
                }
              }}
            >
              Export report
            </a>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;
