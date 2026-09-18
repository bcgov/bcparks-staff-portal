export function parkNameCompare(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

export function addProtectedAreas(
  protectedAreas,
  sites,
  selProtectedAreas,
  selSites,
  protectedAreaList,
) {
  const list = protectedAreaList ?? [];
  const tempParkList = [];

  protectedAreas.forEach((park) => {
    if (!selProtectedAreas.includes(park.documentId)) {
      selProtectedAreas.push(park.documentId);
      tempParkList.push(park.documentId);
      list.push({ orcs: park.orcs, name: park.protectedAreaName });
    }
  });
  if (sites && sites.length > 0) {
    sites.forEach((site) => {
      if (
        !selSites.includes(site.value) &&
        tempParkList.includes(site.obj.protectedArea.documentId)
      ) {
        selSites.push(site.value);
      }
    });
  }
  list.sort(parkNameCompare);
  return list;
}

export function addProtectedAreasFromArea(
  area,
  field,
  selProtectedAreas,
  selSites,
  sites,
  areaList,
  protectedAreaList,
) {
  const list = protectedAreaList ?? [];

  area[field]?.forEach((f) => {
    const relatedArea = areaList.find((a) => a.obj.id === f.id);

    addProtectedAreas(
      relatedArea.obj.protectedAreas,
      sites,
      selProtectedAreas,
      selSites,
      list,
    );
  });
  return list;
}
