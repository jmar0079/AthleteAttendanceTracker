export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused' | 'Unknown'

export type Athlete = {
  id: string
  firstName: string
  lastName: string
  studentId: string
  sport: string
  classification: string
  coach: string
  attendance: number
  missedClasses: number
  consecutiveAbsences: number
  trend: 'Improving' | 'Steady' | 'Declining'
  courses: string[]
}

export type AttendanceRecord = {
  id: string
  athleteId: string
  course: string
  date: string
  status: AttendanceStatus
  note?: string
  source?: 'manual'
}

export type AlertRecord = {
  id: string
  athleteId: string
  type: string
  severity: 'Warning' | 'Critical'
  date: string
  detail: string
  resolved: boolean
}

export const athletes: Athlete[] = [
  { id: 'a-01', firstName: 'Jordan', lastName: 'Ellis', studentId: 'STU-1042', sport: 'Baseball', classification: 'Junior', coach: 'Marcus Reid', attendance: 98, missedClasses: 1, consecutiveAbsences: 0, trend: 'Improving', courses: ['BIO 1301', 'ENG 1302', 'KIN 2301'] },
  { id: 'a-02', firstName: 'Maya', lastName: 'Brooks', studentId: 'STU-1088', sport: 'Soccer', classification: 'Senior', coach: 'Elena Hayes', attendance: 96, missedClasses: 2, consecutiveAbsences: 0, trend: 'Steady', courses: ['PSY 2301', 'HIS 1301', 'KIN 2301'] },
  { id: 'a-03', firstName: 'Caleb', lastName: 'Foster', studentId: 'STU-1116', sport: 'Basketball', classification: 'Sophomore', coach: 'Marcus Reid', attendance: 96, missedClasses: 1, consecutiveAbsences: 0, trend: 'Improving', courses: ['MAT 1314', 'BIO 1301', 'ENG 1302'] },
  { id: 'a-04', firstName: 'Avery', lastName: 'Coleman', studentId: 'STU-1153', sport: 'Track & Field', classification: 'Freshman', coach: 'Elena Hayes', attendance: 95, missedClasses: 2, consecutiveAbsences: 0, trend: 'Steady', courses: ['CHE 1401', 'HIS 1301', 'PSY 2301'] },
  { id: 'a-05', firstName: 'Nina', lastName: 'Carter', studentId: 'STU-1197', sport: 'Softball', classification: 'Junior', coach: 'Elena Hayes', attendance: 94, missedClasses: 2, consecutiveAbsences: 0, trend: 'Improving', courses: ['ENG 1302', 'BIO 1301', 'KIN 2301'] },
  { id: 'a-06', firstName: 'Ethan', lastName: 'Reyes', studentId: 'STU-1221', sport: 'Baseball', classification: 'Senior', coach: 'Marcus Reid', attendance: 93, missedClasses: 3, consecutiveAbsences: 0, trend: 'Steady', courses: ['MAT 1314', 'HIS 1301', 'BIO 1301'] },
  { id: 'a-07', firstName: 'Sofia', lastName: 'Mitchell', studentId: 'STU-1254', sport: 'Soccer', classification: 'Sophomore', coach: 'Elena Hayes', attendance: 92, missedClasses: 3, consecutiveAbsences: 0, trend: 'Improving', courses: ['PSY 2301', 'ENG 1302', 'KIN 2301'] },
  { id: 'a-08', firstName: 'Liam', lastName: 'Parker', studentId: 'STU-1290', sport: 'Basketball', classification: 'Freshman', coach: 'Marcus Reid', attendance: 91, missedClasses: 4, consecutiveAbsences: 1, trend: 'Steady', courses: ['CHE 1401', 'MAT 1314', 'BIO 1301'] },
  { id: 'a-09', firstName: 'Olivia', lastName: 'Turner', studentId: 'STU-1328', sport: 'Cross Country', classification: 'Junior', coach: 'Elena Hayes', attendance: 90, missedClasses: 4, consecutiveAbsences: 0, trend: 'Declining', courses: ['HIS 1301', 'PSY 2301', 'ENG 1302'] },
  { id: 'a-10', firstName: 'Noah', lastName: 'Bennett', studentId: 'STU-1361', sport: 'Baseball', classification: 'Sophomore', coach: 'Marcus Reid', attendance: 78, missedClasses: 6, consecutiveAbsences: 2, trend: 'Declining', courses: ['BIO 1301', 'MAT 1314', 'KIN 2301'] },
  { id: 'a-11', firstName: 'Isabella', lastName: 'Price', studentId: 'STU-1402', sport: 'Soccer', classification: 'Senior', coach: 'Elena Hayes', attendance: 76, missedClasses: 8, consecutiveAbsences: 3, trend: 'Declining', courses: ['ENG 1302', 'HIS 1301', 'PSY 2301'] },
  { id: 'a-12', firstName: 'Mason', lastName: 'Hayes', studentId: 'STU-1445', sport: 'Track & Field', classification: 'Freshman', coach: 'Elena Hayes', attendance: 68, missedClasses: 11, consecutiveAbsences: 3, trend: 'Declining', courses: ['CHE 1401', 'BIO 1301', 'MAT 1314'] },
]

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'r-01', athleteId: 'a-11', course: 'ENG 1302', date: '2025-03-18', status: 'Absent', note: 'Unexcused' },
  { id: 'r-02', athleteId: 'a-12', course: 'BIO 1301', date: '2025-03-18', status: 'Absent', note: 'Advisor follow-up requested' },
  { id: 'r-03', athleteId: 'a-10', course: 'MAT 1314', date: '2025-03-18', status: 'Late', note: 'Arrived 12 minutes late' },
  { id: 'r-04', athleteId: 'a-04', course: 'CHE 1401', date: '2025-03-18', status: 'Present' },
  { id: 'r-05', athleteId: 'a-02', course: 'PSY 2301', date: '2025-03-17', status: 'Excused', note: 'Team travel' },
  { id: 'r-06', athleteId: 'a-11', course: 'PSY 2301', date: '2025-03-17', status: 'Absent', note: 'Unexcused' },
  { id: 'r-07', athleteId: 'a-01', course: 'BIO 1301', date: '2025-03-17', status: 'Present' },
  { id: 'r-08', athleteId: 'a-12', course: 'MAT 1314', date: '2025-03-17', status: 'Absent', note: 'Unexcused' },
  { id: 'r-09', athleteId: 'a-10', course: 'BIO 1301', date: '2025-03-14', status: 'Absent', note: 'Unexcused' },
  { id: 'r-10', athleteId: 'a-05', course: 'ENG 1302', date: '2025-03-14', status: 'Present' },
  { id: 'r-11', athleteId: 'a-12', course: 'CHE 1401', date: '2025-03-14', status: 'Late', note: 'Arrived 8 minutes late' },
  { id: 'r-12', athleteId: 'a-03', course: 'MAT 1314', date: '2025-03-14', status: 'Present' },
]

