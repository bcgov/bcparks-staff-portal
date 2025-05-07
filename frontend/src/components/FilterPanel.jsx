import { useState } from "react";
import PropTypes from "prop-types";
import Offcanvas from "react-bootstrap/Offcanvas";
import LoadingBar from "@/components/LoadingBar";
import SwitchToggle from "@/components/SwitchToggle";
import MultiSelectField from "@/components/MultiSelectField";
import "./FilterPanel.scss";

function FilterPanel({
  show,
  setShow,
  sections,
  sectionsLoading,
  sectionsError,
  managementAreas,
  managementAreasLoading,
  managementAreasError,
  statusFilter,
  clearFilter,
}) {
  // states
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedManagementAreas, setSelectedManagementAreas] = useState([]);
  const [selectedDateTypes, setSelectedDateTypes] = useState([]);
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState([]);
  const [isInReservationSystem, setIsInReservationSystem] = useState(false);
  const [hasDateNote, setHasDateNote] = useState(false);

  // functions
  function handleClose() {
    setShow(false);
  }
  function handleReservationSystem(e) {
    setIsInReservationSystem(e.target.checked);
  }
  function handleDateNote(e) {
    setHasDateNote(e.target.checked);
  }

  // dummy data
  // TODO: replace with real data
  const bundleOptions = [
    { value: "bundle1", label: "Bundle 1" },
    { value: "bundle2", label: "Bundle 2" },
    { value: "bundle3", label: "Bundle 3" },
  ];
  const dateTypeOptions = [
    { value: "operation", label: "Operation" },
    { value: "reservation", label: "Reservation" },
    { value: "winter-fee", label: "Winter Fee" },
  ];
  const featureTypeOptions = [
    { value: "campground", label: "Campground" },
    { value: "trail", label: "Trail" },
    { value: "picnic-area", label: "Picnic Area" },
  ];

  // components
  function renderSectionField() {
    if (sectionsLoading) return <LoadingBar />;
    if (sectionsError)
      return <p>Error loading sections data: {sectionsError.message}</p>;
    return (
      <MultiSelectField
        id="section"
        label="Section(s)"
        options={sections}
        value={selectedSections}
        onChange={(e) => setSelectedSections(e)}
        placeholder="Select Section(s)"
        optionLabel="sectionName"
        optionValue="sectionNumber"
      />
    );
  }
  function renderManagementAreaField() {
    if (managementAreasLoading) return <LoadingBar />;
    if (managementAreasError)
      return (
        <p>Error loading management areas: {managementAreasError.message}</p>
      );
    return (
      <MultiSelectField
        id="management-area"
        label="Management Area(s)"
        options={managementAreas}
        value={selectedManagementAreas}
        onChange={(e) => setSelectedManagementAreas(e)}
        placeholder="Select Management Area(s)"
        optionLabel="managementAreaName"
        optionValue="managementAreaNumber"
      />
    );
  }

  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      placement="end"
      className="filter-panel"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <h2>All filters</h2>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div>
          <h3>Status</h3>
          {statusFilter}
        </div>
        <div className="mt-4">
          <h3>Area</h3>
          {/* TODO: CMS-324 */}
          <MultiSelectField
            id="bundle"
            label="Bundle(s)"
            options={bundleOptions}
            value={selectedBundles}
            onChange={(e) => setSelectedBundles(e)}
            placeholder="Select bundle(s)"
          />
          {renderSectionField()}
          {renderManagementAreaField()}
        </div>
        <div className="mt-4">
          <h3>Dates</h3>
          {/* TODO: CMS-788 */}
          <div className="row">
            <div className="col-lg-6">
              <MultiSelectField
                id="date-type"
                label="Date Type(s)"
                options={dateTypeOptions}
                value={selectedDateTypes}
                onChange={(e) => setSelectedDateTypes(e)}
                placeholder="Select Date Type(s)"
              />
            </div>
          </div>
          <div className="mt-4">
            {/* TODO: CMS-787 */}
            <SwitchToggle
              id="is-in-reservation-system"
              label="In BC Parks reservation system"
              checked={isInReservationSystem}
              onChange={handleReservationSystem}
            />
          </div>
          <div className="mt-4">
            <SwitchToggle
              id="has-date-note"
              label="Has date note"
              checked={hasDateNote}
              onChange={handleDateNote}
            />
          </div>
        </div>
        <div className="mt-4">
          <h3>Park</h3>
          <div className="row">
            <div className="col-lg-6">
              <MultiSelectField
                id="feature-type"
                label="Feature Type(s)"
                options={featureTypeOptions}
                value={selectedFeatureTypes}
                onChange={(e) => setSelectedFeatureTypes(e)}
                placeholder="Select Feature Type(s)"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary">Apply filters</button>
          {clearFilter}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default FilterPanel;

FilterPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      sectionNumber: PropTypes.string.isRequired,
      sectionName: PropTypes.string.isRequired,
    }),
  ).isRequired,
  sectionsLoading: PropTypes.bool.isRequired,
  sectionsError: PropTypes.object,
  managementAreas: PropTypes.arrayOf(
    PropTypes.shape({
      managementAreaNumber: PropTypes.string.isRequired,
      managementAreaName: PropTypes.string.isRequired,
    }),
  ).isRequired,
  managementAreasLoading: PropTypes.bool.isRequired,
  managementAreasError: PropTypes.object,
  statusFilter: PropTypes.element.isRequired,
  clearFilter: PropTypes.element.isRequired,
};
