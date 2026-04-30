// Copied from nr-rec-resources/shared/src/components/suggestion-typeahead/constants.ts
import SIT_ICON from "@/assets/icons/rst-icons/recreation_site.svg";
import RTE_ICON from "@/assets/icons/rst-icons/recreation_trail.svg";
import IF_ICON from "@/assets/icons/rst-icons/interpretive_forest.svg";
import NO_TYPE_ICON from "@/assets/icons/rst-icons/no_type.svg";

export const RESOURCE_TYPE_ICONS = {
  // site type
  SIT: SIT_ICON,
  RR: SIT_ICON,
  // trail type
  RTR: RTE_ICON,
  RTE: RTE_ICON,
  TBL: RTE_ICON,
  TRB: RTE_ICON,
  // interpretive forest type
  IF: IF_ICON,
  IFT: IF_ICON,
  // default icon for unspecified types
  NO_TYPE: NO_TYPE_ICON,
};
