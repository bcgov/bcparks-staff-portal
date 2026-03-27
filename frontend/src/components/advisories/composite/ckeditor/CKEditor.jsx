import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Link,
  SourceEditing,
} from "ckeditor5";
import getEnv from "@/config/getEnv";

import "ckeditor5/ckeditor5.css";

export default function StaffPortalCKEditor({ value, onChange }) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        licenseKey: getEnv("VITE_CKEDITOR_LICENSE_KEY"),
        plugins: [Essentials, Paragraph, Bold, Italic, Link, SourceEditing],
        toolbar: ["bold", "italic", "|", "link", "|", "sourceEditing"],
      }}
      onBlur={(_, editor) => {
        onChange(editor.getData());
      }}
    />
  );
}
