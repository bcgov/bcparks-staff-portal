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

export function calculateIsStatHoliday(
  setIsStatHoliday,
  cmsData,
  setCmsData,
  token,
) {
  if (!cmsData.statutoryHolidays) {
    Promise.resolve(
      cmsAxios
        .get(`statutory-holiday`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const statData = res.data.data.data;

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
        })
        .catch((err) => {
          console.error(err);
          // Call Statutory Holiday API if CMS cache is not available
          axios
            .get(getEnv("VITE_STAT_HOLIDAY_API"))
            .then((res) => {
              setIsStatHoliday(calculateStatHoliday(res.data));
              const data = cmsData;

              data.statutoryHolidays = res.data;
              setCmsData(data);
              // Write Statutory Data to CMS cache
              cmsAxios
                .put(
                  `statutory-holiday`,
                  { id: 1, data: { ...res.data } },
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
            })
            .catch((error) => {
              setIsStatHoliday(false);
              console.error(
                "error occurred fetching statutory holidays from API",
                error,
              );
            });
        }),
    );
  } else {
    setIsStatHoliday(calculateStatHoliday(cmsData.statutoryHolidays));
  }
}
