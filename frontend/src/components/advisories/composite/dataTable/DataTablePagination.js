import React from "react";
import PropTypes from "prop-types";
import TableCell from "@mui/material/TableCell";
import PaginationBar from "./PaginationBar";

export default function DataTablePagination({
  colSpan,
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions,
  onChangePage,
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

  const pageSizeOptions =
    rowsPerPageOptions && rowsPerPageOptions.length > 0
      ? rowsPerPageOptions
      : [5, 10, 25, 50, 100];

  return (
    <TableCell colSpan={colSpan} style={style}>
      <div className="data-table-pagination d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <span>{labelRowsPerPage || "Rows per page:"}</span>
            <select
              className="form-select form-select-sm data-table-pagination__select"
              value={rowsPerPage}
              onChange={(e) => onChangeRowsPerPage(e)}
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
    </TableCell>
  );
}

DataTablePagination.propTypes = {
  colSpan: PropTypes.number,
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  rowsPerPageOptions: PropTypes.array,
  onChangePage: PropTypes.func.isRequired,
  onChangeRowsPerPage: PropTypes.func.isRequired,
  labelDisplayedRows: PropTypes.func,
  labelRowsPerPage: PropTypes.string,
  style: PropTypes.object,
};

DataTablePagination.defaultProps = {
  colSpan: 1,
  rowsPerPageOptions: undefined,
  labelDisplayedRows: undefined,
  labelRowsPerPage: "Rows per page:",
  style: undefined,
};
