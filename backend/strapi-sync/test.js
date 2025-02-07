import {
  Park,
  FeatureType,
  Feature,
  Dateable,
  DateType,
  Season,
  DateRange,
  User,
} from "../models/index.js";

async function test() {
  const seasons = await Season.findAll({
    where: {
      featureTypeId: 20,
    },
    include: [
      {
        model: FeatureType,
        as: "featureType",
        attributes: ["id", "name", "icon"],
      },
      {
        model: Park,
        as: "park",
        attributes: ["id", "name", "orcs"],
      },
    ],
  });

  const items = seasons.map((season) => season.toJSON());

  const uniqueParks = new Set(items.map((item) => item.park.name));

  console.log(uniqueParks);
}

test();
