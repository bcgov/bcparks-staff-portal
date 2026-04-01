import PropTypes from "prop-types";
import PaginationBar from "./PaginationBar";

// Pagination controls including page size selector and pagination bar
export default function PaginationControls({
  pageSize,
  onPageSizeChange,
  currentPage,
  totalItems,
  onPageChange,
  pageSizeLabel = "Rows per page",
  pageSizeOptions = [5, 10, 25, 50, 100],
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
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
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
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
};
