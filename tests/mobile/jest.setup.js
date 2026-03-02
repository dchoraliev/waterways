import '@testing-library/jest-native/extend-expect';

// Set environment variables BEFORE any imports
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((callback) => {
      // super minimal fake transaction object
      const tx = {
        executeSql: jest.fn((_sql, _params, successCb) => {
          // call success callback with an empty result if provided
          if (successCb) {
            successCb({
              rows: {
                _array: [],
                length: 0,
                item: () => null,
              },
            });
          }
        }),
      };
      callback(tx);
    }),
  })),
}));

//Mock expo-location
jest.mock(
  'expo-location',
  () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({
      coords: { latitude: 0, longitude: 0, accuracy: 10 },
      timestamp: Date.now(),
    }),
  }),
  { virtual: true }
);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock React Native core modules
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
  isTV: false,
  isTesting: true,
  Version: 123,
}));

// Mock StyleSheet
jest.mock('react-native/Libraries/StyleSheet/StyleSheet', () => ({
  create: (styles) => styles,
  flatten: (style) => style,
  compose: (style1, style2) => [style1, style2],
  hairlineWidth: 1,
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
}));

// Mock Alert
global.Alert = {
  alert: jest.fn(),
};

// Reduce console noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
