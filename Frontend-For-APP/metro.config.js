const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for react-native-pager-view on web - block native-only module imports
const nativeModules = [
  'react-native/Libraries/Utilities/codegenNativeCommands',
  'react-native/Libraries/Utilities/codegenNativeComponent',
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && nativeModules.includes(moduleName)) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
