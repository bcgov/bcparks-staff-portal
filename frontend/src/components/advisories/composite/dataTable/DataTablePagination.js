import React from "react";
import PropTypes from "prop-types";
import PaginationBar from "./PaginationBar";

// Adapted from the DOOT pagination control (PaginationControls.jsx) for legacy material-table usage.
export default function DataTablePagination({
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions,
  onPageChange,
  onChangePage,
  onRowsPerPageChange,
  onChangeRowsPerPage,
  labelDisplayedRows,
  labelRowsPerPage,
  style,
}) {
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, count);
  const displayedRows = labelDisplayedRows
    ? labelDisplayedRows({ from, to, count, page })
    : `${from}-${to} of ${count}`;

  const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
  const pageSizeOptions = [
    ...new Set([...DEFAULT_PAGE_SIZE_OPTIONS, ...(rowsPerPageOptions ?? [])]),
  ]
    .filter((option) => option < count)
    .sort((a, b) => a - b);

  const handleRowsPerPageChange = onRowsPerPageChange || onChangeRowsPerPage;
  const handlePageChange = onPageChange || onChangePage;

  return (
    <td className="data-table-pagination__container" style={style}>
      <div className="data-table-pagination d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="text-nowrap">
              {labelRowsPerPage || "Rows per page:"}
            </span>
            <select
              className="form-select form-select-sm data-table-pagination__select"
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(e)}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <span className="text-muted">{displayedRows}</span>
        </div>

        <PaginationBar
          currentPage={page + 1}
          totalItems={count}
          itemsPerPage={rowsPerPage}
          onPageChange={(nextPage) => handlePageChange(null, nextPage - 1)}
          className="ms-lg-auto"
        />
      </div>
    </td>
  );
}

DataTablePagination.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  rowsPerPageOptions: PropTypes.array,
  onPageChange: PropTypes.func,
  onChangePage: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  onChangeRowsPerPage: PropTypes.func,
  labelDisplayedRows: PropTypes.func,
  labelRowsPerPage: PropTypes.string,
  style: PropTypes.object,
};

DataTablePagination.defaultProps = {
  rowsPerPageOptions: undefined,
  onPageChange: undefined,
  onChangePage: undefined,
  onRowsPerPageChange: undefined,
  onChangeRowsPerPage: undefined,
  labelDisplayedRows: undefined,
  labelRowsPerPage: "Rows per page:",
  style: undefined,
};
