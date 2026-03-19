import React from "react";
import PropTypes from "prop-types";
import PaginationBar from "./PaginationBar";

// Adapted from the DOOT pagination control (PaginationControls.jsx) for legacy material-table usage.
export default function DataTablePagination({
  count,
  page,
  rowsPerPage,
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

  const pageSizeOptions = [5, 10, 25, 50, 100];

  const handleRowsPerPageChange = onRowsPerPageChange || onChangeRowsPerPage;

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
          onPageChange={(nextPage) => onChangePage(null, nextPage - 1)}
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
  onChangePage: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func,
  onChangeRowsPerPage: PropTypes.func,
  labelDisplayedRows: PropTypes.func,
  labelRowsPerPage: PropTypes.string,
  style: PropTypes.object,
};

DataTablePagination.defaultProps = {
  onRowsPerPageChange: undefined,
  onChangeRowsPerPage: undefined,
  labelDisplayedRows: undefined,
  labelRowsPerPage: "Rows per page:",
  style: undefined,
};
