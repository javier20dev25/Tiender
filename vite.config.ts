/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: [
      'node_modules/**', // Ignorar tests de dependencias
      'supabase/functions/**', // Excluir los tests de Deno
    ],
  },
})
