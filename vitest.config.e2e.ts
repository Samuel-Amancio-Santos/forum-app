import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  oxc: false,
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-e2e.ts'], // roda por worker
  },

  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
