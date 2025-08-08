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

async function generateFeature(
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
      "agentic": "Focus on autonomous agent behavior, task chaining, planning, memory recall, and action execution across multi-step workflows.",
      "ai": "Focus on AI model validation, hallucination detection, bias/fairness testing, and explainability. Include prompt handling and evaluation scenarios.",
      "automotive": "Emphasize safety-critical systems, diagnostics, sensor data interpretation, and autonomous driving scenarios. Include CAN bus or ECU references if applicable.",
      "biotech": "Include scenarios related to genomic analysis, lab data pipelines, machine learning in drug discovery, and bioinformatics validation steps.",
      "crypto": "Include smart contract interactions, wallet transactions, multi-sig approval, and blockchain confirmations. Use web3-style flows and secure access patterns.",
      "ecommerce": "Include checkout flows, cart management, product filtering, promotions, and order lifecycle. Test across desktop and mobile.",
      "finance": "Focus on transactions, authentication, fraud detection, and data integrity. Use secure access patterns and compliance terms (e.g. PCI, AML).",
      "gaming": "Test multiplayer interactions, leaderboard updates, in-game purchases, user sessions, and state synchronization.",
      "gdpr": "Validate user consent, data deletion requests, access logging, and cross-border data restrictions. Include legal justification handling.",
      "generic": "Use user-centered behavior with a focus on feature functionality and outcomes. Avoid implementation details or internal actions.",
      "healthcare": "Include scenarios relevant to HIPAA, EHR workflows, patient safety, and access controls. Use realistic healthcare data flows.",
      "infrastructure": "Focus on client-server architecture, network protocols (HTTP, TCP, DNS), environment configuration, request tracing, and resiliency under latency/failure conditions.",
      "insurance": "Include quote generation, claim submission, fraud rules, and risk analysis workflows. Address underwriting decision logic.",
      "llmops": "Focus on monitoring LLMs in production, drift detection, version control, prompt evaluation, and user feedback loop integration.",
      "medtech": "Include Class II/III device safety validation, regulatory workflows, device-to-cloud syncing, and audit trail scenarios.",
      "performance": "Emphasize load scenarios, latency checks, scaling behavior, and backend throughput. Consider APM or telemetry-based validations.",
      "rag": "Include retrieval validation, passage relevance checks, hallucination reduction, and LLM+vector database integration (e.g. Weaviate, Pinecone).",
      "salesforce": "Center around CRM flows: updating leads, managing cases, triggering workflows, and AI (Einstein) suggestions.",
      "security": "Test authentication, RBAC, OWASP Top 10, privilege escalation attempts, and session timeout behavior.",
      "soc": "Test log ingestion, alert routing, playbook automation, SIEM triggers, and escalation thresholds. Include compliance mapping.",
      "sox": "Include access control validation, segregation of duties, audit log immutability, financial reporting checks, and change control approvals."
    };

    const domainNote =
      domainInstructions[domain.toLowerCase()] || domainInstructions["generic"];

    const aiPrompt = `
You are a domain-aware expert in writing Cucumber BDD feature files.

Feature Title: ${title}
Feature Story: ${story}
Domain: ${domain}

Write a Cucumber feature with:
- EXACTLY ${scenarioCount} unique scenarios
- One reusable Background section
- Given/When/Then format
- ONLY one tag: ${featureTag}
- Domain instructions: ${domainNote}
- Output ONLY valid Gherkin

Make sure:
- Steps in each Scenario start with "And" if there is a Background
- Avoid repeating "Given" if a Background is present

Example format:
${featureTag}
Feature: ${title}
As a user, I want to interact with this feature
So that I can achieve the expected outcome

Background:
  Given I am logged in

Scenario: First example
  And I navigate to the dashboard
  When I perform an action
  Then I see a result

[CONTINUE WITH ${scenarioCount - 1} MORE SCENARIOS]`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in Cucumber BDD. Generate a valid feature file using the user's title, story, and domain context. The output must have exactly one tag, a Background, and the required number of scenarios.",
        },
        { role: "user", content: aiPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    let content = response.choices[0].message.content ?? "";
    content = content.replace(/```(gherkin)?/g, "").trim();
    content = content.replace(/@[\w]+\s*\n(@[\w]+\s*\n)*/, `${featureTag}\n`);
    content = content.replace(/Feature:([^\n]+)\n\n/g, "Feature:$1\n");

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

async function suggestTitle(story: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Cucumber BDD title expert. Suggest short, business-readable feature titles (max 5 words).",
        },
        {
          role: "user",
          content: `Story: ${story}\nReturn 3 titles in JSON array.`,
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

async function analyzeFeatureComplexity(content: string): Promise<FeatureComplexity> {
  try {
    console.log("Starting complexity analysis for content:", content.substring(0, 100) + "...");

    const prompt = `
You are an expert in Cucumber BDD and test architecture. Analyze this feature file and return a JSON object with:

- overallComplexity: a number from 1 to 10 (how hard this feature is to test)
- scenarios: an array of scenarios, each with:
  - name: string
  - complexity: 1–10
  - factors: {
      stepCount: 1–10,
      dataDependencies: 1–10,
      conditionalLogic: 1–10,
      technicalDifficulty: 1–10
    }
  - explanation: string explaining the complexity
- recommendations: array of actionable insights for improving testability

Respond ONLY with valid JSON.

Example JSON format:
{
  "overallComplexity": 6,
  "scenarios": [
    {
      "name": "Login with valid credentials",
      "complexity": 4,
      "factors": {
        "stepCount": 3,
        "dataDependencies": 2,
        "conditionalLogic": 1,
        "technicalDifficulty": 2
      },
      "explanation": "Standard login flow with simple validation."
    }
  ],
  "recommendations": [
    "Mock external dependencies for isolation.",
    "Reduce redundant steps to improve speed."
  ]
}

Feature content:
${content}`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You analyze Cucumber features for automation complexity, performance risk, and technical challenges.",
        },
        {
          role: "user",
          content: prompt,
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
        factors: typeof s.factors === "object" && !Array.isArray(s.factors)
          ? {
              stepCount: s.factors.stepCount ?? 0,
              dataDependencies: s.factors.dataDependencies ?? 0,
              conditionalLogic: s.factors.conditionalLogic ?? 0,
              technicalDifficulty: s.factors.technicalDifficulty ?? 0,
            }
          : {
              stepCount: 0,
              dataDependencies: 0,
              conditionalLogic: 0,
              technicalDifficulty: 0,
            },
        explanation: s.explanation ?? "",
      })),
      recommendations: raw.recommendations ?? [],
    };
  } catch (err: any) {
    throw new Error(`Failed to analyze complexity: ${err.message}`);
  }
}

export { generateFeature, suggestTitle, analyzeFeatureComplexity };
