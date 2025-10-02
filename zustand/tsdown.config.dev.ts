import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'

export const config: UserConfig = {
  platform: 'neutral',
  format: 'esm',
  dts: true,
  minify: false,
  clean: true,
  sourcemap: true,
  entry: `./src/index.ts`,
  outDir: `./dist`,
  watch: `./src`,
}

export default defineConfig(config)
