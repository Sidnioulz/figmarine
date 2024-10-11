export default {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@anolilab/semantic-release-pnpm',
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
      },
    ],
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.gitTag} [skip ci]\\n\\n${nextRelease.notes}',
      },
    ],
  ],
};
