/**
 * Campus Pulse - Gemini AI Service
 * Handles all LLM interactions for issue triage automation
 */

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { AutomationOutput, ImpactScope, UrgencyLevel, ReportType, ContextValidity } from '@/domain/types';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model configuration - single source of truth for observability and consistency
export const MODEL_NAME = 'gemini-2.5-flash';

// Safety settings - allow all content since this is for issue triage
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

// Generation config for consistent JSON output
const generationConfig = {
    temperature: 0.2, // Low temperature for consistent categorization
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048, // Enough for full JSON + safety fields (avoids truncation)
};

/**
 * Valid issue categories for Jamia Hamdard
 */
const VALID_CATEGORIES = [
    'wifi',
    'water',
    'sanitation',
    'electricity',
    'hostel',
    'academics',
    'safety',
    'food',
    'infrastructure',
] as const;

/**
 * System prompt for issue triage (includes single-report safety and abuse detection)
 */
const TRIAGE_SYSTEM_PROMPT = `You are an intelligent issue triage assistant for Campus Pulse at Jamia Hamdard University campus in Delhi, India.

Your task is to analyze student-reported issues and extract structured information for routing, prioritization, and safety escalation.

CONTEXT:
- Jamia Hamdard is a large university campus with hostels, academic blocks, hospital, sports complex, library, and canteens
- Students report issues ranging from infrastructure problems to safety emergencies and mental health concerns
- Single serious reports (safety, crisis) must be flagged for immediate human review

VALID CATEGORIES (use one of these exactly):
- wifi, water, sanitation, electricity, hostel, academics, safety, food, infrastructure

URGENCY SCORING (0.0 to 1.0):
- 0.9-1.0: Emergency/Safety critical (security threats, fire, floods, medical emergencies, feeling unsafe)
- 0.7-0.8: High urgency (complete service outage, health risks)
- 0.5-0.6: Medium urgency (significant inconvenience)
- 0.3-0.4: Low-medium urgency (minor inconvenience)
- 0.1-0.2: Low urgency (suggestions, minor issues)

URGENCY LEVEL (for single-report escalation):
- CRITICAL: Safety threats, medical emergencies, mental health crisis, ongoing danger, violence, harassment, fire, flood, serious injury, reporter feeling unsafe
- HIGH: Significant issues requiring same-day attention (no power, severe leak, security concern)
- MEDIUM: Issues needing attention within 24-48 hours
- LOW: Minor inconveniences, suggestions

REPORT TYPE:
- EMERGENCY: Immediate life/safety danger (fire, violence, medical emergency)
- SAFETY: Non-immediate safety concerns (lighting, security, harassment)
- INFRASTRUCTURE: WiFi, water, electricity, sanitation, AC, furniture
- ACADEMIC: Timetable, results, classroom issues
- GENERAL: General feedback, suggestions
- TEST: Clearly a test message ("hello world", "testing", "123")
- SPAM: Advertising, gibberish, abusive content without substance

REPORTER WELFARE: Set reporter_welfare_flag true if the reporter's language suggests distress, feeling unsafe, scared, anxious, or in need of support.

REQUIRES IMMEDIATE ACTION: Set true only for EMERGENCY or SAFETY with reporter_welfare_flag true, so a single report gets instant human review.

SPAM CONFIDENCE (0.0-1.0): Be CONSERVATIVE - prefer false negatives. 0=not spam, 0.7=suspicious, 1.0=almost certainly spam/test.

CONTEXT VALIDITY: VALID (enough info to route), AMBIGUOUS (missing details), INVALID (incoherent).

RULES:
1. When uncertain between CRITICAL and HIGH, choose CRITICAL.
2. For spam detection, err on inclusion - don't block legitimate reports.
3. If a report mentions feeling unsafe or distressed, set reporter_welfare_flag true.

OUTPUT FORMAT (JSON only, no markdown):
{
  "extracted_category": "one of the valid categories",
  "urgency_score": 0.5,
  "impact_scope": "single or multi",
  "environmental_flag": true or false,
  "confidence_score": 0.8,
  "reasoning": "brief explanation",
  "urgency_level": "CRITICAL or HIGH or MEDIUM or LOW",
  "report_type": "EMERGENCY or SAFETY or INFRASTRUCTURE or ACADEMIC or GENERAL or TEST or SPAM",
  "reporter_welfare_flag": true or false,
  "requires_immediate_action": true or false,
  "spam_confidence": 0.0 to 1.0,
  "context_validity": "VALID or AMBIGUOUS or INVALID"
}`;