export const alerts: AlertRecord[] = [
  { id: 'al-01', athleteId: 'a-12', type: 'Attendance below 70%', severity: 'Critical', date: '2025-03-18', detail: 'Attendance is 68% across current enrollments.', resolved: false },
  { id: 'al-02', athleteId: 'a-11', type: 'Three consecutive absences', severity: 'Critical', date: '2025-03-17', detail: 'Three consecutive absences recorded this week.', resolved: false },
  { id: 'al-03', athleteId: 'a-10', type: 'Attendance below 80%', severity: 'Warning', date: '2025-03-17', detail: 'Attendance is 78%, below the 80% team threshold.', resolved: false },
  { id: 'al-04', athleteId: 'a-09', type: 'Attendance decline over 15%', severity: 'Warning', date: '2025-03-14', detail: 'Attendance has declined 17% this month.', resolved: false },
]

export const attendanceTrend = [
  { label: 'Feb 3', value: 87 },
  { label: 'Feb 10', value: 89 },
  { label: 'Feb 17', value: 88 },
  { label: 'Feb 24', value: 91 },
  { label: 'Mar 3', value: 90 },
  { label: 'Mar 10', value: 92 },
  { label: 'Mar 17', value: 89 },
]

export function getAthleteName(athlete: Athlete) {
  return `${athlete.firstName} ${athlete.lastName}`
}

export function getAttendanceLevel(attendance: number) {
  if (attendance < 70) return 'Critical'
  if (attendance < 80) return 'At risk'
  return 'On track'
}
