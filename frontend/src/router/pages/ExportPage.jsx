import { useState } from "react";
import { saveAs } from "file-saver";
import Select from "react-select";
import { faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";

import { useApiGet } from "@/hooks/useApi";
import useFlashMessage from "@/hooks/useFlashMessage";
import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";

import "./ExportPage.scss";

function ExportPage() {
  const successFlash = useFlashMessage();
  const errorFlash = useFlashMessage();

  const { data: options, loading, error } = useApiGet("/export/options");
  const [exportYear, setExportYear] = useState();

  const { generating, fetchData: fetchCsv } = useApiGet("/export/csv", {
    instant: false,
    params: {
      year: exportYear?.value,
    },
  });

  // Fetches the CSV as plain text, and then saves it as a file.
  async function getCsv() {
    try {
      const csvData = await fetchCsv();

      const exportDate = format(new Date(), "yyyyMMdd-HHmm");
      const filename = `DOOT ${exportYear.value} - all dates - exported ${exportDate}.csv`;

      // Convert CSV string to blob and save in the browser
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

      saveAs(blob, filename);

      successFlash.open(
        "Export completed",
        "Check your downloads for the export.",
      );
    } catch (csvError) {
      console.error("Error generating CSV", csvError);

      errorFlash.open(
        "Export failed",
        "There was an error generating the Excel document. Please try again.",
      );
    }
  }

  if (error) {
    return (
      <div className="container">
        <p className="px-3">Error loading options data: {error.message}</p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="container">
        <div className="p-3 pt-0">
          <LoadingBar />
        </div>
      </div>
    );

  const disableButton = !exportYear || generating;

  return (
    <div className="container">
      <div className="page export">
        <FlashMessage
          title={successFlash.title}
          message={successFlash.message}
          isVisible={successFlash.isOpen}
          onClose={successFlash.close}
        />

        <FlashMessage
          title={errorFlash.title}
          message={errorFlash.message}
          isVisible={errorFlash.isOpen}
          onClose={errorFlash.close}
          variant="error"
        />

        <p>Select the information to include in your export:</p>
        <h3 className="mb-4">Dates</h3>

        <div className="row">
          <div className="col-md-6 col-lg-5">
            <fieldset className="section-spaced">
              <h6 className="fw-normal append-required">Operating year</h6>
              <div className="input-with-append col-8 col-sm-6">
                <Select
                  id="year"
                  value={exportYear}
                  options={options?.years || []}
                  placeholder="Select year"
                  className="select-year-field"
                  classNamePrefix="react-select"
                  onChange={(selectedOption) => setExportYear(selectedOption)}
                  components={{
                    DropdownIndicator: () => (
                      <div className="react-select__dropdown-indicator">
                        <FontAwesomeIcon icon={faCalendarCheck} />
                      </div>
                    ),
                  }}
                />
              </div>
              {/* TODO: Add export validation */}
              {!exportYear && (
                <div className="text-danger validation-errors my-2">
                  Required
                </div>
              )}
            </fieldset>
            <fieldset className="d-flex">
              <button
                role="button"
                className="btn btn-primary"
                disabled={disableButton}
                onClick={getCsv}
              >
                Export dates
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
    </div>
  );
}

export default ExportPage;
