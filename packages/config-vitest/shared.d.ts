import type { CoverageIstanbulOptions } from 'vitest/node';

export const coverage: {
  include: string[];
  provider: 'istanbul';
  reporter: ['text', 'json', 'html', 'cobertura'];
} & CoverageIstanbulOptions;
