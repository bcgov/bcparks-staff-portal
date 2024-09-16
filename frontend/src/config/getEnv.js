/**
 * Returns the value of the environment variable with the given name,
 * from the global `window` object or the Vite `import.meta.env` object.
 * @param {string} name environment variable name
 * @returns {string|undefined} - environment variable value
 */
export default function getEnv(name) {
  return window[name] || import.meta.env?.[name];
}
