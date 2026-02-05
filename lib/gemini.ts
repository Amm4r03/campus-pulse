/**
 * Campus Pulse - Gemini AI Service
 * Handles all LLM interactions for issue triage automation
 */

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { AutomationOutput, ImpactScope } from '@/domain/types';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model configuration
const MODEL_NAME = 'gemini-2.5-flash';

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
    maxOutputTokens: 1024,
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
 * System prompt for issue triage
 */
const TRIAGE_SYSTEM_PROMPT = `You are an intelligent issue triage assistant for Jamia Hamdard University campus in Delhi, India.

Your task is to analyze student-reported issues and extract structured information for automated routing and prioritization.

CONTEXT:
- Jamia Hamdard is a large university campus with hostels, academic blocks, hospital, sports complex, library, and canteens
- Students report issues ranging from infrastructure problems to academic concerns
- Your analysis helps administrators prioritize and route issues efficiently

VALID CATEGORIES (you MUST use one of these exactly):
- wifi: Internet connectivity, network issues
- water: Water supply, leaks, water cooler problems
- sanitation: Cleanliness, bathroom issues, garbage
- electricity: Power outages, lights, AC, fans, electrical faults
- hostel: Room issues, hostel facilities (not water/electricity which have their own categories)
- academics: Exam results, scheduling, professor issues, classroom problems
- safety: Security concerns, theft, emergencies
- food: Canteen quality, mess food, cafeteria issues
- infrastructure: General building maintenance, roads, furniture, other facilities

URGENCY SCORING (0.0 to 1.0):
- 0.9-1.0: Emergency/Safety critical (security threats, fire, floods, medical emergencies)
- 0.7-0.8: High urgency (complete service outage affecting many, health risks)
- 0.5-0.6: Medium urgency (significant inconvenience, partial outages)
- 0.3-0.4: Low-medium urgency (minor inconvenience, can wait)
- 0.1-0.2: Low urgency (suggestions, minor issues)

IMPACT SCOPE:
- "single": Affects one student or very small group
- "multi": Affects multiple students, whole hostel, floor, building, or campus-wide

ENVIRONMENTAL FLAG:
- true: Issues related to water, electricity, sanitation, infrastructure (environmental/sustainability impact)
- false: Issues like academics, food quality, hostel room assignments

CONFIDENCE SCORE (0.0 to 1.0):
- How confident you are in your analysis based on clarity of the report

OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object, no markdown, no explanation:
{
  "extracted_category": "one of the valid categories",
  "urgency_score": 0.5,
  "impact_scope": "single or multi",
  "environmental_flag": true or false,
  "confidence_score": 0.8,
  "reasoning": "brief explanation of your analysis"
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
 * Parse and validate Gemini response
 */
function parseTriageResponse(responseText: string): AutomationOutput {
    try {
        // Clean the response - remove markdown code blocks if present
        let cleanedResponse = responseText.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.slice(7);
        }
        if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.slice(3);
        }
        if (cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.slice(0, -3);
        }
        cleanedResponse = cleanedResponse.trim();

        const parsed = JSON.parse(cleanedResponse);

        // Validate and normalize category
        let category = parsed.extracted_category?.toLowerCase().trim();
        if (!VALID_CATEGORIES.includes(category)) {
            // Try to map common variations
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
                category = 'infrastructure'; // Default fallback
            }
        }

        // Validate urgency score
        let urgencyScore = parseFloat(parsed.urgency_score);
        if (isNaN(urgencyScore) || urgencyScore < 0 || urgencyScore > 1) {
            urgencyScore = 0.5;
        }

        // Validate impact scope
        let impactScope: ImpactScope = 'single';
        if (parsed.impact_scope === 'multi' || parsed.impact_scope === 'multiple') {
            impactScope = 'multi';
        }

        // Validate environmental flag
        const environmentalFlag = Boolean(parsed.environmental_flag);

        // Validate confidence score
        let confidenceScore = parseFloat(parsed.confidence_score);
        if (isNaN(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
            confidenceScore = 0.7;
        }

        return {
            extracted_category: category,
            urgency_score: urgencyScore,
            impact_scope: impactScope,
            environmental_flag: environmentalFlag,
            confidence_score: confidenceScore,
            reasoning: parsed.reasoning || 'No reasoning provided',
        };
    } catch (error) {
        console.error('Failed to parse Gemini response:', error, 'Response:', responseText);
        throw new Error('Failed to parse triage response from Gemini');
    }
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

        return parseTriageResponse(responseText);
    } catch (error) {
        console.error('Gemini API error:', error);
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
