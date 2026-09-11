import { useState, useEffect } from "react";

function JsonEdit(props) {
  const { property, record, onChange } = props;

  // get current value
  const rawValue = record.params[property.path];
  // null is a valid JSON literal; only undefined means the property is absent.
  const hasValue = typeof rawValue !== "undefined";
  // Stringify the value to preserve string quotes and output valid JSON
  const initial = hasValue ? JSON.stringify(rawValue, null, 2) : "";

  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  // Re-register when AdminJS replaces form values so untouched values
  // are submitted with the correct JSON type.
  useEffect(() => {
    if (value.trim() === "") {
      onChange(property.path, null);
      setError("");
      return;
    }

    try {
      // Validate before sending; mark the string so the server knows to
      // JSON.parse it back instead of storing this literal marked text
      JSON.parse(value);
      onChange(property.path, `__JSON_STRING__${value}`);
      setError("");
    } catch (err) {
      console.error("JSON parse error:", err);
      setError("Invalid JSON");
    }
  }, [value, rawValue]);

  function handleChange(e) {
    const val = e.target.value;

    setValue(val);
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}
    >
      <label
        htmlFor={property.path}
        style={{
          display: "block",
          fontFamily: "Roboto, sans-serif",
          fontSize: "12px",
          lineHeight: "16px",
          marginBottom: "8px",
        }}
      >
        {property.label}
      </label>
      <textarea
        id={property.path}
        value={value}
        onChange={handleChange}
        rows={10}
        style={{
          fontFamily: "monospace",
          background: "#f9f9f9",
          padding: "8px",
          border: error ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          width: "100%",
        }}
      />
      {error && <span style={{ color: "red", marginTop: "4px" }}>{error}</span>}
    </div>
  );
}

export default JsonEdit;
