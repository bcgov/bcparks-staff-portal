import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBarsFilter } from "@fa-kit/icons/classic/regular";
import PaginationControls from "@/components/PaginationControls";

import "./DataTable.css";

function getColumnId(column, index) {
  return column.field || `column-${index}`;
}

function doNothing() {}

function getFieldValue(row, field) {
  if (!field) {
    return null;
  }

  return field.split(".").reduce((value, key) => value?.[key], row);
}

function normalizeValue(value) {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue).join(", ");
  }

  return String(value);
}

function compareValues(left, right) {
  const normalizedLeft = normalizeValue(left).toLowerCase();
  const normalizedRight = normalizeValue(right).toLowerCase();

  if (normalizedLeft < normalizedRight) {
    return -1;
  }

  if (normalizedLeft > normalizedRight) {
    return 1;
  }

  return 0;
}

function getCellStyle(column, row) {
  if (typeof column.cellStyle === "function") {
    return column.cellStyle(getFieldValue(row, column.field), row);
  }

  return column.cellStyle || null;
}

function rowMatchesSearch(row, columns, searchText) {
  if (!searchText) {
    return true;
  }

  const lowerSearchText = searchText.toLowerCase();

  return columns.some((column) => {
    const value = getFieldValue(row, column.field);

    return normalizeValue(value).toLowerCase().includes(lowerSearchText);
  });
}

function rowMatchesFilter(row, column, filterValue) {
  if (
    filterValue === "" ||
    filterValue === null ||
    typeof filterValue === "undefined"
  ) {
    return true;
  }

  if (column.customFilterAndSearch) {
    return column.customFilterAndSearch(filterValue, row, column);
  }

  const cellValue = getFieldValue(row, column.field);

  if (column.lookup) {
    return normalizeValue(cellValue) === normalizeValue(filterValue);
  }

  return normalizeValue(cellValue)
    .toLowerCase()
    .includes(normalizeValue(filterValue).toLowerCase());
}

function buildFilterPayload(columns, filterValues) {
  return columns
    .map((column, index) => ({
      column,
      value: filterValues[getColumnId(column, index)] || "",
    }))
    .filter((filterEntry) => filterEntry.value !== "");
}

function getVisibleColumns(columns) {
  return columns.filter((column) => column.hidden !== true);
}

function renderCell(column, row) {
  if (column.render) {
    return column.render(row);
  }

  return normalizeValue(getFieldValue(row, column.field));
}

