import { useState } from "react";
import PropTypes from "prop-types";
import CmsDataContext from "@/contexts/CmsDataContext";

export function CmsDataProvider({ children }) {
  const [cmsData, setCmsData] = useState({});

  return (
    <CmsDataContext.Provider value={{ cmsData, setCmsData }}>
      {children}
    </CmsDataContext.Provider>
  );
}

CmsDataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