/**
 * Get Gemini model instance
 */
function getModel(): GenerativeModel {
    return genAI.getGenerativeModel({
        model: MODEL_NAME,
        safetySettings,
        generationConfig,
    });
}

/**
 * Extract partial key-value pairs from truncated JSON (e.g. Gemini cut off mid-response).
 * Returns a record suitable for normalizeParsed(); missing fields stay undefined and get defaults.
 */
function extractPartialTriageResponse(cleanedResponse: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const str = cleanedResponse;

    const categoryMatch = str.match(/"extracted_category"\s*:\s*"([^"]*)"/);
    if (categoryMatch) out.extracted_category = categoryMatch[1];

    const urgencyMatch = str.match(/"urgency_score"\s*:\s*([0-9.]+)/);
    if (urgencyMatch) out.urgency_score = parseFloat(urgencyMatch[1]);

    const impactMatch = str.match(/"impact_scope"\s*:\s*"(single|multi(?:le)?)"/);
    if (impactMatch) out.impact_scope = impactMatch[1] === 'multiple' ? 'multi' : impactMatch[1];

    const envMatch = str.match(/"environmental_flag"\s*:\s*(true|false)/);
    if (envMatch) out.environmental_flag = envMatch[1] === 'true';

    const confMatch = str.match(/"confidence_score"\s*:\s*([0-9.]+)/);
    if (confMatch) out.confidence_score = parseFloat(confMatch[1]);

    const reasoningMatch = str.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (reasoningMatch) out.reasoning = reasoningMatch[1].replace(/\\(.)/g, '$1');

    const urgencyLevelMatch = str.match(/"urgency_level"\s*:\s*"(CRITICAL|HIGH|MEDIUM|LOW)"/);
    if (urgencyLevelMatch) out.urgency_level = urgencyLevelMatch[1];

    const reportTypeMatch = str.match(/"report_type"\s*:\s*"(EMERGENCY|SAFETY|INFRASTRUCTURE|ACADEMIC|GENERAL|TEST|SPAM)"/);
    if (reportTypeMatch) out.report_type = reportTypeMatch[1];

    const welfareMatch = str.match(/"reporter_welfare_flag"\s*:\s*(true|false)/);
    if (welfareMatch) out.reporter_welfare_flag = welfareMatch[1] === 'true';

    const immediateMatch = str.match(/"requires_immediate_action"\s*:\s*(true|false)/);
    if (immediateMatch) out.requires_immediate_action = immediateMatch[1] === 'true';

    const spamMatch = str.match(/"spam_confidence"\s*:\s*([0-9.]+)/);
    if (spamMatch) out.spam_confidence = parseFloat(spamMatch[1]);

    const contextMatch = str.match(/"context_validity"\s*:\s*"(VALID|AMBIGUOUS|INVALID)"/);
    if (contextMatch) out.context_validity = contextMatch[1];

    return out;
}

/**
 * Validate and normalize parsed (or partial) triage object into AutomationOutput
 */
