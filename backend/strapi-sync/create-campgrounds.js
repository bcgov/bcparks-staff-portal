export function createCampgrounds() {
  const data = [
    {
      campground: "Alice Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Alice Lake Campground A sites 1-55",
          name: "Campground A sites 1-55",
        },
        {
          originalName: "Alice Lake Campground B sites 56-96",
          name: "Campground B sites 56-96",
        },
      ],
    },
    {
      campground: "Alice Lake groupsite",
      parkId: 1,
      features: [
        {
          originalName: "Alice Lake groupsite A",
          name: "Groupsite A",
        },
        {
          originalName: "Alice Lake groupsite B",
          name: "Groupsite B",
        },
      ],
    },
    {
      campground: "Bear Creek Campground",
      parkId: 1,
      features: [
        {
          originalName: "Bear Creek Campground sites 1-45",
          name: "Sites 1-45",
        },
        {
          originalName: "Bear Creek Campground sites 46-80",
          name: "Sites 46-80",
        },
        {
          originalName: "Bear Creek Campground sites 81-143",
          name: "Sites 81-143",
        },
      ],
    },
    {
      campground: "Bear Creek Overflow sites",
      parkId: 1,
      features: [
        {
          originalName: "Bear Creek Overflow sites",
          name: "Overflow sites",
        },
      ],
    },
    {
      campground: "Berg Lake Trail",
      parkId: 1,
      features: [
        {
          originalName: "Berg Lake Trail - Berg Lake",
          name: "Berg Lake",
        },
        {
          originalName: "Berg Lake Trail - Emperor Falls",
          name: "Emperor Falls",
        },
        {
          originalName: "Berg Lake Trail - Kinney Lake Campground",
          name: "Kinney Lake Campground",
        },
        {
          originalName: "Berg Lake Trail - Marmot",
          name: "Marmot",
        },
        {
          originalName: "Berg Lake Trail - Rearguard",
          name: "Rearguard",
        },
        {
          originalName: "Berg Lake Trail - Robson Pass",
          name: "Robson Pass",
        },
        {
          originalName: "Berg Lake Trail - Whitehorn Campground",
          name: "Whitehorn Campground",
        },
      ],
    },
    {
      campground: "Big Bar Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Big Bar Lake Lakeside Campground",
          name: "Lakeside",
        },
        {
          originalName: "Big Bar Lake Upper Campground",
          name: "Upper",
        },
      ],
    },
    {
      campground: "Bighorn Campground",
      parkId: 1,
      features: [
        {
          originalName: "Bighorn Campground RV sites",
          name: "RV sites",
        },
        {
          originalName: "Bighorn Campground sites 71-86",
          name: "Sites 71-86",
        },
      ],
    },
    {
      campground: "Birkenhead Campground",
      parkId: 1,
      features: [
        {
          originalName: "Birkenhead Campground",
          name: "Campground",
        },
        {
          originalName: "Birkenhead high-density campground",
          name: "High-density",
        },
      ],
    },
    {
      campground: "Bromley Rock Campground",
      parkId: 1,
      features: [
        {
          originalName: "Bromley Rock Campground sites 1-12",
          name: "Sites 1-12",
        },
        {
          originalName: "Bromley Rock Campground sites 13-17",
          name: "Sites 13-17",
        },
        {
          originalName: "Bromley Rock Campground sites 1-17",
          name: "Sites 1-17",
        },
      ],
    },
    {
      campground: "Cathedral Campground",
      parkId: 1,
      features: [
        {
          originalName: "Cathedral backcountry",
          name: "Backcountry",
        },
        {
          originalName: "Cathedral core area",
          name: "Core area",
        },
      ],
    },
    {
      campground: "Ellison Campground",
      parkId: 1,
      features: [
        {
          originalName: "Ellison Campground",
          name: "Campground",
        },
        {
          originalName: "Ellison Campground sites 1-36, 47-71",
          name: "Sites 1-36, 47-71",
        },
        {
          originalName: "Ellison Campground sites 37-46",
          name: "Sites 37-46",
        },
        {
          originalName: "Ellison Campground sites 47-71",
          name: "Sites 47-71",
        },
      ],
    },
    {
      campground: "Fintry Campground",
      parkId: 1,
      features: [
        {
          originalName: "Fintry Campground sites 1-160",
          name: "Sites 1-160",
        },
        {
          originalName: "Fintry Campground sites 1-50",
          name: "Sites 1-50",
        },
        {
          originalName: "Fintry Campground sites 111-160",
          name: "Sites 111-160",
        },
        {
          originalName: "Fintry Campground sites 51-110",
          name: "Sites 51-110",
        },
      ],
    },
    {
      campground: "Fintry Group Campground",
      parkId: 1,
      features: [
        {
          originalName: "Fintry Group Campground pod 1",
          name: "Pod 1",
        },
        {
          originalName: "Fintry Group Campground pod 2",
          name: "Pod 2",
        },
        {
          originalName: "Fintry Group Campground pod 3",
          name: "Pod 3",
        },
        {
          originalName: "Fintry groupsites",
          name: "Groupsites",
        },
      ],
    },
    {
      campground: "Furlong Bay Campground",
      parkId: 1,
      features: [
        {
          originalName: "Furlong Bay Campground sites 1-85",
          name: "Sites 1-85",
        },
        {
          originalName: "Furlong Bay Campground sites 86-164",
          name: "Sites 86-164",
        },
      ],
    },
    {
      campground: "Hiakwah Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Hiakwah Lake Cabin 1",
          name: "Cabin 1",
        },
        {
          originalName: "Hiakwah Lake Campground sites 21-40",
          name: "Sites 21-40",
        },
      ],
    },
    {
      campground: "Honeymoon Bay",
      parkId: 1,
      features: [
        {
          originalName: "Honeymoon Bay groupsite A",
          name: "Groupsite A",
        },
        {
          originalName: "Honeymoon Bay groupsite B",
          name: "Groupsite B",
        },
      ],
    },
    {
      campground: "Juniper Beach Campground",
      parkId: 1,
      features: [
        {
          originalName: "Juniper Beach Campground",
          name: "Campground",
        },
        {
          originalName: "Juniper Beach Central sites 8-13, 22-27",
          name: "Central sites 8-13, 22-27",
        },
        {
          originalName: "Juniper Beach East-West sites 1-7, 14-16",
          name: "East-West sites 1-7, 14-16",
        },
        {
          originalName: "Juniper Beach sites 17-21, 28-31",
          name: "Sites 17-21, 28-31",
        },
      ],
    },
    {
      campground: "Kekuli Bay Campground",
      parkId: 1,
      features: [
        {
          originalName: "Kekuli Bay Campground sites 1-43, 70-73",
          name: "Sites 1-43, 70-73",
        },
        {
          originalName: "Kekuli Bay Campground sites 1-73",
          name: "Sites 1-73",
        },
        {
          originalName: "Kekuli Bay Campground sites 44-69",
          name: "Sites 44-69",
        },
      ],
    },
    {
      campground: "Kettle River Campground",
      parkId: 1,
      features: [
        {
          originalName: "Kettle River Campground sites 1-9, 21-44, 61-114",
          name: "Sites 1-9, 21-44, 61-114",
        },
        {
          originalName: "Kettle River Campground sites 10-20, 45-60",
          name: "Sites 10-20, 45-60",
        },
        {
          originalName: "Kettle River Campground sites 88-114",
          name: "Sites 88-114",
        },
      ],
    },
    {
      campground: "Lac La Hache Campground",
      parkId: 1,
      features: [
        {
          originalName: "Lac La Hache Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Lac Le Jeune Campground",
      parkId: 1,
      features: [
        {
          originalName: "Lac Le Jeune Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Lakeside (Deer Lake) Campground",
      parkId: 1,
      features: [
        {
          originalName: "Lakeside (Deer Lake) Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Lakeside Campground",
      parkId: 1,
      features: [
        {
          originalName: "Lakeside Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Leighton Campground",
      parkId: 1,
      features: [
        {
          originalName: "Leighton Campground",
          name: "Leighton Campground",
        },
        {
          originalName: "Leighton North Campground",
          name: "North Campground",
        },
      ],
    },
    {
      campground: "Lightning Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Lightning Lake Campground (Large Loop)",
          name: "Large Loop",
        },
        {
          originalName: "Lightning Lake Campground (Small Loop)",
          name: "Small Loop",
        },
      ],
    },
    {
      campground: "Little Qualicum Falls",
      parkId: 1,
      features: [
        {
          originalName: "Little Qualicum Falls Lower Campground",
          name: "Lower Campground",
        },
        {
          originalName: "Little Qualicum Falls Upper Campground",
          name: "Upper Campground",
        },
      ],
    },
    {
      campground: "Lone Duck",
      parkId: 1,
      features: [
        {
          originalName: "Lone Duck groupsite 1",
          name: "Groupsite 1",
        },
        {
          originalName: "Lone Duck groupsite 2",
          name: "Groupsite 2",
        },
        {
          originalName: "Lone Duck winter",
          name: "Winter",
        },
      ],
    },
    {
      campground: "Maple Bay Campground",
      parkId: 1,
      features: [
        {
          originalName: "Maple Bay Campground sites 1-65",
          name: "Sites 1-65",
        },
        {
          originalName: "Maple Bay Campground sites 66-97",
          name: "Sites 66-97",
        },
      ],
    },
    {
      campground: "Martha Creek Campground",
      parkId: 1,
      features: [
        {
          originalName: "Martha Creek Campground",
          name: "Martha Creek Campground",
        },
        {
          originalName: "Martha Creek Campground sites 1-42",
          name: "Sites 1-42",
        },
        {
          originalName: "Martha Creek Campground sites 43-76",
          name: "Sites 43-76",
        },
        {
          originalName: "Martha Creek Campground sites 77-109",
          name: "Sites 77-109",
        },
      ],
    },
    {
      campground: "McDonald Creek Campground",
      parkId: 1,
      features: [
        {
          originalName: "McDonald Creek Campground",
          name: "McDonald Creek Campground",
        },
        {
          originalName:
            "McDonald Creek Campground first come, first served sites",
          name: "First come, first served sites",
        },
      ],
    },
    {
      campground: "Miracle Beach Campground",
      parkId: 1,
      features: [
        {
          originalName: "Miracle Beach Campground Overflow",
          name: "Overflow",
        },
        {
          originalName: "Miracle Beach Campground sites 1-10",
          name: "Sites 1-10",
        },
        {
          originalName: "Miracle Beach Campground sites 1-201",
          name: "Sites 1-201",
        },
        {
          originalName: "Miracle Beach Campground sites 1-25",
          name: "Sites 1-25",
        },
        {
          originalName: "Miracle Beach Campground sites 101-201",
          name: "Sites 101-201",
        },
        {
          originalName: "Miracle Beach Campground sites 11-25",
          name: "Sites 11-25",
        },
        {
          originalName: "Miracle Beach Campground sites 26-100",
          name: "Sites 26-100",
        },
      ],
    },
    {
      campground: "North Beach Campground",
      parkId: 1,
      features: [
        {
          originalName: "North Beach Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "North Thompson River Campground",
      parkId: 1,
      features: [
        {
          originalName: "North Thompson River Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "North Copeland Island",
      parkId: 1,
      features: [
        {
          originalName: "North Copeland Island",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "North Twin Island Campground",
      parkId: 1,
      features: [
        {
          originalName: "North Twin Island Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Okanagan Lake North Campground",
      parkId: 1,
      features: [
        {
          originalName: "Okanagan Lake North Campground sites 1-31",
          name: "Sites 1-31",
        },
        {
          originalName: "Okanagan Lake North Campground sites 1-81",
          name: "Sites 1-81",
        },
        {
          originalName: "Okanagan Lake North Campground sites 32-81",
          name: "Sites 32-81",
        },
      ],
    },
    {
      campground: "Okanagan Lake South Campground",
      parkId: 1,
      features: [
        {
          originalName:
            "Okanagan Lake South Campground Loop 1 sites 1-24, 69-88",
          name: "Loop 1 sites 1-24, 69-88",
        },
        {
          originalName: "Okanagan Lake South Campground Loop 2 sites 25-68",
          name: "Loop 2 sites 25-68",
        },
        {
          originalName: "Okanagan Lake South Campground overflow sites",
          name: "Overflow sites",
        },
        {
          originalName: "Okanagan Lake South Campground sites 1-88",
          name: "Sites 1-88",
        },
      ],
    },
    {
      campground: "Otter Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Otter Lake Campground sites 1-26",
          name: "Sites 1-26",
        },
        {
          originalName: "Otter Lake Campground sites 1-45",
          name: "Sites 1-45",
        },
        {
          originalName: "Otter Lake Campground sites 27-45",
          name: "Sites 27-45",
        },
      ],
    },
    {
      campground: "Porpoise Bay Campground",
      parkId: 1,
      features: [
        {
          originalName: "Porpoise Bay Campground sites 1-30",
          name: "Sites 1-30",
        },
        {
          originalName: "Porpoise Bay Campground sites 31-84",
          name: "Sites 31-84",
        },
      ],
    },
    {
      campground: "Porteau Cove Campground",
      parkId: 1,
      features: [
        {
          originalName: "Porteau Cove Campground sites 1-9, 23-30",
          name: "Sites 1-9, 23-30",
        },
        {
          originalName: "Porteau Cove Campground sites 10-22",
          name: "Sites 10-22",
        },
        {
          originalName: "Porteau Cove Campground sites 31-44",
          name: "Sites 31-44",
        },
        {
          originalName: "Porteau Cove Campground vehicle accessible sites",
          name: "Vehicle accessible sites",
        },
      ],
    },
    {
      campground: "Quinsam Campground",
      parkId: 1,
      features: [
        {
          originalName: "Quinsam Campground",
          name: "Quinsam Campground",
        },
        {
          originalName: "Quinsam Campground sites 1-15",
          name: "Sites 1-15",
        },
        {
          originalName: "Quinsam Campground sites 16-70",
          name: "Sites 16-70",
        },
        {
          originalName: "Quinsam Campground sites 71-122",
          name: "Sites 71-122",
        },
      ],
    },
    {
      campground: "Rathtrevor Beach Campground",
      parkId: 1,
      features: [
        {
          originalName: "Rathtrevor Beach Campground sites 1-174",
          name: "Sites 1-174",
        },
        {
          originalName: "Rathtrevor Beach Campground sites 175-226",
          name: "Sites 175-226",
        },
      ],
    },
    {
      campground: "Robson Meadows Campground",
      parkId: 1,
      features: [
        {
          originalName: "Robson Meadows Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Robson River Campground",
      parkId: 1,
      features: [
        {
          originalName: "Robson River Campground",
          name: "Robson River Campground",
        },
        {
          originalName: "Robson River Campground electrified sites",
          name: "Electrified sites",
        },
      ],
    },
    {
      campground: "Roche Lake North Campground",
      parkId: 1,
      features: [
        {
          originalName: "Roche Lake North Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Roche Lake West Campground",
      parkId: 1,
      features: [
        {
          originalName: "Roche Lake West Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Sandspit Campground",
      parkId: 1,
      features: [
        {
          originalName: "Sandspit Campground lanes 1-3, sites 1-52",
          name: "Lanes 1-3, sites 1-52",
        },
        {
          originalName: "Sandspit Campground lanes 4-6, sites 53-113",
          name: "Lanes 4-6, sites 53-113",
        },
      ],
    },
    {
      campground: "Shuswap Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Shuswap Lake Campground",
          name: "Shuswap Lake Campground",
        },
        {
          originalName: "Shuswap Lake Campground sites 1-78, 246-330",
          name: "Sites 1-78, 246-330",
        },
        {
          originalName: "Shuswap Lake Campground sites 79-245",
          name: "Sites 79-245",
        },
        {
          originalName: "Shuswap Lake overflow sites",
          name: "Overflow sites",
        },
      ],
    },
    {
      campground: "Silver Beach Campground",
      parkId: 1,
      features: [
        {
          originalName: "Silver Beach Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Silver Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Silver Lake Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Sproat Lake",
      parkId: 1,
      features: [
        {
          originalName: "Sproat Lake Lower Campground",
          name: "Lower Campground",
        },
        {
          originalName: "Sproat Lake Upper Campground",
          name: "Upper Campground",
        },
      ],
    },
    {
      campground: "Stemwinder Campground",
      parkId: 1,
      features: [
        {
          originalName: "Stemwinder Campground",
          name: "Stemwinder Campground",
        },
        {
          originalName: "Stemwinder Campground sites 1-11",
          name: "Sites 1-11",
        },
        {
          originalName: "Stemwinder Campground sites 12-27",
          name: "Sites 12-27",
        },
      ],
    },
    {
      campground: "Summit Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "Summit Lake Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Texas Creek Campground",
      parkId: 1,
      features: [
        {
          originalName: "Texas Creek Campground site 1-10 and 35-63",
          name: "Sites 1-10 and 35-63",
        },
        {
          originalName: "Texas Creek Campground sites 11-34",
          name: "Sites 11-34",
        },
      ],
    },
    {
      campground: "West Side Campground",
      parkId: 1,
      features: [
        {
          originalName: "West Side groupsite A",
          name: "Groupsite A",
        },
        {
          originalName: "West Side groupsite B",
          name: "Groupsite B",
        },
      ],
    },
    {
      campground: "White Lake Campground",
      parkId: 1,
      features: [
        {
          originalName: "White Lake Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "White River Campground",
      parkId: 1,
      features: [
        {
          originalName: "White River Campground",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "White Spruce Island Campground",
      parkId: 1,
      features: [
        {
          originalName: "White Spruce Island North",
          name: "North",
        },
        {
          originalName: "White Spruce Island South",
          name: "South",
        },
      ],
    },
    {
      campground: "Elk Lakes backcountry",
      parkId: 1,
      features: [
        {
          originalName: "Elk Lakes backcountry",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "Elk River",
      parkId: 1,
      features: [
        {
          originalName: "Elk River",
          name: "All Sites",
        },
      ],
    },
    {
      campground: "sẃiẃs Campground",
      parkId: 1,
      features: [
        {
          originalName: "sẃiẃs Campground",
          name: "sẃiẃs Campground",
        },
        {
          originalName: "sẃiẃs overflow camping",
          name: "Overflow Camping",
        },
      ],
    },
  ];
}
