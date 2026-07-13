/**
 * Show a simple alert message using the browser window alert.
 */
export function showAlert(title, message) {
  window.alert(message ? `${title}\n\n${message}` : title);
}

/**
 * Show a confirmation dialog.
 * Returns a Promise that resolves to true if the user confirmed, false otherwise.
 */
export function showConfirm(title, message) {
  return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
}
