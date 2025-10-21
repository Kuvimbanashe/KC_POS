const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
 
module.exports = withNativeWind(config, { input: './global.css' })


    // Add this to ignore node_modules from being watched
    

    // Alternatively, or in addition, you can configure the watcher itself
    // config.watchFolders = [__dirname]; // Only watch the current project folder
    // config.watcher = {
    //   ...config.watcher,
    //   ignored: [
    //     /node_modules/,
    //     /\.git/,
    //     // Add any other directories you want to ignore
    //   ],
    // };


    