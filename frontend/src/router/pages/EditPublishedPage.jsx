import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";

import { useApiGet } from "@/hooks/useApi";
import ParkSearch from "@/components/ParkSearch";
import LoadingBar from "@/components/LoadingBar";

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
            {/* TODO: CMS-1836 - Add a park name search and a park table here */}
            <ParkSearch
              options={parkOptions}
              value={selectedParkOption}
              onChange={setSelectedParkOption}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
