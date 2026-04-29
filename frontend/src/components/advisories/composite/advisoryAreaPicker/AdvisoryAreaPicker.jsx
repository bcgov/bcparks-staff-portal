import { useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryAreaPicker.css";
import Select from "react-select";
import Form from "react-bootstrap/Form";
import classNames from "classnames";
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleQuestion,
  faChevronDown,
  faChevronUp,
} from "@fa-kit/icons/classic/solid";
import { validateRequiredAffectedArea } from "@/lib/advisories/validators/AdvisoryValidator";
import { generateProtectedAreasListForSelectedRelations } from "@/lib/advisories/utils/AdvisoryUtil";
import { getParkRelations } from "@/lib/advisories/utils/CmsDataUtil";

export default function AdvisoryAreaPicker({
  data: {
    protectedAreas,
    selectedProtectedAreas,
    setSelectedProtectedAreas,
    regions,
    selectedRegions,
    setSelectedRegions,
    sections,
    selectedSections,
    setSelectedSections,
    managementAreas,
    selectedManagementAreas,
    setSelectedManagementAreas,
    sites,
    selectedSites,
    setSelectedSites,
    fireCentres,
    selectedFireCentres,
    setSelectedFireCentres,
    fireZones,
    selectedFireZones,
    setSelectedFireZones,
    naturalResourceDistricts,
    selectedNaturalResourceDistricts,
    setSelectedNaturalResourceDistricts,
    advisoryData,
    protectedAreaError,
  },
}) {
  const [isShow, setIsShow] = useState(false);

  async function handleRemoveProtectedArea(updatedParksList) {
    const deletedParks = selectedProtectedAreas.filter(
      (park) => !updatedParksList?.includes(park),
    );

    if (deletedParks.length) {
      const parkId = deletedParks[0]?.value;
      const {
        managementArea,
        region,
        section,
        fireZone,
        fireCentre,
        naturalResourceDistrict,
        sites: relatedSites,
      } = await Promise.resolve(getParkRelations(parkId));

      if (managementArea && selectedManagementAreas.length) {
        const newManagementAreas = selectedManagementAreas.filter(
          (ma) => ma.value !== managementArea.documentId,
        );

        setSelectedManagementAreas(newManagementAreas);
      }
      if (region && selectedRegions.length) {
        const newRegions = selectedRegions.filter(
          (r) => r.value !== region.documentId,
        );

        setSelectedRegions(newRegions);
      }
      if (section && selectedSections.length) {
        const newSections = selectedSections.filter(
          (s) => s.value !== section.documentId,
        );

        setSelectedSections(newSections);
      }
      if (fireZone && selectedFireZones.length) {
        const newFireZones = selectedFireZones.filter(
          (fz) => fz.value !== fireZone.documentId,
        );

        setSelectedFireZones(newFireZones);
      }
      if (fireCentre && selectedFireCentres.length) {
        const newFireCentres = selectedFireCentres.filter(
          (fc) => fc.value !== fireCentre.documentId,
        );

        setSelectedFireCentres(newFireCentres);
      }
      if (naturalResourceDistrict && selectedNaturalResourceDistricts.length) {
        const newNaturalResourceDistricts =
          selectedNaturalResourceDistricts.filter(
            (nrd) => nrd.value !== naturalResourceDistrict.documentId,
          );

        setSelectedNaturalResourceDistricts(newNaturalResourceDistricts);
      }
      if (relatedSites && relatedSites.length && selectedSites.length) {
        const parkSites = new Set(relatedSites.map((x) => x.documentId));
        const newSites = selectedSites.filter((s) => !parkSites.has(s.value));

        setSelectedSites(newSites);
      }
    }
  }

  function handleClearProtectedAreas() {
    setSelectedManagementAreas([]);
    setSelectedRegions([]);
    setSelectedSections([]);
    setSelectedFireZones([]);
    setSelectedFireCentres([]);
    setSelectedNaturalResourceDistricts([]);
    setSelectedSites([]);
  }

  function handleChangeRelations({
    updatedRegions,
    updatedSections,
    updatedManagementAreas,
    updatedSites,
    updatedFireZones,
    updatedFireCentres,
    updatedNaturalResourceDistricts,
  }) {
    // get current the list of park ids before the change
    const currentlySelected = selectedProtectedAreas.map((x) => x.value);

    // get the list of park ids based on the previously selected relations
    const oldGeneratedList = generateProtectedAreasListForSelectedRelations(
      selectedRegions,
      selectedSections,
      selectedManagementAreas,
      selectedSites,
      selectedFireCentres,
      selectedFireZones,
      selectedNaturalResourceDistricts,
      managementAreas,
      fireZones,
      sites,
    );

    // get the difference (these are the extra/manual parks)
    const manualList = currentlySelected.filter(
      (id) => !new Set(oldGeneratedList).has(id),
    );

    // get the new list of park ids based on updated relations
    const newGeneratedList = generateProtectedAreasListForSelectedRelations(
      updatedRegions || selectedRegions,
      updatedSections || selectedSections,
      updatedManagementAreas || selectedManagementAreas,
      updatedSites || selectedSites,
      updatedFireCentres || selectedFireCentres,
      updatedFireZones || selectedFireZones,
      updatedNaturalResourceDistricts || selectedNaturalResourceDistricts,
      managementAreas,
      fireZones,
      sites,
    );

    // add back the extra manual park ids
    const newList = new Set([...newGeneratedList, ...manualList]);

    // update the parks input with the new list
    const parks = protectedAreas.filter((p) => newList.has(p.value));

    setSelectedProtectedAreas(parks);
  }

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      maxHeight: "400px",
      overflowY: "auto",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "2.3rem",
    }),
  };

  return (
    <div className="advisory-area-picker">
      <p>
        <span className="append-required">
          Select at least one resource <b>or</b> search for groups of resources
          by other area(s)
        </span>
        <LightTooltip
          arrow
          title="Please select the resource that your advisory is affecting.
                There is no need to select additional sites, regions, or sections if your advisory is just for a specific resource.
                Selecting a region (or any other category) will apply your advisory to every resource page within that region or other category.
                For example, an advisory for Goldstream Park would only need Goldstream selected from the list of resources,
                you would not need to include West Coast in the regions as this would trigger an alert for all resources in the West Coast."
        >
          <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
        </LightTooltip>
      </p>

      <Form.Group className="form-group" controlId="parks">
        <Form.Label>BC Parks park(s)</Form.Label>
        <div
          className={classNames({
            "bcgov-select-error": protectedAreaError !== "",
          })}
        >
          <Select
            id="parks"
            options={protectedAreas}
            maxHeight={200}
            value={selectedProtectedAreas}
            onChange={(e, action) => {
              setSelectedProtectedAreas(e);
              if (action.action === "clear") {
                handleClearProtectedAreas();
              } else {
                handleRemoveProtectedArea(e);
              }
            }}
            placeholder="Search or select BC Parks park(s)"
            isMulti
            className="bcgov-select"
            onBlur={() => {
              validateRequiredAffectedArea(advisoryData.protectedArea);
            }}
            styles={customSelectStyles}
          />
        </div>
        {protectedAreaError && (
          <div className="invalid-feedback d-block">{protectedAreaError}</div>
        )}
      </Form.Group>

      {!isShow && (
        <button
          type="button"
          className="btn mt-2 btn-link btn-boolean with-icon"
          onClick={() => setIsShow(true)}
        >
          Show other areas <FontAwesomeIcon icon={faChevronDown} />
        </button>
      )}

      {isShow && (
        <>
          <Form.Group className="form-group" controlId="sites">
            <Form.Label>BC Parks site(s)</Form.Label>
            <Select
              id="sites"
              options={sites}
              value={selectedSites}
              onChange={(e) => {
                setSelectedSites(e);
                handleChangeRelations({ updatedSites: e });
              }}
              placeholder="Search or select BC Parks site(s)"
              isMulti
              className="bcgov-select"
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="fire-centres">
            <Form.Label>Fire centre(s)</Form.Label>
            <Select
              id="fire-centres"
              options={fireCentres}
              value={selectedFireCentres}
              onChange={(e) => {
                setSelectedFireCentres(e);
                handleChangeRelations({ updatedFireCentres: e });
              }}
              placeholder="Search or select fire centre(s)"
              isMulti
              className="bcgov-select"
            />{" "}
          </Form.Group>

          <Form.Group className="form-group" controlId="fire-zones">
            <Form.Label>Fire zone(s)</Form.Label>
            <Select
              id="fire-zones"
              options={fireZones}
              value={selectedFireZones}
              onChange={(e) => {
                setSelectedFireZones(e);
                handleChangeRelations({ updatedFireZones: e });
              }}
              placeholder="Search or select fire zone(s)"
              isMulti
              className="bcgov-select"
            />
          </Form.Group>

          <Form.Group
            className="form-group"
            controlId="natural-resource-districts"
          >
            <Form.Label>Natural resource district(s)</Form.Label>
            <Select
              id="natural-resource-districts"
              options={naturalResourceDistricts}
              value={selectedNaturalResourceDistricts}
              onChange={(e) => {
                setSelectedNaturalResourceDistricts(e);
                handleChangeRelations({
                  updatedNaturalResourceDistricts: e,
                });
              }}
              placeholder="Search or select natural resource district(s)"
              isMulti
              className="bcgov-select"
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="regions">
            <Form.Label>BC Parks region(s)</Form.Label>
            <Select
              id="regions"
              options={regions}
              value={selectedRegions}
              onChange={(e) => {
                setSelectedRegions(e);
                handleChangeRelations({ updatedRegions: e });
              }}
              placeholder="Search or select BC Parks region(s)"
              isMulti
              className="bcgov-select"
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="sections">
            <Form.Label>BC Parks section(s)</Form.Label>
            <Select
              id="sections"
              options={sections}
              value={selectedSections}
              onChange={(e) => {
                setSelectedSections(e);
                handleChangeRelations({ updatedSections: e });
              }}
              placeholder="Search or select BC Parks section(s)"
              isMulti
              className="bcgov-select"
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="management-areas">
            <Form.Label>BC Parks management area(s)</Form.Label>
            <Select
              id="management-areas"
              options={managementAreas}
              value={selectedManagementAreas}
              onChange={(e) => {
                setSelectedManagementAreas(e);
                handleChangeRelations({ updatedManagementAreas: e });
              }}
              placeholder="Search or select BC Parks management area(s)"
              isMulti
              className="bcgov-select"
            />
          </Form.Group>

          <button
            type="button"
            className="btn mt-2 btn-link btn-boolean with-icon"
            onClick={() => setIsShow(false)}
          >
            Hide other areas <FontAwesomeIcon icon={faChevronUp} />
          </button>
        </>
      )}
    </div>
  );
}

