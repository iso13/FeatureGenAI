/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('process.env', () => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'test-db-url',
  OPENAI_API_KEY: 'test-openai-key'
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
})