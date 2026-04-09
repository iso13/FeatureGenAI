/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import { describe, it, expect } from 'vitest'

// Function to count scenarios in Gherkin content
function countScenariosInContent(content: string): number {
  const scenarioMatches = content.match(/^\s*(Scenario|Scenario Outline):/gm);
  return scenarioMatches ? scenarioMatches.length : 0;
}

describe('Scenario Counter Utility', () => {
  it('should count basic scenarios correctly', () => {
    const content = `
Feature: Test Feature
  As a user
  I want to test scenarios
  So that I can verify functionality

  Scenario: First test scenario
    Given I am on the homepage
    When I click the button
    Then I should see a result

  Scenario: Second test scenario
    Given I am logged in
    When I navigate to dashboard
    Then I should see my data
    `;

    expect(countScenariosInContent(content)).toBe(2);
  });

  it('should count scenario outlines correctly', () => {
    const content = `
Feature: Test Feature

  Scenario Outline: Test with examples
    Given I have <input>
    When I process it
    Then I get <output>

    Examples:
      | input | output |
      | a     | b      |
      | c     | d      |

  Scenario: Regular scenario
    Given something
    When action
    Then result
    `;

    expect(countScenariosInContent(content)).toBe(2);
  });

  it('should handle mixed scenario types', () => {
    const content = `
Feature: Mixed scenarios

  Scenario: Basic scenario
    Given condition
    When action
    Then result

  Scenario Outline: Parameterized scenario
    Given I have <value>
    When I use it
    Then I get <result>

    Examples:
      | value | result |
      | 1     | one    |

  Scenario: Another basic scenario
    Given another condition
    When another action
    Then another result
    `;

    expect(countScenariosInContent(content)).toBe(3);
  });

  it('should return 0 for content without scenarios', () => {
    const content = `
Feature: Empty feature
  As a user
  I want to test
  So that I can verify

  Background:
    Given some setup
    `;

    expect(countScenariosInContent(content)).toBe(0);
  });

  it('should handle indented scenarios', () => {
    const content = `
Feature: Indented scenarios

    Scenario: Indented scenario
      Given condition
      When action
      Then result

      Scenario: Another indented scenario
        Given another condition
        When another action
        Then another result
    `;

    expect(countScenariosInContent(content)).toBe(2);
  });

  it('should ignore scenario keywords in comments or strings', () => {
    const content = `
Feature: Test feature
  # This is a comment about Scenario: testing
  
  Scenario: Real scenario
    Given I have a string "This contains Scenario: text"
    When I process it
    Then it should work
    `;

    expect(countScenariosInContent(content)).toBe(1);
  });
});