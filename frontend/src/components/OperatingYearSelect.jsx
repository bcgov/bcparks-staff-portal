import { useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import * as SEASON_TYPE from "@/constants/seasonType";

export default function OperatingYearSelect({
  seasonId,
  season,
  seasonOptions,
  loadingSeasonOptions,
  onSeasonChange,
}) {
  const showOperatingYearRange = useMemo(
    () =>
      season?.seasonType === SEASON_TYPE.WINTER ||
      Boolean(season?.feature?.datesCanSpan2Years),
    [season?.seasonType, season?.feature?.datesCanSpan2Years],
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
        value={seasonId}
        onChange={(event) => {
          const nextSeasonId = Number.parseInt(event.target.value, 10);

          onSeasonChange(nextSeasonId);
        }}
        className="ms-0 ms-sm-3 mb-2"
        disabled={loadingSeasonOptions || seasonOptions.length === 0}
      >
        {seasonOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {formatOperatingYearLabel(option.operatingYear)}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}

OperatingYearSelect.propTypes = {
  seasonId: PropTypes.number.isRequired,
  season: PropTypes.shape({
    seasonType: PropTypes.string,
    feature: PropTypes.shape({
      datesCanSpan2Years: PropTypes.bool,
    }),
  }),
  seasonOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      operatingYear: PropTypes.number.isRequired,
    }),
  ).isRequired,
  loadingSeasonOptions: PropTypes.bool,
  onSeasonChange: PropTypes.func.isRequired,
};

OperatingYearSelect.defaultProps = {
  loadingSeasonOptions: false,
  season: null,
};
