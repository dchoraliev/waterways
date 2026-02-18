import { readFileSync } from 'fs';
import { resolve } from 'path';

function readFile(rel) {
  return readFileSync(resolve(__dirname, '..', rel), 'utf8');
}

const gradleProps = readFile('android/gradle.properties');
const appConfig = readFile('app.config.ts');
const buildGradle = readFile('android/app/build.gradle');

const problems = [];

if (!/newArchEnabled\s*=\s*false/.test(gradleProps)) {
  problems.push(
    'android/gradle.properties: newArchEnabled should be false for react-native-voice compatibility'
  );
}

if (!/newArchEnabled\s*:\s*false/.test(appConfig)) {
  problems.push('apps/mobile/app.config.ts: newArchEnabled should be false');
}

const versionCodeMatch = buildGradle.match(/versionCode\s*(\d+)/);
if (versionCodeMatch) {
  const versionCode = parseInt(versionCodeMatch[1], 10);
  if (versionCode < 2) {
    problems.push(
      'android/app/build.gradle: versionCode should be incremented for pub/side-loads (currently ' +
        versionCode +
        ')'
    );
  }
} else {
  problems.push('android/app/build.gradle: versionCode not found');
}

if (problems.length) {
  console.error('\nRelease config check failed:');
  problems.forEach((p) => console.error(' - ' + p));
  console.error(
    '\nRun `node ./scripts/check-release-config.js` or `yarn mobile:check-release-config` to validate.'
  );
  process.exit(1);
}

console.log('Release config check passed.');
process.exit(0);
