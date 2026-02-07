/**
 * Soft validation for report title/description to detect test or low-effort input.
 * Used to show a warning and discourage test messages; does not block submission.
 */

const TEST_PATTERNS = [
    /^test$/i,
    /^testing$/i,
    /^hello\s*world$/i,
    /^[0-9]+$/,
    /^qweasdzxc$/i,
    /^asdf$/i,
    /^abc$/i,
]

export function validateReportInput(
    title: string,
    description: string
): { isValid: boolean; warning: string | null } {
    const t = (title || '').trim()
    const d = (description || '').trim()

    const looksLikeTest = TEST_PATTERNS.some(
        (pattern) => pattern.test(t) && (d.length < 10 || pattern.test(d))
    )
    if (looksLikeTest) {
        return {
            isValid: false,
            warning:
                "This looks like a test message. If you have a real issue, please describe it so we can help.",
        }
    }

    if (t.length < 3 && d.length < 10) {
        return {
            isValid: false,
            warning: "Please provide a bit more detail about your issue so we can route it correctly.",
        }
    }

    return { isValid: true, warning: null }
}
