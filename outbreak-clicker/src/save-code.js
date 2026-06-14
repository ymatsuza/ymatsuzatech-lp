// Portable save codes: serialize state to a base64 string the player can copy
// out (backup) and paste back in (restore / move devices). Pure; no DOM.
// Imported codes should be run through state.migrate() before use.

export function exportSave(state) {
  return btoa(JSON.stringify(state));
}

export function importSave(code) {
  try {
    const parsed = JSON.parse(atob(String(code).trim()));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
