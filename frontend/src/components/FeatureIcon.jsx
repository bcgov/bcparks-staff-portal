import PropTypes from "prop-types";

import accessibility from "@/assets/icons/accessibility.svg";
import amphitheatre from "@/assets/icons/amphitheatre.svg";
import anchorage from "@/assets/icons/anchorage.svg";
import atv from "@/assets/icons/atv.svg";
import bikePark from "@/assets/icons/bike-park.svg";
import boatLaunch from "@/assets/icons/boat-launch.svg";
import campfireBan from "@/assets/icons/campfire-ban.svg";
import campfires from "@/assets/icons/campfires.svg";
import canoeing from "@/assets/icons/canoeing.svg";
import caving from "@/assets/icons/caving.svg";
import climbing from "@/assets/icons/climbing.svg";
import cycling from "@/assets/icons/cycling.svg";
import discGolf from "@/assets/icons/disc-golf.svg";
import dock from "@/assets/icons/dock.svg";
import drinkingWater from "@/assets/icons/drinking-water.svg";
import eBikesPermitted from "@/assets/icons/e-bikes-permitted.svg";
import electricalHookUps from "@/assets/icons/electrical-hook-ups.svg";
import electricalOutlets from "@/assets/icons/electrical-outlets.svg";
import evCharging from "@/assets/icons/ev-charging.svg";
import fishing from "@/assets/icons/fishing.svg";
import foodCache from "@/assets/icons/food-cache.svg";
import frontcountryCamping from "@/assets/icons/frontcountry-camping.svg";
import garbage from "@/assets/icons/garbage.svg";
import gatehouse from "@/assets/icons/gatehouse.svg";
import groupCamping from "@/assets/icons/group-camping.svg";
import hiking from "@/assets/icons/hiking.svg";
import horsebackRiding from "@/assets/icons/horseback-riding.svg";
import horseshoes from "@/assets/icons/horseshoes.svg";
import hotspring from "@/assets/icons/hotspring.svg";
import hunting from "@/assets/icons/hunting.svg";
import informationDhelter from "@/assets/icons/information-shelter.svg";
import information from "@/assets/icons/information.svg";
import interpretiveProgramsOutside from "@/assets/icons/interpretive-programs-outside.svg";
import kayaking from "@/assets/icons/kayaking.svg";
import marineAccessibleCamping from "@/assets/icons/marine-accessible-camping.svg";
import mooringBuoy from "@/assets/icons/mooring-buoy.svg";
import mountainBiking from "@/assets/icons/mountain-biking.svg";
import parking from "@/assets/icons/parking.svg";
import petsOnLeash from "@/assets/icons/pets-on-leash.svg";
import picnicArea from "@/assets/icons/picnic-area.svg";
import picnicAreas from "@/assets/icons/picnic-areas.svg";
import picnicShelter from "@/assets/icons/picnic-shelter.svg";
import playground from "@/assets/icons/playground.svg";
import recycling from "@/assets/icons/recycling.svg";
import reservations from "@/assets/icons/reservations.svg";
import sailing from "@/assets/icons/sailing.svg";
import saniStation from "@/assets/icons/sani-station.svg";
import scubaDiving from "@/assets/icons/scuba-diving.svg";
import shelter from "@/assets/icons/shelter.svg";
import showers from "@/assets/icons/showers.svg";
import snowmobiling from "@/assets/icons/snowmobiling.svg";
import swimming from "@/assets/icons/swimming.svg";
import toilets from "@/assets/icons/toilets.svg";
import vehicleAccessibleCamping from "@/assets/icons/vehicle-accessible-camping.svg";
import viewpoint from "@/assets/icons/viewpoint.svg";
import walkInCamping from "@/assets/icons/walk-in-camping.svg";
import waterskiing from "@/assets/icons/waterskiing.svg";
import wildernessCamping from "@/assets/icons/wilderness-camping.svg";
import wildlifeViewing from "@/assets/icons/wildlife-viewing.svg";
import windSurfing from "@/assets/icons/wind-surfing.svg";
import winterCamping from "@/assets/icons/winter-camping.svg";
import winterRecreation from "@/assets/icons/winter-recreation.svg";

import "./FeatureIcon.scss";

// Map Strapi icon names to icon paths
const pathMap = new Map([
  ["accessibility", accessibility],
  ["amphitheatre", amphitheatre],
  ["anchorage", anchorage],
  ["atv", atv],
  ["bike-park", bikePark],
  ["boat-launch", boatLaunch],
  ["campfire-ban", campfireBan],
  ["campfires", campfires],
  ["canoeing", canoeing],
  ["caving", caving],
  ["climbing", climbing],
  ["cycling", cycling],
  ["disc-golf", discGolf],
  ["dock", dock],
  ["drinking-water", drinkingWater],
  ["e-bikes-permitted", eBikesPermitted],
  ["electrical-hook-ups", electricalHookUps],
  ["electrical-outlets", electricalOutlets],
  ["ev-charging", evCharging],
  ["fishing", fishing],
  ["food-cache", foodCache],
  ["frontcountry-camping", frontcountryCamping],
  ["garbage", garbage],
  ["gatehouse", gatehouse],
  ["group-camping", groupCamping],
  ["hiking", hiking],
  ["horseback-riding", horsebackRiding],
  ["horseshoes", horseshoes],
  ["hotspring", hotspring],
  ["hunting", hunting],
  ["information-shelter", informationDhelter],
  ["information", information],
  ["interpretive-programs-outside", interpretiveProgramsOutside],
  ["kayaking", kayaking],
  ["marine-accessible-camping", marineAccessibleCamping],
  ["mooring-buoy", mooringBuoy],
  ["mountain-biking", mountainBiking],
  ["parking", parking],
  ["pets-on-leash", petsOnLeash],
  ["picnic-area", picnicArea],
  ["picnic-areas", picnicAreas],
  ["picnic-shelter", picnicShelter],
  ["playground", playground],
  ["recycling", recycling],
  ["reservations", reservations],
  ["sailing", sailing],
  ["sani-station", saniStation],
  ["scuba-diving", scubaDiving],
  ["shelter", shelter],
  ["showers", showers],
  ["snowmobiling", snowmobiling],
  ["swimming", swimming],
  ["toilets", toilets],
  ["vehicle-accessible-camping", vehicleAccessibleCamping],
  ["viewpoint", viewpoint],
  ["walk-in-camping", walkInCamping],
  ["waterskiing", waterskiing],
  ["wilderness-camping", wildernessCamping],
  ["wildlife-viewing", wildlifeViewing],
  ["wind-surfing", windSurfing],
  ["winter-camping", winterCamping],
  ["winter-recreation", winterRecreation],
]);

export default function FeatureIcon({ iconName }) {
  // Get the icon path from the Strapi icon name,
  // or show the frontcountry camping icon by default
  const iconPath = pathMap.get(iconName) ?? frontcountryCamping;

  return <img src={iconPath} className="feature-icon" />;
}

// props validation
FeatureIcon.propTypes = {
  iconName: PropTypes.string,
};
