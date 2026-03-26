import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from "ckeditor5";
import getEnv from "@/config/getEnv";

import "ckeditor5/ckeditor5.css";

export default function StaffPortalCKEditor() {
  return (
    <CKEditor
      editor={ClassicEditor}
      config={{
        licenseKey: getEnv("VITE_CKEDITOR_LICENSE_KEY"),
        plugins: [Essentials, Paragraph, Bold, Italic],
        toolbar: ["undo", "redo", "|", "bold", "italic"],
        initialData: "<p>Hello from CKEditor 5 in React!</p>",
      }}
    />
  );
}
