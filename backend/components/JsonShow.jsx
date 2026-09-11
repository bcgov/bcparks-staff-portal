function JsonShow(props) {
  const { property, record } = props;

  const rawValue = record.params[property.path];
  const hasValue = rawValue !== null && typeof rawValue !== "undefined";

  let displayValue = "—";

  if (hasValue) {
    try {
      // Format the raw value as an indented JSON string
      displayValue = JSON.stringify(rawValue, null, 2);
    } catch (err) {
      console.error("Failed to stringify JSON:", err);
      displayValue = String(rawValue);
    }
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}
    >
      <label
        style={{
          fontWeight: 300,
          marginBottom: "4px",
          color: "#898a9a",
          fontSize: "12px",
        }}
      >
        {property?.props?.label ?? property.label}
      </label>
      <pre
        style={{
          fontFamily: "monospace",
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
