import { Campground, Feature, Park } from "../models/index.js";

import { getItemByAttributes, createModel } from "./utils.js";

const campgrounds = [
  {
    parkId: 6,
    campgroundName: "Alice Lake Campground",
    items: [
      {
        strapiName: "Alice Lake Campground A sites 1-55",
        newName: "Campground A sites 1-55",
        strapiId: 60,
      },
      {
        strapiName: "Alice Lake Campground B sites 56-96",
        newName: "Campground B sites 56-96",
        strapiId: 61,
      },
    ],
  },
  {
    parkId: 6,
    campgroundName: "Alice Lake Groupsites",
    items: [
      {
        strapiName: "Alice Lake groupsite A",
        newName: "Groupsite A",
        strapiId: 177,
      },
      {
        strapiName: "Alice Lake groupsite B",
        newName: "Groupsite B",
        strapiId: 178,
      },
    ],
  },
  {
    parkId: 53,
    campgroundName: "Big Bar Lake Campground",
    items: [
      {
        strapiName: "Big Bar Lake Lakeside Campground",
        newName: "Lakeside Campground",
        strapiId: 29,
      },
      {
        strapiName: "Big Bar Lake Upper Campground",
        newName: "Upper Campground",
        strapiId: 30,
      },
    ],
  },
  {
    parkId: 902,
    campgroundName: "Bighorn Campground",
    items: [
      {
        strapiName: "Bighorn Campground RV sites",
        newName: "RV Sites",
        strapiId: 31,
      },
      {
        strapiName: "Bighorn Campground sites 71-86",
        newName: "Sites 71-86",
        strapiId: 32,
      },
    ],
  },
  {
    parkId: 506,
    campgroundName: "Furlong Bay Campground",
    items: [
      {
        strapiName: "Furlong Bay Campground sites 1-85",
        newName: "Sites 1-85",
        strapiId: 132,
      },
      {
        strapiName: "Furlong Bay Campground sites 86-164",
        newName: "Sites 86-164",
        strapiId: 133,
      },
    ],
  },
  {
    parkId: 199,
    campgroundName: "Honeymoon Bay Groupsites",
    items: [
      {
        strapiName: "Honeymoon Bay groupsite A",
        newName: "Groupsite A",
        strapiId: 200,
      },
      {
        strapiName: "Honeymoon Bay groupsite B",
        newName: "Groupsite B",
        strapiId: 201,
      },
    ],
  },
  {
    parkId: 449,
    campgroundName: "Kettle River Campground",
    items: [
      {
        strapiName: "Kettle River Campground sites 1-9, 21-44, 61-114",
        newName: "Sites 1-9, 21-44, 61-114",
        strapiId: 753,
      },
      {
        strapiName: "Kettle River Campground sites 10-20, 45-60",
        newName: "Sites 10-20, 45-60",
        strapiId: 226,
      },
    ],
  },
  {
    parkId: 247,
    campgroundName: "Lightning Lake Campground",
    items: [
      {
        strapiName: "Lightning Lake Campground (Large Loop)",
        newName: "Large Loop",
        strapiId: 246,
      },
      {
        strapiName: "Lightning Lake Campground (Small Loop)",
        newName: "Small Loop",
        strapiId: 247,
      },
    ],
  },
  {
    parkId: 525,
    campgroundName: "Little Qualicum Falls Campground",
    items: [
      {
        strapiName: "Little Qualicum Falls Lower Campground",
        newName: "Lower Campground",
        strapiId: 258,
      },
      {
        strapiName: "Little Qualicum Falls Upper Campground",
        newName: "Upper Campground",
        strapiId: 462,
      },
    ],
  },
  {
    parkId: 247,
    campgroundName: "Lone Duck Groupsites",
    items: [
      {
        strapiName: "Lone Duck groupsite 1",
        newName: "Groupsite 1",
        strapiId: 252,
      },
      {
        strapiName: "Lone Duck groupsite 2",
        newName: "Groupsite 2",
        strapiId: 253,
      },
    ],
  },
  {
    parkId: 199,
    campgroundName: "Maple Bay Campground",
    items: [
      {
        strapiName: "Maple Bay Campground sites 1-65",
        newName: "Sites 1-65",
        strapiId: 272,
      },
      {
        strapiName: "Maple Bay Campground sites 66-97",
        newName: "Sites 66-97",
        strapiId: 273,
      },
    ],
  },
  {
    parkId: 573,
    campgroundName: "Miracle Beach Campground",
    items: [
      {
        strapiName: "Miracle Beach Campground Overflow",
        newName: "Overflow",
        strapiId: 922,
      },
      {
        strapiName: "Miracle Beach Campground sites 1-10",
        newName: "Sites 1-10",
        strapiId: 282,
      },
      {
        strapiName: "Miracle Beach Campground sites 1-25",
        newName: "Sites 1-25",
        strapiId: 915,
      },
      {
        strapiName: "Miracle Beach Campground sites 101-201",
        newName: "Sites 101-201",
        strapiId: 281,
      },
      {
        strapiName: "Miracle Beach Campground sites 26-100",
        newName: "Sites 26-100",
        strapiId: 285,
      },
    ],
  },
  {
    parkId: 681,
    campgroundName: "Okanagan Lake Campground",
    items: [
      {
        strapiName: "Okanagan Lake North Campground sites 1-81",
        newName: "North Campground sites 1-81",
        strapiId: 533,
      },
      {
        strapiName: "Okanagan Lake South Campground sites 1-88",
        newName: "South Campground sites 1-88",
        strapiId: 539,
      },
    ],
  },
  {
    parkId: 727,
    campgroundName: "Porpoise Bay Campground",
    items: [
      {
        strapiName: "Porpoise Bay Campground sites 1-30",
        newName: "Sites 1-30",
        strapiId: 343,
      },
      {
        strapiName: "Porpoise Bay Campground sites 31-84",
        newName: "Sites 31-84",
        strapiId: 342,
      },
    ],
  },
  {
    parkId: 264,
    campgroundName: "Quinsam Campground",
    items: [
      {
        strapiName: "Quinsam Campground sites 1-15",
        newName: "Sites 1-15",
        strapiId: 535,
      },
      {
        strapiName: "Quinsam Campground sites 16-70",
        newName: "Sites 16-70",
        strapiId: 536,
      },
      {
        strapiName: "Quinsam Campground sites 71-122",
        newName: "Sites 71-122",
        strapiId: 537,
      },
    ],
  },
  {
    parkId: 760,
    campgroundName: "Rathtrevor Beach Campground",
    items: [
      {
        strapiName: "Rathtrevor Beach Campground sites 1-174",
        newName: "Sites 1-174",
        strapiId: 101,
      },
      {
        strapiName: "Rathtrevor Beach Campground sites 175-226",
        newName: "Sites 175-226",
        strapiId: 255,
      },
    ],
  },
  {
    parkId: 773,
    campgroundName: "Roche Lake Campground",
    items: [
      {
        strapiName: "Roche Lake North Campground",
        newName: "North Campground",
        strapiId: 369,
      },
      {
        strapiName: "Roche Lake West Campground",
        newName: "West Campground",
        strapiId: 370,
      },
    ],
  },
  {
    parkId: 486,
    campgroundName: "Sandspit Campground",
    items: [
      {
        strapiName: "Sandspit Campground lanes 1-3, sites 1-52",
        newName: "Lanes 1-3, Sites 1-52",
        strapiId: 381,
      },
      {
        strapiName: "Sandspit Campground lanes 4-6, sites 53-113",
        newName: "Lanes 4-6, Sites 53-113",
        strapiId: 382,
      },
    ],
  },
  {
    parkId: 816,
    campgroundName: "Shuswap Lake Campground",
    items: [
      {
        strapiName: "Shuswap Lake Campground sites 1-78, 246-330",
        newName: "Sites 1-78, 246-330",
        strapiId: 754,
      },
      {
        strapiName: "Shuswap Lake Campground sites 79-245",
        newName: "Sites 79-245",
        strapiId: 755,
      },
      {
        strapiName: "Shuswap Lake overflow sites",
        newName: "Overflow sites",
        strapiId: 322,
      },
    ],
  },
  {
    parkId: 865,
    campgroundName: "Sproat Lake Campground",
    items: [
      {
        strapiName: "Sproat Lake Lower Campground",
        newName: "Lower Campground",
        strapiId: 259,
      },
      {
        strapiName: "Sproat Lake Upper Campground",
        newName: "Upper Campground",
        strapiId: 463,
      },
    ],
  },
  {
    parkId: 340,
    campgroundName: "Texas Creek Campground",
    items: [
      {
        strapiName: "Texas Creek Campground site 1-10 and 35-63",
        newName: "Site 1-10 and 35-63",
        strapiId: 451,
      },
      {
        strapiName: "Texas Creek Campground sites 11-34",
        newName: "Sites 11-34",
        strapiId: 398,
      },
    ],
  },
  {
    parkId: 199,
    campgroundName: "West Side Groupsites",
    items: [
      {
        strapiName: "West Side groupsite A",
        newName: "Groupsite A",
        strapiId: 484,
      },
      {
        strapiName: "West Side groupsite B",
        newName: "Groupsite B",
        strapiId: 485,
      },
    ],
  },
  {
    parkId: 128,
    campgroundName: "White Spruce Island",
    items: [
      {
        strapiName: "White Spruce Island North",
        newName: "Island North",
        strapiId: 489,
      },
      {
        strapiName: "White Spruce Island South",
        newName: "Island South",
        strapiId: 490,
      },
    ],
  },
];

async function updateFeature(item, campgroundId) {
  // get feature by strapiID
  const feature = await getItemByAttributes(Feature, {
    strapiId: item.strapiId,
  });

  // set campgroundId and name
  feature.campgroundId = campgroundId;
  feature.name = item.newName;

  await feature.save();
}

async function createCampground(item) {
  const park = await getItemByAttributes(Park, {
    strapiId: item.parkId,
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

async function createCampgrounds(items) {
  await Promise.all(items.map(async (item) => createCampground(item)));
}

createCampgrounds(campgrounds);
