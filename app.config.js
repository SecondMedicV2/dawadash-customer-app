const { brandConfigSource } = require('./src/branding/brandConfig.cjs');

const activeConfig = brandConfigSource.load();
const { brand } = activeConfig;
const { colors } = brand.theme;
const { logo } = brand;

module.exports = ({ config }) => ({
  ...config,
  name: brand.name,
  slug: brand.id,
  scheme: 'dawadash',
  platforms: ['ios', 'android', 'web'],
  web: {
    ...config.web,
    bundler: 'metro',
    output: 'single',
    favicon: logo.appIcon,
    name: brand.name,
    themeColor: colors.primaryDark,
  },
  icon: logo.appIcon,
  splash: {
    image: logo.splashLogo,
    resizeMode: 'contain',
    backgroundColor: colors.background,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.dawadash.customer',
    icon: logo.appIcon,
  },
  android: {
    ...config.android,
    package: 'com.dawadash.customer',
    versionCode: 1,
    adaptiveIcon: {
      ...config.android?.adaptiveIcon,
      backgroundColor: colors.primaryDark,
      foregroundImage: logo.adaptiveIconForeground,
    },
  },
});
