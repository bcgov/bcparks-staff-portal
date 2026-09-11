const MAX_LENGTH = 60;

function JsonList(props) {
  const { property, record } = props;

  const rawValue = record.params[property.path];
  const hasValue = rawValue !== null && typeof rawValue !== "undefined";

  let displayValue = "—";

  if (hasValue) {
    try {
      // Format the raw value as a compact JSON string
      displayValue = JSON.stringify(rawValue);
    } catch (err) {
      console.error("Failed to stringify JSON:", err);
      displayValue = String(rawValue);
    }
  }

  const truncated =
    displayValue.length > MAX_LENGTH
      ? `${displayValue.slice(0, MAX_LENGTH)}…`
      : displayValue;

  return (
    <pre
      title="JSON data"
      style={{
        fontFamily: "monospace",
        // Allow wrapping to prevent overflowing the table
        whiteSpace: "pre-wrap",
        margin: 0,
        background: "#f9f9f9",
        padding: "4px",
        borderRadius: "4px",
      }}
    >
      {truncated}
    </pre>
  );
}

export default JsonList;
