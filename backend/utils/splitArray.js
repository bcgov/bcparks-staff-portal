/**
 * Splits an array into smaller chunks for JSON transmission, based on a maximum byte size.
 * @param {Array} items The array of items to split.
 * @param {number} [maxBytes=1_000_000] The maximum byte size for each chunk. (Default: 1,000,000 = 1MB)
 * @returns {Array<Array>} - An array of chunks, each containing a subset of the original items.
 */
export default function splitArray(items, maxBytes = 1_000_000) {
  const chunks = [];
  let chunk = [];
  // Array brackets are 1 byte each
  let size = 2;

  // Calculate size in bytes of each item in the array and split accordingly
  for (const item of items) {
    const stringifiedItem = JSON.stringify(item);
    let bytes = Buffer.byteLength(stringifiedItem, "utf8");

    // Account for commas between items
    bytes += chunk.length ? 1 : 0;

    // If adding this item would exceed maxBytes, start a new chunk
    if (size + bytes > maxBytes && chunk.length) {
      // Save current chunk and start a new one
      chunks.push(chunk);
      chunk = [];
      size = 2;
    }

    // Add item to current chunk
    chunk.push(item);

    // Update current chunk size
    size += bytes;
  }

  // Add any remaining items as the last chunk
  if (chunk.length) chunks.push(chunk);
  return chunks;
}
