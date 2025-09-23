function NullableBooleanList({ record, property }) {
  const value = record.params[property.path];

  if (value === null || typeof value === "undefined") {
    return <span>null</span>;
  }
  return <span>{value ? "Yes" : "No"}</span>;
}

export default NullableBooleanList;
