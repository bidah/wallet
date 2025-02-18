module.exports = {
  plugins: [
    [require('@babel/plugin-proposal-decorators').default, { legacy: true }],
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        path: 'e2e/.env',
      },
    ],
    // Remove @babel/plugin-proposal-numeric-separator when we upgrade metro with the upstream fix (https://github.com/facebook/metro/pull/681)
    '@babel/plugin-proposal-numeric-separator',
    // Remove @babel/plugin-transform-named-capturing-groups-regex once hermes supports named capture groups (https://github.com/facebook/hermes/issues/696)
    '@babel/plugin-transform-named-capturing-groups-regex',
    'react-native-reanimated/plugin',
    // NOTE: Reanimated plugin has to be listed last.
  ],
  presets: ['module:metro-react-native-babel-preset'],
}
