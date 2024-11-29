export const strapiData = [
  {
    model: "park-operation-sub-area-date",
    endpoint: "/park-operation-sub-area-dates",
    fields: [
      "operatingYear",
      "parkOperationSubArea", // FK
      "isActive",
      "openDate",
      "closeDate",
      "serviceStartDate",
      "serviceEndDate",
      "reservationStartDate",
      "reservationEndDate",
      "offSeasonStartDate",
      "offSeasonEndDate",
    ],
    associations: [
      {
        model: "park-operation-sub-area",
        field: "parkOperationSubArea",
        endpoint: "/park-operation-sub-areas",
      },
    ],
  },
  {
    model: "park-operation-sub-area",
    endpoint: "/park-operation-sub-areas",
    fields: [
      "parkSubArea",
      "parkSubAreaType", // FK
      "protectedArea", // FK
      "orcsSiteNumber",
      "isActive",
      "offSeasonUse",
      "hasReservations",
    ],
    associations: [
      {
        model: "park-operation-sub-area-type",
        field: "parkSubAreaType",
        endpoint: "/park-operation-sub-area-types",
      },
      {
        model: "protected-area",
        field: "protectedArea",
        endpoint: "/protected-areas",
      },
    ],
  },
  {
    model: "park-operation-sub-area-type",
    endpoint: "/park-operation-sub-area-types",
    fields: [
      "subAreaType",
      "subAreaTypeCode",
      "facilityType", // FK
      "campingType", // FK
    ],
    associations: [
      {
        model: "facility-type",
        field: "facilityType",
        endpoint: "/facility-types",
      },
      {
        model: "camping-type",
        field: "campingType",
        endpoint: "/camping-types",
      },
    ],
  },
  {
    model: "park-operation-date",
    endpoint: "/park-operation-dates",
    fields: [
      "operatingYear",
      "protectedArea", // FK
      "gateOpenDate",
      "gateCloseDate",
    ],
    associations: [
      {
        model: "protected-area",
        field: "protectedArea",
        endpoint: "/protected-areas",
      },
    ],
  },
  {
    model: "protected-area",
    endpoint: "/protected-areas",
    fields: [
      "orcs",
      "protectedAreaName",
      "type",
      "typeCode",
      "parkFacilities", // FK (don't use it?)
      // "parkNames", // FK
      "parkOperations", // FK
    ],
    associations: [
      {
        model: "park-name",
        field: "parkNames",
        endpoint: "/park-names",
      },
      {
        model: "park-operation",
        field: "parkOperations",
        endpoint: "/park-operations",
      },
    ],
  },
  {
    model: "facility-type",
    endpoint: "/facility-types",
    fields: [
      "facilityNumber",
      "facilityName",
      "facilityCode",
      "isActive",
      "icon",
    ],
  },
  {
    model: "camping-type",
    endpoint: "/camping-types",
    fields: [
      "campingTypeNumber",
      "campingTypeName",
      "campingTypeCode",
      "icon",
      "isActive",
    ],
  },

  {
    model: "park-name",
    endpoint: "/park-names",
    fields: ["parkName", "parkNameType"],
  },
  {
    model: "park-operation",
    endpoint: "/park-operations",
    fields: [
      "orcsSiteNumber",
      "hasReservations",
      "isActive",
      // "protectedArea", // FK
      // bunch of featureTypesStrings
    ],
  },

  // OPTIONAL MODELS - MAYBE DON'T NEED THESE
  {
    model: "park-facility",
    endpoint: "/park-facilities",
    fields: [
      "name",
      "isFacilityOpen",
      "isActive",
      "facilityType", // FK
    ],
    associations: [
      {
        model: "facility-type",
        field: "facilityType",
        endpoint: "/facility-types",
      },
    ],
  },
  {
    model: "park-camping-type",
    endpoint: "/park-camping-types",
    fields: [
      "name",
      "description",
      "isCampingOpen",
      "isActive",
      "campingType", // FK
    ],
    associations: [
      {
        model: "camping-type",
        field: "campingType",
        endpoint: "/camping-types",
      },
    ],
  },
];

export const localData = [
  {
    model: "Park",
    strapiModel: ["protected-area"],
    fieldMap: {
      orcs: ["protected-area", "orcs"],
      name: ["protected-area", "protectedAreaName"],
      strapiID: ["protected-area", "id"],
      // create new dateable if the park is new
    },
  },
  {
    model: "Campground",
    strapiModel: ["park-operation-sub-area"],
  },
  {
    model: "DateRange",
    fieldMap: {
      startDate: ["park-operation-sub-area-date", "openDate"], // could be serviceStartDate
      endDate: ["park-operation-sub-area-date", "closeDate"], // could be serviceEndDate
    },
  },
  // park (DONE)
  // campground
  // FeatureType
  // Feature
  // DateType
  // Season
  // DateRange
];
