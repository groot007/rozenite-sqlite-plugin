const { getDefaultConfig } = require("expo/metro-config");
const { withRozenite } = require("@rozenite/metro");

let config = getDefaultConfig(__dirname);

config = withRozenite(config, {
  enabled: process.env.WITH_ROZENITE === "true",
});

module.exports = config;