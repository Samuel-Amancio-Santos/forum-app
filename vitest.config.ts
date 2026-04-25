import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  oxc: false,
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
