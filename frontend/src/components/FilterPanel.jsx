import PropTypes from "prop-types";
import Offcanvas from "react-bootstrap/Offcanvas";
import LoadingBar from "@/components/LoadingBar";
import SwitchToggle from "@/components/SwitchToggle";
import MultiSelectField from "@/components/MultiSelectField";
import "./FilterPanel.scss";

function FilterPanel({
  show,
  setShow,
  filters,
  updateFilter,
  filterOptions,
  filterOptionsLoading,
  filterOptionsError,
  statusFilter,
  clearFilter,
  totalItems,
}) {
  // constants and states
  const { sections, managementAreas, dateTypes, featureTypes, accessGroups } =
    filterOptions;

  // functions
  function handleClose() {
    setShow(false);
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
        {filterOptionsLoading && <LoadingBar />}
        {!filterOptionsLoading && !filterOptionsError && (
          <>
            <div className="mt-4">
              <h3>Area</h3>
              <MultiSelectField
                id="bundle"
                label="Bundle(s)"
                options={accessGroups}
                value={filters.accessGroups}
                onChange={(e) => updateFilter("accessGroups", e)}
                placeholder="Select bundle(s)"
                optionLabel="name"
                optionValue="id"
              />
              <MultiSelectField
                id="section"
                label="Section(s)"
                options={sections}
                value={filters.sections}
                onChange={(e) => updateFilter("sections", e)}
                placeholder="Select Section(s)"
                optionLabel="name"
                optionValue="sectionNumber"
              />
              <MultiSelectField
                id="management-area"
                label="Management Area(s)"
                options={managementAreas}
                value={filters.managementAreas}
                onChange={(e) => updateFilter("managementAreas", e)}
                placeholder="Select Management Area(s)"
                optionLabel="name"
                optionValue="managementAreaNumber"
              />
            </div>
            <div className="mt-4">
              <h3>Dates</h3>
              <div className="row">
                <div className="col-lg-6">
                  <MultiSelectField
                    id="date-type"
                    label="Date Type(s)"
                    options={dateTypes}
                    value={filters.dateTypes}
                    onChange={(e) => updateFilter("dateTypes", e)}
                    placeholder="Select Date Type(s)"
                    optionLabel="name"
                    optionValue="id"
                  />
                </div>
              </div>
              <div className="mt-4">
                <SwitchToggle
                  id="is-in-reservation-system"
                  label="BCP reservations only"
                  checked={filters.isInReservationSystem}
                  onChange={(e) =>
                    updateFilter("isInReservationSystem", e.target.checked)
                  }
                />
              </div>
              <div className="mt-4">
                {/* TODO: CMS-788 */}
                <SwitchToggle
                  id="has-date-note"
                  label="Has date note"
                  checked={filters.hasDateNote}
                  onChange={(e) =>
                    updateFilter("hasDateNote", e.target.checked)
                  }
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
                    options={featureTypes}
                    value={filters.featureTypes}
                    onChange={(e) => updateFilter("featureTypes", e)}
                    placeholder="Select Feature Type(s)"
                    optionLabel="name"
                    optionValue="id"
                  />
                </div>
              </div>
            </div>
          </>
        )}
        <div className="mt-4">
          <button className="btn btn-primary" onClick={() => handleClose()}>
            {`Show ${totalItems} park${totalItems !== 1 ? "s" : ""}`}
          </button>
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
  filters: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.object),
    managementAreas: PropTypes.arrayOf(PropTypes.object),
    dateTypes: PropTypes.arrayOf(PropTypes.object),
    featureTypes: PropTypes.arrayOf(PropTypes.object),
    accessGroups: PropTypes.arrayOf(PropTypes.object),
    isInReservationSystem: PropTypes.bool,
    hasDateNote: PropTypes.bool,
  }).isRequired,
  updateFilter: PropTypes.func.isRequired,
  filterOptions: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.object),
    managementAreas: PropTypes.arrayOf(PropTypes.object),
    dateTypes: PropTypes.arrayOf(PropTypes.object),
    featureTypes: PropTypes.arrayOf(PropTypes.object),
    accessGroups: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  filterOptionsLoading: PropTypes.bool.isRequired,
  filterOptionsError: PropTypes.object,
  statusFilter: PropTypes.element.isRequired,
  clearFilter: PropTypes.element.isRequired,
  totalItems: PropTypes.number.isRequired,
};
