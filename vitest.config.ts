/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'vite.config.ts',
        'vitest.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
})