/* Test environment mocks for native modules that don't run under Jest. */

// Jest's node sandbox doesn't expose these globals; sql.js's wasm runtime
// (used by the db integration tests) needs them.
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

// Safe-area context: synthetic provider/view + zero insets.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Run requestAnimationFrame callbacks synchronously so focus() calls resolve
// during the test tick instead of firing a stray timer after teardown.
global.requestAnimationFrame = (cb) => {
  cb(0);
  return 0;
};
global.cancelAnimationFrame = () => {};

// Deterministic, incrementing UUIDs so ordering by created_at is stable.
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `id-${++n}` };
});
