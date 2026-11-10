/**
 * Finds the first time an advisory/closure was published, from its revision history.
 * Mirrors the publish date/actor fallbacks used by AdvisoryHistory.
 * @param {Array<Object>} revisions Advisory audit records from the history endpoint
 * @returns {{date: string, actorName: string}|null} The earliest publish event, or null if never published
 */
export default function getFirstPosted(revisions) {
  const postings = (revisions ?? [])
    .filter(
      (revision) =>
        revision.advisoryStatus?.code === "PUB" || revision.publishedDate,
    )
    .map((revision) => ({
      date: revision.publishedDate || revision.modifiedDate,
      actorName: revision.publishedByName || revision.modifiedByName || "",
    }))
    .filter((posting) => posting.date);

  if (postings.length === 0) return null;

  return postings.reduce((earliest, posting) =>
    new Date(posting.date) < new Date(earliest.date) ? posting : earliest,
  );
}
