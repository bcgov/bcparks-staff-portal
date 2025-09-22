function JsonShow(props) {
  const { property, record } = props;

  const rawValue = record.params[property.path];

  let displayValue = "—";

  try {
    if (rawValue) {
      // Handle case where admin js gives back a stringified json
      const parsed =
        typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;

      displayValue = JSON.stringify(parsed, null, 2);
    }
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    // fallback to raw value if parsing fails
    displayValue = rawValue;
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}
    >
      <label style={{ fontWeight: "bold", marginBottom: "4px" }}>
        {property.label}
      </label>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "#f9f9f9",
          padding: "8px",
          borderRadius: "4px",
        }}
      >
        {displayValue}
      </pre>
    </div>
  );
}

export default JsonShow;