AdvisoryAreaPicker.propTypes = {
  data: PropTypes.shape({
    protectedAreas: PropTypes.array.isRequired,
    selectedProtectedAreas: PropTypes.array,
    setSelectedProtectedAreas: PropTypes.func.isRequired,
    regions: PropTypes.array.isRequired,
    selectedRegions: PropTypes.array,
    setSelectedRegions: PropTypes.func.isRequired,
    sections: PropTypes.array.isRequired,
    selectedSections: PropTypes.array,
    setSelectedSections: PropTypes.func.isRequired,
    managementAreas: PropTypes.array.isRequired,
    selectedManagementAreas: PropTypes.array,
    setSelectedManagementAreas: PropTypes.func.isRequired,
    sites: PropTypes.array.isRequired,
    selectedSites: PropTypes.array,
    setSelectedSites: PropTypes.func.isRequired,
    fireCentres: PropTypes.array.isRequired,
    selectedFireCentres: PropTypes.array,
    setSelectedFireCentres: PropTypes.func.isRequired,
    fireZones: PropTypes.array.isRequired,
    selectedFireZones: PropTypes.array,
    setSelectedFireZones: PropTypes.func.isRequired,
    naturalResourceDistricts: PropTypes.array.isRequired,
    selectedNaturalResourceDistricts: PropTypes.array,
    setSelectedNaturalResourceDistricts: PropTypes.func.isRequired,
    advisoryData: PropTypes.object,
    protectedAreaError: PropTypes.string,
  }).isRequired,
};
