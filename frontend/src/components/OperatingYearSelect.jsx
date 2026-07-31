import { useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import * as SEASON_TYPE from "@/constants/seasonType";

export default function OperatingYearSelect({
  season = null,
  seasonOptions,
  featureTypeName = null,
  loadingSeasonOptions = false,
  onSeasonChange,
}) {
  const currentYear = new Date().getFullYear();
  const allowCurrentYear =
    featureTypeName === "Group campground" ||
    featureTypeName === "Picnic shelter";

  // Filter out seasons that are in the future and hide the current operating year in Edit Published.
  // Group campground and Picnic shelter always carry one extra season ahead,
  // so allow the current operating year for those feature types.
  const editableSeasonOptions = useMemo(
    () =>
      seasonOptions.filter((option) =>
        allowCurrentYear
          ? option.operatingYear <= currentYear
          : option.operatingYear < currentYear,
      ),
    [allowCurrentYear, seasonOptions, currentYear],
  );

  const showOperatingYearRange = useMemo(
    () =>
      season?.seasonType === SEASON_TYPE.WINTER ||
      Boolean(season?.datesCanSpan2Years),
    [season?.seasonType, season?.datesCanSpan2Years],
  );

  const formatOperatingYearLabel = useCallback(
    (operatingYear) =>
      showOperatingYearRange
        ? `${operatingYear} – ${operatingYear + 1}`
        : `${operatingYear}`,
    [showOperatingYearRange],
  );

  return (
    <div className="d-block d-sm-flex align-items-center">
      <h2 className="fw-normal">Edit dates for</h2>
      <Form.Select
        id="operating-year-select"
        aria-label="Select operating year"
        value={season?.id ?? ""}
        onChange={(event) => {
          const nextSeasonId = Number.parseInt(event.target.value, 10);

          onSeasonChange(nextSeasonId);
        }}
        className="ms-0 ms-sm-3 mb-2"
        disabled={loadingSeasonOptions || editableSeasonOptions.length === 0}
      >
        {editableSeasonOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {formatOperatingYearLabel(option.operatingYear)}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}

OperatingYearSelect.propTypes = {
  season: PropTypes.shape({
    id: PropTypes.number,
    seasonType: PropTypes.string,
    datesCanSpan2Years: PropTypes.bool,
  }),
  seasonOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      operatingYear: PropTypes.number.isRequired,
    }),
  ).isRequired,
  featureTypeName: PropTypes.string,
  loadingSeasonOptions: PropTypes.bool,
  onSeasonChange: PropTypes.func.isRequired,
};
