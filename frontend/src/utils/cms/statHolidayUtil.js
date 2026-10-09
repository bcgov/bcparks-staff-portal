import moment from "moment";
import { cmsAxios, axios } from "@/utils/cms/axiosConfig";
import getEnv from "@/config/getEnv";

export function calculateStatHoliday(statData) {
  for (const hol of statData.province.holidays) {
    if (moment(hol.date).isSame(Date.now(), "day")) {
      return true;
    }
  }
  return false;
}

function isLatestStatutoryHolidayList(statData) {
  for (const hol of statData.province.holidays) {
    if (!moment(hol.date).isSame(Date.now(), "year")) {
      return false;
    }
  }
  return true;
}

/**
 * Calculates whether the current day is a statutory holiday based on CMS data or an external API.
 * @param {Function} setIsStatHoliday  Callback to set the statutory holiday status
 * @param {Object} cmsData  Current CMS data
 * @param {Function} setCmsData  Callback to update the CMS data
 * @param {string} token  Authorization token for CMS API
 * @returns {Promise<void>}  Resolves when the statutory holiday status has been calculated and set
 */
export async function calculateIsStatHoliday(
  setIsStatHoliday,
  cmsData,
  setCmsData,
  token,
) {
  // Don't fetch from the API if CMS data already contains statutory holiday information
  if (cmsData.statutoryHolidays) {
    setIsStatHoliday(calculateStatHoliday(cmsData.statutoryHolidays));
    return;
  }

  try {
    const response = await cmsAxios.get(`statutory-holiday`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statData = response.data.data.data;

    if (
      !statData ||
      Object.keys(statData).length === 0 ||
      !isLatestStatutoryHolidayList(statData)
    ) {
      throw new Error("Obsolete Holiday List. Reloading...");
    }

    const data = cmsData;

    data.statutoryHolidays = statData;
    setCmsData(data);
    setIsStatHoliday(calculateStatHoliday(statData));
  } catch (cmsError) {
    console.error(cmsError);

    try {
      const response = await axios.get(getEnv("VITE_STAT_HOLIDAY_API"));
      const statData = response.data;
      const isStatHoliday = calculateStatHoliday(statData);
      const data = cmsData;

      data.statutoryHolidays = statData;
      setCmsData(data);
      setIsStatHoliday(isStatHoliday);

      cmsAxios
        .put(
          `statutory-holiday`,
          { id: 1, data: { ...statData } },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        .catch((error) => {
          console.error(
            "error occurred writing statutory holidays to cms",
            error,
          );
        });
    } catch (error) {
      setIsStatHoliday(false);
      console.error(
        "error occurred fetching statutory holidays from API",
        error,
      );
      throw error;
    }
  }
}
