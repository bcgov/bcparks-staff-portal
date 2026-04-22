import { useState } from "react";
import { Link } from "react-router-dom";
import { cmsAxios } from "@/lib/advisories/axios_config";
import DataTable from "@/components/advisories/composite/dataTable/DataTable";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { exportPdf } from "@/lib/advisories/utils/ExportPdfUtil";
import "./ParkAccessStatus.scss";

function exportCsvFile(columns, rows, fileName) {
  const headers = columns
    .filter((c) => c.field)
    .map((c) => c.title ?? c.field)
    .join(",");
  const body = rows
    .map((row) =>
      columns
        .filter((c) => c.field)
        .map((c) => JSON.stringify(row[c.field] ?? ""))
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`${headers}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(date) {
  return moment(date).isValid() ? moment(date).format("YYYY-MM-DD") : null;
}
async function fetchParkAccessStatus() {
  const response = await cmsAxios.get(
    `/protected-areas/status?limit=-1&sort=protectedAreaName`,
  );

  return response.data.map((park) => {
    park.id = park.orcs;
    park.managementAreasStr = park.managementAreas.join(", ");
    park.sectionsStr = park.sections.join(", ");
    park.regionsStr = park.regions.join(", ");
    park.fireCentresStr = park.fireCentres.join(", ");
    park.fireZonesStr = park.fireZones.join(", ");
    park.naturalResourceDistrictsStr = park.naturalResourceDistricts.join(", ");
    park.accessStatusEffectiveDate = formatDate(park.accessStatusEffectiveDate);
    park.campfireBanEffectiveDate = formatDate(park.campfireBanEffectiveDate);
    return park;
  });
}

export default function ParkAccessStatus() {
  const STALE_TIME_MILLISECONDS = 10 * 60 * 1000; // 10 minutes
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { isLoading, data } = useQuery({
    queryKey: ["parkAccessStatus"],
    queryFn: fetchParkAccessStatus,
    staleTime: STALE_TIME_MILLISECONDS,
  });

  const title = "Park Access Status";
  const exportFilename = `${title.toLowerCase().replaceAll(" ", "-")}-${moment(
    new Date(),
  ).format("YYYYMMDD")}`;

  return (
    <div className="park-access-status-page-wrap advisories-styles">
      <div id="park-status-container" className="container-fluid">
        <p>{isLoading}</p>
        {isLoading && (
          <div className="page-loader">
            <Loader page />
          </div>
        )}
        {!isLoading && (
          <DataTable
            key={data.length}
            hover
            filtering
            search
            exportMenu={[
              {
                label: "Export CSV",
                exportFunc: (cols, datas) =>
                  exportCsvFile(cols, datas, exportFilename),
              },
              {
                label: "Export PDF",
                exportFunc: (cols, datas) =>
                  exportPdf(cols, datas, title, exportFilename),
              },
            ]}
            pageSize={pageSize}
            pageSizeOptions={[25, 50, -1]}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setCurrentPage(1);
            }}
            onFilterChange={() => setCurrentPage(1)}
            columns={[
              {
                title: "ORCS",
                field: "orcs",
              },
              { title: "Protected Area Name", field: "protectedAreaName" },
              { title: "Type", field: "type" },
              { title: "Region", field: "regionsStr" },
              { title: "Section", field: "sectionsStr" },
              { title: "Management Area", field: "managementAreasStr" },
              { title: "Fire Centre", field: "fireCentresStr" },
              { title: "Fire Zone", field: "fireZonesStr" },
              {
                title: "Natural Resource District",
                field: "naturalResourceDistrictsStr",
              },
              { title: "Access Status", field: "accessStatus" },
              {
                title: "Access Details",
                field: "accessDetails",
                render: (rowData) => (
                  <Link
                    to={{
                      pathname: `/advisory-summary/${rowData.publicAdvisoryAuditId}`,
                      index: 1,
                    }}
                  >
                    {rowData.accessDetails}
                  </Link>
                ),
              },
              {
                title: "Access Status Effective Date",
                field: "accessStatusEffectiveDate",
              },
              { title: "Campfire Facility", field: "hasCampfiresFacility" },
              {
                title: "Reservations Affected",
                field: "isReservationsAffected",
              },
              {
                title: "Campfire Ban",
                field: "hasCampfireBan",
              },
              {
                title: "Campfire Ban Effective Date",
                field: "campfireBanEffectiveDate",
              },
            ]}
            data={data}
            title={title}
          />
        )}
      </div>
    </div>
  );
}

ParkAccessStatus.propTypes = {};

ParkAccessStatus.defaultProps = {};
