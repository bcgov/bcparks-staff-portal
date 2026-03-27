import { forwardRef } from "react";
import PropTypes from "prop-types";

import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import MaterialTable from "@material-table/core";
import PaginationControls from "@/components/PaginationControls";

import "./DataTable.css";

import AddBox from "@mui/icons-material/AddBox";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Check from "@mui/icons-material/Check";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Clear from "@mui/icons-material/Clear";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Edit from "@mui/icons-material/Edit";
import FilterList from "@mui/icons-material/FilterList";
import FirstPage from "@mui/icons-material/FirstPage";
import LastPage from "@mui/icons-material/LastPage";
import Remove from "@mui/icons-material/Remove";
import SaveAlt from "@mui/icons-material/SaveAlt";
import Search from "@mui/icons-material/Search";
import ViewColumn from "@mui/icons-material/ViewColumn";

function createTableIcon(IconComponent, displayName) {
  const TableIcon = forwardRef((props, ref) => (
    <IconComponent {...props} ref={ref} />
  ));

  TableIcon.displayName = displayName;

  return TableIcon;
}

const tableIcons = {
  Add: createTableIcon(AddBox, "TableIconAdd"),
  Check: createTableIcon(Check, "TableIconCheck"),
  Clear: createTableIcon(Clear, "TableIconClear"),
  Delete: createTableIcon(DeleteOutline, "TableIconDelete"),
  DetailPanel: createTableIcon(ChevronRight, "TableIconDetailPanel"),
  Edit: createTableIcon(Edit, "TableIconEdit"),
  Export: createTableIcon(SaveAlt, "TableIconExport"),
  Filter: createTableIcon(FilterList, "TableIconFilter"),
  FirstPage: createTableIcon(FirstPage, "TableIconFirstPage"),
  LastPage: createTableIcon(LastPage, "TableIconLastPage"),
  NextPage: createTableIcon(ChevronRight, "TableIconNextPage"),
  PreviousPage: createTableIcon(ChevronLeft, "TableIconPreviousPage"),
  ResetSearch: createTableIcon(Clear, "TableIconResetSearch"),
  Search: createTableIcon(Search, "TableIconSearch"),
  SortArrow: createTableIcon(ArrowDownward, "TableIconSortArrow"),
  ThirdStateCheck: createTableIcon(Remove, "TableIconThirdStateCheck"),
  ViewColumn: createTableIcon(ViewColumn, "TableIconViewColumn"),
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
    <TableContainer component={Paper} className="data-table">
      <MaterialTable
        icons={tableIcons}
        components={{
          Pagination: PaginationAdapter,
          ...components,
        }}
        {...materialTableProps}
      />
    </TableContainer>
  );
}

DataTable.propTypes = {
  components: PropTypes.object,
};
