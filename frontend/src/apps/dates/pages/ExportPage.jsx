import { useState, useContext } from "react";
import classNames from "classnames";
import { saveAs } from "file-saver";
import Select from "react-select";
import { faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";

import { useApiGet } from "@/hooks/useApi";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import LoadingBar from "@/components/LoadingBar";
import { ActionButton } from "@/components/ActionButton";

import "./ExportPage.scss";

function ExportPage() {
  const globalFlashMessage = useContext(FlashMessageContext);

  const { data: options, loading, error } = useApiGet("/export/options");
  const [exportYear, setExportYear] = useState();
  const [exportFormat, setExportFormat] = useState("xlsx");

  const { loading: generating, fetchData: fetchExport } = useApiGet(
    "/export/csv",
    {
      instant: false,
      params: {
        year: exportYear?.value,
        format: exportFormat,
      },
      responseType: "blob",
    },
  );

  // Fetches the export in the selected format as a blob, and then saves it as a file.
  async function exportDates() {
    try {
      const fileBlob = await fetchExport();

      const exportDate = format(new Date(), "yyyyMMdd-HHmm");
      const filename = `DOOT ${exportYear.value} - all dates - exported ${exportDate}.${exportFormat}`;

      // Save the blob in the browser
      saveAs(fileBlob, filename);

      globalFlashMessage.open(
        "Export completed",
        "Check your downloads for the export.",
      );
    } catch (exportError) {
      console.error(`Error generating ${exportFormat} export`, exportError);

      globalFlashMessage.open(
        "Export failed",
        "There was an error generating the export. Please try again.",
        { variant: "error" },
      );
    }
  }

  // Throw load errors during render so the route's error boundary catches them
  if (error) {
    throw new Error("Could not load export options", { cause: error });
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
              {!exportYear && (
                <div className="text-danger validation-errors my-2">
                  Required
                </div>
              )}

              <h6 className="fw-normal mt-3">
                <label htmlFor="format">File format</label>
              </h6>
              <div className="col-8 col-sm-6">
                <select
                  id="format"
                  className="form-select"
                  value={exportFormat}
                  onChange={(event) => setExportFormat(event.target.value)}
                >
                  <option value="xlsx">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </fieldset>
            <fieldset
              className={classNames(
                "d-flex",
                "flex-column",
                "flex-sm-row",
                "gap-2",
                "gap-sm-0",
              )}
            >
              <ActionButton
                label="Export dates"
                disabled={disableButton}
                onClick={exportDates}
                hasLoader={generating}
              />
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;
