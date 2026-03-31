import { useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryAreaPicker.css";
import Select from "react-select";
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fa-kit/icons/classic/solid";
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
    <>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-12 ad-label"></div>
        <div className="col-lg-7 col-md-8 col-sm-12">
          <span>
            Select at least one park <b>or</b> search for groups of parks by
            other area{"("}s{")"}
          </span>
          <LightTooltip
            arrow
            title="Please select the park that your advisory is affecting.
                There is no need to select additional sites, regions, or sections if your advisory is just for a specific park.
                Selecting a region (or any other category) will apply your advisory to every park page within that region or other category.
                For example, an advisory for Goldstream Park would only need Goldstream selected from the list of parks,
                you would not need to include West Coast in the regions as this would trigger an alert for all parks in the West Coast."
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
          </LightTooltip>
          {!isShow && (
            <button
              type="button"
              className="btn btn-link btn-boolean"
              onClick={() => setIsShow(true)}
            >
              Show other areas
            </button>
          )}
        </div>
      </div>
      {isShow && (
        <>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
              Fire Centre(s)
            </div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <div className="bcgov-select-form">
                <Select
                  options={fireCentres}
                  value={selectedFireCentres}
                  onChange={(e) => {
                    setSelectedFireCentres(e);
                    handleChangeRelations({ updatedFireCentres: e });
                  }}
                  placeholder="Select Fire Centre(s)"
                  isMulti="true"
                  className="bcgov-select"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
              Fire Zone(s)
            </div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <div className="bcgov-select-form">
                <Select
                  options={fireZones}
                  value={selectedFireZones}
                  onChange={(e) => {
                    setSelectedFireZones(e);
                    handleChangeRelations({ updatedFireZones: e });
                  }}
                  placeholder="Select Fire Zone(s)"
                  isMulti="true"
                  className="bcgov-select"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
              Natural Resource District(s)
            </div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <div className="bcgov-select-form">
                <Select
                  options={naturalResourceDistricts}
                  value={selectedNaturalResourceDistricts}
                  onChange={(e) => {
                    setSelectedNaturalResourceDistricts(e);
                    handleChangeRelations({
                      updatedNaturalResourceDistricts: e,
                    });
                  }}
                  placeholder="Select Natural Resource District(s)"
                  isMulti="true"
                  className="bcgov-select"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
              Region(s)
            </div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <div className="bcgov-select-form">
                <Select
                  options={regions}
                  value={selectedRegions}
                  onChange={(e) => {
                    setSelectedRegions(e);
                    handleChangeRelations({ updatedRegions: e });
                  }}
                  placeholder="Select Region(s)"
                  isMulti="true"
                  className="bcgov-select"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
              Section(s)
            </div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <div className="bcgov-select-form">
                <Select
                  options={sections}
                  value={selectedSections}
                  onChange={(e) => {
                    setSelectedSections(e);
                    handleChangeRelations({ updatedSections: e });
                  }}
                  placeholder="Select Section(s)"
                  isMulti="true"
                  className="bcgov-select"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
              Management Area(s)
            </div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <div className="bcgov-select-form">
                <Select
                  options={managementAreas}
                  value={selectedManagementAreas}
                  onChange={(e) => {
                    setSelectedManagementAreas(e);
                    handleChangeRelations({ updatedManagementAreas: e });
                  }}
                  placeholder="Select Management Area(s)"
                  isMulti="true"
                  className="bcgov-select"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-12"></div>
            <div className="col-lg-7 col-md-8 col-sm-12">
              <button
                type="button"
                className="btn btn-link btn-boolean"
                onClick={() => setIsShow(false)}
              >
                Hide other areas
              </button>
            </div>
          </div>
        </>
      )}
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
          Park(s)
        </div>
        <div className="col-lg-7 col-md-8 col-sm-12">
          <div
            className={`bcgov-select-form ${
              protectedAreaError !== "" ? "bcgov-select-error" : ""
            }`}
          >
            <Select
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
              placeholder="Select Park(s)"
              isMulti="true"
              className="bcgov-select"
              onBlur={() => {
                validateRequiredAffectedArea(advisoryData.protectedArea);
              }}
              styles={customSelectStyles}
            />
            {protectedAreaError && (
              <div className="invalid-feedback d-block">
                {protectedAreaError}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-12 ad-label">Site(s)</div>
        <div className="col-lg-7 col-md-8 col-sm-12">
          <div className="bcgov-select-form">
            <Select
              options={sites}
              value={selectedSites}
              onChange={(e) => {
                setSelectedSites(e);
                handleChangeRelations({ updatedSites: e });
              }}
              placeholder="Select Site(s)"
              isMulti="true"
              className="bcgov-select"
            />
          </div>
        </div>
      </div>
    </>
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
