import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import act from "../ui-text/act";
import common from "../ui-text/common";
import doot from "../ui-text/doot";

// react-i18next plugin config

i18n
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    // English is the only locale in this version
    fallbackLng: "en",
    lng: "en",

    resources: {
      en: {
        act,
        common,
        doot,
      },
    },

    defaultNS: "common",

    interpolation: {
      escapeValue: false, // not needed for React as it escapes by default
    },
  });

export default i18n;
