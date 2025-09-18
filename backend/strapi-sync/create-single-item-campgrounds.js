import "../env.js";
import { Feature } from "../models/index.js";

import { getItemByAttributes, findOrCreateParkArea } from "./utils.js";

const campgrounds = [
  {
    campgroundName: "8 Mile Log Cabin",
    items: [{ featureName: "All sites", featureId: "9815_1" }],
    orcs: 9815,
  },
  {
    campgroundName: "Agate Beach Campground",
    items: [{ featureName: "All sites", featureId: "255_2" }],
    orcs: 255,
  },
  {
    campgroundName: "Akamina Creek backcountry",
    items: [{ featureName: "All sites", featureId: "338_3" }],
    orcs: 338,
  },
  {
    campgroundName: "Alces Lake Campground",
    items: [{ featureName: "All sites", featureId: "287_5" }],
    orcs: 287,
  },
  {
    campgroundName: "Alice Lake walk-in sites",
    items: [{ featureName: "All sites", featureId: "90_469" }],
    orcs: 90,
  },
  {
    campgroundName: "Allison Lake Campground",
    items: [{ featureName: "All sites", featureId: "119_6" }],
    orcs: 119,
  },
  {
    campgroundName: "Alouette Campground",
    items: [{ featureName: "All sites", featureId: "8_7" }],
    orcs: 8,
  },
  {
    campgroundName: "Alouette groupsite",
    items: [{ featureName: "All sites", featureId: "8_8" }],
    orcs: 8,
  },
  {
    campgroundName: "Applebee Dome Campground",
    items: [{ featureName: "All sites", featureId: "206_9" }],
    orcs: 206,
  },
  {
    campgroundName: "Arrowhead Campground",
    items: [{ featureName: "All sites", featureId: "273_10" }],
    orcs: 273,
  },
  {
    campgroundName: "Ashnola Forest Service Road",
    items: [{ featureName: "All sites", featureId: "199_11" }],
    orcs: 199,
  },
  {
    campgroundName: "Lake of the Woods Campground",
    items: [{ featureName: "All sites", featureId: "199_66" }],
    orcs: 199,
  },
  {
    campgroundName: "Quiniscoe Lake Campground",
    items: [{ featureName: "All sites", featureId: "199_970" }],
    orcs: 199,
  },
  {
    campgroundName: "Pyramid Campground",
    items: [{ featureName: "All sites", featureId: "199_972" }],
    orcs: 199,
  },
  {
    campgroundName: "Atnarko Campground",
    items: [{ featureName: "All sites", featureId: "19_12" }],
    orcs: 19,
  },
  {
    campgroundName: "Azure Lake backcountry",
    items: [{ featureName: "All sites", featureId: "24_13" }],
    orcs: 24,
  },
  {
    campgroundName: "Balsam Island",
    items: [{ featureName: "All sites", featureId: "251_14" }],
    orcs: 251,
  },
  {
    campgroundName: "Bamberton Campground",
    items: [{ featureName: "All sites", featureId: "117_15" }],
    orcs: 117,
  },
  {
    campgroundName: "Bastion Mountain Campground",
    items: [{ featureName: "All sites", featureId: "276_16" }],
    orcs: 276,
  },
  {
    campgroundName: "Bear Creek Campground",
    items: [{ featureName: "All sites", featureId: "307_912" }],
    orcs: 307,
  },
  {
    campgroundName: "Beatton Campground",
    items: [{ featureName: "All sites", featureId: "14_17" }],
    orcs: 14,
  },
  {
    campgroundName: "Beaumont Campground",
    items: [{ featureName: "All sites", featureId: "115_18" }],
    orcs: 115,
  },
  {
    campgroundName: "Beaver Creek Campground",
    items: [{ featureName: "All sites", featureId: "169_615" }],
    orcs: 169,
  },
  {
    campgroundName: "Bedwell Lake and Baby Bedwell Lake",
    items: [{ featureName: "All sites", featureId: "1_842" }],
    orcs: 1,
  },
  {
    campgroundName: "Bench Campground",
    items: [{ featureName: "All sites", featureId: "200_19" }],
    orcs: 200,
  },
  {
    campgroundName: "Bert's Cabin (includes three tent pads)",
    items: [{ featureName: "All sites", featureId: "251_28" }],
    orcs: 251,
  },
  {
    campgroundName: "Big Bunsby marine-accessible camping",
    items: [{ featureName: "All sites", featureId: "8779_532" }],
    orcs: 8779,
  },
  {
    campgroundName: "Bishop Creek Campground",
    items: [{ featureName: "All sites", featureId: "9509_759" }],
    orcs: 9509,
  },
  {
    campgroundName: "Black Prince Cabin",
    items: [{ featureName: "All sites", featureId: "27_36" }],
    orcs: 27,
  },
  {
    campgroundName: "Blanket Creek groupsites",
    items: [{ featureName: "All sites", featureId: "323_179" }],
    orcs: 323,
  },
  {
    campgroundName: "Blanket Creek sites 1-105",
    items: [{ featureName: "All sites", featureId: "323_394" }],
    orcs: 323,
  },
  {
    campgroundName: "Blue Earth Lake Campground",
    items: [{ featureName: "All sites", featureId: "6900_37" }],
    orcs: 6900,
  },
  {
    campgroundName: "Bold Head",
    items: [{ featureName: "All sites", featureId: "252_39" }],
    orcs: 252,
  },
  {
    campgroundName: "Boulder Campground",
    items: [{ featureName: "All sites", featureId: "206_40" }],
    orcs: 206,
  },
  {
    campgroundName: "Boundary Creek Campground",
    items: [{ featureName: "All sites", featureId: "56_41" }],
    orcs: 56,
  },
  {
    campgroundName: "Bowron Lake Backcountry Canoe Circuit",
    items: [{ featureName: "All sites", featureId: "129_44" }],
    orcs: 129,
  },
  {
    campgroundName: "Bowron Lake Backcountry Canoe Circuit cabins",
    items: [{ featureName: "All sites", featureId: "129_42" }],
    orcs: 129,
  },
  {
    campgroundName: "Bowron Lake Campground",
    items: [{ featureName: "All sites", featureId: "129_43" }],
    orcs: 129,
  },
  {
    campgroundName: "Boya Lake Campground",
    items: [{ featureName: "All sites", featureId: "178_46" }],
    orcs: 178,
  },
  {
    campgroundName: "Bridge Lake Campground",
    items: [{ featureName: "All sites", featureId: "57_47" }],
    orcs: 57,
  },
  {
    campgroundName: "Bridge Lake walk-in sites",
    items: [{ featureName: "All sites", featureId: "57_470" }],
    orcs: 57,
  },
  {
    campgroundName: "Bromley Rock Campground sites 1-17",
    items: [{ featureName: "All sites", featureId: "58_538" }],
    orcs: 58,
  },
  {
    campgroundName: "Buckhorn Campground",
    items: [{ featureName: "All sites", featureId: "33_793" }],
    orcs: 33,
  },
  {
    campgroundName: "Buckinghorse River Campground",
    items: [{ featureName: "All sites", featureId: "214_49" }],
    orcs: 214,
  },
  {
    campgroundName: "Bull Canyon Campground",
    items: [{ featureName: "All sites", featureId: "398_50" }],
    orcs: 398,
  },
  {
    campgroundName: "Bush Creek Site",
    items: [{ featureName: "All sites", featureId: "361_51" }],
    orcs: 361,
  },
  {
    campgroundName: "Buttle Lake Campground",
    items: [{ featureName: "All sites", featureId: "1_52" }],
    orcs: 1,
  },
  {
    campgroundName: "Buttle Lake and Upper Campbell marine sites",
    items: [{ featureName: "All sites", featureId: "1_498" }],
    orcs: 1,
  },
  {
    campgroundName: "Cambie Creek (groupsite 3)",
    items: [{ featureName: "All sites", featureId: "33_57" }],
    orcs: 33,
  },
  {
    campgroundName: "Cape Scott backcountry",
    items: [{ featureName: "All sites", featureId: "250_62" }],
    orcs: 250,
  },
  {
    campgroundName: "Carmanah Walbran backcountry",
    items: [{ featureName: "All sites", featureId: "383_63" }],
    orcs: 383,
  },
  {
    campgroundName: "Carp Lake (Kettle Bay) Campground",
    items: [{ featureName: "All sites", featureId: "251_64" }],
    orcs: 251,
  },
  {
    campgroundName: "Cave Creek backcountry",
    items: [{ featureName: "All sites", featureId: "287_67" }],
    orcs: 287,
  },
  {
    campgroundName: "Cedar Point Campground",
    items: [{ featureName: "All sites", featureId: "135_68" }],
    orcs: 135,
  },
  {
    campgroundName: "Champion Lakes Campground",
    items: [{ featureName: "All sites", featureId: "51_69" }],
    orcs: 51,
  },
  {
    campgroundName: "Charlie Lake Campground",
    items: [{ featureName: "All sites", featureId: "161_70" }],
    orcs: 161,
  },
  {
    campgroundName: "Cheakamus Lake Campground",
    items: [{ featureName: "All sites", featureId: "7_71" }],
    orcs: 7,
  },
  {
    campgroundName: "Chilliwack Lake backcountry",
    items: [{ featureName: "All sites", featureId: "258_72" }],
    orcs: 258,
  },
  {
    campgroundName: "China Beach Campground",
    items: [{ featureName: "All sites", featureId: "9398_73" }],
    orcs: 9398,
  },
  {
    campgroundName: "Cinnemousun Narrows marine-accessible camping",
    items: [{ featureName: "All sites", featureId: "85_74" }],
    orcs: 85,
  },
  {
    campgroundName: "Cinnemousun Narrows shelters",
    items: [{ featureName: "All sites", featureId: "85_387" }],
    orcs: 85,
  },
  {
    campgroundName: "Clear Creek Campground",
    items: [{ featureName: "All sites", featureId: "41_75" }],
    orcs: 41,
  },
  {
    campgroundName: "Clearwater Lake Campground",
    items: [{ featureName: "All sites", featureId: "24_77" }],
    orcs: 24,
  },
  {
    campgroundName: "Clearwater Lake backcountry",
    items: [{ featureName: "All sites", featureId: "24_76" }],
    orcs: 24,
  },
  {
    campgroundName: "Coldspring Campground",
    items: [{ featureName: "All sites", featureId: "33_78" }],
    orcs: 33,
  },
  {
    campgroundName: "Conkle Lake Campground",
    items: [{ featureName: "All sites", featureId: "244_79" }],
    orcs: 244,
  },
  {
    campgroundName: "Conkle Lake groupsites",
    items: [{ featureName: "All sites", featureId: "244_80" }],
    orcs: 244,
  },
  {
    campgroundName: "Conrad Kain Hut",
    items: [{ featureName: "All sites", featureId: "206_82" }],
    orcs: 206,
  },
  {
    campgroundName: "Crooked River Campground",
    items: [{ featureName: "All sites", featureId: "177_83" }],
    orcs: 177,
  },
  {
    campgroundName: "Croteau Lake backcountry groupsite",
    items: [{ featureName: "All sites", featureId: "1_84" }],
    orcs: 1,
  },
  {
    campgroundName: "Dark Creek Campground",
    items: [{ featureName: "All sites", featureId: "9508_752" }],
    orcs: 9508,
  },
  {
    campgroundName: "Davis Creek Campground",
    items: [{ featureName: "All sites", featureId: "357_86" }],
    orcs: 357,
  },
  {
    campgroundName: "Delta Grove Campground",
    items: [{ featureName: "All sites", featureId: "41_95" }],
    orcs: 41,
  },
  {
    campgroundName: "Denetiah Lake Cabin",
    items: [{ featureName: "All sites", featureId: "8297_96" }],
    orcs: 8297,
  },
  {
    campgroundName: "Dionisio Point backcountry",
    items: [{ featureName: "All sites", featureId: "384_97" }],
    orcs: 384,
  },
  {
    campgroundName: "Discovery Island backcountry",
    items: [{ featureName: "All sites", featureId: "237_98" }],
    orcs: 237,
  },
  {
    campgroundName: "Downing Campground",
    items: [{ featureName: "All sites", featureId: "217_99" }],
    orcs: 217,
  },
  {
    campgroundName: "Driftwood Bay groupsite",
    items: [{ featureName: "All sites", featureId: "1_100" }],
    orcs: 1,
  },
  {
    campgroundName: "Dry Gulch Campground",
    items: [{ featureName: "All sites", featureId: "61_104" }],
    orcs: 61,
  },
  {
    campgroundName: "Duu Guusd Campsite",
    items: [{ featureName: "All sites", featureId: "559_465" }],
    orcs: 559,
  },
  {
    campgroundName: "East Curme Island",
    items: [{ featureName: "All sites", featureId: "252_106" }],
    orcs: 252,
  },
  {
    campgroundName: "Elfin Lakes Campground",
    items: [{ featureName: "All sites", featureId: "7_107" }],
    orcs: 7,
  },
  {
    campgroundName: "Elfin Lakes Shelter",
    items: [{ featureName: "All sites", featureId: "7_108" }],
    orcs: 7,
  },
  {
    campgroundName: "Elk Lakes Cabin",
    items: [{ featureName: "All sites", featureId: "253_110" }],
    orcs: 253,
  },
  {
    campgroundName: "Elk Lakes backcountry",
    items: [{ featureName: "All sites", featureId: "253_109" }],
    orcs: 253,
  },
  {
    campgroundName: "Elk River",
    items: [{ featureName: "All sites", featureId: "1_502" }],
    orcs: 1,
  },
  {
    campgroundName: "Ellison Campground",
    items: [{ featureName: "All sites", featureId: "139_917" }],
    orcs: 139,
  },
  {
    campgroundName: "Emerald Bay Campground",
    items: [{ featureName: "All sites", featureId: "273_910" }],
    orcs: 273,
  },
  {
    campgroundName: "Emory Creek Campground",
    items: [{ featureName: "All sites", featureId: "81_116" }],
    orcs: 81,
  },
  {
    campgroundName: "Englishman River Falls Campground",
    items: [{ featureName: "All sites", featureId: "29_117" }],
    orcs: 29,
  },
  {
    campgroundName: "Entrance Bay Campground",
    items: [{ featureName: "All sites", featureId: "41_118" }],
    orcs: 41,
  },
  {
    campgroundName: "Falls Creek Campground",
    items: [{ featureName: "All sites", featureId: "24_119" }],
    orcs: 24,
  },
  {
    campgroundName: "Feather Cove",
    items: [{ featureName: "All sites", featureId: "6268_120" }],
    orcs: 6268,
  },
  {
    campgroundName: "Fillongley Campground sites 1-10",
    items: [{ featureName: "All sites", featureId: "48_121" }],
    orcs: 48,
  },
  {
    campgroundName: "Fintry Campground sites 1-160",
    items: [{ featureName: "All sites", featureId: "9213_921" }],
    orcs: 9213,
  },
  {
    campgroundName: "Fintry groupsites",
    items: [{ featureName: "All sites", featureId: "9213_123" }],
    orcs: 9213,
  },
  {
    campgroundName: "Fish Lake Cabin",
    items: [{ featureName: "All sites", featureId: "247_125" }],
    orcs: 247,
  },
  {
    campgroundName: "Fisheries Pool Campground",
    items: [{ featureName: "All sites", featureId: "19_126" }],
    orcs: 19,
  },
  {
    campgroundName: "Flora Loop",
    items: [{ featureName: "All sites", featureId: "258_127" }],
    orcs: 258,
  },
  {
    campgroundName: "Flores Island backcountry",
    items: [{ featureName: "All sites", featureId: "9497_128" }],
    orcs: 9497,
  },
  {
    campgroundName: "French Beach Campground",
    items: [{ featureName: "All sites", featureId: "262_129" }],
    orcs: 262,
  },
  {
    campgroundName: "French Beach groupsite",
    items: [{ featureName: "All sites", featureId: "262_130" }],
    orcs: 262,
  },
  {
    campgroundName: "Friends Campground",
    items: [{ featureName: "All sites", featureId: "52_131" }],
    orcs: 52,
  },
  {
    campgroundName: "Frosty Creek Campground",
    items: [{ featureName: "All sites", featureId: "33_795" }],
    orcs: 33,
  },
  {
    campgroundName: "Garibaldi Lake Campground",
    items: [{ featureName: "All sites", featureId: "7_134" }],
    orcs: 7,
  },
  {
    campgroundName: "Gibson marine backcountry",
    items: [{ featureName: "All sites", featureId: "196_135" }],
    orcs: 196,
  },
  {
    campgroundName: "Gold Creek Campground",
    items: [{ featureName: "All sites", featureId: "8_138" }],
    orcs: 8,
  },
  {
    campgroundName: "Golden Ears backcountry",
    items: [{ featureName: "All sites", featureId: "8_139" }],
    orcs: 8,
  },
  {
    campgroundName: "Golden Ears groupsite",
    items: [{ featureName: "All sites", featureId: "8_140" }],
    orcs: 8,
  },
  {
    campgroundName: "Golden Ears marine backcountry",
    items: [{ featureName: "All sites", featureId: "8_141" }],
    orcs: 8,
  },
  {
    campgroundName: "Goldminer Groupsite",
    items: [{ featureName: "All sites", featureId: "96_611" }],
    orcs: 96,
  },
  {
    campgroundName: "Goldpan Campground",
    items: [{ featureName: "All sites", featureId: "63_142" }],
    orcs: 63,
  },
  {
    campgroundName: "Goldstream Campground",
    items: [{ featureName: "All sites", featureId: "96_143" }],
    orcs: 96,
  },
  {
    campgroundName: "Gordon Bay Campground",
    items: [{ featureName: "All sites", featureId: "210_145" }],
    orcs: 210,
  },
  {
    campgroundName: "Gordon Bay groupsite",
    items: [{ featureName: "All sites", featureId: "210_146" }],
    orcs: 210,
  },
  {
    campgroundName: "Grace Harbour",
    items: [{ featureName: "All sites", featureId: "252_147" }],
    orcs: 252,
  },
  {
    campgroundName: "Granite Falls Campground",
    items: [{ featureName: "All sites", featureId: "9509_750" }],
    orcs: 9509,
  },
  {
    campgroundName: "Greendrop Loop",
    items: [{ featureName: "All sites", featureId: "258_150" }],
    orcs: 258,
  },
  {
    campgroundName: "Grizzly Den Cabin",
    items: [{ featureName: "All sites", featureId: "9815_151" }],
    orcs: 9815,
  },
  {
    campgroundName: "Groupsite G1",
    items: [{ featureName: "All sites", featureId: "52_180" }],
    orcs: 52,
  },
  {
    campgroundName: "Gwe Da Ts'ih Campground",
    items: [{ featureName: "All sites", featureId: "409_185" }],
    orcs: 409,
  },
  {
    campgroundName: "Gwillim Lake Campground",
    items: [{ featureName: "All sites", featureId: "222_187" }],
    orcs: 222,
  },
  {
    campgroundName: "Halkett Bay marine backcountry",
    items: [{ featureName: "All sites", featureId: "365_189" }],
    orcs: 365,
  },
  {
    campgroundName: "Hampton Campground",
    items: [{ featureName: "All sites", featureId: "33_190" }],
    orcs: 33,
  },
  {
    campgroundName: "Hare Point",
    items: [{ featureName: "All sites", featureId: "252_191" }],
    orcs: 252,
  },
  {
    campgroundName: "Helm Creek Campground",
    items: [{ featureName: "All sites", featureId: "7_192" }],
    orcs: 7,
  },
  {
    campgroundName: "Hicks Lake Campground",
    items: [{ featureName: "All sites", featureId: "200_196" }],
    orcs: 200,
  },
  {
    campgroundName: "Hicks Lake groupsite",
    items: [{ featureName: "All sites", featureId: "200_197" }],
    orcs: 200,
  },
  {
    campgroundName: "Home Basin Campground",
    items: [{ featureName: "All sites", featureId: "287_198" }],
    orcs: 287,
  },
  {
    campgroundName: "Homestead Campground",
    items: [{ featureName: "All sites", featureId: "276_199" }],
    orcs: 276,
  },
  {
    campgroundName: "Hook (Deep) Bay",
    items: [{ featureName: "All sites", featureId: "400_831" }],
    orcs: 400,
  },
  {
    campgroundName: "Horsefly Lake Campground",
    items: [{ featureName: "All sites", featureId: "268_202" }],
    orcs: 268,
  },
  {
    campgroundName: "Horsefly Lake walk-in sites",
    items: [{ featureName: "All sites", featureId: "268_472" }],
    orcs: 268,
  },
  {
    campgroundName: "Horseshoe Bend groupsite",
    items: [{ featureName: "All sites", featureId: "6161_203" }],
    orcs: 6161,
  },
  {
    campgroundName: "Horseshoe Lake Campground",
    items: [{ featureName: "All sites", featureId: "6892_204" }],
    orcs: 6892,
  },
  {
    campgroundName: "Inkaneep Campground",
    items: [{ featureName: "All sites", featureId: "64_205" }],
    orcs: 64,
  },
  {
    campgroundName: "Inland Lake Campground",
    items: [{ featureName: "All sites", featureId: "6197_207" }],
    orcs: 6197,
  },
  {
    campgroundName: "Inland Lake backcountry",
    items: [{ featureName: "All sites", featureId: "6197_206" }],
    orcs: 6197,
  },
  {
    campgroundName: "Inlet Creek Campground",
    items: [{ featureName: "All sites", featureId: "287_208" }],
    orcs: 287,
  },
  {
    campgroundName: "Jedediah Island marine backcountry",
    items: [{ featureName: "All sites", featureId: "9512_211" }],
    orcs: 9512,
  },
  {
    campgroundName: "Jewel Lake Campground",
    items: [{ featureName: "All sites", featureId: "319_212" }],
    orcs: 319,
  },
  {
    campgroundName: "Jimsmith Lake Campground",
    items: [{ featureName: "All sites", featureId: "65_213" }],
    orcs: 65,
  },
  {
    campgroundName: "Joffre Lakes Backcountry Campground",
    items: [{ featureName: "All sites", featureId: "363_215" }],
    orcs: 363,
  },
  {
    campgroundName: "Johnstone Creek Campground",
    items: [{ featureName: "All sites", featureId: "66_216" }],
    orcs: 66,
  },
  {
    campgroundName: "Juan de Fuca Marine Trail backcountry",
    items: [{ featureName: "All sites", featureId: "9398_217" }],
    orcs: 9398,
  },
  {
    campgroundName: "Juniper Beach Campground",
    items: [{ featureName: "All sites", featureId: "369_911" }],
    orcs: 369,
  },
  {
    campgroundName: "Kalispell Trail Campground",
    items: [{ featureName: "All sites", featureId: "235_222" }],
    orcs: 235,
  },
  {
    campgroundName: "Karst Creek groupsite",
    items: [{ featureName: "All sites", featureId: "1_223" }],
    orcs: 1,
  },
  {
    campgroundName: "Kekuli Bay Campground sites 1-73",
    items: [{ featureName: "All sites", featureId: "378_530" }],
    orcs: 378,
  },
  {
    campgroundName: "Kekuli Bay walk-in sites 74-77",
    items: [{ featureName: "All sites", featureId: "378_467" }],
    orcs: 378,
  },
  {
    campgroundName: "Kentucky-Alleyne Campground",
    items: [{ featureName: "All sites", featureId: "306_224" }],
    orcs: 306,
  },
  {
    campgroundName: "Kentucky-Alleyne groupsite",
    items: [{ featureName: "All sites", featureId: "306_225" }],
    orcs: 306,
  },
  {
    campgroundName: "Kettle River groupsite",
    items: [{ featureName: "All sites", featureId: "236_227" }],
    orcs: 236,
  },
  {
    campgroundName: "Kicking Horse Campground",
    items: [{ featureName: "All sites", featureId: "33_794" }],
    orcs: 33,
  },
  {
    campgroundName: "Kikomun groupsites",
    items: [{ featureName: "All sites", featureId: "235_229" }],
    orcs: 235,
  },
  {
    campgroundName: "Kilby Campground",
    items: [{ featureName: "All sites", featureId: "245_230" }],
    orcs: 245,
  },
  {
    campgroundName: "Kinaskan Lake Campground",
    items: [{ featureName: "All sites", featureId: "356_231" }],
    orcs: 356,
  },
  {
    campgroundName: "Kiskatinaw Campground",
    items: [{ featureName: "All sites", featureId: "140_232" }],
    orcs: 140,
  },
  {
    campgroundName: "Kitty Coleman Beach Campground",
    items: [{ featureName: "All sites", featureId: "36_233" }],
    orcs: 36,
  },
  {
    campgroundName: "Kitty Coleman Beach groupsite",
    items: [{ featureName: "All sites", featureId: "36_234" }],
    orcs: 36,
  },
  {
    campgroundName: "Kleanza Creek Campground",
    items: [{ featureName: "All sites", featureId: "67_235" }],
    orcs: 67,
  },
  {
    campgroundName: "Kokanee Glacier Cabin",
    items: [{ featureName: "All sites", featureId: "4_237" }],
    orcs: 4,
  },
  {
    campgroundName: "Kokanee Glacier backcountry",
    items: [{ featureName: "All sites", featureId: "4_236" }],
    orcs: 4,
  },
  {
    campgroundName: "Kootenay Lake groupsite",
    items: [{ featureName: "All sites", featureId: "357_166" }],
    orcs: 357,
  },
  {
    campgroundName: "Lac La Hache Campground",
    items: [{ featureName: "All sites", featureId: "68_238" }],
    orcs: 68,
  },
  {
    campgroundName: "Lac Le Jeune Campground",
    items: [{ featureName: "All sites", featureId: "69_239" }],
    orcs: 69,
  },
  {
    campgroundName: "Lakelse Lake groupsite",
    items: [{ featureName: "All sites", featureId: "70_167" }],
    orcs: 70,
  },
  {
    campgroundName: "Lakeside (Deer Lake) Campground",
    items: [{ featureName: "All sites", featureId: "200_240" }],
    orcs: 200,
  },
  {
    campgroundName: "Lakeside Campground",
    items: [{ featureName: "All sites", featureId: "136_241" }],
    orcs: 136,
  },
  {
    campgroundName: "Leighton Campground",
    items: [{ featureName: "All sites", featureId: "6878_242" }],
    orcs: 6878,
  },
  {
    campgroundName: "Leighton North Campground",
    items: [{ featureName: "All sites", featureId: "6878_244" }],
    orcs: 6878,
  },
  {
    campgroundName: "Liard River Hot Springs Campground",
    items: [{ featureName: "All sites", featureId: "92_245" }],
    orcs: 92,
  },
  {
    campgroundName: "Lindeman Loop",
    items: [{ featureName: "All sites", featureId: "258_250" }],
    orcs: 258,
  },
  {
    campgroundName: "Lockhart Beach Campground",
    items: [{ featureName: "All sites", featureId: "12_251" }],
    orcs: 12,
  },
  {
    campgroundName: "Lost Ledge Campground",
    items: [{ featureName: "All sites", featureId: "357_256" }],
    orcs: 357,
  },
  {
    campgroundName: "Loveland Bay Campground",
    items: [{ featureName: "All sites", featureId: "189_257" }],
    orcs: 189,
  },
  {
    campgroundName: "Loveland Bay groupsites",
    items: [{ featureName: "All sites", featureId: "189_181" }],
    orcs: 189,
  },
  {
    campgroundName: "Lucerne Campground",
    items: [{ featureName: "All sites", featureId: "2_260" }],
    orcs: 2,
  },
  {
    campgroundName: "Mabel Lake groupsite",
    items: [{ featureName: "All sites", featureId: "241_168" }],
    orcs: 241,
  },
  {
    campgroundName: "MacDonald Campground",
    items: [{ featureName: "All sites", featureId: "93_261" }],
    orcs: 93,
  },
  {
    campgroundName: "Magog Lake",
    items: [{ featureName: "All sites", featureId: "5_263" }],
    orcs: 5,
  },
  {
    campgroundName: "Mahood Lake Campground",
    items: [{ featureName: "All sites", featureId: "24_265" }],
    orcs: 24,
  },
  {
    campgroundName: "Mahood Lake backcountry",
    items: [{ featureName: "All sites", featureId: "24_264" }],
    orcs: 24,
  },
  {
    campgroundName: "Mahood Lake groupsites",
    items: [{ featureName: "All sites", featureId: "24_266" }],
    orcs: 24,
  },
  {
    campgroundName: "Main Campground sites 1-61",
    items: [{ featureName: "All sites", featureId: "202_267" }],
    orcs: 202,
  },
  {
    campgroundName: "Main Lake backcountry",
    items: [{ featureName: "All sites", featureId: "6093_268" }],
    orcs: 6093,
  },
  {
    campgroundName: "Maple Bay Campground Cabins",
    items: [{ featureName: "All sites", featureId: "41_271" }],
    orcs: 41,
  },
  {
    campgroundName: "Marble Canyon Campground",
    items: [{ featureName: "All sites", featureId: "183_274" }],
    orcs: 183,
  },
  {
    campgroundName: "Martha Creek Campground",
    items: [{ featureName: "All sites", featureId: "404_913" }],
    orcs: 404,
  },
  {
    campgroundName: "McDonald Creek Campground",
    items: [{ featureName: "All sites", featureId: "324_363" }],
    orcs: 324,
  },
  {
    campgroundName: "Mermaid Cove Campground",
    items: [{ featureName: "All sites", featureId: "145_277" }],
    orcs: 145,
  },
  {
    campgroundName: "Meziadin Lake Campground",
    items: [{ featureName: "All sites", featureId: "358_278" }],
    orcs: 358,
  },
  {
    campgroundName: "Middle Copeland Island",
    items: [{ featureName: "All sites", featureId: "228_279" }],
    orcs: 228,
  },
  {
    campgroundName: "Midge Creek backcountry",
    items: [{ featureName: "All sites", featureId: "357_280" }],
    orcs: 357,
  },
  {
    campgroundName: "Miracle Beach groupsite",
    items: [{ featureName: "All sites", featureId: "45_169" }],
    orcs: 45,
  },
  {
    campgroundName: "Misty Meadows Campground",
    items: [{ featureName: "All sites", featureId: "255_286" }],
    orcs: 255,
  },
  {
    campgroundName: "Misty Meadows Groupsite",
    items: [{ featureName: "All sites", featureId: "255_648" }],
    orcs: 255,
  },
  {
    campgroundName: "Moberly Lake Campground",
    items: [{ featureName: "All sites", featureId: "181_287" }],
    orcs: 181,
  },
  {
    campgroundName: "Momich River Campground",
    items: [{ featureName: "All sites", featureId: "9693_288" }],
    orcs: 9693,
  },
  {
    campgroundName: "Monashee Loop sites 1-36",
    items: [{ featureName: "All sites", featureId: "241_290" }],
    orcs: 241,
  },
  {
    campgroundName: "Monashee backcountry",
    items: [{ featureName: "All sites", featureId: "143_289" }],
    orcs: 143,
  },
  {
    campgroundName: "Monck Campground",
    items: [{ featureName: "All sites", featureId: "46_291" }],
    orcs: 46,
  },
  {
    campgroundName: "Monkman Campground",
    items: [{ featureName: "All sites", featureId: "315_292" }],
    orcs: 315,
  },
  {
    campgroundName: "Montague Harbour Campground",
    items: [{ featureName: "All sites", featureId: "104_293" }],
    orcs: 104,
  },
  {
    campgroundName: "Montague Harbour groupsite",
    items: [{ featureName: "All sites", featureId: "104_170" }],
    orcs: 104,
  },
  {
    campgroundName: "Morton Lake Campground",
    items: [{ featureName: "All sites", featureId: "190_294" }],
    orcs: 190,
  },
  {
    campgroundName: "Mount Fernie Campground",
    items: [{ featureName: "All sites", featureId: "105_295" }],
    orcs: 105,
  },
  {
    campgroundName: "Mount Seymour backcountry",
    items: [{ featureName: "All sites", featureId: "15_577" }],
    orcs: 15,
  },
  {
    campgroundName: "Mount Seymour groupsite",
    items: [{ featureName: "All sites", featureId: "15_171" }],
    orcs: 15,
  },
  {
    campgroundName: "Moyie Lake Campground",
    items: [{ featureName: "All sites", featureId: "108_296" }],
    orcs: 108,
  },
  {
    campgroundName: "Mule Deer Campground",
    items: [{ featureName: "All sites", featureId: "33_297" }],
    orcs: 33,
  },
  {
    campgroundName: "Murtle Lake backcountry",
    items: [{ featureName: "All sites", featureId: "24_298" }],
    orcs: 24,
  },
  {
    campgroundName: "M\u146buq\u1d42in wilderness camping",
    items: [{ featureName: "All sites", featureId: "339_540" }],
    orcs: 339,
  },
  {
    campgroundName: "Nairn Campground",
    items: [{ featureName: "All sites", featureId: "179_299" }],
    orcs: 179,
  },
  {
    campgroundName: "Naiset Huts",
    items: [{ featureName: "All sites", featureId: "5_300" }],
    orcs: 5,
  },
  {
    campgroundName: "Nancy Greene Campground",
    items: [{ featureName: "All sites", featureId: "232_301" }],
    orcs: 232,
  },
  {
    campgroundName: "Newcastle Island Campground",
    items: [{ featureName: "All sites", featureId: "133_302" }],
    orcs: 133,
  },
  {
    campgroundName: "Niskonlith Lake Campground",
    items: [{ featureName: "All sites", featureId: "275_303" }],
    orcs: 275,
  },
  {
    campgroundName: "Norbury Lake Campground",
    items: [{ featureName: "All sites", featureId: "98_304" }],
    orcs: 98,
  },
  {
    campgroundName: "North Beach Campground",
    items: [{ featureName: "All sites", featureId: "8_305" }],
    orcs: 8,
  },
  {
    campgroundName: "North Copeland Island",
    items: [{ featureName: "All sites", featureId: "228_308" }],
    orcs: 228,
  },
  {
    campgroundName: "North Thompson River Campground",
    items: [{ featureName: "All sites", featureId: "195_309" }],
    orcs: 195,
  },
  {
    campgroundName: "North Twin Island Campground",
    items: [{ featureName: "All sites", featureId: "9509_749" }],
    orcs: 9509,
  },
  {
    campgroundName: "Nu Chugh Beniz Campground",
    items: [{ featureName: "All sites", featureId: "409_310" }],
    orcs: 409,
  },
  {
    campgroundName: "Og Lake",
    items: [{ featureName: "All sites", featureId: "5_313" }],
    orcs: 5,
  },
  {
    campgroundName: "Okanagan Lake South Campground walk-in sites 89-96",
    items: [{ featureName: "All sites", featureId: "54_424" }],
    orcs: 54,
  },
  {
    campgroundName: "Okanagan wilderness and boat-access camping",
    items: [{ featureName: "All sites", featureId: "259_493" }],
    orcs: 259,
  },
  {
    campgroundName: "Okeover Arm",
    items: [{ featureName: "All sites", featureId: "294_314" }],
    orcs: 294,
  },
  {
    campgroundName: "Olympic Legacy Cabins",
    items: [{ featureName: "All sites", featureId: "314_315" }],
    orcs: 314,
  },
  {
    campgroundName: "Osprey Point Campground",
    items: [{ featureName: "All sites", featureId: "52_317" }],
    orcs: 52,
  },
  {
    campgroundName: "Osprey Point Campground G2",
    items: [{ featureName: "All sites", featureId: "52_316" }],
    orcs: 52,
  },
  {
    campgroundName: "Other E.C. Manning backcountry",
    items: [{ featureName: "All sites", featureId: "33_105" }],
    orcs: 33,
  },
  {
    campgroundName:
      "Other Mount Robson backcountry (Mount Fitzwilliam and Moose River Trail)",
    items: [{ featureName: "All sites", featureId: "2_318" }],
    orcs: 2,
  },
  {
    campgroundName: "Otter Lake Campground sites 1-45",
    items: [{ featureName: "All sites", featureId: "146_534" }],
    orcs: 146,
  },
  {
    campgroundName: "O\u2019Brien Meadows",
    items: [{ featureName: "All sites", featureId: "5_311" }],
    orcs: 5,
  },
  {
    campgroundName: "O\u2019Brien Meadows Horse Campground",
    items: [{ featureName: "All sites", featureId: "5_312" }],
    orcs: 5,
  },
  {
    campgroundName: "Paarens Beach Campground",
    items: [{ featureName: "All sites", featureId: "234_323" }],
    orcs: 234,
  },
  {
    campgroundName: "Packrat Point Campground",
    items: [{ featureName: "All sites", featureId: "287_324" }],
    orcs: 287,
  },
  {
    campgroundName: "Paleface Loop",
    items: [{ featureName: "All sites", featureId: "258_325" }],
    orcs: 258,
  },
  {
    campgroundName: "Paradise Meadows area",
    items: [{ featureName: "All sites", featureId: "1_503" }],
    orcs: 1,
  },
  {
    campgroundName: "Paul Lake Campground",
    items: [{ featureName: "All sites", featureId: "127_326" }],
    orcs: 127,
  },
  {
    campgroundName: "Paul Lake groupsite",
    items: [{ featureName: "All sites", featureId: "127_327" }],
    orcs: 127,
  },
  {
    campgroundName: "Pendleton Bay",
    items: [{ featureName: "All sites", featureId: "400_830" }],
    orcs: 400,
  },
  {
    campgroundName: "Pierre Creek",
    items: [{ featureName: "All sites", featureId: "400_833" }],
    orcs: 400,
  },
  {
    campgroundName: "Pilot Bay backcountry",
    items: [{ featureName: "All sites", featureId: "163_334" }],
    orcs: 163,
  },
  {
    campgroundName: "Pinkut Creek",
    items: [{ featureName: "All sites", featureId: "400_832" }],
    orcs: 400,
  },
  {
    campgroundName: "Pirates Cove backcountry",
    items: [{ featureName: "All sites", featureId: "198_335" }],
    orcs: 198,
  },
  {
    campgroundName: "Plumper Cove marine-accessible camping",
    items: [{ featureName: "All sites", featureId: "116_473" }],
    orcs: 116,
  },
  {
    campgroundName: "Police Meadows Cabin",
    items: [{ featureName: "All sites", featureId: "5_339" }],
    orcs: 5,
  },
  {
    campgroundName: "Ponderosa Campground",
    items: [{ featureName: "All sites", featureId: "235_340" }],
    orcs: 235,
  },
  {
    campgroundName: "Ponderosa Campground Cabins",
    items: [{ featureName: "All sites", featureId: "235_341" }],
    orcs: 235,
  },
  {
    campgroundName: "Porcupine Campground",
    items: [{ featureName: "All sites", featureId: "5_792" }],
    orcs: 5,
  },
  {
    campgroundName: "Porpoise Bay cyclist-only walk-in sites",
    items: [{ featureName: "All sites", featureId: "221_85" }],
    orcs: 221,
  },
  {
    campgroundName: "Porpoise Bay groupsite",
    items: [{ featureName: "All sites", featureId: "221_173" }],
    orcs: 221,
  },
  {
    campgroundName: "Porteau Cove Campground vehicle accessible sites",
    items: [{ featureName: "All sites", featureId: "314_914" }],
    orcs: 314,
  },
  {
    campgroundName: "Porteau Cove walk-in sites",
    items: [{ featureName: "All sites", featureId: "314_476" }],
    orcs: 314,
  },
  {
    campgroundName: "Premier Lake Campground",
    items: [{ featureName: "All sites", featureId: "25_344" }],
    orcs: 25,
  },
  {
    campgroundName: "Prospector Groupsite ",
    items: [{ featureName: "All sites", featureId: "96_610" }],
    orcs: 96,
  },
  {
    campgroundName: "Prudhomme Lake Campground",
    items: [{ featureName: "All sites", featureId: "162_346" }],
    orcs: 162,
  },
  {
    campgroundName: "Purden Lake Campground",
    items: [{ featureName: "All sites", featureId: "229_347" }],
    orcs: 229,
  },
  {
    campgroundName: "Pyramid Campground",
    items: [{ featureName: "All sites", featureId: "24_348" }],
    orcs: 24,
  },
  {
    campgroundName: "R.C. Hind Hut",
    items: [{ featureName: "All sites", featureId: "5_352" }],
    orcs: 5,
  },
  {
    campgroundName: "Radium Loop",
    items: [{ featureName: "All sites", featureId: "258_353" }],
    orcs: 258,
  },
  {
    campgroundName: "Raft Cove backcountry",
    items: [{ featureName: "All sites", featureId: "377_354" }],
    orcs: 377,
  },
  {
    campgroundName: "Ralph River Campground",
    items: [{ featureName: "All sites", featureId: "1_355" }],
    orcs: 1,
  },
  {
    campgroundName: "Rampart Ponds Campground",
    items: [{ featureName: "All sites", featureId: "7_356" }],
    orcs: 7,
  },
  {
    campgroundName: "Rathtrevor Beach groupsites",
    items: [{ featureName: "All sites", featureId: "193_182" }],
    orcs: 193,
  },
  {
    campgroundName: "Rathtrevor Beach walk-in sites",
    items: [{ featureName: "All sites", featureId: "193_474" }],
    orcs: 193,
  },
  {
    campgroundName: "Raven Lake Cabin",
    items: [{ featureName: "All sites", featureId: "9815_357" }],
    orcs: 9815,
  },
  {
    campgroundName: "Red Bluff Campground",
    items: [{ featureName: "All sites", featureId: "288_358" }],
    orcs: 288,
  },
  {
    campgroundName: "Red Heather Campground",
    items: [{ featureName: "All sites", featureId: "7_360" }],
    orcs: 7,
  },
  {
    campgroundName: "Redfish Campground",
    items: [{ featureName: "All sites", featureId: "52_361" }],
    orcs: 52,
  },
  {
    campgroundName: "Reinecker Campground",
    items: [{ featureName: "All sites", featureId: "276_362" }],
    orcs: 276,
  },
  {
    campgroundName: "Roberts Creek Campground",
    items: [{ featureName: "All sites", featureId: "40_364" }],
    orcs: 40,
  },
  {
    campgroundName: "Robson Meadows Campground",
    items: [{ featureName: "All sites", featureId: "2_365" }],
    orcs: 2,
  },
  {
    campgroundName: "Robson Meadows groupsite",
    items: [{ featureName: "All sites", featureId: "2_366" }],
    orcs: 2,
  },
  {
    campgroundName: "Rolley Lake Campground",
    items: [{ featureName: "All sites", featureId: "122_371" }],
    orcs: 122,
  },
  {
    campgroundName: "Roscoe Bay",
    items: [{ featureName: "All sites", featureId: "373_372" }],
    orcs: 373,
  },
  {
    campgroundName: "Rosebery Campground",
    items: [{ featureName: "All sites", featureId: "110_373" }],
    orcs: 110,
  },
  {
    campgroundName: "Ross Lake Campground",
    items: [{ featureName: "All sites", featureId: "261_374" }],
    orcs: 261,
  },
  {
    campgroundName: "Ross Lake groupsite",
    items: [{ featureName: "All sites", featureId: "261_375" }],
    orcs: 261,
  },
  {
    campgroundName: "Ruckle Campground RV sites",
    items: [{ featureName: "All sites", featureId: "267_379" }],
    orcs: 267,
  },
  {
    campgroundName: "Ruckle Campground walk-in sites",
    items: [{ featureName: "All sites", featureId: "267_376" }],
    orcs: 267,
  },
  {
    campgroundName: "Ruckle groupsites",
    items: [{ featureName: "All sites", featureId: "267_183" }],
    orcs: 267,
  },
  {
    campgroundName: "Russet Lake Campground",
    items: [{ featureName: "All sites", featureId: "7_377" }],
    orcs: 7,
  },
  {
    campgroundName: "Sandpoint",
    items: [{ featureName: "All sites", featureId: "400_834" }],
    orcs: 400,
  },
  {
    campgroundName: "Sarah Point",
    items: [{ featureName: "All sites", featureId: "6268_383" }],
    orcs: 6268,
  },
  {
    campgroundName: "Schoen Lake Campground",
    items: [{ featureName: "All sites", featureId: "283_384" }],
    orcs: 283,
  },
  {
    campgroundName: "Seeley Lake Campground",
    items: [{ featureName: "All sites", featureId: "74_385" }],
    orcs: 74,
  },
  {
    campgroundName: "Shelter Bay Campground",
    items: [{ featureName: "All sites", featureId: "308_386" }],
    orcs: 308,
  },
  {
    campgroundName: "Shuswap Lake groupsite",
    items: [{ featureName: "All sites", featureId: "89_174" }],
    orcs: 89,
  },
  {
    campgroundName: "Silver Beach Campground",
    items: [{ featureName: "All sites", featureId: "212_389" }],
    orcs: 212,
  },
  {
    campgroundName: "Silver Lake Campground",
    items: [{ featureName: "All sites", featureId: "158_390" }],
    orcs: 158,
  },
  {
    campgroundName: "Silver Spray Cabin",
    items: [{ featureName: "All sites", featureId: "4_391" }],
    orcs: 4,
  },
  {
    campgroundName: "Singing Creek Campground",
    items: [{ featureName: "All sites", featureId: "7_392" }],
    orcs: 7,
  },
  {
    campgroundName: "Skagit Valley wilderness",
    items: [{ featureName: "All sites", featureId: "261_415" }],
    orcs: 261,
  },
  {
    campgroundName: "Skihist Campground",
    items: [{ featureName: "All sites", featureId: "75_416" }],
    orcs: 75,
  },
  {
    campgroundName: "Skyview RV Campground",
    items: [{ featureName: "All sites", featureId: "33_417" }],
    orcs: 33,
  },
  {
    campgroundName: "Smelt Bay Campground",
    items: [{ featureName: "All sites", featureId: "243_418" }],
    orcs: 243,
  },
  {
    campgroundName: "Smithers Landing",
    items: [{ featureName: "All sites", featureId: "400_829" }],
    orcs: 400,
  },
  {
    campgroundName: "Snowmobile Chalet",
    items: [{ featureName: "All sites", featureId: "27_419" }],
    orcs: 27,
  },
  {
    campgroundName: "South Curme Island",
    items: [{ featureName: "All sites", featureId: "252_425" }],
    orcs: 252,
  },
  {
    campgroundName: "Sowchea Bay Campground",
    items: [{ featureName: "All sites", featureId: "370_426" }],
    orcs: 370,
  },
  {
    campgroundName: "Spirea Island",
    items: [{ featureName: "All sites", featureId: "251_427" }],
    orcs: 251,
  },
  {
    campgroundName: "Stamp River Campground",
    items: [{ featureName: "All sites", featureId: "31_428" }],
    orcs: 31,
  },
  {
    campgroundName: "Stawamus Chief drive-in sites",
    items: [{ featureName: "All sites", featureId: "6328_102" }],
    orcs: 6328,
  },
  {
    campgroundName: "Stawamus Chief walk-in sites",
    items: [{ featureName: "All sites", featureId: "6328_475" }],
    orcs: 6328,
  },
  {
    campgroundName: "Steelhead Campground",
    items: [{ featureName: "All sites", featureId: "408_429" }],
    orcs: 408,
  },
  {
    campgroundName: "Stemwinder Campground",
    items: [{ featureName: "All sites", featureId: "76_916" }],
    orcs: 76,
  },
  {
    campgroundName: "Stoltz Pool Campground",
    items: [{ featureName: "All sites", featureId: "6161_430" }],
    orcs: 6161,
  },
  {
    campgroundName: "Stoltz Pool groupsite",
    items: [{ featureName: "All sites", featureId: "6161_431" }],
    orcs: 6161,
  },
  {
    campgroundName: "Strawberry Flats Campground",
    items: [{ featureName: "All sites", featureId: "93_433" }],
    orcs: 93,
  },
  {
    campgroundName: "Sturgeon Point groupsite",
    items: [{ featureName: "All sites", featureId: "202_436" }],
    orcs: 202,
  },
  {
    campgroundName: "Summit Lake Campground",
    items: [{ featureName: "All sites", featureId: "156_438" }],
    orcs: 156,
  },
  {
    campgroundName: "Summit Lake Campground",
    items: [{ featureName: "All sites", featureId: "94_437" }],
    orcs: 94,
  },
  {
    campgroundName: "Sunset View Campground sites 1-54",
    items: [{ featureName: "All sites", featureId: "273_439" }],
    orcs: 273,
  },
  {
    campgroundName: "Sunset View groupsite",
    items: [{ featureName: "All sites", featureId: "273_441" }],
    orcs: 273,
  },
  {
    campgroundName: "Sunset View walk-in sites",
    items: [{ featureName: "All sites", featureId: "273_442" }],
    orcs: 273,
  },
  {
    campgroundName: "Surprise Creek Cabin",
    items: [{ featureName: "All sites", featureId: "5_443" }],
    orcs: 5,
  },
  {
    campgroundName: "Surveyors Campground",
    items: [{ featureName: "All sites", featureId: "235_444" }],
    orcs: 235,
  },
  {
    campgroundName: "Swan Lake Campground",
    items: [{ featureName: "All sites", featureId: "16_445" }],
    orcs: 16,
  },
  {
    campgroundName: "Taylor Arm groupsites G1-G3",
    items: [{ featureName: "All sites", featureId: "296_184" }],
    orcs: 296,
  },
  {
    campgroundName: "Taylor Creek Loop sites 85-114",
    items: [{ featureName: "All sites", featureId: "241_448" }],
    orcs: 241,
  },
  {
    campgroundName: "Taylor Meadows Campground",
    items: [{ featureName: "All sites", featureId: "7_449" }],
    orcs: 7,
  },
  {
    campgroundName: "Tenedos Bay",
    items: [{ featureName: "All sites", featureId: "252_450" }],
    orcs: 252,
  },
  {
    campgroundName: "Top of the World backcountry",
    items: [{ featureName: "All sites", featureId: "247_452" }],
    orcs: 247,
  },
  {
    campgroundName: "Touring Campground",
    items: [{ featureName: "All sites", featureId: "136_453" }],
    orcs: 136,
  },
  {
    campgroundName: "Trinity Loop sites 37-84",
    items: [{ featureName: "All sites", featureId: "241_455" }],
    orcs: 241,
  },
  {
    campgroundName: "Trophy Mountain backcountry",
    items: [{ featureName: "All sites", featureId: "24_456" }],
    orcs: 24,
  },
  {
    campgroundName: "Ts'il?os backcountry",
    items: [{ featureName: "All sites", featureId: "409_457" }],
    orcs: 409,
  },
  {
    campgroundName: "Tudyah Lake Campground",
    items: [{ featureName: "All sites", featureId: "317_458" }],
    orcs: 317,
  },
  {
    campgroundName: "Tunkwa Campground",
    items: [{ featureName: "All sites", featureId: "6878_459" }],
    orcs: 6878,
  },
  {
    campgroundName: "Tweedsmuir backcountry",
    items: [{ featureName: "All sites", featureId: "19_460" }],
    orcs: 19,
  },
  {
    campgroundName: "Tyhee Lake Campground",
    items: [{ featureName: "All sites", featureId: "84_461" }],
    orcs: 84,
  },
  {
    campgroundName: "Tyhee Lake groupsite",
    items: [{ featureName: "All sites", featureId: "84_175" }],
    orcs: 84,
  },
  {
    campgroundName: "Vaseux Lake Campground",
    items: [{ featureName: "All sites", featureId: "77_464" }],
    orcs: 77,
  },
  {
    campgroundName: "Vetter Creek Campground",
    items: [{ featureName: "All sites", featureId: "386_466" }],
    orcs: 386,
  },
  {
    campgroundName: "Wallace Island backcountry",
    items: [{ featureName: "All sites", featureId: "382_477" }],
    orcs: 382,
  },
  {
    campgroundName: "War Lake Campground",
    items: [{ featureName: "All sites", featureId: "251_479" }],
    orcs: 251,
  },
  {
    campgroundName: "Wasa Lake Campground",
    items: [{ featureName: "All sites", featureId: "53_480" }],
    orcs: 53,
  },
  {
    campgroundName: "Wedgemount Lake Campground",
    items: [{ featureName: "All sites", featureId: "7_482" }],
    orcs: 7,
  },
  {
    campgroundName: "West Curme Island",
    items: [{ featureName: "All sites", featureId: "252_483" }],
    orcs: 252,
  },
  {
    campgroundName: "Whiskers Point Campground",
    items: [{ featureName: "All sites", featureId: "78_486" }],
    orcs: 78,
  },
  {
    campgroundName: "White Lake Campground",
    items: [{ featureName: "All sites", featureId: "167_487" }],
    orcs: 167,
  },
  {
    campgroundName: "White River Campground",
    items: [{ featureName: "All sites", featureId: "287_488" }],
    orcs: 287,
  },
  {
    campgroundName: "Whitworth Horse Camp",
    items: [{ featureName: "All sites", featureId: "261_491" }],
    orcs: 261,
  },
  {
    campgroundName: "Widgeon Creek Campground",
    items: [{ featureName: "All sites", featureId: "9508_751" }],
    orcs: 9508,
  },
  {
    campgroundName: "Wilderness Camping Area",
    items: [{ featureName: "All sites", featureId: "7_492" }],
    orcs: 7,
  },
  {
    campgroundName: "Woodbury Cabin",
    items: [{ featureName: "All sites", featureId: "4_494" }],
    orcs: 4,
  },
  {
    campgroundName: "Woodlands groupsite",
    items: [{ featureName: "All sites", featureId: "8_613" }],
    orcs: 8,
  },
  {
    campgroundName: "Yahk Campground",
    items: [{ featureName: "All sites", featureId: "79_495" }],
    orcs: 79,
  },
  {
    campgroundName: "sx\u030c\u02b7\u0259x\u030c\u02b7nitk\u02b7 Campground",
    items: [{ featureName: "All sites", featureId: "73_446" }],
    orcs: 73,
  },
];

async function createCampground(item) {
  const campground = await findOrCreateParkArea(item);

  const feature = await getItemByAttributes(Feature, {
    strapiFeatureId: item.items[0].featureId,
  });

  feature.parkAreaId = campground.id;
  feature.name = "All sites";
  await feature.save();
}

export async function createSingleItemsCampgrounds() {
  await Promise.all(campgrounds.map(createCampground));
}
