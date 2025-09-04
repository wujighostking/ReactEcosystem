import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'
import { config } from './tsdown.config.dev'

export default defineConfig((config as UserConfig[]).map((option: UserConfig) => ({ ...option, watch: false })))
