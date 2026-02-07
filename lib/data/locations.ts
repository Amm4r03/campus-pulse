import type { Location, LocationType } from '@/types'

export const CAMPUS_LOCATIONS: Location[] = [
  // Hostels
  { id: 'hostel-boys-1', name: 'Boys Hostel 1', type: 'hostel', is_active: true },
  { id: 'hostel-boys-2', name: 'Boys Hostel 2', type: 'hostel', is_active: true },
  { id: 'hostel-boys-3', name: 'Boys Hostel 3', type: 'hostel', is_active: true },
  { id: 'hostel-girls-1', name: 'Girls Hostel 1', type: 'hostel', is_active: true },
  { id: 'hostel-girls-2', name: 'Girls Hostel 2', type: 'hostel', is_active: true },
  { id: 'hostel-international', name: 'International Hostel', type: 'hostel', is_active: true },
  
  // Academic Blocks (matches DB schema: academic_block)
  { id: 'block-a', name: 'Academic Block A', type: 'academic_block', is_active: true },
  { id: 'block-b', name: 'Academic Block B', type: 'academic_block', is_active: true },
  { id: 'block-c', name: 'Academic Block C', type: 'academic_block', is_active: true },
  { id: 'block-d', name: 'Academic Block D', type: 'academic_block', is_active: true },
  { id: 'pharmacy-block', name: 'Faculty of Pharmacy', type: 'academic_block', is_active: true },
  { id: 'nursing-block', name: 'College of Nursing', type: 'academic_block', is_active: true },
  { id: 'management-block', name: 'Faculty of Management', type: 'academic_block', is_active: true },
  { id: 'engineering-block', name: 'School of Engineering', type: 'academic_block', is_active: true },
  { id: 'law-block', name: 'Faculty of Law', type: 'academic_block', is_active: true },
  
  // Library (common_area per DB schema)
  { id: 'central-library', name: 'Central Library', type: 'common_area', is_active: true },
  { id: 'pharmacy-library', name: 'Pharmacy Library', type: 'common_area', is_active: true },
  
  // Sports
  { id: 'sports-complex', name: 'Sports Complex', type: 'sports', is_active: true },
  { id: 'gymnasium', name: 'Gymnasium', type: 'sports', is_active: true },
  { id: 'cricket-ground', name: 'Cricket Ground', type: 'sports', is_active: true },
  
  // Hospital
  { id: 'hahc-hospital', name: 'HAHC Hospital', type: 'hospital', is_active: true },
  { id: 'health-center', name: 'University Health Center', type: 'hospital', is_active: true },
  
  // Canteens
  { id: 'main-canteen', name: 'Main Canteen', type: 'canteen', is_active: true },
  { id: 'hostel-canteen', name: 'Hostel Canteen', type: 'canteen', is_active: true },
  { id: 'pharmacy-canteen', name: 'Pharmacy Canteen', type: 'canteen', is_active: true },
  
  // Other (common_area per DB schema)
  { id: 'admin-block', name: 'Administrative Block', type: 'common_area', is_active: true },
  { id: 'examination-hall', name: 'Examination Hall', type: 'common_area', is_active: true },
  { id: 'auditorium', name: 'University Auditorium', type: 'common_area', is_active: true },
  { id: 'parking', name: 'Parking Area', type: 'common_area', is_active: true },
  { id: 'main-gate', name: 'Main Gate', type: 'common_area', is_active: true },
]

// Helper to get location by ID
export function getLocationById(id: string): Location | undefined {
  return CAMPUS_LOCATIONS.find(loc => loc.id === id)
}

// Helper to get locations by type
export function getLocationsByType(type: Location['type']): Location[] {
  return CAMPUS_LOCATIONS.filter(loc => loc.type === type && loc.is_active)
}

// Group locations by type for select dropdowns
export function getGroupedLocations(): Record<string, Location[]> {
  return CAMPUS_LOCATIONS.reduce((acc, location) => {
    if (!location.is_active) return acc
    const type = location.type
    if (!acc[type]) acc[type] = []
    acc[type].push(location)
    return acc
  }, {} as Record<string, Location[]>)
}

// Location type labels for display (keys match domain/DB LocationType)
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  hostel: 'Hostels',
  academic_block: 'Academic Buildings',
  common_area: 'Common Areas',
  sports: 'Sports Facilities',
  hospital: 'Healthcare',
  canteen: 'Food & Dining',
}
