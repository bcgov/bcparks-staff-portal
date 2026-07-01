import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { faPen } from "@fa-kit/icons/classic/regular";

import { useApiGet } from "@/hooks/useApi";
import FormPanel from "@/components/FormPanel";
import IconButton from "@/components/IconButton";
import ParkSearch from "@/components/ParkSearch";
import LoadingBar from "@/components/LoadingBar";
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
    const targetOperatingYear = new Date().getFullYear() - 1;

    // Find a season by year and type
    function getSeasonByYear(seasons = [], seasonType = "regular") {
      return (
        seasons.find(
          (season) =>
            season.seasonType === seasonType &&
            season.operatingYear === targetOperatingYear,
        ) || null
      );
    }

    // Park-level seasons (regular and winter)
    const regularSeason = getSeasonByYear(selectedPark.seasons, "regular");
    const winterSeason = getSeasonByYear(selectedPark.seasons, "winter");

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
      const parkAreaSeason = getSeasonByYear(parkArea.seasons, "regular");

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
      const featureSeason = getSeasonByYear(feature.seasons, "regular");

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
    });
    setShowFormPanel(true);
  }

  if (loading) {
    return <LoadingBar />;
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
                      <tr key={item.id} className={`table-row--${item.level}`}>
                        <th className="align-middle">
                          {item.name}
                          {item.typeName && (
                            <div className="fw-normal">
                              <small>{item.typeName}</small>
                            </div>
                          )}
                        </th>
                        <td className="align-middle text-end">
                          <IconButton
                            icon={faPen}
                            label="Edit"
                            onClick={() => handleOpenFormPanel(item)}
                          />
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
