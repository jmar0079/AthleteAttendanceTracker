import { alerts as sampleAlerts, attendanceRecords as sampleRecords } from './data'
import type { AlertRecord, AttendanceRecord, AttendanceStatus } from './data'

export type DemoRole = 'coach' | 'advisor' | 'athleticAdministrator' | 'systemAdministrator'

export type AdvisorNote = {
  id: string
  athleteId: string
  author: string
  text: string
  createdAt: string
}

export type DemoData = {
  version: 1
  role: DemoRole
  attendanceRecords: AttendanceRecord[]
  alerts: AlertRecord[]
  resolvedAlertIds: string[]
  advisorNotes: AdvisorNote[]
}

const storageKey = 'schreiner-athletics-attendance-demo-v1'

const defaultData: DemoData = {
  version: 1,
  role: 'coach',
  attendanceRecords: sampleRecords,
  alerts: sampleAlerts,
  resolvedAlertIds: [],
  advisorNotes: [],
}

const statuses: AttendanceStatus[] = ['Present', 'Late', 'Absent', 'Excused', 'Unknown']
const roles: DemoRole[] = ['coach', 'advisor', 'athleticAdministrator', 'systemAdministrator']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAttendanceRecord(value: unknown): value is AttendanceRecord {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.athleteId === 'string'
    && typeof value.course === 'string'
    && typeof value.date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
    && statuses.includes(value.status as AttendanceStatus)
    && (value.note === undefined || typeof value.note === 'string')
    && (value.source === undefined || value.source === 'manual')
}

function isAlert(value: unknown): value is AlertRecord {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.athleteId === 'string'
    && typeof value.type === 'string'
    && (value.severity === 'Warning' || value.severity === 'Critical')
    && typeof value.date === 'string'
    && typeof value.detail === 'string'
    && typeof value.resolved === 'boolean'
}

function isAdvisorNote(value: unknown): value is AdvisorNote {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.athleteId === 'string'
    && typeof value.author === 'string'
    && typeof value.text === 'string'
    && typeof value.createdAt === 'string'
    && !Number.isNaN(Date.parse(value.createdAt))
}

function isDemoData(value: unknown): value is DemoData {
  return isRecord(value)
    && value.version === 1
    && roles.includes(value.role as DemoRole)
    && Array.isArray(value.attendanceRecords)
    && value.attendanceRecords.every(isAttendanceRecord)
    && Array.isArray(value.alerts)
    && value.alerts.every(isAlert)
    && Array.isArray(value.resolvedAlertIds)
    && value.resolvedAlertIds.every((id) => typeof id === 'string')
    && Array.isArray(value.advisorNotes)
    && value.advisorNotes.every(isAdvisorNote)
}

export function readDemoData(): { data: DemoData; error: string | null } {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved === null) return { data: defaultData, error: null }

    const parsed: unknown = JSON.parse(saved)
    if (!isDemoData(parsed)) {
      return {
        data: defaultData,
        error: 'Saved demo data is invalid. Sample data is shown instead; refresh will retry saving.',
      }
    }

    return { data: parsed, error: null }
  } catch (error) {
    console.error('Unable to read saved attendance demo data.', error)
    return {
      data: defaultData,
      error: 'Saved demo data could not be read. Sample data is shown instead.',
    }
  }
}

export function writeDemoData(data: DemoData) {
  localStorage.setItem(storageKey, JSON.stringify(data))
}
