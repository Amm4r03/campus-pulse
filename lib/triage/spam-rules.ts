/**
 * Rule-based spam detection for campus issue reports.
 * Conservative: only flags unambiguous spam (test messages, gibberish, placeholders, ads).
 * Intent (e.g. food requests vs real complaints) is left to the LLM to avoid blocking real reports.
 */

export interface RuleSpamResult {
  isSpam: boolean;
  reason: string;
}

/** Unambiguous spam only: test/placeholder, greeting-only, gibberish, advertising. */
const SPAM_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Test / placeholder
  { pattern: /^test\s*$/i, reason: 'Test message' },
  { pattern: /^testing\s*$/i, reason: 'Test message' },
  { pattern: /^hello\s*world\s*$/i, reason: 'Placeholder message' },
  { pattern: /^asdf\s*$/i, reason: 'Keyboard mashing' },
  { pattern: /^qwe(rty)?\s*$/i, reason: 'Keyboard mashing' },
  { pattern: /^abc\s*$/i, reason: 'Placeholder' },
  { pattern: /^xyz\s*$/i, reason: 'Placeholder' },
  { pattern: /^sample\s*(text|data)?\s*$/i, reason: 'Sample text' },
  // Greeting / empty intent only (not "hi" inside a sentence)
  { pattern: /^(hi|hello|hey)\s*[,!]?\s*$/im, reason: 'Greeting only' },
  { pattern: /^(nothing|nope|naah|no)\s*[.!]?\s*$/im, reason: 'No real content' },
  // Explicit testing/joke (not intent in context)
  { pattern: /just\s+(testing|checking|kidding)\b/i, reason: 'Testing/joke' },
  { pattern: /sirf\s+test\s*(hai|kar\s*raha)/i, reason: 'Test message (Hinglish)' },
  // Gibberish
  { pattern: /[b-df-hj-np-tv-z]{8,}/i, reason: 'Gibberish (long consonant string)' },
  { pattern: /(.)\1{6,}/, reason: 'Repeated character gibberish' },
  // Advertising / off-topic
  { pattern: /(buy|discount|offer|click\s+here|http[s]?:\/\/)/i, reason: 'Advertising or link' },
];

/** Substrings that are unambiguous spam (no intent parsing). */
const SPAM_PHRASES: string[] = [
  'hello world',
  'qwerty',
  'asdfgh',
  'sample text',
  'testing 123',
];

/** Minimum length of "content" (title + description) to avoid flagging very short legitimate reports. */
const MIN_CONTENT_LENGTH_FOR_RULES = 10;

/**
 * Check if text looks like gibberish: high ratio of random-looking clusters.
 */
function looksLikeGibberish(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length < 15) return false;
  const consonantRun = /[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]{6,}/gi;
  const matches = t.match(consonantRun) || [];
  const gibberishLength = matches.join('').length;
  if (gibberishLength >= 12 && gibberishLength / t.length > 0.35) return true;
  const vowels = (t.match(/[aeiouAEIOU]/g) || []).length;
  if (t.length >= 20 && vowels < t.length * 0.15) return true;
  return false;
}

/**
 * Run rule-based spam check. Conservative: only obvious spam.
 * Intent (food requests, complaints vs jokes) is left to the LLM.
 */
export function ruleBasedSpamCheck(title: string, description: string): RuleSpamResult {
  const t = (title || '').trim();
  const d = (description || '').trim();
  const combined = `${t}\n${d}`.trim();
  const combinedLower = combined.toLowerCase();

  // Regex first (short unambiguous spam)
  const toCheck = [t, d, combined];
  for (const block of toCheck) {
    if (block.length < 2) continue;
    for (const { pattern, reason } of SPAM_PATTERNS) {
      if (pattern.test(block)) {
        return { isSpam: true, reason };
      }
    }
  }

  if (combined.length < MIN_CONTENT_LENGTH_FOR_RULES) {
    return { isSpam: false, reason: '' };
  }

  if (looksLikeGibberish(combined)) {
    return { isSpam: true, reason: 'Gibberish or keyboard mashing' };
  }

  for (const phrase of SPAM_PHRASES) {
    if (combinedLower.includes(phrase.toLowerCase())) {
      return { isSpam: true, reason: 'Known spam phrase' };
    }
  }

  return { isSpam: false, reason: '' };
}
