/**
 * FeatureGen AI
 * Copyright (c) 2024–2025 David Tran
 * Licensed under the Business Source License 1.1
 * See LICENSE.txt for full terms
 * Change Date: January 1, 2029 (license converts to MIT)
 * Contact: davidtran@featuregen.ai
 */

import OpenAI from "openai";



function injectDomainTags(content: string, domains: string[]): string {
  console.log('=== INJECT DOMAIN TAGS DEBUG ===');
  console.log('- domains received:', domains);
  console.log('- content received:', JSON.stringify(content));

  if (!domains || domains.length === 0) {
    console.log('No domains provided, returning original content');
    return content;
  }

  // Create properly formatted domain tags in lowerCamelCase (no capitalization changes)
  const domainTagsLine = domains
    .map(domain => {
      const cleanDomain = domain.startsWith('@') ? domain.slice(1) : domain;
      return `@${cleanDomain}`;
    })
    .join(' ');

  console.log('- formatted domain tags:', domainTagsLine);

  // Clean and normalize content while preserving proper Gherkin structure
  let cleanedContent = content.trim();
  
  // Fix the most common spacing issues:
  
  // 1. Remove excessive blank lines (3+ consecutive) but preserve single blank lines
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // 2. Ensure there's a blank line after Feature title and user story (but before Background/Scenario)
  cleanedContent = cleanedContent.replace(/(Feature:.*\n(?:\s{2}.*\n)*?)(?=\s*(?:Background:|Scenario:))/g, '$1\n');
  
  // 3. Ensure proper spacing before Background (should have blank line before it)
  cleanedContent = cleanedContent.replace(/(\S.*)\n(Background:)/g, '$1\n\n$2');
  
  // 4. Ensure proper spacing before each Scenario (should have blank line before it)
  cleanedContent = cleanedContent.replace(/(\S.*)\n(Scenario:)/g, '$1\n\n$2');
  
  // 5. Remove any double blank lines between scenarios to keep it clean
  cleanedContent = cleanedContent.replace(/(\nScenario:.*(?:\n\s+.*)*)\n\n\n+(Scenario:)/g, '$1\n\n$2');
  
  const lines = cleanedContent.split('\n');

  if (lines.length === 0) {
    console.log('All lines empty, returning just domain tags');
    return domainTagsLine;
  }

  console.log('- cleaned lines:', lines.map(l => JSON.stringify(l)));

  const firstNonEmptyLine = lines.find(line => line.trim() !== '')?.trim() || '';
  console.log('- first non-empty line:', JSON.stringify(firstNonEmptyLine));

  // Case 1: Replace existing tags
  if (firstNonEmptyLine.startsWith('@')) {
    console.log('Found existing tags, replacing');
    const firstNonEmptyIndex = lines.findIndex(line => line.trim() !== '');
    lines[firstNonEmptyIndex] = domainTagsLine;
    const result = lines.join('\n');
    console.log('- final result:', JSON.stringify(result));
    return result;
  }

  // Case 2: Insert before Feature: line with proper spacing
  if (firstNonEmptyLine.startsWith('Feature:')) {
    console.log('Found Feature: line, inserting tags before it with proper spacing');
    const result = domainTagsLine + '\n' + lines.join('\n');
    console.log('- final result:', JSON.stringify(result));
    return result;
  }

  // Case 3: Prepend to beginning with proper spacing
  console.log('Default case: prepending tags to beginning with proper spacing');
  const result = domainTagsLine + '\n' + lines.join('\n');
  console.log('- final result:', JSON.stringify(result));
  return result;
}

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

// Proper title-to-tag conversion function
function titleToCamelTag(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .split(/\s+/)                // Split on whitespace
    .filter(word => word.length > 0);

  if (words.length === 0) return '@unknown';

  const camelCase = words[0] + words.slice(1).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');

  return '@' + camelCase;
}

