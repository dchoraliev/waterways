const { getDefaultConfig } = require('@expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve node_modules from both the project and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// 3. Mirror tsconfig/workspace aliases so Metro can resolve shared imports at runtime.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@waterways/shared': path.resolve(monorepoRoot, 'packages/shared'),
  '@shared': path.resolve(monorepoRoot, 'packages/shared/src'),
  assert: require.resolve('assert'),
};

// 4. Resolve shared aliases to concrete files inside packages/shared/src.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@waterways/shared') {
    const mappedPath = path.resolve(monorepoRoot, 'packages/shared/src/index.ts');
    return context.resolveRequest(context, mappedPath, platform);
  }

  if (moduleName.startsWith('@waterways/shared/src/')) {
    const mappedPath = path.resolve(
      monorepoRoot,
      'packages/shared/src',
      moduleName.replace('@waterways/shared/src/', '')
    );
    return context.resolveRequest(context, mappedPath, platform);
  }

  if (moduleName.startsWith('@shared/')) {
    const mappedPath = path.resolve(
      monorepoRoot,
      'packages/shared/src',
      moduleName.replace('@shared/', '')
    );
    return context.resolveRequest(context, mappedPath, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
