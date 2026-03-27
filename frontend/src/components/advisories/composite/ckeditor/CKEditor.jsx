import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Link,
  SourceEditing,
  List,
} from "ckeditor5";
import PropTypes from "prop-types";
import getEnv from "@/config/getEnv";

import "ckeditor5/ckeditor5.css";

export default function StaffPortalCKEditor({ value, onChange }) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        licenseKey: getEnv("VITE_CKEDITOR_LICENSE_KEY"),
        plugins: [
          Essentials,
          Paragraph,
          Bold,
          Italic,
          Link,
          SourceEditing,
          List,
        ],
        toolbar: [
          "bold",
          "italic",
          "|",
          "link",
          "|",
          "bulletedList",
          "numberedList",
          "|",
          "sourceEditing",
        ],
      }}
      onBlur={(_, editor) => {
        onChange(editor.getData());
      }}
    />
  );
}

StaffPortalCKEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
