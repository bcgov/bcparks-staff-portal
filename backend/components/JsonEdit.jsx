import { useState, useEffect } from "react";

const JsonEdit = (props) => {
  const { property, record, onChange } = props;

  // get current value
  const rawValue = record.params[property.path] || "";
  const initial =
    typeof rawValue === "object" ? JSON.stringify(rawValue, null, 2) : rawValue;

  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (value.trim() !== "") {
        JSON.parse(value);
      }
      setError("");
    } catch (err) {
      setError("Invalid JSON");
    }
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);

    try {
      const parsed = val.trim() ? JSON.parse(val) : null;
      // Notify AdminJS of the change
      onChange(property.path, JSON.stringify(parsed));
      setError("");
    } catch (err) {
      // keep showing error until valid JSON
      console.error("JSON parse error:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label htmlFor={property.path} style={{ fontWeight: "bold" }}>
        {property.label}
      </label>
      <textarea
        id={property.path}
        value={value}
        onChange={handleChange}
        rows={10}
        style={{
          padding: "8px",
          border: error ? "1px solid red" : "1px solid #ccc",
          borderRadius: "4px",
          width: "100%",
        }}
      />
      {error && <span style={{ color: "red", marginTop: "4px" }}>{error}</span>}
    </div>
  );
};

export default JsonEdit;
