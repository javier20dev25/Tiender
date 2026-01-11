/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    env: {
      VITE_SUPABASE_URL: 'https://zilkwckvsnxualaaapud.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbGt3Y2t2c254dWFsYWFhcHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODU1NjgsImV4cCI6MjA4MzI2MTU2OH0.JZYT0b6UXEhxNmytfrzLSQDg7bVeecRhk6hddXir-UQ',
    },
  },
})
