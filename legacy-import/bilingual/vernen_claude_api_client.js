/**
 * Claude API Client — Hartmann Legal Analytics
 * Backend integration with Anthropic API for VERNEN™ audit engine
 * 
 * This file runs SERVER-SIDE (Node.js/Express/Next.js API route).
 * Never expose API keys to the frontend.
 * 
 * © 2026 Michael Vernen Thomas Hartmann. All rights reserved.
 */

import { buildSystemPrompt, getDisclaimer } from "./system-prompts.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5-20250929"; // Best cost/performance for auditing
const MAX_TOKENS = 4096;

/**
 * Run a compliance audit via Claude API
 * 
 * @param {Object} params
 * @param {string} params.documentText - Extracted text from uploaded document
 * @param {string} params.domain - Audit domain (e.g., "family_court", "constitutional")
 * @param {string} params.lang - Output language: "en", "es", or "both"
 * @param {string} params.additionalContext - Optional user-provided context
 * @returns {Object} { findings, disclaimer, tokensUsed, cost }
 */
export async function runAudit({ documentText, domain, lang = "en", additionalContext = "" }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Build the system prompt with language preference
  const systemPrompt = buildSystemPrompt(lang);

  // Construct user message
  let userMessage = `AUDIT REQUEST
Domain: ${domain}
Output Language: ${lang === "both" ? "Bilingual (English + Spanish)" : lang === "es" ? "Spanish" : "English"}

DOCUMENT TEXT:
---
${documentText}
---`;

  if (additionalContext) {
    userMessage += `\n\nADDITIONAL CONTEXT FROM USER:\n${additionalContext}`;
  }

  userMessage += `\n\nPerform a comprehensive compliance audit of this document against all applicable standards for the ${domain} domain. Structure findings by severity (Critical, Major, Minor, Advisory). Cite specific standards violated and specific evidence from the document.`;

  const requestBody = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt[0].content,
    messages: [
      {
        role: "user",
        content: userMessage
      }
    ]
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  // Extract response text
  const auditText = data.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("\n");

  // Calculate cost
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cacheRead = data.usage?.cache_read_input_tokens || 0;
  const cacheWrite = data.usage?.cache_creation_input_tokens || 0;

  // Sonnet 4.5 pricing
  const cost = (
    ((inputTokens - cacheRead - cacheWrite) * 3.0 / 1_000_000) + // base input
    (cacheWrite * 3.75 / 1_000_000) +                             // cache write (1.25x)
    (cacheRead * 0.30 / 1_000_000) +                              // cache read (0.1x)
    (outputTokens * 15.0 / 1_000_000)                             // output
  );

  return {
    findings: auditText,
    disclaimer: getDisclaimer(lang),
    usage: {
      inputTokens,
      outputTokens,
      cacheRead,
      cacheWrite,
      estimatedCost: `$${cost.toFixed(4)}`
    }
  };
}

/**
 * Simple translation helper for ad-hoc text
 * Uses Claude for context-aware legal translation
 * 
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language ("en" or "es")
 * @param {string} toLang - Target language ("en" or "es")
 * @returns {string} Translated text
 */
export async function translateLegalText(text, fromLang = "en", toLang = "es") {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const fromName = fromLang === "en" ? "English" : "Spanish";
  const toName = toLang === "en" ? "English" : "Spanish";

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // Haiku for simple translation (cheapest)
      max_tokens: 2048,
      system: `You are a legal translation specialist. Translate the following ${fromName} legal text to ${toName}. 

CRITICAL RULES:
- Legal citations (statute numbers, code references like "Family Code § 3044", "42 USC § 1983") are NEVER translated — keep them exactly as-is
- Use formal legal register appropriate for court documents
- Preserve paragraph structure and formatting
- If a legal term has no direct equivalent, keep the English term and add a parenthetical explanation in ${toName}`,
      messages: [{ role: "user", content: text }]
    })
  });

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

/**
 * Domain labels in both languages for API responses
 */
export const DOMAIN_LABELS = {
  constitutional:   { en: "Constitutional & Civil Rights", es: "Derechos Constitucionales y Civiles" },
  family_court:     { en: "Family Court Orders", es: "Órdenes de Tribunal de Familia" },
  cps:              { en: "CPS / Child Welfare", es: "CPS / Bienestar Infantil" },
  law_enforcement:  { en: "Law Enforcement Conduct", es: "Conducta Policial" },
  fbi:              { en: "FBI / Federal Law Enforcement", es: "FBI / Fuerzas Federales" },
  attorney_conduct: { en: "Attorney Ethics", es: "Ética de Abogados" },
  psychiatry:       { en: "Psychiatry & Neurology", es: "Psiquiatría y Neurología" },
  fcs_mediator:     { en: "FCS Custody Mediator", es: "Mediadores de Custodia FCS" },
  victim_rights:    { en: "Victim Rights", es: "Derechos de Víctimas" },
  labor:            { en: "Labor & Employment", es: "Trabajo y Empleo" },
  state_agency:     { en: "State Agency Correspondence", es: "Correspondencia de Agencias" },
  fcra:             { en: "FCRA / Consumer Reports", es: "FCRA / Informes del Consumidor" },
  ssa_disability:   { en: "SSA Disability", es: "Discapacidad SSA" },
  military:         { en: "USMC Military Standards", es: "Estándares Militares USMC" }
};
