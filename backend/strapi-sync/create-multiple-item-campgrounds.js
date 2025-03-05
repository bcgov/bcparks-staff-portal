import "../env.js";
import { Campground, Feature, Park } from "../models/index.js";

import { getItemByAttributes, createModel } from "./utils.js";

const campgrounds = [
  {
    campgroundName: "Alice Lake Campground",
    items: [
      {
        strapiName: "Alice Lake Campground A sites 1-55",
        newName: "Campground A sites 1-55",
        featureId: "90_60",
      },
      {
        strapiName: "Alice Lake Campground B sites 56-96",
        newName: "Campground B sites 56-96",
        featureId: "90_61",
      },
    ],
    orcs: 90,
  },
  {
    campgroundName: "Alice Lake Groupsites",
    items: [
      {
        strapiName: "Alice Lake groupsite A",
        newName: "Groupsite A",
        featureId: "90_177",
      },
      {
        strapiName: "Alice Lake groupsite B",
        newName: "Groupsite B",
        featureId: "90_178",
      },
    ],
    orcs: 90,
  },
  {
    campgroundName: "Berg Lake Trail",
    items: [
      {
        strapiName: "Berg Lake Trail - Kinney Lake Campground",
        newName: "Kinney Lake Campground",
        featureId: "2_23",
      },
      {
        strapiName: "Berg Lake Trail - Whitehorn Campground",
        newName: "Whitehorn Campground",
        featureId: "2_27",
      },
    ],
    orcs: 2,
  },
  {
    campgroundName: "Big Bar Lake Campground",
    items: [
      {
        strapiName: "Big Bar Lake Lakeside Campground",
        newName: "Lakeside Campground",
        featureId: "213_29",
      },
      {
        strapiName: "Big Bar Lake Upper Campground",
        newName: "Upper Campground",
        featureId: "213_30",
      },
    ],
    orcs: 213,
  },
  {
    campgroundName: "Bighorn Campground",
    items: [
      {
        strapiName: "Bighorn Campground electrified sites 62-70",
        newName: "Electrified sites 62-70",
        featureId: "202_31",
      },
      {
        strapiName: "Bighorn Campground sites 71-86",
        newName: "Sites 71-86",
        featureId: "202_32",
      },
    ],
    orcs: 202,
  },
  {
    campgroundName: "Birkenhead Campground",
    items: [
      {
        strapiName: "Birkenhead Campground sites 1-78",
        newName: "Sites 1-78",
        featureId: "152_34",
      },
      {
        strapiName: "Birkenhead Campground high-density sites",
        newName: "High-density campsites",
        featureId: "152_35",
      },
    ],
    orcs: 152,
  },
  {
    campgroundName: "Cathedral backcountry",
    items: [
      {
        strapiName: "Cathedral other backcountry",
        newName: "Other backcountry",
        featureId: "199_65",
      },
      {
        strapiName: "Cathedral core area backcountry",
        newName: "Core area",
        featureId: "199_66",
      },
      {
        strapiName: "Ashnola Forest Service Road",
        newName: "Ashnola Forest Service Road",
        featureId: "199_11",
      },
    ],
    orcs: 199,
  },
  {
    campgroundName: "Furlong Bay Campground",
    items: [
      {
        strapiName: "Furlong Bay Campground sites 1-85",
        newName: "Sites 1-85",
        featureId: "70_132",
      },
      {
        strapiName: "Furlong Bay Campground sites 86-164",
        newName: "Sites 86-164",
        featureId: "70_133",
      },
    ],
    orcs: 70,
  },
  {
    campgroundName: "Honeymoon Bay Groupsites",
    items: [
      {
        strapiName: "Honeymoon Bay groupsite A",
        newName: "Groupsite A",
        featureId: "41_200",
      },
      {
        strapiName: "Honeymoon Bay groupsite B",
        newName: "Groupsite B",
        featureId: "41_201",
      },
    ],
    orcs: 41,
  },
  {
    campgroundName: "Kettle River Campground",
    items: [
      {
        strapiName: "Kettle River Campground sites 1-9, 21-44, 61-114",
        newName: "Sites 1-9, 21-44, 61-114",
        featureId: "236_753",
      },
      {
        strapiName: "Kettle River Campground sites 10-20, 45-60",
        newName: "Sites 10-20, 45-60",
        featureId: "236_226",
      },
    ],
    orcs: 236,
  },
  {
    campgroundName: "Lightning Lake Campground",
    items: [
      {
        strapiName: "Lightning Lake Campground (Large Loop)",
        newName: "Large Loop",
        featureId: "33_246",
      },
      {
        strapiName: "Lightning Lake Campground (Small Loop)",
        newName: "Small Loop",
        featureId: "33_247",
      },
    ],
    orcs: 33,
  },
  {
    campgroundName: "Little Qualicum Falls Campground",
    items: [
      {
        strapiName: "Little Qualicum Falls Lower Campground",
        newName: "Lower Campground",
        featureId: "30_258",
      },
      {
        strapiName: "Little Qualicum Falls Upper Campground",
        newName: "Upper Campground",
        featureId: "30_462",
      },
    ],
    orcs: 30,
  },
  {
    campgroundName: "Lone Duck Groupsites",
    items: [
      {
        strapiName: "Lone Duck groupsite 1",
        newName: "Groupsite 1",
        featureId: "33_252",
      },
      {
        strapiName: "Lone Duck groupsite 2",
        newName: "Groupsite 2",
        featureId: "33_253",
      },
    ],
    orcs: 33,
  },
  {
    campgroundName: "Maple Bay Campground",
    items: [
      {
        strapiName: "Maple Bay Campground sites 1-65",
        newName: "Sites 1-65",
        featureId: "41_272",
      },
      {
        strapiName: "Maple Bay Campground sites 66-97",
        newName: "Sites 66-97",
        featureId: "41_273",
      },
    ],
    orcs: 41,
  },
  {
    campgroundName: "Miracle Beach Campground",
    items: [
      {
        strapiName: "Miracle Beach Campground Overflow",
        newName: "Overflow",
        featureId: "45_922",
      },
      {
        strapiName: "Miracle Beach Campground sites 1-25",
        newName: "Sites 1-25",
        featureId: "45_915",
      },
      {
        strapiName: "Miracle Beach Campground sites 101-201",
        newName: "Sites 101-201",
        featureId: "45_281",
      },
      {
        strapiName: "Miracle Beach Campground sites 26-100",
        newName: "Sites 26-100",
        featureId: "45_285",
      },
    ],
    orcs: 45,
  },
  {
    campgroundName: "Okanagan Lake Campground",
    items: [
      {
        strapiName: "Okanagan Lake North Campground sites 1-81",
        newName: "North Campground sites 1-81",
        featureId: "54_533",
      },
      {
        strapiName: "Okanagan Lake South Campground sites 1-88",
        newName: "South Campground sites 1-88",
        featureId: "54_539",
      },
    ],
    orcs: 54,
  },
  {
    campgroundName: "Porpoise Bay Campground",
    items: [
      {
        strapiName: "Porpoise Bay Campground sites 1-30",
        newName: "Sites 1-30",
        featureId: "221_343",
      },
      {
        strapiName: "Porpoise Bay Campground sites 31-84",
        newName: "Sites 31-84",
        featureId: "221_342",
      },
    ],
    orcs: 221,
  },
  {
    campgroundName: "Quinsam Campground",
    items: [
      {
        strapiName: "Quinsam Campground sites 1-15",
        newName: "Sites 1-15",
        featureId: "28_535",
      },
      {
        strapiName: "Quinsam Campground sites 16-70",
        newName: "Sites 16-70",
        featureId: "28_536",
      },
      {
        strapiName: "Quinsam Campground sites 71-122",
        newName: "Sites 71-122",
        featureId: "28_537",
      },
    ],
    orcs: 28,
  },
  {
    campgroundName: "Rathtrevor Beach Campground",
    items: [
      {
        strapiName: "Rathtrevor Beach Campground sites 1-174",
        newName: "Sites 1-174",
        featureId: "193_101",
      },
      {
        strapiName: "Rathtrevor Beach Campground sites 175-226",
        newName: "Sites 175-226",
        featureId: "193_255",
      },
    ],
    orcs: 193,
  },
  {
    campgroundName: "Robson River Campground",
    items: [
      {
        strapiName: "Robson River Campground 1-20",
        newName: "Sites 1-20",
        featureId: "2_367",
      },
      {
        strapiName: "Robson River Campground electrified sites 21-40",
        newName: "Electrified sites 21-40",
        featureId: "2_368",
      },
    ],
    orcs: 2,
  },
  {
    campgroundName: "Roche Lake Campground",
    items: [
      {
        strapiName: "Roche Lake North Campground",
        newName: "North Campground",
        featureId: "6892_369",
      },
      {
        strapiName: "Roche Lake West Campground",
        newName: "West Campground",
        featureId: "6892_370",
      },
    ],
    orcs: 6892,
  },
  {
    campgroundName: "Sandspit Campground",
    items: [
      {
        strapiName: "Sandspit Campground lanes 1-3, sites 1-52",
        newName: "Lanes 1-3, Sites 1-52",
        featureId: "52_381",
      },
      {
        strapiName: "Sandspit Campground lanes 4-6, sites 53-113",
        newName: "Lanes 4-6, Sites 53-113",
        featureId: "52_382",
      },
    ],
    orcs: 52,
  },
  {
    campgroundName: "Shuswap Lake Campground",
    items: [
      {
        strapiName: "Shuswap Lake Campground sites 1-78, 246-330",
        newName: "Sites 1-78, 246-330",
        featureId: "89_754",
      },
      {
        strapiName: "Shuswap Lake Campground sites 79-245",
        newName: "Sites 79-245",
        featureId: "89_755",
      },
      {
        strapiName: "Shuswap Lake overflow sites",
        newName: "Overflow sites",
        featureId: "89_322",
      },
    ],
    orcs: 89,
  },
  {
    campgroundName: "Sproat Lake Campground",
    items: [
      {
        strapiName: "Sproat Lake Lower Campground",
        newName: "Lower Campground",
        featureId: "182_259",
      },
      {
        strapiName: "Sproat Lake Upper Campground",
        newName: "Upper Campground",
        featureId: "182_463",
      },
    ],
    orcs: 182,
  },
  {
    campgroundName: "s\u1e83i\u1e83s Campground",
    items: [
      {
        strapiName: "s\u1e83i\u1e83s Campground sites 1-41",
        newName: "Sites 1-41",
        featureId: "142_380",
      },
      {
        strapiName: "s\u1e83i\u1e83s Campground overflow sites",
        newName: "Overflow sites",
        featureId: "142_319",
      },
    ],
    orcs: 142,
  },
  {
    campgroundName: "Texas Creek Campground",
    items: [
      {
        strapiName: "Texas Creek Campground site 1-10 and 35-63",
        newName: "Sites 1-10 and 35-63",
        featureId: "9549_451",
      },
      {
        strapiName: "Texas Creek Campground sites 11-34",
        newName: "Sites 11-34",
        featureId: "9549_398",
      },
    ],
    orcs: 9549,
  },
  {
    campgroundName: "West Side Groupsites",
    items: [
      {
        strapiName: "West Side groupsite A",
        newName: "Groupsite A",
        featureId: "41_484",
      },
      {
        strapiName: "West Side groupsite B",
        newName: "Groupsite B",
        featureId: "41_485",
      },
    ],
    orcs: 41,
  },
  {
    campgroundName: "White Spruce Island",
    items: [
      {
        strapiName: "White Spruce Island North",
        newName: "North",
        featureId: "251_489",
      },
      {
        strapiName: "White Spruce Island South",
        newName: "South",
        featureId: "251_490",
      },
    ],
    orcs: 251,
  },
];

async function updateFeature(item, campgroundId) {
  // const strapiId = parseInt(item.featureId.split("_")[1], 10);

  // get feature by featureId
  const feature = await getItemByAttributes(Feature, {
    strapiFeatureId: item.featureId,
  });

  // const feature = await getItemByAttributes(Feature, {
  //   strapiId,
  // });

  // set campgroundId and name
  feature.campgroundId = campgroundId;
  feature.name = item.newName;

  await feature.save();
}

async function createCampground(item) {
  // get park by orcs
  const park = await getItemByAttributes(Park, {
    orcs: item.orcs.toString(),
  });

  // create campground with FK to Park
  const data = {
    name: item.campgroundName,
    parkId: park.id,
  };

  const campground = await createModel(Campground, data);

  await Promise.all(
    item.items.map(async (feature) => updateFeature(feature, campground.id)),
  );
}

export async function createCampgrounds(items) {
  await Promise.all(items.map(async (item) => createCampground(item)));
}

// createCampgrounds(campgrounds);
