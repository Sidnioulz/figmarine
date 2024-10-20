export default {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@anolilab/semantic-release-pnpm',
    '@semantic-release/github',
  ],
};
