export default {
  ignorePackages: [
    // Never included.
    'packages/config-*',
    // Not ready for release yet.
    'packages/eslint-plugin-figma',
  ],
  deps: {
    bump: 'inherit',
  },
};