function renderSortIndicator(isActive, direction) {
  if (!isActive) {
    return <span className="data-table-sort-indicator">↕</span>;
  }

  return (
    <span className="data-table-sort-indicator is-active">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function DefaultToolbar({
  title,
  searchEnabled,
  searchText,
  onSearchChange,
  exportMenu,
  exportColumns,
  exportRows,
}) {
  const hasToolbarContent = title || searchEnabled || exportMenu.length > 0;

  if (!hasToolbarContent) {
    return null;
  }

  return (
    <div className="data-table-toolbar d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-2 mb-3">
      <div className="data-table-title">{title}</div>
      <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 ms-lg-auto">
        {searchEnabled && (
          <Form.Control
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className="data-table-search"
          />
        )}
        {exportMenu.length > 0 && (
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Export
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {exportMenu.map((menuItem) => (
                <Dropdown.Item
                  key={menuItem.label}
                  onClick={() => menuItem.exportFunc(exportColumns, exportRows)}
                >
                  {menuItem.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

DefaultToolbar.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  searchEnabled: PropTypes.bool.isRequired,
  searchText: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  exportMenu: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      exportFunc: PropTypes.func.isRequired,
    }),
  ).isRequired,
  exportColumns: PropTypes.array.isRequired,
  exportRows: PropTypes.array.isRequired,
};

export default function DataTable(props) {
  const {
    columns,
    data,
    options,
    title,
    onRowClick,
    onFilterChange,
    components,
    hover,
  } = props;
  const visibleColumns = useMemo(() => getVisibleColumns(columns), [columns]);
  const [searchText, setSearchText] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sortConfig, setSortConfig] = useState(null);
  const [page, setPage] = useState(1);
  const initialPageSize = options.pageSize || 5;
  const [pageSize, setPageSize] = useState(initialPageSize);
  const firstFilterEffect = useRef(true);
  const debounceInterval = options.debounceInterval || 0;
  const pageSizeOptions = useMemo(() => {
    const configured = options.pageSizeOptions || [5, 10, 25, 50, 100];
    const combined = [...configured, initialPageSize].filter(
      (value) => value > 0,
    );

    return [...new Set(combined)].sort((left, right) => left - right);
  }, [initialPageSize, options.pageSizeOptions]);

  useEffect(() => {
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  useEffect(() => {
    if (!onFilterChange) {
      return doNothing;
    }

    if (firstFilterEffect.current) {
      firstFilterEffect.current = false;
      return doNothing;
    }

    const timeoutId = window.setTimeout(() => {
      onFilterChange(buildFilterPayload(visibleColumns, filterValues));
    }, debounceInterval);

    function clearFilterChangeTimeout() {
      window.clearTimeout(timeoutId);
    }

    return clearFilterChangeTimeout;
  }, [debounceInterval, filterValues, onFilterChange, visibleColumns]);

  const filteredRows = useMemo(
    () =>
      data.filter((row) => {
        const matchesSearch = options.search
          ? rowMatchesSearch(row, visibleColumns, searchText)
          : true;
        const matchesFilters = visibleColumns.every((column, index) => {
          const filterValue = filterValues[getColumnId(column, index)] || "";

          return rowMatchesFilter(row, column, filterValue);
        });

        return matchesSearch && matchesFilters;
      }),
    [data, filterValues, options.search, searchText, visibleColumns],
  );

  const sortedRows = useMemo(() => {
    if (!sortConfig) {
      return filteredRows;
    }

    const nextRows = [...filteredRows];
    const sortColumn = visibleColumns.find(
      (column, index) => getColumnId(column, index) === sortConfig.columnId,
    );

    if (!sortColumn) {
      return filteredRows;
    }

    nextRows.sort((leftRow, rightRow) => {
      const comparison = sortColumn.customSort
        ? sortColumn.customSort(leftRow, rightRow)
        : compareValues(
            getFieldValue(leftRow, sortColumn.field),
            getFieldValue(rightRow, sortColumn.field),
          );

      return sortConfig.direction === "asc" ? comparison : comparison * -1;
    });

    return nextRows;
  }, [filteredRows, sortConfig, visibleColumns]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pageSize, sortedRows.length]);

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;

    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [page, pageSize, sortedRows]);

  function handleSort(column, index) {
    if ((!column.field && !column.customSort) || column.sorting === false) {
      return;
    }

    const columnId = getColumnId(column, index);

    setSortConfig((currentSortConfig) => {
      if (!currentSortConfig || currentSortConfig.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }

      if (currentSortConfig.direction === "asc") {
        return { columnId, direction: "desc" };
      }

      return null;
    });
  }

  function handleFilterInputChange(column, index, value) {
    const columnId = getColumnId(column, index);

    setFilterValues((currentFilterValues) => ({
      ...currentFilterValues,
      [columnId]: value,
    }));
    setPage(1);
  }

  function handleSearchChange(value) {
    setSearchText(value);
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function renderFilterControl(column, index) {
    const columnId = getColumnId(column, index);
    const filterValue = filterValues[columnId] || "";

    if (column.filtering === false) {
      return null;
    }

    if (column.lookup) {
      return (
        <Form.Select
          size="sm"
          value={filterValue}
          onChange={(event) => {
            handleFilterInputChange(column, index, event.target.value);
          }}
        >
          <option value="">All</option>
          {Object.entries(column.lookup).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Form.Select>
      );
    }

    return (
      <div className="data-table-filter-text">
        <FontAwesomeIcon
          icon={faBarsFilter}
          className="data-table-filter-icon"
        />
        <Form.Control
          size="sm"
          value={filterValue}
          onChange={(event) => {
            handleFilterInputChange(column, index, event.target.value);
          }}
        />
      </div>
    );
  }

  const ToolbarComponent = components?.Toolbar || null;
  const tableClassName = hover
    ? "data-table-table"
    : "data-table-table no-hover";

  return (
    <div className="data-table">
      {ToolbarComponent ? (
        <ToolbarComponent />
      ) : (
        <DefaultToolbar
          title={title}
          searchEnabled={Boolean(options.search)}
          searchText={searchText}
          onSearchChange={handleSearchChange}
          exportMenu={options.exportMenu || []}
          exportColumns={visibleColumns}
          exportRows={sortedRows}
        />
      )}

      <div className="table-responsive-md">
        <Table className={tableClassName}>
          <thead>
            <tr>
              {visibleColumns.map((column, index) => {
                const columnId = getColumnId(column, index);
                const isSorted = sortConfig?.columnId === columnId;
                const isSortable =
                  (column.field || column.customSort) &&
                  column.sorting !== false;

                return (
                  <th
                    key={columnId}
                    style={column.headerStyle}
                    className="data-table-header-cell"
                  >
                    <button
                      type="button"
                      className="data-table-header-button"
                      onClick={() => {
                        handleSort(column, index);
                      }}
                      disabled={!isSortable}
                    >
                      <span>{column.title}</span>
                      {isSortable &&
                        renderSortIndicator(isSorted, sortConfig?.direction)}
                    </button>
                  </th>
                );
              })}
            </tr>
            {options.filtering && (
              <tr>
                {visibleColumns.map((column, index) => {
                  const columnId = getColumnId(column, index);

                  return (
                    <th key={`${columnId}-filter`} style={column.headerStyle}>
                      {renderFilterControl(column, index)}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="text-center py-4"
                >
                  No records to display.
                </td>
              </tr>
            )}
            {paginatedRows.map((row, rowIndex) => {
              const rowKey = row.documentId || row.id || rowIndex;
              const rowProps = {};

              if (onRowClick) {
                rowProps.className = "data-table-clickable-row";
                rowProps.onClick = (event) => {
                  onRowClick(event, row);
                };
              }

              return (
                <tr key={rowKey} {...rowProps}>
                  {visibleColumns.map((column, index) => {
                    const columnId = getColumnId(column, index);

                    return (
                      <td
                        key={`${rowKey}-${columnId}`}
                        style={getCellStyle(column, row)}
                      >
                        {renderCell(column, row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <PaginationControls
        totalItems={sortedRows.length}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        pageSizeLabel="Rows per page"
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  options: PropTypes.shape({
    debounceInterval: PropTypes.number,
    exportMenu: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        exportFunc: PropTypes.func.isRequired,
      }),
    ),
    filtering: PropTypes.bool,
    pageSize: PropTypes.number,
    pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
    search: PropTypes.bool,
  }),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onRowClick: PropTypes.func,
  onFilterChange: PropTypes.func,
  components: PropTypes.shape({
    Toolbar: PropTypes.elementType,
  }),
  hover: PropTypes.bool,
};

DataTable.defaultProps = {
  options: {},
  title: "",
  onRowClick: null,
  onFilterChange: null,
  components: null,
  hover: false,
};
