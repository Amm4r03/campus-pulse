import type { IssueCategory, Authority } from '@/types'

export const AUTHORITIES: Authority[] = [
  { id: 'provost', name: 'Provost Office', description: 'Handles hostel-related issues' },
  { id: 'admin-office', name: 'Administrative Office', description: 'Handles infrastructure and general campus issues' },
  { id: 'security', name: 'Security Department', description: 'Handles safety and security concerns' },
  { id: 'academic-affairs', name: 'Academic Affairs', description: 'Handles academic scheduling and results' },
  { id: 'it-services', name: 'IT Services', description: 'Handles technology and connectivity issues' },
  { id: 'maintenance', name: 'Maintenance Department', description: 'Handles repairs and maintenance' },
]

export const ISSUE_CATEGORIES: IssueCategory[] = [
  { 
    id: 'water-supply', 
    name: 'Water Supply', 
    is_environmental: true,
    default_authority_id: 'maintenance'
  },
  { 
    id: 'electricity', 
    name: 'Electricity/Power', 
    is_environmental: true,
    default_authority_id: 'maintenance'
  },
  { 
    id: 'wifi', 
    name: 'Wi-Fi/Internet', 
    is_environmental: false,
    default_authority_id: 'it-services'
  },
  { 
    id: 'ac-heating', 
    name: 'AC/Heating', 
    is_environmental: true,
    default_authority_id: 'maintenance'
  },
  { 
    id: 'sanitation', 
    name: 'Cleanliness/Sanitation', 
    is_environmental: true,
    default_authority_id: 'admin-office'
  },
  { 
    id: 'food-quality', 
    name: 'Food Quality', 
    is_environmental: true,
    default_authority_id: 'admin-office'
  },
  { 
    id: 'safety', 
    name: 'Safety/Security', 
    is_environmental: false,
    default_authority_id: 'security'
  },
  { 
    id: 'hostel-issues', 
    name: 'Hostel Issues', 
    is_environmental: false,
    default_authority_id: 'provost'
  },
  { 
    id: 'academic', 
    name: 'Academic Issues', 
    is_environmental: false,
    default_authority_id: 'academic-affairs'
  },
  { 
    id: 'timetable', 
    name: 'Timetable/Scheduling', 
    is_environmental: false,
    default_authority_id: 'academic-affairs'
  },
  { 
    id: 'results', 
    name: 'Results/Grades', 
    is_environmental: false,
    default_authority_id: 'academic-affairs'
  },
  { 
    id: 'furniture', 
    name: 'Furniture/Equipment', 
    is_environmental: false,
    default_authority_id: 'maintenance'
  },
  { 
    id: 'other', 
    name: 'Other', 
    is_environmental: false,
    default_authority_id: 'admin-office'
  },
]

// Helper to get category by ID
export function getCategoryById(id: string): IssueCategory | undefined {
  return ISSUE_CATEGORIES.find(cat => cat.id === id)
}

// Helper to get authority by ID
export function getAuthorityById(id: string): Authority | undefined {
  return AUTHORITIES.find(auth => auth.id === id)
}

// Get environmental categories
export function getEnvironmentalCategories(): IssueCategory[] {
  return ISSUE_CATEGORIES.filter(cat => cat.is_environmental)
}

// Get non-environmental categories
export function getNonEnvironmentalCategories(): IssueCategory[] {
  return ISSUE_CATEGORIES.filter(cat => !cat.is_environmental)
}

// Category grouping for forms
export const CATEGORY_GROUPS = {
  infrastructure: ['water-supply', 'electricity', 'ac-heating', 'furniture'],
  services: ['wifi', 'sanitation', 'food-quality'],
  safety: ['safety'],
  academic: ['academic', 'timetable', 'results'],
  hostel: ['hostel-issues'],
  other: ['other'],
}

export const CATEGORY_GROUP_LABELS: Record<keyof typeof CATEGORY_GROUPS, string> = {
  infrastructure: 'Infrastructure',
  services: 'Services',
  safety: 'Safety & Security',
  academic: 'Academic',
  hostel: 'Hostel',
  other: 'Other',
}
