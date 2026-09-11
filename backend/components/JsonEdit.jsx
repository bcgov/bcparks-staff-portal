import { useState, useEffect } from "react";

function JsonEdit(props) {
  const { property, record, onChange } = props;

  // get current value
  const rawValue = record.params[property.path];
  const hasValue = rawValue !== null && typeof rawValue !== "undefined";
  // Stringify the value to preserve string quotes and output valid JSON
  const initial = hasValue ? JSON.stringify(rawValue, null, 2) : "";

  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  // Register the marked initial value with AdminJS on mount, otherwise an
  // untouched field falls back to AdminJS's default flattened form
  // submission for this "mixed" property, which coerces values to strings.
  useEffect(() => {
    onChange(property.path, hasValue ? `__JSON_STRING__${initial}` : null);
    // run once on mount only
  }, []);

  useEffect(() => {
    try {
      if (value.trim() !== "") {
        JSON.parse(value);
      }
      setError("");
    } catch (err) {
      console.error("JSON parse error:", err);
      setError("Invalid JSON");
    }
  }, [value]);

  function handleChange(e) {
    const val = e.target.value;

    setValue(val);

    try {
      if (val.trim() === "") {
        // Send null for empty values
        onChange(property.path, null);
        setError("");
      } else {
        // Parse to validate, but send as JSON string to preserve types
        JSON.parse(val);

        // Send the raw JSON string with a special marker
        onChange(property.path, `__JSON_STRING__${val}`);
        setError("");
      }
    } catch (err) {
      // keep showing error until valid JSON
      console.error("JSON parse error:", err);
    }
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
