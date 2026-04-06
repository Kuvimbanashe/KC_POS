const os = require('os');
const path = require('path');

if (typeof os.availableParallelism !== 'function') {
  os.availableParallelism = () => {
    const cpus = os.cpus?.();
    const length = Array.isArray(cpus) ? cpus.length : 1;
    return Math.max(1, length - 1);
  };
}

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: path.join(__dirname, 'global.css'),
  configPath: path.join(__dirname, 'tailwind.config.js'),
});
