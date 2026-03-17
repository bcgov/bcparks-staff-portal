import PropTypes from "prop-types";
import PaginationBar from "./PaginationBar";

// Pagination controls including page size selector and pagination bar
export default function PaginationControls({
  pageSize,
  onPageSizeChange,
  currentPage,
  totalItems,
  onPageChange,
  pageSizeLabel,
}) {
  return (
    totalItems > 0 && (
      <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center">
        <div className="d-flex align-items-center start-0">
          <span className="me-2">{pageSizeLabel}</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto", minHeight: "2.4rem" }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={onPageChange}
          className="mx-lg-auto my-3"
        />
      </div>
    )
  );
}

PaginationControls.propTypes = {
  pageSize: PropTypes.number.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  pageSizeLabel: PropTypes.string,
};
