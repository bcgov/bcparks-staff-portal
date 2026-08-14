import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { faPen } from "@fa-kit/icons/classic/regular";

import { useApiGet } from "@/hooks/useApi";
import FormPanel from "@/components/FormPanel";
import IconButton from "@/components/IconButton";
import ParkSearch from "@/components/ParkSearch";
import LoadingBar from "@/components/LoadingBar";
import * as SEASON_TYPE from "@/constants/seasonType";
import "./EditPublishedPage.scss";

export default function EditPublishedPage() {
  const { data, loading, error, fetchData } = useApiGet("/edit-published");
  const parks = useMemo(() => data ?? [], [data]);

  const [selectedParkOption, setSelectedParkOption] = useState(null);
  const [formData, setFormData] = useState({});
  const [showFormPanel, setShowFormPanel] = useState(false);

  const parkOptions = useMemo(
    () =>
      sortBy(
        parks.map((park) => ({
          value: park.id,
          label: park.name,
        })),
        "label",
      ),
    [parks],
  );

  const selectedPark = useMemo(() => {
    if (!selectedParkOption) return null;

    return parks.find((park) => park.id === selectedParkOption.value) || null;
  }, [parks, selectedParkOption]);

  const parkItems = useMemo(() => {
    if (!selectedPark) return [];

    const items = [];

    // Find a season by type
    function getSeasonByType(seasons = [], seasonType = SEASON_TYPE.REGULAR) {
      const seasonsOfType = seasons.filter(
        (season) => season.seasonType === seasonType,
      );

      if (!seasonsOfType.length) {
        return null;
      }

      const previousSeasonYear = Math.max(
        ...seasonsOfType.map((season) => season.operatingYear),
      );

      return (
        seasonsOfType.find(
          (season) => season.operatingYear === previousSeasonYear,
        ) || null
      );
    }

    // Park-level seasons (regular and winter)
    const regularSeason = getSeasonByType(
      selectedPark.seasons,
      SEASON_TYPE.REGULAR,
    );
    const winterSeason = getSeasonByType(
      selectedPark.seasons,
      SEASON_TYPE.WINTER,
    );

    if (regularSeason) {
      items.push({
        id: regularSeason.id,
        name: "Tiers and gate",
        level: "park",
      });
    }

    if (winterSeason) {
      items.push({
        id: winterSeason.id,
        name: "Winter fee",
        level: "park",
      });
    }

    // Area-level seasons
    for (const parkArea of selectedPark.parkAreas || []) {
      const parkAreaSeason = getSeasonByType(
        parkArea.seasons,
        SEASON_TYPE.REGULAR,
      );

      if (parkAreaSeason) {
        items.push({
          id: parkAreaSeason.id,
          name: parkArea.name,
          typeName:
            parkArea.parkAreaTypeName ?? parkArea.parkAreaType?.name ?? null,
          level: "park-area",
        });
      }
    }

    // Feature-level seasons
    for (const feature of selectedPark.features || []) {
      const featureSeason = getSeasonByType(
        feature.seasons,
        SEASON_TYPE.REGULAR,
      );

      if (featureSeason) {
        items.push({
          id: featureSeason.id,
          name: feature.name,
          typeName:
            feature.featureTypeName ?? feature.featureType?.name ?? null,
          level: "feature",
        });
      }
    }

    return items;
  }, [selectedPark]);

  function handleOpenFormPanel(item) {
    setFormData({
      seasonId: item.id,
      level: item.level,
      showOperatingYearSelect: true,
    });
    setShowFormPanel(true);
  }

  if (loading) {
    return (
      <div className="container">
        <div className="page edit-published">
          <LoadingBar />
        </div>
      </div>
    );
  }

  if (error) {
    return <p>Error loading parks data: {error.message}</p>;
  }

  return (
    <div className="container">
      <div className="page edit-published">
        <h3 className="fw-normal mb-4">Edit published dates</h3>

        <div className="row">
          <div className="col-md-8 col-lg-7 col-xl-5">
            <ParkSearch
              options={parkOptions}
              value={selectedParkOption}
              onChange={setSelectedParkOption}
            />
            {selectedPark && (
              <div className="table-responsive mt-4">
                <table className="table has-header-row mb-0">
                  <thead>
                    <tr className="table-row--park-header">
                      <th
                        scope="col"
                        colSpan="2"
                        className="align-middle fw-normal text-white"
                      >
                        {selectedPark.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkItems.map((item) => (
                      <tr
                        key={item.id}
                        className="table-row--clickable"
                        onClick={() => handleOpenFormPanel(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleOpenFormPanel(item);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Edit ${item.name}`}
                      >
                        <th className="align-middle">
                          {item.name}
                          {item.typeName && (
                            <div className="fw-normal">
                              <small>{item.typeName}</small>
                            </div>
                          )}
                        </th>
                        <td className="align-middle text-end">
                          <IconButton icon={faPen} label="Edit" tabIndex={-1} />
                        </td>
                      </tr>
                    ))}

                    {parkItems.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-muted">
                          No published seasons available for this park.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <FormPanel
          show={showFormPanel}
          setShow={setShowFormPanel}
          formData={formData}
          onDataUpdate={fetchData}
        />
      </div>
    </div>
  );
}