function normalizeParsed(parsed: Record<string, unknown>): AutomationOutput {
        const rawCategory = typeof parsed.extracted_category === 'string' ? parsed.extracted_category : '';
        let category = rawCategory.toLowerCase().trim();
        if (!category || !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
            if (category?.includes('internet') || category?.includes('network')) {
                category = 'wifi';
            } else if (category?.includes('electric') || category?.includes('power') || category?.includes('ac') || category?.includes('fan')) {
                category = 'electricity';
            } else if (category?.includes('toilet') || category?.includes('bathroom') || category?.includes('clean')) {
                category = 'sanitation';
            } else if (category?.includes('exam') || category?.includes('class') || category?.includes('professor') || category?.includes('result')) {
                category = 'academics';
            } else if (category?.includes('secure') || category?.includes('theft') || category?.includes('danger')) {
                category = 'safety';
            } else {
                category = 'infrastructure';
            }
        }

        let urgencyScore = parseFloat(String(parsed.urgency_score ?? ''));
        if (isNaN(urgencyScore) || urgencyScore < 0 || urgencyScore > 1) {
            urgencyScore = 0.5;
        }

        let impactScope: ImpactScope = 'single';
        if (parsed.impact_scope === 'multi' || parsed.impact_scope === 'multiple') {
            impactScope = 'multi';
        }

        const environmentalFlag = Boolean(parsed.environmental_flag);

        let confidenceScore = parseFloat(String(parsed.confidence_score ?? ''));
        if (isNaN(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
            confidenceScore = 0.7;
        }

        const validUrgencyLevels: UrgencyLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const rawUrgencyLevel = parsed.urgency_level;
        const urgencyLevel: UrgencyLevel = (typeof rawUrgencyLevel === 'string' && validUrgencyLevels.includes(rawUrgencyLevel as UrgencyLevel)) ? (rawUrgencyLevel as UrgencyLevel) : (urgencyScore >= 0.9 ? 'CRITICAL' : urgencyScore >= 0.7 ? 'HIGH' : urgencyScore >= 0.5 ? 'MEDIUM' : 'LOW');

        const validReportTypes: ReportType[] = ['EMERGENCY', 'SAFETY', 'INFRASTRUCTURE', 'ACADEMIC', 'GENERAL', 'TEST', 'SPAM'];
        const rawReportType = parsed.report_type;
        const reportType: ReportType = (typeof rawReportType === 'string' && validReportTypes.includes(rawReportType as ReportType)) ? (rawReportType as ReportType) : 'GENERAL';

        const reporterWelfareFlag = Boolean(parsed.reporter_welfare_flag);
        const requiresImmediateAction = Boolean(parsed.requires_immediate_action);

        let spamConfidence = parseFloat(String(parsed.spam_confidence ?? ''));
        if (isNaN(spamConfidence) || spamConfidence < 0 || spamConfidence > 1) spamConfidence = 0;

        const validContext: ContextValidity[] = ['VALID', 'AMBIGUOUS', 'INVALID'];
        const rawContext = parsed.context_validity;
        const contextValidity: ContextValidity = (typeof rawContext === 'string' && validContext.includes(rawContext as ContextValidity)) ? (rawContext as ContextValidity) : 'VALID';

        const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No reasoning provided';

        return {
            extracted_category: category as typeof VALID_CATEGORIES[number],
            urgency_score: urgencyScore,
            impact_scope: impactScope,
            environmental_flag: environmentalFlag,
            confidence_score: confidenceScore,
            reasoning,
            urgency_level: urgencyLevel,
            report_type: reportType,
            reporter_welfare_flag: reporterWelfareFlag,
            requires_immediate_action: requiresImmediateAction,
            spam_confidence: spamConfidence,
            context_validity: contextValidity,
        };
}

/**
 * Parse and validate Gemini response. Uses partial extraction if JSON is truncated.
 */
function parseTriageResponse(responseText: string): AutomationOutput {
    let cleanedResponse = responseText.trim();

    // Extract JSON from markdown code block even with leading text (e.g. "Response: ```json\n...")
    const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        cleanedResponse = codeBlockMatch[1].trim();
    } else {
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.slice(7);
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.slice(3);
        }
        if (cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.slice(0, -3);
        }
        cleanedResponse = cleanedResponse.trim();
    }

    // Strip any remaining leading non-JSON (e.g. "Response: " before an unfenced object)
    const firstBrace = cleanedResponse.indexOf('{');
    if (firstBrace > 0) {
        cleanedResponse = cleanedResponse.slice(firstBrace);
    }

    // Remove trailing commas before ] or } (invalid in JSON but sometimes emitted by LLMs)
    cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');

    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(cleanedResponse) as Record<string, unknown>;
    } catch (parseError) {
        // Truncated or malformed JSON (e.g. "Unterminated string") - try to salvage partial fields
        console.warn('Gemini response parse failed, attempting partial extraction:', parseError);
        parsed = extractPartialTriageResponse(cleanedResponse);
        if (!parsed.extracted_category && parsed.urgency_score === undefined) {
            console.error('Failed to parse Gemini response:', parseError, 'Response:', responseText);
            throw new Error('Failed to parse triage response from Gemini');
        }
    }

    return normalizeParsed(parsed);
}

