import { createContext } from "react";

// Context to provide functions for refreshing main table data
// when changes are saved to the DB
export default createContext({
  refreshTable() {},
});
