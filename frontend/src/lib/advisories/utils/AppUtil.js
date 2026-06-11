export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function a11yProps(index, label) {
  return {
    id: `${label}-${index}`,
    "aria-controls": `${label}-${index}`,
  };
}

export function labelCompare(a, b) {
  if (a.label < b.label) {
    return -1;
  }
  if (a.label > b.label) {
    return 1;
  }
  return 0;
}

export function advisoryHistoryCompare(a, b) {
  if (a.revisionNumber > b.revisionNumber) {
    return -1;
  }
  if (a.revisionNumber < b.revisionNumber) {
    return 1;
  }

  const displayTextPriority = {
    reviewed: 1,
    published: 2,
  };

  const aPriority = displayTextPriority[a.displayText] || 3;
  const bPriority = displayTextPriority[b.displayText] || 3;

  if (aPriority < bPriority) {
    return -1;
  }
  if (aPriority > bPriority) {
    return 1;
  }

  return 0;
}
