import { describe, expect, it } from 'vitest'
import { studyDate, calendarValue } from '@/utils/studyPresentation'
describe('Salvador date presentation',()=>{
  it('displays 12-hour time and preserves the selected wall time across UTC storage',()=>{
    const stored = new Date('2026-09-18T14:30:00-06:00').toISOString()
    expect(calendarValue(stored)).toBe('2026-09-18T14:30')
    expect(studyDate(stored)).toMatch(/2:30.*p\./)
    expect(studyDate(stored)).not.toContain('14:30')
    expect(studyDate('2026-09-18T06:00:00Z')).toMatch(/12:00.*a\./)
    expect(studyDate(null)).toBe('Sin fecha')
  })
})
