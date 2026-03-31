import { useState, useEffect, useContext } from "react";
import ErrorContext from "@/contexts/ErrorContext";
import CmsDataContext from "@/contexts/CmsDataContext";
import "./ParkSearch.scss";
// Include styles from AdvisoryForm component
import "@/components/advisories/composite/advisoryForm/AdvisoryForm.css";
import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";
import Select, { components } from "react-select";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import ListGroup from "react-bootstrap/ListGroup";
import {
  getProtectedAreas,
  getRegions,
  getSections,
  getManagementAreas,
  getSites,
} from "@/lib/advisories/utils/CmsDataUtil";
import {
  addProtectedAreasFromArea,
  addProtectedAreas,
} from "@/lib/advisories/utils/LocationUtil";
import { isEmpty } from "@/lib/advisories/utils/AppUtil";

export default function ParkSearch() {
  const { setError } = useContext(ErrorContext);
  const { cmsData, setCmsData } = useContext(CmsDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [protectedAreas, setProtectedAreas] = useState([]);
  const [regions, setRegions] = useState([]);
  const [sections, setSections] = useState([]);
  const [managementAreas, setManagementAreas] = useState([]);
  // const [sites, setSites] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [filteredManagementAreas, setFilteredManagementAreas] = useState([]);
  const [protectedArea, setProtectedArea] = useState(0);
  const [region, setRegion] = useState();
  const [section, setSection] = useState();
  const [managementArea, setManagementArea] = useState();
  const auth = useAuth();
  const initialized = !auth.isLoading;
  const keycloak = auth.isAuthenticated ? auth.user : null;
  const [toError, setToError] = useState(false);
  const [toDetails, setToDetails] = useState(false);
  const [parkList, setParkList] = useState([]);

  function DropdownIndicator(props) {
    return (
      <components.DropdownIndicator {...props}>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </components.DropdownIndicator>
    );
  }

  useEffect(() => {
    if (!isLoading) {
      setParkList([]);
      let newParkList = [];
      const parkIds = [];

      if (protectedArea > 0) {
        setToDetails(true);
      }
      if (managementArea && !isEmpty(managementArea)) {
        newParkList = addProtectedAreas(
          managementArea.obj.protectedAreas,
          null,
          parkIds,
          null,
          newParkList,
        );
        setParkList(newParkList);
      } else if (section && !isEmpty(section)) {
        newParkList = addProtectedAreasFromArea(
          section.obj,
          "managementAreas",
          parkIds,
          null,
          null,
          managementAreas,
          newParkList,
        );
        setParkList(newParkList);
      } else if (region && !isEmpty(region)) {
        newParkList = addProtectedAreasFromArea(
          region.obj,
          "managementAreas",
          parkIds,
          null,
          null,
          managementAreas,
          newParkList,
        );
        setParkList(newParkList);
      }
      setFilteredSections(sections);
      setFilteredManagementAreas(managementAreas);
      if (section && !isEmpty(section)) {
        const newFilteredManagementAreas = managementAreas.filter(
          (m) => m.obj.section?.id === section.value,
        );

        setFilteredManagementAreas([...newFilteredManagementAreas]);
      }
      if (region && !isEmpty(region)) {
        const newFilteredSections = sections.filter(
          (s) => s.obj.region?.id === region.value,
        );

        setFilteredSections([...newFilteredSections]);
        if (!section) {
          const newFilteredManagementAreas = managementAreas.filter(
            (m) => m.obj.region?.id === region.value,
          );

          setFilteredManagementAreas([...newFilteredManagementAreas]);
        }
      }
    }
  }, [
    protectedArea,
    isLoading,
    region,
    regions,
    managementAreas,
    setParkList,
    section,
    managementArea,
    sections,
    setFilteredSections,
    setFilteredManagementAreas,
  ]);

  useEffect(() => {
    if (initialized && keycloak) {
      Promise.all([
        getProtectedAreas(cmsData, setCmsData),
        getRegions(cmsData, setCmsData),
        getSections(cmsData, setCmsData),
        getManagementAreas(cmsData, setCmsData),
        getSites(cmsData, setCmsData),
      ])
        .then((res) => {
          const protectedAreaData = res[0];
          const protectedAreaOptions = protectedAreaData.map((p) => ({
            label: p.protectedAreaName,
            value: p.id,
            orcs: p.orcs,
            type: "protectedArea",
          }));

          setProtectedAreas([...protectedAreaOptions]);
          const regionData = res[1];
          const regionOptions = regionData.map((r) => ({
            label: `${r.regionName} Region`,
            value: r.id,
            type: "region",
            obj: r,
          }));

          setRegions([...regionOptions]);
          const sectionData = res[2];
          const sectionOptions = sectionData.map((s) => ({
            label: `${s.sectionName} Section`,
            value: s.id,
            type: "section",
            obj: s,
          }));

          setFilteredSections([...sectionOptions]);
          setSections([...sectionOptions]);
          const managementAreaData = res[3];
          const managementAreaOptions = managementAreaData.map((m) => ({
            label: `${m.managementAreaName} Management Area`,
            value: m.id,
            type: "managementArea",
            obj: m,
          }));

          setFilteredManagementAreas([...managementAreaOptions]);
          setManagementAreas([...managementAreaOptions]);
          // const siteData = res[4];
          // const sites = siteData.map((s) => ({
          //   label: s.protectedArea.protectedAreaName + ": " + s.siteName,
          //   value: s.id,
          //   type: "site",
          //   obj: s,
          // }));
          // sites.sort(labelCompare);
          // setSites([...sites]);
          setIsLoading(false);
        })
        .catch(() => {
          setToError(true);
          setError({
            status: 500,
            message: "Error loading park search",
          });
          setIsLoading(false);
        });
    }
  }, [cmsData, initialized, keycloak, setCmsData, setError, setIsLoading]);

  function filterSection(event) {
    if (event) {
      const matchingSections = sections.filter(
        (s) => s.value === event.obj.section.id,
      );

      if (matchingSections.length > 0) {
        setSection(matchingSections[0]);
      }
    }
  }

  function filterRegion(event) {
    if (event) {
      const matchingRegions = regions.filter(
        (r) => r.value === event.obj.region?.id,
      );

      if (matchingRegions.length > 0) {
        setRegion(matchingRegions[0]);
      }
    }
  }

  if (toDetails) {
    return <Navigate to={`/park-info/${protectedArea}`} />;
  }

  if (toError) {
    return <Navigate to="/error" />;
  }

  return (
    <main className="advisories-styles">
      <div
        className="ParkSearch park-search-page-wrap"
        data-testid="ParkSearch"
      >
        <div className="container">
          {isLoading && (
            <div className="page-loader">
              <Loader page />
            </div>
          )}
          {!isLoading && (
            <>
              <form>
                <div className="container-fluid ad-form">
                  <div className="row mt20">
                    <div className="col-lg-6 col-md-8 col-sm-12 ad-auto-margin">
                      <Select
                        options={protectedAreas}
                        value={protectedAreas.filter(
                          (e) => e.orcs === protectedArea,
                        )}
                        onChange={(e) => setProtectedArea(e ? e.orcs : 0)}
                        placeholder="Find a park by name"
                        className="bcgov-select"
                        onBlur={() => {}}
                        isClearable
                        components={{ DropdownIndicator }}
                      />
                    </div>
                  </div>
                  <div className="row mt20">
                    <div className="col-lg-6 col-md-8 col-sm-12 ad-auto-margin">
                      <Select
                        options={regions}
                        value={region}
                        onChange={(e) => {
                          setRegion(e);
                          setSection(null);
                          setManagementArea(null);
                        }}
                        placeholder="Select the Region"
                        className="bcgov-select"
                        isClearable
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-6 col-md-8 col-sm-12 ad-auto-margin">
                      <Select
                        options={filteredSections}
                        value={section}
                        onChange={(e) => {
                          setSection(e);
                          setManagementArea(null);
                          filterRegion(e);
                        }}
                        placeholder="Select the Section"
                        className="bcgov-select"
                        isClearable
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-6 col-md-8 col-sm-12 ad-auto-margin">
                      <Select
                        options={filteredManagementAreas}
                        value={managementArea}
                        onChange={(e) => {
                          setManagementArea(e);
                          filterSection(e);
                          filterRegion(e);
                        }}
                        placeholder="Select the Management Area"
                        className="bcgov-select"
                        isClearable
                      />
                    </div>
                  </div>
                </div>
              </form>
              {parkList.length > 0 && (
                <div className="container">
                  <div className="row mt20">
                    <div className="col-lg-10 col-md-12 col-sm-12 ad-auto-margin">
                      <ListGroup as="div">
                        <ListGroup.Item className="da-list-header" as="div">
                          Park name
                        </ListGroup.Item>
                        {parkList.map((p) => (
                          <ListGroup.Item
                            key={p.orcs}
                            className="da-list-item"
                            as="div"
                          >
                            <div
                              className="ad-anchor pointer"
                              onClick={() => {
                                setProtectedArea(p.orcs);
                              }}
                            >
                              {p.name}
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <br />
      </div>
    </main>
  );
}
