import { jsPDF as JsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import logo from "@/assets/bc-parks-logo-positive.png";

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function getLogoDataUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const image = await loadImage(logo);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    context.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function exportPdf(columns, data, reportTitle, exportFilename) {
  if (typeof window !== "undefined") {
    const today = moment(new Date()).format("YYYY-MM-DD");
    const logoDataUrl = await getLogoDataUrl();
    const unit = "pt";
    const size = "A2";
    const orientation = "landscape";
    const pdfDocument = new JsPDF(orientation, unit, size);

    const content = {
      columns: columns
        .filter((item) => item.export !== false && !item.hidden && item.field)
        .map((item) => ({
          header: item.title,
          dataKey: item.field,
        })),
      body: data,
      margin: { top: 100 },
      didDrawPage() {
        if (logoDataUrl) {
          pdfDocument.addImage(logoDataUrl, "PNG", 50, 30, 150, 50);
        }
        pdfDocument.setFontSize(40);
        pdfDocument.text(reportTitle, 220, 78);
        pdfDocument.setFontSize(12);
        pdfDocument.text(`Report generated on ${today}`, 1466, 92);
      },
    };

    pdfDocument.setFontSize(10);
    autoTable(pdfDocument, content);
    pdfDocument.save(exportFilename);
  }
}
