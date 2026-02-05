/**
 * Dataset for spam-check testing: Hindi, English, Hinglish.
 * expectedSpam: true = should be classified as spam (by rules and/or LLM), false = legitimate.
 * ruleBasedCatches: when true, rule-based layer must flag; when false, intent is left to LLM (rules stay conservative).
 */

export interface SpamTestCase {
  title: string;
  description: string;
  expectedSpam: boolean;
  /** When true, rule-based check must return spam. When false and expectedSpam true, LLM handles intent. */
  ruleBasedCatches?: boolean;
  label?: string;
}

export const SPAM_DATASET: SpamTestCase[] = [
  // ========== SPAM – rule-based catches (unambiguous) ==========
  {
    title: 'mujhe maggi khila do please',
    description: 'kljsdflkdsjoqw kdads Additional details: How long has this been happening?: Just started How is this affecting you?: Safety concern',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Gibberish in description (rules catch; intent left to LLM)',
  },
  {
    title: 'test',
    description: 'just testing the form',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Test message',
  },
  {
    title: 'Testing',
    description: '',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Test title only',
  },
  {
    title: 'Hello World',
    description: 'Sample submission',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Placeholder',
  },
  {
    title: 'asdf',
    description: 'qwerty',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Keyboard mashing',
  },
  {
    title: 'Sample text',
    description: 'This is sample data for testing.',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Sample text',
  },
  {
    title: 'Hi',
    description: '',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Greeting only',
  },
  {
    title: 'Just kidding',
    description: 'No real issue here.',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Joke',
  },
  {
    title: 'Nothing',
    description: '',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'No content',
  },
  {
    title: 'Buy now 50% off',
    description: 'Click here for best deals on laptops http://spam.com',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Advertising',
  },
  {
    title: 'qwertyuiop',
    description: 'asdfghjkl zxcvbnm',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Keyboard rows',
  },
  {
    title: 'Issue',
    description: 'kljsdflkdsjoqw kdads mnxzbvclkqwe',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Gibberish description',
  },
  {
    title: 'xyz',
    description: 'abc',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Placeholder short',
  },
  // ========== SPAM – LLM catches (intent-based; rules stay conservative) ==========
  {
    title: 'Maggi chahiye',
    description: 'Hostel 2 se hoon, maggi do please.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Food request Hinglish',
  },
  {
    title: 'Give me food',
    description: 'I am hungry please send maggi to room 101.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Food request English',
  },
  {
    title: 'Chai pilao',
    description: 'Library me chai chahiye thak gaya hun.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Beverage joke Hinglish',
  },
  {
    title: 'Biryani do',
    description: 'Canteen closed, biryani chahiye please.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Food joke',
  },
  {
    title: 'mujhe laptop chahiye',
    description: 'mujhe naya laptop chahiye please arrange karo.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Personal want not facility issue',
  },
  {
    title: 'kuch nahi',
    description: 'sirf dekh raha tha',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Nothing / not an issue (Hinglish)',
  },
  {
    title: 'Ye test hai',
    description: 'Ignore karo ye message.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Test Hinglish (intent)',
  },
  {
    title: 'I want pizza',
    description: 'Please deliver to hostel block A.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Food want',
  },
  {
    title: 'sirf test kar raha hun',
    description: 'system check',
    expectedSpam: true,
    ruleBasedCatches: true,
    label: 'Testing Hinglish (explicit test)',
  },
  {
    title: 'khana khila do',
    description: 'Hostel 3 room 45.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Food request',
  },
  {
    title: 'Please give me some noodles',
    description: 'Maggi preferred. Room 12.',
    expectedSpam: true,
    ruleBasedCatches: false,
    label: 'Noodle request',
  },
  // ========== NOT SPAM ==========
  {
    title: 'Water leakage in 2nd floor washroom',
    description: 'Continuous leakage since morning. Block B second floor. Creating puddles.',
    expectedSpam: false,
    label: 'Real issue English',
  },
  {
    title: 'WiFi slow in library',
    description: 'Internet bahut slow hai library me. Since 2 days.',
    expectedSpam: false,
    label: 'Real issue Hinglish',
  },
  {
    title: 'Hostel bathroom tap broken',
    description: 'Tap टूट गया है, पानी बह रहा है. Hostel A ground floor.',
    expectedSpam: false,
    label: 'Real issue Hindi mix',
  },
  {
    title: 'AC not working in class',
    description: 'Room 101 AC not cooling. Very hot. Since yesterday.',
    expectedSpam: false,
    label: 'Real infrastructure',
  },
  {
    title: 'Street light not working',
    description: 'Path near canteen is dark. Safety concern for girls hostel route.',
    expectedSpam: false,
    label: 'Safety/infrastructure',
  },
  {
    title: 'No water supply',
    description: 'Hostel 2 me pani nahi aa raha. Morning se.',
    expectedSpam: false,
    label: 'Water supply Hinglish',
  },
  {
    title: 'Toilet flush not working',
    description: 'Block C first floor. Two toilets affected.',
    expectedSpam: false,
    label: 'Sanitation',
  },
  {
    title: 'Electricity gone',
    description: 'Whole wing 2nd floor no current since 1 hour.',
    expectedSpam: false,
    label: 'Power outage',
  },
  {
    title: 'Projector not working',
    description: 'Room 205 projector not turning on. Class at 10.',
    expectedSpam: false,
    label: 'Academic facility',
  },
  {
    title: 'Gate lock broken',
    description: 'Main gate lock broken. Security issue.',
    expectedSpam: false,
    label: 'Safety',
  },
];
