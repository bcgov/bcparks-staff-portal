import _ from "lodash";

function JsonShow(props) {
  const { property, record } = props;

  console.log("JsonShow props:", props);

  // Collect all properties that start with the property path
  const fieldData = [];
  const pathPrefix = `${property.path}.`;

  Object.keys(record.params).forEach((key) => {
    if (key.startsWith(pathPrefix)) {
      // Remove the prefix to get the relative path
      const relativePath = key.slice(pathPrefix.length);

      // Use lodash setWith to handle arrays properly
      _.set(fieldData, relativePath, record.params[key]);
    }
  });

  let displayValue = "—";

  try {
    if (Object.keys(fieldData).length > 0) {
      displayValue = JSON.stringify(fieldData, null, 2);
    }
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    displayValue = "Error parsing data";
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