export async function inferDomains(
  title: string,
  story: string
): Promise<string[]> {
  console.log('=== DOMAIN INFERENCE DEBUG ===');
  console.log('Input title:', title);
  console.log('Input story:', story);

  const domainInferencePrompt = `
Based on the following feature title and story, determine which domain tags apply.
Return ONLY a JSON array of domain names (lowercase, no @ symbols).

Available domains: gdpr, security, performance, accessibility, analytics, payments, notifications, auth, api, ui, database, mobile, testing, deployment, monitoring, compliance, internationalization, seo, caching, backup, logging, email, integration, workflow, reporting, search, messaging, social, media, content, admin, billing, subscription, userManagement, fileUpload, validation, errorHandling, configuration, documentation, audit, maintenance, scalability, optimization, migration, backupRecovery, disasterRecovery, loadBalancing, microservices, containerization, docker, aws, azure, gcp, serverless, lambda, graphql, restApi, websockets, realTime, streaming, batchProcessing, machineLearning, ai, dataScience, analyticsReporting, businessIntelligence, dataWarehouse, etl, dataPipeline, dataGovernance, dataPrivacy, dataRetention, dataArchiving, dataMigration, dataBackup, dataRecovery, dataSynchronization, dataValidation, dataTransformation, dataEnrichment, dataCleansing, dataQuality, dataLineage, dataCatalog, dataDiscovery, dataProfiling, dataMasking, dataEncryption, dataCompression, dataDeduplication, dataPartitioning, dataSharding, dataReplication, dataDistribution, dataConsistency, dataIntegrity, dataAvailability, dataDurability, dataReliability, dataSecurity, dataCompliance, dataAudit, dataMonitoring, dataAlerting, dataVisualization, dataDashboards, dataReporting, dataExports, dataImports, dataFeeds, dataApis, dataServices, dataModels, dataSchemas, dataStructures, dataFormats, dataStandards, dataProtocols, dataInterfaces, dataContracts, dataAgreements, dataPolicies, dataProcedures, dataGuidelines, dataBestPractices

Title: "${title}"
Story: "${story}"

Examples:
- For user authentication features: ["auth", "security"]
- For GDPR compliance features: ["gdpr", "compliance", "dataPrivacy"]
- For payment processing: ["payments", "security", "compliance"]
- For data classification: ["dataGovernance", "dataPrivacy", "compliance"]
- For email processing: ["email", "dataPrivacy", "compliance"]

Return the array:`;

  console.log('Domain inference prompt:', domainInferencePrompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: domainInferencePrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    console.log('Raw OpenAI domain inference response:', response.choices[0]?.message?.content);

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.log('No content in response, using fallback domains');
      return ['content']; // Fallback
    }

    // Parse JSON response
    try {
      const domains = JSON.parse(content);
      console.log('Parsed domains from OpenAI:', domains);

      if (Array.isArray(domains) && domains.length > 0) {
        const filteredDomains = domains.filter(domain => 
          typeof domain === 'string' && domain.length > 0
        );
        console.log('Final domains being returned:', filteredDomains);
        return filteredDomains;
      } else {
        console.log('Invalid domains array, using fallback');
        return ['content'];
      }
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      console.log('Attempting to extract domains from text...');

      // Try to extract array-like content from the response
      const arrayMatch = content.match(/\[(.*?)\]/);
      if (arrayMatch) {
        try {
          const domains = JSON.parse(arrayMatch[0]);
          console.log('Extracted domains:', domains);
          return Array.isArray(domains) ? domains : ['content'];
        } catch (e) {
          console.log('Secondary parse failed:', e);
        }
      }

      return ['content']; // Ultimate fallback
    }
  } catch (error: any) {
    console.log('OpenAI API error:', error);
    return ['content']; // Fallback for API errors
  }
}

