const MAX_LENGTH = 60;

function JsonList(props) {
  const { property, record } = props;

  const rawValue = record.params[property.path];

  if (rawValue === null || typeof rawValue === "undefined") {
    return <span>—</span>;
  }

  let compact;

  try {
    const parsed =
      typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;

    compact = JSON.stringify(parsed);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    compact = String(rawValue);
  }

  const truncated =
    compact.length > MAX_LENGTH ? `${compact.slice(0, MAX_LENGTH)}…` : compact;

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
