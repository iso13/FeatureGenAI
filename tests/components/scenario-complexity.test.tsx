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
import { ScenarioComplexity } from '../../client/src/components/ui/scenario-complexity'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children)
  }
}))

// Mock the UI components that aren't available in test environment
vi.mock('../../client/src/components/ui/hover-card', () => ({
  HoverCard: ({ children }: any) => React.createElement('div', {}, children),
  HoverCardTrigger: ({ children }: any) => children,
  HoverCardContent: ({ children }: any) => React.createElement('div', {}, children)
}))

vi.mock('../../client/src/components/ui/progress', () => ({
  Progress: ({ value }: any) => React.createElement('div', { 'data-testid': 'progress', 'data-value': value })
}))

const mockScenario1 = {
  name: 'User login with valid credentials',
  complexity: 3,
  factors: {
    stepCount: 4,
    dataDependencies: 2,
    conditionalLogic: 1,
    technicalDifficulty: 2
  },
  explanation: 'Standard login flow with minimal complexity'
}

const mockScenario2 = {
  name: 'User login with invalid credentials',
  complexity: 5,
  factors: {
    stepCount: 5,
    dataDependencies: 3,
    conditionalLogic: 3,
    technicalDifficulty: 4
  },
  explanation: 'Error handling adds complexity to the scenario'
}

describe('ScenarioComplexity Component', () => {
  it('renders scenario name and complexity score', () => {
    render(<ScenarioComplexity {...mockScenario1} />)
    
    expect(screen.getByText('User login with valid credentials')).toBeInTheDocument()
    expect(screen.getByText('Simple')).toBeInTheDocument()
  })

  it('displays scenario explanation', () => {
    render(<ScenarioComplexity {...mockScenario1} />)
    
    const explanations = screen.getAllByText('Standard login flow with minimal complexity')
    expect(explanations.length).toBeGreaterThan(0)
  })

  it('shows complexity factors in hover card', () => {
    render(<ScenarioComplexity {...mockScenario2} />)
    
    // The complexity factors are shown in the hover card content
    expect(screen.getByText('Step Count')).toBeInTheDocument()
    expect(screen.getByText('Data Dependencies')).toBeInTheDocument()
    expect(screen.getByText('Conditional Logic')).toBeInTheDocument()
    expect(screen.getByText('Technical Difficulty')).toBeInTheDocument()
  })

  it('displays correct complexity badge for moderate complexity', () => {
    render(<ScenarioComplexity {...mockScenario2} />)
    
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('handles undefined factors gracefully', () => {
    const scenarioWithoutFactors = {
      name: 'Test scenario',
      complexity: 2,
      factors: undefined as any,
      explanation: 'Test explanation'
    }
    
    render(<ScenarioComplexity {...scenarioWithoutFactors} />)
    
    expect(screen.getByText('Test scenario')).toBeInTheDocument()
    expect(screen.getByText('Simple')).toBeInTheDocument()
  })

  it('shows hover prompt', () => {
    render(<ScenarioComplexity {...mockScenario1} />)
    
    expect(screen.getByText('Hover for details')).toBeInTheDocument()
  })
});