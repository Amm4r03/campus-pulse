/**
 * Environment variable validation.
 * Call from server context (e.g. root layout or API) to fail fast if required vars are missing.
 */

const REQUIRED_SERVER = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const REQUIRED_FOR_LLM = ['GEMINI_API_KEY'] as const;

/**
 * Validate required env vars. Logs missing vars and in strict mode throws.
 * Safe to call from server components/layout; only runs in Node.
 */
export function validateEnv(options?: { strict?: boolean }): { ok: boolean; missing: string[] } {
    if (typeof process === 'undefined') {
        return { ok: true, missing: [] };
    }

    const all = [...REQUIRED_SERVER];
    const missing: string[] = [];

    for (const key of all) {
        const value = process.env[key];
        if (value === undefined || value === '') {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('[Campus Pulse] Missing required environment variables:', missing.join(', '));
        if (options?.strict) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    return { ok: missing.length === 0, missing };
}

/**
 * Check if LLM (Gemini) is configured. Use before calling triage/automation.
 */
export function isGeminiConfigured(): boolean {
    if (typeof process === 'undefined') return false;
    const key = process.env.GEMINI_API_KEY;
    return !!key && key.length > 0;
}