export async function generateFeature(
  title: string,
  story: string,
  scenarioCount: number,
  customDomainContext?: any,
  companyKnowledgeContext?: string // Added this parameter
): Promise<string> {
  try {
    console.log('=== FEATURE GENERATION DEBUG ===');

    const titleTag = titleToCamelTag(title);
    console.log('Generated title tag:', titleTag);

    // Step 1: ALWAYS infer domains using AI
    let inferredDomains: string[] = [];
    try {
      inferredDomains = await inferDomains(title, story);
      console.log('🧠 **Domain Inference**: Found', JSON.stringify(inferredDomains));

      if (!Array.isArray(inferredDomains)) {
        console.warn("inferDomains returned non-array:", inferredDomains);
        inferredDomains = [];
      }
    } catch (error) {
      console.warn("Failed to infer domains:", error);
      inferredDomains = [];
    }

    let domainContext = "";
    let domainContextDescription = "";
    let domainTags: string[] = [];

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
      "security": "Test authentication, RBAC, OWASP Top 10, privilege escalation attempts, and session timeout behavior.",
      "healthcare": "Include scenarios relevant to HIPAA, EHR workflows, patient safety, and access controls. Use realistic healthcare data flows.",
      "compliance": "Focus on regulatory requirements, audit trails, data retention policies, and legal compliance workflows."
    };

    if (customDomainContext) {
      domainContext = `\n\nCustom Domain Context:\n${customDomainContext.context || customDomainContext.displayName}`;
      domainContextDescription = `Custom domain: ${customDomainContext.displayName}`;
      domainTags = [`@${customDomainContext.displayName.replace(/\s+/g, '')}`];
    } else {
      // ALWAYS use AI-inferred domains
      const validDomains = inferredDomains.filter(d => d && typeof d === 'string' && d.trim().length > 0);

      if (validDomains.length > 0) {
        domainContextDescription = `AI-inferred domains: ${validDomains.join(", ")}`;

        // Get domain-specific context from the instructions
        domainContext = validDomains.map(domain => {
          const instructions = domainInstructions[domain];
          return instructions ? `\n\n${domain.toUpperCase()} Domain Context:\n${instructions}` : '';
        }).filter(ctx => ctx.length > 0).join('');

        // Add company knowledge context
        domainContext += companyKnowledgeContext;

        // Convert ALL inferred domains to proper format WITHOUT "domain" prefix
        domainTags = validDomains.map(d => {
          // Remove "domain" prefix if it exists
          let cleanDomain = d;
          if (d.toLowerCase().startsWith('domain')) {
            cleanDomain = d.slice(6); // Remove "domain" (6 characters)
          }

          // Keep original casing from inference
          return `@${cleanDomain}`;
        });

        console.log('🎯 Using AI-inferred domains as tags:', domainTags);
      } else {
        console.log('No valid domains found, using fallback');
        domainContextDescription = 'Generic feature generation';
        domainContext = companyKnowledgeContext ?? '';
      }
    }

    // Step 2: Create final tags (title + all inferred domains)
    let allTagsArray = [titleTag, ...domainTags];
    console.log('🏷️ Final tags:', allTagsArray);

    const allTags = allTagsArray.join(' ');
    console.log('Generated allTags:', allTags);

    // Step 3: Generate feature with DECLARATIVE GHERKIN prompt
    const aiPrompt = `Generate a Cucumber BDD feature file using DECLARATIVE language and proper Background usage.

Title: ${title}
Story: ${story}
Number of scenarios: ${scenarioCount}
${domainContextDescription}
${domainContext}

CRITICAL GHERKIN REQUIREMENTS:

1. USE DECLARATIVE LANGUAGE (describe WHAT happens, not HOW):
   ❌ IMPERATIVE: "When I click the Submit button"
   ✅ DECLARATIVE: "When the form submission is completed"

   ❌ IMPERATIVE: "And I enter 'john@email.com' in the Email field"  
   ✅ DECLARATIVE: "And the email address 'john@email.com' is provided"

2. PROPER BACKGROUND USAGE:
   - Background: Use "Given" and "And" for setup conditions
   - Scenarios: Start with "And" (continuing from Background), then "When", then "Then"

   Structure:
   Background:
     Given [initial authenticated state]
     And [access to relevant system/features]

   Scenario:
     And [additional context continuing from background]
     When [business action/event occurs]  
     And [additional business actions]
     Then [expected business outcome]
     And [additional verifiable results]

3. FOCUS ON BUSINESS OUTCOMES AND VALUE:
   ❌ UI-FOCUSED: "And I see a green checkmark icon"
   ✅ BUSINESS-FOCUSED: "And the application status is approved"

   ❌ TECHNICAL: "And the database record is updated"
   ✅ BUSINESS: "And the customer information is saved in the system"

4. USE SPECIFIC, REALISTIC DATA:
   - Include concrete values: "john.doe@company.com", "2024-01-15", "Policy-ABC123"
   - Reference specific business entities and states
   - Use realistic error messages: "Email address is required"
   - Include specific success indicators: "Account created successfully"

5. WRITE FOR BUSINESS STAKEHOLDERS:
   - Use domain-specific terminology
   - Focus on user value and business processes
   - Describe system behavior from user perspective
   - Avoid technical implementation details
   - Keep scenarios concise - combine related actions into single steps
   - Aim for 3-5 steps per scenario maximum

EXAMPLE DECLARATIVE PATTERN:
Background:
  Given the user is authenticated in the system
  And the user has access to claim management features

Scenario: Insurance claim is submitted with complete documentation
  And a new auto insurance claim with policy "POL-2024-ABC123" is initiated
  When the complete claim details and documentation are provided
  Then the claim "CLM-2024-456789" is successfully registered
  And the policyholder receives confirmation

Generate exactly ${scenarioCount} scenarios that:
- Focus on high-level business workflows (avoid excessive step-by-step details)
- Include both positive and negative scenarios
- Use specific data values but keep steps concise (3-5 steps per scenario maximum)
- Follow proper declarative language patterns
- Continue from the Background with "And" statements
- Describe business outcomes, not UI interactions
- Group related actions into single, meaningful steps rather than breaking them down granularly

Format as standard Gherkin with this structure and PROPER SPACING:
Feature: [Feature Title]
  [User Story - exactly as provided, indented with 2 spaces]

Background:
  [Background steps]

Scenario: [Scenario name]
  [Scenario steps]

Scenario: [Next scenario name]
  [Next scenario steps]

CRITICAL FORMATTING REQUIREMENTS:
- Include a blank line after the Feature title and user story
- Include a blank line before each Scenario
- Include a blank line between scenarios
- Use consistent indentation (2 spaces for user story, 2 spaces for scenario steps)
- Background should have no indentation, scenario steps should be indented 2 spaces

Do NOT include any domain tags at the beginning - just start with "Feature:".`;

    console.log('AI Prompt being sent:', aiPrompt);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a BDD expert specializing in declarative Gherkin scenarios for business stakeholders. 
          Write business-focused scenarios that describe WHAT happens and WHY it matters, not HOW it's technically implemented.
          Always use proper Background structure where scenarios continue with "And" instead of repeating "Given".
          Focus on business outcomes, user value, and verifiable business results.
          Use specific, realistic data that business users would recognize.`,
        },
        { role: "user", content: aiPrompt },
      ],
      temperature: 0.2, // Lower temperature for more consistent, structured output
      max_tokens: 2000,
    });

    let content = response.choices[0].message.content ?? "";
    content = content.replace(/```(gherkin)?/g, "").trim();

    console.log('Raw OpenAI generated content BEFORE injectDomainTags:', JSON.stringify(content));
    console.log('About to call injectDomainTags with tagArray:', allTagsArray);

    // Use the utility function to ensure tags are properly injected
    content = injectDomainTags(content, allTagsArray);
    console.log('Content AFTER injectDomainTags:', JSON.stringify(content));

    // Clean up spacing
    content = content.replace(/\n{3,}/g, "\n\n");

    // Validate scenario count
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
          content: "You are a Cucumber BDD title expert. Suggest short, business-readable feature titles (max 5 words).",
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

export { suggestTitle, analyzeFeatureComplexity };