import { useCallback, useEffect, useMemo } from "react";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import * as SEASON_TYPE from "@/constants/seasonType";

export default function OperatingYearSelect({
  season = null,
  seasonOptions,
  loadingSeasonOptions = false,
  onSeasonChange,
}) {
  const latestSeasonId = useMemo(() => {
    if (!seasonOptions.length) return "";

    return seasonOptions.reduce((latestOption, option) =>
      option.operatingYear > latestOption.operatingYear ? option : latestOption,
    ).id;
  }, [seasonOptions]);

  const selectedSeasonId = useMemo(() => {
    const selectedId = season?.id;

    return seasonOptions.some((option) => option.id === selectedId)
      ? selectedId
      : latestSeasonId;
  }, [season?.id, seasonOptions, latestSeasonId]);

  // Keep the selected season in sync with available options
  useEffect(() => {
    if (selectedSeasonId && Number(season?.id) !== Number(selectedSeasonId)) {
      onSeasonChange(selectedSeasonId);
    }
  }, [onSeasonChange, season?.id, selectedSeasonId]);

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
        value={selectedSeasonId}
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
  loadingSeasonOptions: PropTypes.bool,
  onSeasonChange: PropTypes.func.isRequired,
};
