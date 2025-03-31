// Router path resolvers for resource IDs

function park(id) {
  return `/parks/${id}`;
}

function season(parkId, seasonId) {
  return `${park(parkId)}/seasons/${seasonId}`;
}

function edit(rootPath) {
  return `${rootPath}/edit`;
}

function preview(rootPath) {
  return `${rootPath}/preview`;
}

export default {
  park,
  season,

  edit,
  preview,

  seasonEdit(parkId, seasonId) {
    return edit(season(parkId, seasonId));
  },

  seasonPreview(parkId, seasonId) {
    return preview(season(parkId, seasonId));
  },

  winterFeesEdit(parkId, seasonId) {
    return edit(`${park(parkId)}/winter-fees/${seasonId}`);
  },

  winterFeesPreview(parkId, seasonId) {
    return preview(`${park(parkId)}/winter-fees/${seasonId}`);
  },
};
