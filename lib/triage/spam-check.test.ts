/**
 * Spam check tests: rule-based layer (conservative) + full checkSpamNSFW.
 * Rules only assert on unambiguous spam; intent-based cases are left to the LLM.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ruleBasedSpamCheck } from './spam-rules';
import { checkSpamNSFW } from './spam-check';
import { SPAM_DATASET } from './spam-dataset';

describe('ruleBasedSpamCheck', () => {
  it('has at least 20 test cases', () => {
    expect(SPAM_DATASET.length).toBeGreaterThanOrEqual(20);
  });

  describe('SPAM_DATASET: rule-based only where ruleBasedCatches is set', () => {
    SPAM_DATASET.forEach(({ title, description, expectedSpam, ruleBasedCatches, label }, index) => {
      it(`case ${index + 1}: ${label ?? (expectedSpam ? 'spam' : 'not spam')} - "${title.slice(0, 40)}..."`, () => {
        const result = ruleBasedSpamCheck(title, description);
        // Rules must match only when we expect them to catch, or must not flag real issues
        if (ruleBasedCatches === true) {
          expect(result.isSpam).toBe(true);
        } else if (expectedSpam === false) {
          expect(result.isSpam).toBe(false);
        } else if (ruleBasedCatches === false) {
          // Intent-based spam: rules stay conservative, should not flag
          expect(result.isSpam).toBe(false);
        }
      });
    });
  });
});

describe('checkSpamNSFW', () => {
  const envRestore: Record<string, string | undefined> = {};

  beforeEach(() => {
    envRestore.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (envRestore.GEMINI_API_KEY !== undefined) {
      process.env.GEMINI_API_KEY = envRestore.GEMINI_API_KEY;
    }
  });

  it('returns spam when rule-based flags (gibberish) without API', async () => {
    const res = await checkSpamNSFW(
      'mujhe maggi khila do please',
      'kljsdflkdsjoqw kdads Additional details: How long?: Just started'
    );
    expect(res.isSpam).toBe(true);
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    expect(res.reason).toBeTruthy();
  });

  it('returns spam for test message via rules', async () => {
    const res = await checkSpamNSFW('test', 'just testing the form');
    expect(res.isSpam).toBe(true);
  });

  it('returns spam for gibberish description via rules', async () => {
    const res = await checkSpamNSFW(
      'Issue',
      'kljsdflkdsjoqw kdads mnxzbvclkqwe'
    );
    expect(res.isSpam).toBe(true);
  });

  it('does not flag real issue (rule-based passes through)', async () => {
    process.env.GEMINI_API_KEY = '';
    const res = await checkSpamNSFW(
      'Water leakage in 2nd floor washroom',
      'Continuous leakage since morning. Block B second floor.'
    );
    expect(res.isSpam).toBe(false);
  });

  it('does not flag real Hinglish issue', async () => {
    process.env.GEMINI_API_KEY = '';
    const res = await checkSpamNSFW(
      'WiFi slow in library',
      'Internet bahut slow hai library me. Since 2 days.'
    );
    expect(res.isSpam).toBe(false);
  });
});

describe('SPAM_DATASET rule-based consistency', () => {
  it('every case: rule-based result matches ruleBasedCatches / expectedSpam', () => {
    const failed: Array<{ index: number; label?: string; expected: boolean; got: boolean }> = [];
    SPAM_DATASET.forEach(({ title, description, expectedSpam, ruleBasedCatches, label }, index) => {
      const result = ruleBasedSpamCheck(title, description);
      if (ruleBasedCatches === true && !result.isSpam) {
        failed.push({ index: index + 1, label, expected: true, got: result.isSpam });
      } else if (expectedSpam === false && result.isSpam) {
        failed.push({ index: index + 1, label, expected: false, got: result.isSpam });
      } else if (ruleBasedCatches === false && expectedSpam === true && result.isSpam) {
        failed.push({ index: index + 1, label, expected: false, got: result.isSpam });
      }
    });
    expect(failed).toEqual([]);
  });
});
