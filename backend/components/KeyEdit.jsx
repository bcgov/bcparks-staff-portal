function KeyEdit(props) {
  const { property, record, onChange } = props;

  const value = record.params[property.path] ?? "";
  // Timestamps exist only after Sequelize has persisted the setting.
  const isExistingRecord = Boolean(record.params.createdAt);

  const labelStyle = {
    display: "block",
    fontFamily: "Roboto, sans-serif",
    fontSize: "12px",
    lineHeight: "16px",
    marginBottom: "8px",
  };

  if (isExistingRecord) {
    // The key is this record's primary key, so renaming it here would break
    // AdminJS' update lookup; show it read-only for existing records instead.
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "1rem",
        }}
      >
        <label style={labelStyle}>{property.label}</label>
        <span>{value}</span>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}
    >
      <label htmlFor={property.path} style={labelStyle}>
        {property.label}
      </label>
      <input
        id={property.path}
        type="text"
        value={value}
        onChange={(e) => onChange(property.path, e.target.value)}
        style={{
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          width: "100%",
        }}
      />
    </div>
  );
}

export default KeyEdit;
