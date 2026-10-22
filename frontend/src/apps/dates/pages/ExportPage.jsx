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

  const { loading: generating, fetchData: fetchCsv } = useApiGet(
    "/export/csv",
    {
      instant: false,
      params: {
        year: exportYear?.value,
      },
    },
  );

  // Fetches the CSV as plain text, and then saves it as a file.
  async function getCsv() {
    try {
      const csvData = await fetchCsv();

      const exportDate = format(new Date(), "yyyyMMdd-HHmm");
      const filename = `DOOT ${exportYear.value} - all dates - exported ${exportDate}.csv`;

      // Convert CSV string to blob and save in the browser
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

      saveAs(blob, filename);

      globalFlashMessage.open(
        "Export completed",
        "Check your downloads for the export.",
      );
    } catch (csvError) {
      console.error("Error generating CSV", csvError);

      globalFlashMessage.open(
        "Export failed",
        "There was an error generating the Excel document. Please try again.",
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
                onClick={getCsv}
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