/**
 * Analyze an issue using Gemini for triage
 */
export async function analyzeIssue(
    title: string,
    description: string
): Promise<AutomationOutput> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const titleSnippet = title.slice(0, 50) + (title.length > 50 ? '...' : '');
    const startMs = Date.now();
    console.log('[LLM] Gemini analyzeIssue: calling chat', { titleSnippet });

    const model = getModel();

    const userPrompt = `Analyze this student-reported campus issue:

Title: ${title}

Description: ${description}

Provide your analysis as a JSON object following the specified format.`;

    try {
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: TRIAGE_SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'I understand. I will analyze campus issues and respond with structured JSON containing category, urgency, impact scope, environmental flag, confidence, and reasoning. I will only use the valid categories you specified.' }],
                },
            ],
        });

        const result = await chat.sendMessage(userPrompt);
        const responseText = result.response.text();
        const output = parseTriageResponse(responseText);
        const elapsed = Date.now() - startMs;
        console.log('[LLM] Gemini analyzeIssue: done', {
            titleSnippet,
            extracted_category: output.extracted_category,
            urgency_score: output.urgency_score,
            confidence_score: output.confidence_score,
            elapsedMs: elapsed,
        });
        return output;
    } catch (error) {
        const elapsed = Date.now() - startMs;
        console.error('[LLM] Gemini analyzeIssue: failed', {
            titleSnippet,
            error: error instanceof Error ? error.message : String(error),
            elapsedMs: elapsed,
        });
        throw new Error(`Gemini analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Batch analyze multiple issues (for backfill or reprocessing)
 */
export async function analyzeIssuesBatch(
    issues: Array<{ id: string; title: string; description: string }>
): Promise<Map<string, AutomationOutput>> {
    const results = new Map<string, AutomationOutput>();

    // Process sequentially to avoid rate limits
    for (const issue of issues) {
        try {
            const result = await analyzeIssue(issue.title, issue.description);
            results.set(issue.id, result);

            // Small delay between requests to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed to analyze issue ${issue.id}:`, error);
            // Set a default result for failed analysis
            results.set(issue.id, {
                extracted_category: 'infrastructure',
                urgency_score: 0.5,
                impact_scope: 'single',
                environmental_flag: false,
                confidence_score: 0,
                reasoning: 'Analysis failed - using defaults',
            });
        }
    }

    return results;
}

/**
 * Check if Gemini API is available and configured
 */
export async function checkGeminiHealth(): Promise<{
    available: boolean;
    error?: string;
}> {
    if (!process.env.GEMINI_API_KEY) {
        return { available: false, error: 'GEMINI_API_KEY not configured' };
    }

    try {
        const model = getModel();
        const result = await model.generateContent('Respond with only the word "ok"');
        const text = result.response.text().toLowerCase();

        if (text.includes('ok')) {
            return { available: true };
        }
        return { available: false, error: 'Unexpected response from Gemini' };
    } catch (error) {
        return {
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
