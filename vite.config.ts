import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { onlineBattlePlugin } from './scripts/dev/online-battle.ts'
export default defineConfig(({ mode }) => ({
  plugins: [react(), onlineBattlePlugin(loadEnv(mode, process.cwd(), ''))],
}))
