/**
 * Jest setup: wires up mocks that jest-expo's preset no longer provides
 * automatically as of jest-expo ~54 (previously ~52 handled this
 * differently). See TODO.md "Type-check debt" -> jest-expo bullet.
 */

// @react-native-async-storage/async-storage ships its own Jest mock but
// (as of the version pinned here) does not self-register via jest.mock();
// it must be wired in explicitly, per the package's own Jest integration
// docs: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
