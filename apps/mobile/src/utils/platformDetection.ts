import Constants from 'expo-constants';

/**
 * Runtime detection utility for determining the execution environment.
 * Used to conditionally enable/disable native features based on whether
 * the app is running in Expo Go (managed workflow) or a native build
 * (dev client or standalone APK).
 */

/**
 * Check if the app is running in Expo Go.
 * Expo Go cannot use native modules, so we need to provide mock implementations.
 *
 * @returns {boolean} true if running in Expo Go, false if in dev client or standalone
 */
export const isExpoGo = (): boolean => {
  // Constants.executionEnvironment values:
  // - 'storeClient' = Expo Go app from app store
  // - 'standalone' = Standalone/production build
  // - 'bare' = Bare workflow (ejected)
  return Constants.executionEnvironment === 'storeClient';
};

/**
 * Check if native modules are available in the current runtime.
 * Native modules are available in:
 * - Dev client builds
 * - Standalone APK/IPA builds
 * - Bare workflow apps
 *
 * Native modules are NOT available in:
 * - Expo Go
 *
 * @returns {boolean} true if native modules can be used
 */
export const hasNativeModules = (): boolean => {
  return !isExpoGo();
};

/**
 * Get a human-readable description of the current execution environment.
 * Useful for debugging and user feedback.
 *
 * @returns {string} Description of the runtime environment
 */
export const getRuntimeDescription = (): string => {
  const env = Constants.executionEnvironment;

  switch (env) {
    case 'storeClient':
      return 'Expo Go (no native modules)';
    case 'standalone':
      return 'Standalone Build (with native modules)';
    case 'bare':
      return 'Bare Workflow (with native modules)';
    default:
      return `Unknown Environment: ${env}`;
  }
};
