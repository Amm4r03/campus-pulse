/**
 * Template questions by category for smart triage (incomplete reports).
 */

import type { SmartQuestion } from './smart-questions-types'

export const QUESTION_TEMPLATES: Record<string, SmartQuestion[]> = {
  wifi: [
    { id: 'wifi_duration', text: 'How long has the WiFi been down?', type: 'select', suggestions: ['Less than 1 hour', '1-6 hours', '1 day', 'More than a day', 'Ongoing issue'], required: true },
    { id: 'wifi_impact', text: 'Who is affected?', type: 'select', suggestions: ['Just me', 'My room/floor', 'Entire building', 'Whole campus'], required: true },
    { id: 'wifi_reported', text: 'Has this been reported before?', type: 'select', suggestions: ['No, first time', 'Yes, awaiting response', 'Multiple times'], required: false },
  ],
  water: [
    { id: 'water_type', text: 'What type of water issue?', type: 'select', suggestions: ['No water', 'Low pressure', 'Leak', 'Contaminated', 'Hot water issue'], required: true },
    { id: 'water_duration', text: 'How long has this been happening?', type: 'select', suggestions: ['Just now', 'Few hours', '1 day', 'Multiple days'], required: true },
    { id: 'water_essential', text: 'Is this affecting essential water use?', type: 'yes_no', suggestions: ['Yes', 'No'], required: true, context: 'For drinking, cooking, or sanitation' },
  ],
  electricity: [
    { id: 'elec_type', text: 'What type of electrical issue?', type: 'select', suggestions: ['Power cut', 'Voltage fluctuation', 'Appliance not working', 'Wiring issue'], required: true },
    { id: 'elec_duration', text: 'How long has this been happening?', type: 'select', suggestions: ['Just now', 'Few minutes', 'Hours', 'Ongoing'], required: true },
    { id: 'elec_safety', text: 'Any sparking or burning smell?', type: 'yes_no', suggestions: ['Yes', 'No'], required: true, context: 'Safety concern' },
  ],
  safety: [
    { id: 'safety_status', text: 'Are you safe right now?', type: 'select', suggestions: ['Yes, I am safe', 'No - need help now', 'Others are at risk'], required: true, icon: '🆘' },
    { id: 'safety_ongoing', text: 'Is the situation ongoing?', type: 'select', suggestions: ['Just happened', 'Still happening', 'Resolved'], required: true },
    { id: 'safety_location', text: 'Where exactly is this happening?', type: 'text', suggestions: [], required: true, placeholder: 'Describe the specific location' },
  ],
  hostel: [
    { id: 'hostel_scope', text: 'How many students affected?', type: 'select', suggestions: ['Just me', 'Few rooms', 'Entire floor', 'Whole building'], required: true },
    { id: 'hostel_essential', text: 'Is this affecting essential services?', type: 'select', suggestions: ['Water', 'Food', 'Electricity', 'Security', 'Other'], required: true },
  ],
  default: [
    { id: 'default_duration', text: 'How long has this been happening?', type: 'select', suggestions: ['Just started', 'Today', 'This week', 'Longer'], required: true },
    { id: 'default_impact', text: 'How is this affecting you?', type: 'select', suggestions: ['Minor inconvenience', 'Significant disruption', 'Cannot use essential service', 'Safety concern'], required: true },
  ],
}
