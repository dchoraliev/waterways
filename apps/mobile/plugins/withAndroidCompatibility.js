import ConfigPluginsPkg from '@expo/config-plugins';
const ConfigPlugins =
  ConfigPluginsPkg && ConfigPluginsPkg.default ? ConfigPluginsPkg.default : ConfigPluginsPkg;
const { AndroidConfig, withAndroidManifest, withAppBuildGradle, withGradleProperties } =
  ConfigPlugins;

const withAndroidCompatibility = (config) => {
  config = withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      gradleConfig.modResults,
      'android.enableJetifier',
      'true'
    );
    return gradleConfig;
  });

  config = withAndroidManifest(config, (manifestConfig) => {
    if (!manifestConfig.modResults.manifest.$) {
      manifestConfig.modResults.manifest.$ = {};
    }

    manifestConfig.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      manifestConfig.modResults
    );

    if (!mainApplication.$) {
      mainApplication.$ = {};
    }

    const existingReplace = mainApplication.$['tools:replace'];
    const replaceValues = new Set(
      (existingReplace ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    );
    replaceValues.add('android:appComponentFactory');

    mainApplication.$['tools:replace'] = Array.from(replaceValues).join(',');
    mainApplication.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

    return manifestConfig;
  });

  config = withAppBuildGradle(config, (gradleConfig) => {
    const dynamicEntryLine =
      '    entryFile = file(["node", "-e", "require(\'expo/scripts/resolveAppEntry\')", projectRoot, "android", "absolute"].execute(null, rootDir).text.trim())';
    const staticEntryBlock =
      '    root = file("../../../..")\n    entryFile = file("../../index.ts")';

    if (gradleConfig.modResults.contents.includes(dynamicEntryLine)) {
      gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
        dynamicEntryLine,
        staticEntryBlock
      );
    }

    return gradleConfig;
  });

  return config;
};

export default withAndroidCompatibility;
