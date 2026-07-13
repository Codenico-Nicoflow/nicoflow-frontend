/// <reference types="vitest/config" />
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nicoflow/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
      __tests__: path.resolve(__dirname, './__tests__'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov', 'cobertura'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/dist/**',
        '**/coverage/**',
      ],
      // E-018 DoD: ≥80% line coverage on features + store, enforced as a CI gate.
      thresholds: {
        'src/features/**': { lines: 80, statements: 80 },
        'src/lib/store/**': { lines: 80, statements: 80 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./__tests__/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}', '__tests__/**/*.test.{ts,tsx}'],
          exclude: ['node_modules', 'dist', 'e2e/**'],
          globals: true,
          typecheck: {
            tsconfig: './tsconfig.test.json',
          },
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(__dirname, '.storybook') })],
        test: {
          name: 'storybook',
          // Run story files serially: parallel browser contexts race on the
          // shared MSW worker / portal root and flake intermittently.
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: 'playwright',
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
