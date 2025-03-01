// Router path resolvers for resource IDs

function park(id) {
  return `/parks/${id}`;
}

export default {
  park,

  seasonEdit(parkId, seasonId) {
    return `${park(parkId)}/edit/${seasonId}`;
  },

  seasonPreview(parkId, seasonId) {
    return `${park(parkId)}/edit/${seasonId}/preview`;
  },

  winterFeesEdit(parkId, seasonId) {
    return `${park(parkId)}/winter-fees/${seasonId}/edit`;
  },

  winterFeesPreview(parkId, seasonId) {
    return `${park(parkId)}/winter-fees/${seasonId}/preview`;
  },
};
