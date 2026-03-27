import { forwardRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faArrowDown,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCirclePlus,
  faDownload,
  faFilter,
  faMagnifyingGlass,
  faMinus,
  faPen,
  faTableColumns,
  faTrashCan,
  faXmark,
} from "@fa-kit/icons/classic/solid";

import MaterialTable from "@material-table/core";
import PaginationControls from "@/components/PaginationControls";

import "./DataTable.css";

function renderTableIcon(icon, props, ref) {
  return (
    <span ref={ref}>
      <FontAwesomeIcon icon={icon} {...props} />
    </span>
  );
}

function createTableIcon(icon, displayName) {
  const TableIcon = forwardRef(renderTableIcon.bind(null, icon));

  TableIcon.displayName = displayName;

  return TableIcon;
}

const tableIcons = {
  Add: createTableIcon(faCirclePlus, "TableIconAdd"),
  Check: createTableIcon(faCheck, "TableIconCheck"),
  Clear: createTableIcon(faXmark, "TableIconClear"),
  Delete: createTableIcon(faTrashCan, "TableIconDelete"),
  DetailPanel: createTableIcon(faChevronRight, "TableIconDetailPanel"),
  Edit: createTableIcon(faPen, "TableIconEdit"),
  Export: createTableIcon(faDownload, "TableIconExport"),
  Filter: createTableIcon(faFilter, "TableIconFilter"),
  FirstPage: createTableIcon(faAnglesLeft, "TableIconFirstPage"),
  LastPage: createTableIcon(faAnglesRight, "TableIconLastPage"),
  NextPage: createTableIcon(faChevronRight, "TableIconNextPage"),
  PreviousPage: createTableIcon(faChevronLeft, "TableIconPreviousPage"),
  ResetSearch: createTableIcon(faXmark, "TableIconResetSearch"),
  Search: createTableIcon(faMagnifyingGlass, "TableIconSearch"),
  SortArrow: createTableIcon(faArrowDown, "TableIconSortArrow"),
  ThirdStateCheck: createTableIcon(faMinus, "TableIconThirdStateCheck"),
  ViewColumn: createTableIcon(faTableColumns, "TableIconViewColumn"),
};

function PaginationAdapter({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onChangePage,
  onRowsPerPageChange,
  onChangeRowsPerPage,
  labelRowsPerPage,
  style,
}) {
  const handlePageChange = onPageChange || onChangePage;
  const handleRowsPerPageChange = onRowsPerPageChange || onChangeRowsPerPage;

  return (
    <td style={style}>
      <PaginationControls
        totalItems={count}
        currentPage={page + 1}
        pageSize={rowsPerPage}
        onPageChange={(nextPage) => handlePageChange(null, nextPage - 1)}
        onPageSizeChange={(size) =>
          handleRowsPerPageChange({ target: { value: size } })
        }
        pageSizeLabel={labelRowsPerPage}
      />
    </td>
  );
}

PaginationAdapter.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func,
  onChangePage: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  onChangeRowsPerPage: PropTypes.func,
  labelRowsPerPage: PropTypes.string,
  style: PropTypes.object,
};

export default function DataTable(props) {
  const { components, ...materialTableProps } = props;

  return (
    <div className="data-table">
      <MaterialTable
        icons={tableIcons}
        components={{
          Pagination: PaginationAdapter,
          ...components,
        }}
        {...materialTableProps}
      />
    </div>
  );
}

DataTable.propTypes = {
  components: PropTypes.object,
};
