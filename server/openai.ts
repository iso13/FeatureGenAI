/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScenarioComplexity {
  name: string;
  complexity: number;
  factors: {
    stepCount: number;
    dataDependencies: number;
    conditionalLogic: number;
    technicalDifficulty: number;
  };
  explanation: string;
}

interface FeatureComplexity {
  overallComplexity: number;
  scenarios: ScenarioComplexity[];
  recommendations: string[];
}

export async function generateFeature(
  title: string,
  story: string,
  scenarioCount: number,
  domain: string = "generic"
): Promise<string> {
  try {
    const featureTag = `@${title
      .replace(/[^\w\s]/gi, "")
      .split(/\s+/)
      .map((word, i) =>
        i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1)
      )
      .join("")}`;

    const domainInstructions: Record<string, string> = {
      "ar/vr":
        "Focus on immersive experiences, 3D models, AR triggers, mobile/web compatibility, and user interactions with virtual objects.",
      healthcare:
        "Include scenarios relevant to HIPAA, EHR workflows, patient safety, and access controls. Use realistic healthcare data flows.",
      finance:
        "Focus on transactions, authentication, fraud detection, and data integrity. Use secure access patterns and compliance terms (e.g. PCI).",
      salesforce:
        "Center around CRM flows: updating leads, managing cases, triggering workflows, and AI (Einstein) suggestions.",
      generic:
        "Use user-centered behavior with a focus on feature functionality and outcomes. Avoid implementation details or internal actions.",
    };

    const domainNote = domainInstructions[domain.toLowerCase()] || domainInstructions["generic"];

    const aiPrompt = `
You are a domain-aware expert in writing Cucumber BDD feature files.

Feature Title: ${title}
Feature Story: ${story}
Domain: ${domain}

Write a Cucumber feature with:
- EXACTLY ${scenarioCount} unique scenarios
- One reusable Background section with a single Given step
- Since a Background exists, each Scenario MUST start with "And" — never "Given"
- Use "When" to describe the action and "Then" for the expected outcome
- Each scenario MUST have at least one And, one When, and one Then
- Each scenario should have a NATURAL number of steps (3-7) based on its complexity — do NOT make every scenario the same length
- Simple scenarios should have fewer steps (3-4), complex scenarios more (5-7)
- Steps must be specific to the feature story — no generic placeholders
- ONLY one tag: ${featureTag}
- Domain instructions: ${domainNote}
- Output ONLY valid Gherkin — no code fences, no markdown, no commentary

Example format (note varied step counts):
${featureTag}
Feature: ${title}
${story}

Background:
  Given I am logged in as an authenticated compliance officer

Scenario: Successful identity verification
  And I navigate to the identity verification page
  When I submit valid government-issued identity documents
  Then my identity should be verified successfully

Scenario: Identity verification fails with expired documents
  And I navigate to the identity verification page
  When I submit expired identity documents
  Then I should see an error message explaining the documents are expired
  And my identity verification status should remain incomplete
  And I should be prompted to resubmit valid documents
  And a compliance alert should be triggered for the failed attempt

[CONTINUE WITH ${scenarioCount - 2} MORE UNIQUE SCENARIOS WITH VARIED STEP COUNTS]`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in Cucumber BDD. Generate a valid feature file using the user's title, story, and domain context. Since a Background section is always included, every Scenario must start with 'And' not 'Given'. Steps must be specific and meaningful — never use generic placeholders. Each scenario should have a natural, varied number of steps (3-7) based on complexity — do not make every scenario the same length. The output must have exactly one tag, a Background, and the required number of scenarios.",
        },
        { role: "user", content: aiPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    let content = response.choices[0].message.content ?? "";
    content = content.replace(/```(?:gherkin)?/g, "").trim();
    content = content.replace(/@[\w]+\s*\n(@[\w]+\s*\n)*/g, `${featureTag}\n`);
    content = content.replace(/\n{3,}/g, "\n\n");

    const actualCount = (content.match(/Scenario:/g) || []).length;
    if (actualCount !== scenarioCount) {
      throw new Error(
        `Expected ${scenarioCount} scenarios, but found ${actualCount}.`
      );
    }

    return content;
  } catch (error: any) {
    throw new Error(`Failed to generate feature: ${error.message}`);
  }
}

export async function suggestTitle(story: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            'You are a Cucumber BDD title expert. Suggest short, business-readable feature titles (max 5 words). Respond with {"titles": [..]}.',
        },
        {
          role: "user",
          content: `Story: ${story}\nReturn 3 titles in JSON object with key "titles".`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return result.titles ?? [];
  } catch (err: any) {
    throw new Error(`Failed to suggest title: ${err.message}`);
  }
}

export async function analyzeFeatureComplexity(content: string): Promise<FeatureComplexity> {
  try {
    console.log("Starting complexity analysis for content:", content.substring(0, 100) + "...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You analyze Cucumber features for automation complexity, performance risk, and technical challenges. Always return factors as an object with numeric scores.",
        },
        {
          role: "user",
          content: `Analyze this Cucumber feature file and return ONLY a JSON object with this exact structure:
{
  "overallComplexity": <number 1-10>,
  "scenarios": [
    {
      "name": "<scenario name>",
      "complexity": <number 1-10>,
      "factors": {
        "stepCount": <number 1-10>,
        "dataDependencies": <number 1-10>,
        "conditionalLogic": <number 1-10>,
        "technicalDifficulty": <number 1-10>
      },
      "explanation": "<brief explanation>"
    }
  ],
  "recommendations": ["<insight for QA & DEV>"]
}

IMPORTANT: factors MUST be an object with numeric scores 1-10, not an array of strings.

Feature file:
${content}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    console.log("Raw OpenAI response:", response.choices[0].message.content);
    const raw = JSON.parse(response.choices[0].message.content ?? "{}");

    return {
      overallComplexity: Math.min(10, Math.max(1, raw.overallComplexity || 1)),
      scenarios: (raw.scenarios ?? []).map((s: any) => ({
        name: s.name ?? "Unnamed Scenario",
        complexity: Math.min(10, Math.max(1, s.complexity || 1)),
        factors: {
          stepCount: s.factors?.stepCount || 0,
          dataDependencies: s.factors?.dataDependencies || 0,
          conditionalLogic: s.factors?.conditionalLogic || 0,
          technicalDifficulty: s.factors?.technicalDifficulty || 0,
        },
        explanation: s.explanation ?? "",
      })),
      recommendations: raw.recommendations ?? [],
    };
  } catch (err: any) {
    throw new Error(`Failed to analyze complexity: ${err.message}`);
  }
}