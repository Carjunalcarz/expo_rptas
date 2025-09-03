// Small helper to safely access expo-router's router without requiring
// a navigation context during render or module initialization.
// Use this inside event handlers (onPress, etc.).
export function getRouter(): any | undefined {
  try {
    // require inside function to avoid static evaluation
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const r = require('expo-router');
    return r?.router;
  } catch {
    return undefined;
  }
}

export default { getRouter };
