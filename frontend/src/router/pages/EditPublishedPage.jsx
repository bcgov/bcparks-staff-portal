import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";

import { useApiGet } from "@/hooks/useApi";
import ParkSearch from "@/components/ParkSearch";
import LoadingBar from "@/components/LoadingBar";
import "./EditPublishedPage.scss";

export default function EditPublishedPage() {
  const { data, loading, error } = useApiGet("/edit-published");
  const parks = useMemo(() => data ?? [], [data]);

  const [selectedParkOption, setSelectedParkOption] = useState(null);

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

    const rows = [];
    const regularSeason = selectedPark.currentSeason?.regular;
    const winterSeason = selectedPark.currentSeason?.winter;

    if (regularSeason) {
      rows.push({
        id: `park-regular-${regularSeason.id}`,
        name: "Tiers and gate",
        level: "park",
      });
    }

    if (winterSeason) {
      rows.push({
        id: `park-winter-${winterSeason.id}`,
        name: "Winter fee",
        level: "park",
      });
    }

    for (const parkArea of selectedPark.parkAreas || []) {
      const parkAreaSeason = parkArea.currentSeason?.regular;

      if (parkAreaSeason) {
        rows.push({
          id: `park-area-${parkArea.id}-${parkAreaSeason.id}`,
          name: parkArea.name,
          typeName:
            parkArea.parkAreaTypeName ?? parkArea.parkAreaType?.name ?? null,
          level: "park-area",
        });
      }

      for (const feature of parkArea.features || []) {
        const featureSeason = feature.currentSeason?.regular;

        if (!featureSeason) continue;

        rows.push({
          id: `park-area-feature-${feature.id}-${featureSeason.id}`,
          name: feature.name,
          typeName:
            feature.featureTypeName ?? feature.featureType?.name ?? null,
          level: "park-area-feature",
        });
      }
    }

    for (const feature of selectedPark.features || []) {
      const featureSeason = feature.currentSeason?.regular;

      if (!featureSeason) continue;

      rows.push({
        id: `park-feature-${feature.id}-${featureSeason.id}`,
        name: feature.name,
        typeName: feature.featureTypeName ?? feature.featureType?.name ?? null,
        level: "feature",
      });
    }

    return rows;
  }, [selectedPark]);

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
          <div className="col-md-6 col-lg-5">
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
                    {parkItems.map((row) => (
                      <tr key={row.id} className={`table-row--${row.level}`}>
                        <th>
                          {row.name}
                          {row.typeName && (
                            <div className="fw-normal">
                              <small>{row.typeName}</small>
                            </div>
                          )}
                        </th>
                        <td>Edit</td>
                      </tr>
                    ))}

                    {parkItems.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-muted">
                          No published date forms available for this park.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
