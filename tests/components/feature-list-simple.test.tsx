/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureList } from '../../client/src/components/ui/feature-list'

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn()
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children)
  },
  AnimatePresence: ({ children }: any) => children
}))

const mockFeatures = [
  {
    id: 1,
    title: 'User Login',
    story: 'As a user I want to login',
    scenarioCount: 3,
    domain: 'security',
    generatedContent: 'Feature: User Login\nScenario: Valid login',
    manuallyEdited: false,
    deleted: false,
    status: 'backlog',
    lifecycleStage: 'draft',
    stageHistory: null,
    analysisJson: null,
    createdAt: new Date('2024-01-01'),
    userId: 1
  },
  {
    id: 2,
    title: 'User Registration',
    story: 'As a user I want to register',
    scenarioCount: 2,
    domain: 'security',
    generatedContent: 'Feature: User Registration\nScenario: Valid registration',
    manuallyEdited: true,
    deleted: false,
    status: 'in-progress',
    lifecycleStage: 'review',
    stageHistory: null,
    analysisJson: null,
    createdAt: new Date('2024-01-02'),
    userId: 1
  }
]

describe('FeatureList Component', () => {
  it('shows loading state when fetching data', async () => {
    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false
    } as any)

    render(<FeatureList />)

    expect(screen.getByText('Generated Features')).toBeInTheDocument()
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('renders features when data is loaded', async () => {
    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValue({
      data: mockFeatures,
      isLoading: false,
      error: null,
      isError: false
    } as any)

    render(<FeatureList />)

    expect(screen.getByText('Generated Features')).toBeInTheDocument()
    expect(screen.getByText('User Login')).toBeInTheDocument()
    expect(screen.getByText('User Registration')).toBeInTheDocument()
  })

  it('filters out deleted features', async () => {
    const featuresWithDeleted = [
      ...mockFeatures,
      {
        ...mockFeatures[0],
        id: 3,
        title: 'Deleted Feature',
        deleted: true
      }
    ]

    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValue({
      data: featuresWithDeleted,
      isLoading: false,
      error: null,
      isError: false
    } as any)

    render(<FeatureList />)

    expect(screen.getByText('User Login')).toBeInTheDocument()
    expect(screen.queryByText('Deleted Feature')).not.toBeInTheDocument()
  })

  it('handles empty data gracefully', async () => {
    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false
    } as any)

    render(<FeatureList />)

    expect(screen.getByText('Generated Features')).toBeInTheDocument()
  })
});