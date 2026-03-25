import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import getEnv from "@/config/getEnv";

export function exportPdf(columns, data, reportTitle, exportFilename) {
  if (typeof window !== "undefined") {
    const today = moment(new Date()).format("YYYY-MM-DD");

    const content = {
      columns: columns
        .filter((item) => item.export !== false && !item.hidden && item.field)
        .map((item) => ({
          header: item.title,
          dataKey: item.field,
        })),
      body: data,
      margin: { top: 100 },
      didDrawPage(data) {
        doc.addImage(
          `${getEnv("VITE_FRONTEND_BASE_URL")}/images/logo-bcparks-positive.png`,
          "PNG",
          50,
          30,
          150,
          50,
        );
        doc.setFontSize(40);
        doc.text(reportTitle, 220, 78);
        doc.setFontSize(12);
        doc.text(`Report generated on ${today}`, 1466, 92);
      },
    };

    const unit = "pt";
    const size = "A2";
    const orientation = "landscape";

    const doc = new jsPDF(orientation, unit, size);

    doc.setFontSize(10);
    autoTable(doc, content);
    doc.save(exportFilename);
  }
}
