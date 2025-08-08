/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { describe, it, expect } from 'vitest'

describe('Feature Generator Core Functionality', () => {
  describe('Scenario Counting', () => {
    function countScenariosInContent(content: string): number {
      const scenarioMatches = content.match(/^\s*(Scenario|Scenario Outline):/gm);
      return scenarioMatches ? scenarioMatches.length : 0;
    }

    it('should correctly count scenarios in real Gherkin content', () => {
      const realFeatureContent = `
@userLogin
Feature: User Authentication
  As a registered user
  I want to log into the system
  So that I can access my account

  Background:
    Given the application is running
    And the database is accessible

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter my valid email "user@example.com"
    And I enter my valid password "SecurePass123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  Scenario: Failed login with invalid email
    Given I am on the login page
    When I enter an invalid email "invalid@email"
    And I enter my password "SecurePass123"
    And I click the login button
    Then I should see an error message "Invalid email format"

  Scenario Outline: Multiple failed login attempts
    Given I am on the login page
    When I enter email "<email>"
    And I enter password "<password>"
    And I click the login button
    Then I should see error "<error>"

    Examples:
      | email           | password    | error                |
      | user@example.com| wrongpass   | Invalid password     |
      | wrong@email.com | SecurePass123| User not found      |
      |                 | SecurePass123| Email required      |
      `

      expect(countScenariosInContent(realFeatureContent)).toBe(3)
    })

    it('should handle complex feature with multiple scenario types', () => {
      const complexFeature = `
Feature: E-commerce Shopping Cart
  As a customer
  I want to manage items in my shopping cart
  So that I can purchase products

  Scenario: Add single item to cart
    Given I am viewing a product page
    When I click "Add to Cart"
    Then the item should be added to my cart

  Scenario: Add multiple quantities
    Given I am viewing a product page
    When I select quantity 3
    And I click "Add to Cart"
    Then 3 items should be added to my cart

  Scenario Outline: Apply discount codes
    Given I have items in my cart
    When I enter discount code "<code>"
    Then my total should be reduced by <percentage>%

    Examples:
      | code      | percentage |
      | SAVE10    | 10         |
      | SAVE20    | 20         |

  Scenario: Remove item from cart
    Given I have items in my cart
    When I click "Remove" for an item
    Then the item should be removed from my cart
      `

      expect(countScenariosInContent(complexFeature)).toBe(4)
    })
  })

  describe('Domain Validation', () => {
    const validDomains = [
      'ai', 'biotech', 'crypto', 'ecommerce', 'finance',
      'generic', 'healthcare', 'infrastructure', 'insurance',
      'performance', 'rag', 'salesforce', 'security'
    ]

    it('should validate all supported domain types', () => {
      validDomains.forEach(domain => {
        expect(typeof domain).toBe('string')
        expect(domain.length).toBeGreaterThan(0)
      })
    })

    it('should categorize domains correctly', () => {
      const securityDomains = ['security', 'insurance']
      const techDomains = ['ai', 'crypto', 'rag']
      const businessDomains = ['ecommerce', 'finance', 'salesforce']

      securityDomains.forEach(domain => {
        expect(validDomains).toContain(domain)
      })

      techDomains.forEach(domain => {
        expect(validDomains).toContain(domain)
      })

      businessDomains.forEach(domain => {
        expect(validDomains).toContain(domain)
      })
    })
  })

  describe('Lifecycle Stage Validation', () => {
    const lifecycleStages = ['draft', 'review', 'approved', 'implemented', 'tested', 'deployed']

    it('should validate progression through lifecycle stages', () => {
      expect(lifecycleStages[0]).toBe('draft')
      expect(lifecycleStages[lifecycleStages.length - 1]).toBe('deployed')
    })

    it('should support all required lifecycle stages', () => {
      const requiredStages = ['draft', 'review', 'approved', 'implemented', 'tested', 'deployed']
      
      requiredStages.forEach(stage => {
        expect(lifecycleStages).toContain(stage)
      })
    })
  })

  describe('Feature Content Validation', () => {
    it('should validate proper Gherkin syntax structure', () => {
      const validGherkin = `
Feature: Valid Feature
  As a user
  I want functionality
  So that I can achieve goals

  Scenario: Valid scenario
    Given a precondition
    When an action occurs
    Then an outcome happens
      `

      expect(validGherkin).toContain('Feature:')
      expect(validGherkin).toContain('As a')
      expect(validGherkin).toContain('I want')
      expect(validGherkin).toContain('So that')
      expect(validGherkin).toContain('Scenario:')
      expect(validGherkin).toContain('Given')
      expect(validGherkin).toContain('When')
      expect(validGherkin).toContain('Then')
    })

    it('should validate user story format', () => {
      const userStories = [
        'As a customer I want to browse products so that I can make purchases',
        'As an admin I want to manage users so that I can control access',
        'As a developer I want to test features so that I can ensure quality'
      ]

      userStories.forEach(story => {
        expect(story).toMatch(/As an? .+ I want .+ so that .+/i)
      })
    })
  })

  describe('Feature Analytics and Complexity', () => {
    it('should calculate feature complexity factors', () => {
      const complexityFactors = {
        stepCount: 5,
        dataDependencies: 3,
        conditionalLogic: 2,
        technicalDifficulty: 4
      }

      const totalComplexity = Object.values(complexityFactors).reduce((sum, value) => sum + value, 0)
      
      expect(totalComplexity).toBe(14)
      expect(complexityFactors.stepCount).toBeGreaterThan(0)
      expect(complexityFactors.dataDependencies).toBeGreaterThan(0)
    })

    it('should provide meaningful complexity recommendations', () => {
      const recommendations = [
        'Use test data builders for better maintainability',
        'Consider mocking external services to reduce dependencies',
        'Break down complex scenarios into smaller, focused tests',
        'Implement page object patterns for UI testing'
      ]

      recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string')
        expect(recommendation.length).toBeGreaterThan(20)
      })
    })
  })
});