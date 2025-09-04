import type { UserConfig } from 'tsdown'
import { readdirSync } from 'node:fs'
import { defineConfig } from 'tsdown'

export const config: UserConfig = readdirSync('./packages').map(dir => ({
  platform: 'neutral',
  format: 'esm',
  dts: true,
  minify: true,
  clean: false,
  sourcemap: false,
  entry: `./packages/${dir}/src/index.ts`,
  outDir: `./packages/${dir}/dist`,
  watch: `./packages/${dir}/src`,
}))

export default defineConfig(config)
