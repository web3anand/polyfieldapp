// Shim for react-native-passkeys to allow running in Expo Go and web without native modules.
// This satisfies @privy-io/expo's import but throws if actually used.

function notSupported(fn) {
  const err = new Error(
    `react-native-passkeys: ${fn} is not available in this environment. ` +
      `Build a Development Client (EAS dev build) and install @privy-io/expo-native-extensions to use passkeys.`
  );
  // Preserve stack for better debugging
  err.code = 'PASSKEYS_UNAVAILABLE';
  return err;
}

export async function create() {
  throw notSupported('create');
}

export async function get() {
  throw notSupported('get');
}

export default { create, get };
