/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

// Type declarations to resolve Vite server configuration compatibility
declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | true | string[];
  }
}

export {};