import { defineConfig } from 'tsdown'
import { config } from './tsdown.config.dev'

export default defineConfig({ ...config, minify: true, watch: false })
