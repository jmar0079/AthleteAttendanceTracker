import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  athletes,
  attendanceTrend,
  getAthleteName,
  getAttendanceLevel,
  type AlertRecord,
  type Athlete,
  type AttendanceRecord,
} from './data'
import { readDemoData, writeDemoData, type AdvisorNote, type DemoData, type DemoRole } from './storage'

type Page = 'overview' | 'roster' | 'attendance' | 'alerts' | 'reports'
type IconName = 'overview' | 'roster' | 'attendance' | 'alerts' | 'reports' | 'search' | 'bell' | 'chevron' | 'arrow' | 'download' | 'calendar' | 'close' | 'check' | 'trend' | 'users' | 'clock' | 'menu'
type ReportType = 'team' | 'risk' | 'attendance' | 'compliance'

const roleDetails: Record<DemoRole, { title: string; name: string; initials: string; description: string }> = {
  coach: { title: 'Coach', name: 'Marcus Reid', initials: 'MR', description: 'Assigned athletes only' },
  advisor: { title: 'Academic Advisor', name: 'Taylor Morgan', initials: 'TM', description: 'All student-athletes · Advisor notes' },
  athleticAdministrator: { title: 'Athletic Administrator', name: 'Athletics Office', initials: 'AO', description: 'All sports · Attendance management' },
  systemAdministrator: { title: 'System Administrator', name: 'System Admin', initials: 'SA', description: 'Demo administrator · Full sample data' },
}

const pageTitles: Record<Page, string> = {
  overview: 'Overview',
  roster: 'Team roster',
  attendance: 'Attendance',
  alerts: 'Alerts & follow-up',
  reports: 'Reports',
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  const paths: Record<IconName, React.ReactNode> = {
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    roster: <><path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H7.4A3.4 3.4 0 0 0 4 18.4V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M17 11a3.5 3.5 0 0 0 0-6.8M20 20v-1.6a3.4 3.4 0 0 0-2.5-3.3" /></>,
    attendance: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 14l2.2 2.2L16 11" /></>,
    alerts: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    reports: <><path d="M5 3.5h9l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20z" /><path d="M14 3.5V9h5M8 13h8M8 16.5h8" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    download: <><path d="M12 3.5v11m-4-4 4 4 4-4" /><path d="M5 16v4.5h14V16" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    trend: <><path d="m4 16 5-5 4 3 7-8" /><path d="M14 6h6v6" /></>,
    users: <><path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H7.4A3.4 3.4 0 0 0 4 18.4V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M17 11a3.5 3.5 0 0 0 0-6.8M20 20v-1.6a3.4 3.4 0 0 0-2.5-3.3" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  }
  return <svg {...shared}>{paths[name]}</svg>
}

function initials(athlete: Athlete) {
  return `${athlete.firstName[0]}${athlete.lastName[0]}`
}

function attendanceClass(value: number) {
  return value < 70 ? 'critical' : value < 80 ? 'warning' : 'good'
}

function currentAthlete(athlete: Athlete, records: AttendanceRecord[]): Athlete {
  const manualRecords = records.filter((record) => record.athleteId === athlete.id && record.source === 'manual')
  const countedRecords = manualRecords.filter((record) => record.status === 'Present' || record.status === 'Late' || record.status === 'Absent')
  const baselineClasses = 20
  const baselineAttended = Math.round((athlete.attendance / 100) * baselineClasses)
  const attendedNewClasses = countedRecords.filter((record) => record.status === 'Present' || record.status === 'Late').length
  const classCount = baselineClasses + countedRecords.length
  const attendance = classCount === 0 ? athlete.attendance : Math.round(((baselineAttended + attendedNewClasses) / classCount) * 100)
  const sortedRecords = [...manualRecords].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  let consecutiveAbsences = athlete.consecutiveAbsences
  if (sortedRecords.length > 0) {
    consecutiveAbsences = 0
    for (const record of sortedRecords) {
      if (record.status !== 'Absent') break
      consecutiveAbsences += 1
    }
  }
  return {
    ...athlete,
    attendance,
    missedClasses: athlete.missedClasses + manualRecords.filter((record) => record.status === 'Absent').length,
    consecutiveAbsences,
  }
}

function localDateValue() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function dateDaysAgo(days: number, baseDate = localDateValue()) {
  const date = new Date(`${baseDate}T12:00:00`)
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function currentRiskAlerts(athleteId: string, records: AttendanceRecord[], date: string): AlertRecord[] {
  const originalAthlete = athletes.find((athlete) => athlete.id === athleteId)
  if (!originalAthlete) return []

  const athlete = currentAthlete(originalAthlete, records)
  const candidates: AlertRecord[] = []
  if (athlete.attendance < 80) {
    const critical = athlete.attendance < 70
    candidates.push({
      id: `auto-${athlete.id}-attendance-${critical ? 'critical' : 'warning'}`,
      athleteId,
      type: critical ? 'Attendance below 70%' : 'Attendance below 80%',
      severity: critical ? 'Critical' : 'Warning',
      date,
      detail: `Attendance is now ${athlete.attendance}%, based on recorded class meetings.`,
      resolved: false,
    })
  }
  if (athlete.consecutiveAbsences >= 3) {
    candidates.push({
      id: `auto-${athlete.id}-absence-streak`,
      athleteId,
      type: 'Three consecutive absences',
      severity: 'Critical',
      date,
      detail: `${athlete.consecutiveAbsences} consecutive absences are recorded.`,
      resolved: false,
    })
  }

  const cutoff = dateDaysAgo(30, date)
  const recentAbsences = records.filter((record) =>
    record.athleteId === athlete.id && record.status === 'Absent' && record.date >= cutoff && record.date <= date,
  )
  if (recentAbsences.length >= 5) {
    candidates.push({
      id: `auto-${athlete.id}-monthly-absences`,
      athleteId,
      type: 'Five absences in 30 days',
      severity: 'Critical',
      date,
      detail: `${recentAbsences.length} unexcused absences were recorded in the last 30 days.`,
      resolved: false,
    })
  }

  return candidates
}

function alertStillApplies(alert: AlertRecord, athlete: Athlete, records: AttendanceRecord[]) {
  if (alert.type === 'Attendance below 70%') return athlete.attendance < 70
  if (alert.type === 'Attendance below 80%') return athlete.attendance < 80
  if (alert.type === 'Three consecutive absences') return athlete.consecutiveAbsences >= 3
  if (alert.type === 'Five absences in 30 days') {
    const cutoff = dateDaysAgo(30, alert.date)
    return records.filter((record) => record.athleteId === athlete.id
      && record.status === 'Absent'
      && record.date >= cutoff
      && record.date <= alert.date).length >= 5
  }
  return true
}

function App() {
  const [page, setPage] = useState<Page>('overview')
  const [query, setQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('All sports')
  const [riskFilter, setRiskFilter] = useState('All levels')
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [initialDemoData] = useState(readDemoData)
  const [role, setRole] = useState<DemoRole>(initialDemoData.data.role)
  const [records, setRecords] = useState<AttendanceRecord[]>(initialDemoData.data.attendanceRecords)
  const [savedAlerts, setSavedAlerts] = useState<AlertRecord[]>(initialDemoData.data.alerts)
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>(initialDemoData.data.resolvedAlertIds)
  const [advisorNotes, setAdvisorNotes] = useState<AdvisorNote[]>(initialDemoData.data.advisorNotes)
  const [storageError, setStorageError] = useState(initialDemoData.error)
  const [attendanceFilter, setAttendanceFilter] = useState('All statuses')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const roleInfo = roleDetails[role]
  const currentAthletes = useMemo(() => athletes.map((athlete) => currentAthlete(athlete, records)), [records])
  const visibleAthletes = useMemo(
    () => role === 'coach' ? currentAthletes.filter((athlete) => athlete.coach === roleDetails.coach.name) : currentAthletes,
    [currentAthletes, role],
  )
  const visibleIds = useMemo(() => new Set(visibleAthletes.map((athlete) => athlete.id)), [visibleAthletes])
  const openAlerts = savedAlerts.filter((alert) => {
    if (!visibleIds.has(alert.athleteId) || alert.resolved || resolvedAlerts.includes(alert.id)) return false
    const athlete = currentAthletes.find((item) => item.id === alert.athleteId)
    return athlete !== undefined && alertStillApplies(alert, athlete, records)
  })
  const averageAttendance = visibleAthletes.reduce((total, athlete) => total + athlete.attendance, 0) / (visibleAthletes.length || 1)
  const atRiskCount = visibleAthletes.filter((athlete) => athlete.attendance < 80).length
  const sports = [...new Set(visibleAthletes.map((athlete) => athlete.sport))]
  const canEditAttendance = role === 'athleticAdministrator' || role === 'systemAdministrator'
  const canAddAdvisorNotes = role === 'advisor'

  useEffect(() => {
    const data: DemoData = {
      version: 1,
      role,
      attendanceRecords: records,
      alerts: savedAlerts,
      resolvedAlertIds: resolvedAlerts,
      advisorNotes,
    }
    try {
      writeDemoData(data)
      setStorageError(null)
    } catch (error) {
      console.error('Unable to save attendance demo data.', error)
      setStorageError('Changes could not be saved in this browser. Check storage settings and try again.')
    }
  }, [role, records, savedAlerts, resolvedAlerts, advisorNotes])

  const filteredAthletes = useMemo(() => athletes.filter((athlete) => {
    if (!visibleIds.has(athlete.id)) return false
    const updatedAthlete = currentAthletes.find((item) => item.id === athlete.id) ?? athlete
    const athleteAlerts = openAlerts.filter((alert) => alert.athleteId === athlete.id).map((alert) => `${alert.type} ${alert.detail}`).join(' ')
    const matchesQuery = `${athlete.firstName} ${athlete.lastName} ${athlete.studentId} ${athlete.sport} ${athlete.coach} ${athlete.courses.join(' ')} ${athleteAlerts}`.toLowerCase().includes(query.toLowerCase())
    const matchesSport = sportFilter === 'All sports' || athlete.sport === sportFilter
    const level = getAttendanceLevel(updatedAthlete.attendance)
    const matchesRisk = riskFilter === 'All levels' || level === riskFilter
    return matchesQuery && matchesSport && matchesRisk
  }), [query, sportFilter, riskFilter, visibleIds, currentAthletes, openAlerts])

  const navigate = (nextPage: Page) => {
    setPage(nextPage)
    setMobileNavOpen(false)
  }

  const resolveAlert = (alert: AlertRecord) => {
    setResolvedAlerts((current) => current.includes(alert.id) ? current : [...current, alert.id])
  }

  const saveAttendanceRecord = (record: AttendanceRecord) => {
    if (!canEditAttendance) return
    const manualRecord: AttendanceRecord = { ...record, source: 'manual' }
    const nextRecords: AttendanceRecord[] = records.some((item) => item.id === record.id)
      ? records.map((item) => item.id === record.id ? manualRecord : item)
      : [...records, manualRecord]
    setRecords(nextRecords)

    const autoPrefix = `auto-${record.athleteId}-`
    const generatedAlerts = currentRiskAlerts(record.athleteId, nextRecords, record.date)
    const generatedIds = new Set(generatedAlerts.map((alert) => alert.id))
    setSavedAlerts((current) => {
      const previousAutoAlerts = new Map(current.filter((alert) => alert.id.startsWith(autoPrefix)).map((alert) => [alert.id, alert]))
      const retainedAlerts = current.filter((alert) => !alert.id.startsWith(autoPrefix))
      return [...retainedAlerts, ...generatedAlerts.map((alert) => previousAutoAlerts.get(alert.id) ?? alert)]
    })
    setResolvedAlerts((current) => current.filter((id) => !id.startsWith(autoPrefix) || generatedIds.has(id)))
  }

  const removeAttendanceRecord = (record: AttendanceRecord) => {
    if (!canEditAttendance || record.source !== 'manual') return
    const nextRecords = records.filter((item) => item.id !== record.id)
    setRecords(nextRecords)
    const autoPrefix = `auto-${record.athleteId}-`
    const generatedAlerts = currentRiskAlerts(record.athleteId, nextRecords, localDateValue())
    const generatedIds = new Set(generatedAlerts.map((alert) => alert.id))
    setSavedAlerts((current) => {
      const previousAutoAlerts = new Map(current.filter((alert) => alert.id.startsWith(autoPrefix)).map((alert) => [alert.id, alert]))
      const retainedAlerts = current.filter((alert) => !alert.id.startsWith(autoPrefix))
      return [...retainedAlerts, ...generatedAlerts.map((alert) => previousAutoAlerts.get(alert.id) ?? alert)]
    })
    setResolvedAlerts((current) => current.filter((id) => !id.startsWith(autoPrefix) || generatedIds.has(id)))
  }

  const saveAdvisorNote = (athleteId: string, text: string) => {
    if (!canAddAdvisorNotes || !text.trim()) return
    setAdvisorNotes((current) => [{
      id: `note-${Date.now()}-${crypto.randomUUID()}`,
      athleteId,
      author: roleInfo.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }, ...current])
  }

  const downloadCsv = (filename: string, rows: string[][]) => {
    const content = rows.map((row) => row.map((cell) => {
      const safeCell = /^[\s]*[=+\-@]/.test(cell) ? `'${cell}` : cell
      return `"${safeCell.replaceAll('"', '""')}"`
    }).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportAthletes = (filename: string, roster: Athlete[]) => downloadCsv(filename, [
    ['Name', 'Student ID', 'Sport', 'Classification', 'Attendance', 'Risk level', 'Coach'],
    ...roster.map((athlete) => [getAthleteName(athlete), athlete.studentId, athlete.sport, athlete.classification, `${athlete.attendance}%`, getAttendanceLevel(athlete.attendance), athlete.coach]),
  ])

  const exportRoster = () => exportAthletes('athlete-roster-sample.csv', filteredAthletes)

  const exportReport = (report: ReportType) => {
    if (report === 'team') {
      exportAthletes('team-attendance-sample.csv', visibleAthletes)
      return
    }

    if (report === 'risk') {
      const atRiskAthletes = visibleAthletes.filter((athlete) => athlete.attendance < 80)
      downloadCsv('athletes-below-threshold-sample.csv', [
        ['Name', 'Student ID', 'Sport', 'Attendance', 'Risk level', 'Missed classes', 'Coach'],
        ...atRiskAthletes.map((athlete) => [getAthleteName(athlete), athlete.studentId, athlete.sport, `${athlete.attendance}%`, getAttendanceLevel(athlete.attendance), athlete.missedClasses.toString(), athlete.coach]),
      ])
      return
    }

    if (report === 'attendance') {
      const athleteById = new Map(visibleAthletes.map((athlete) => [athlete.id, athlete]))
      downloadCsv('recent-attendance-sample.csv', [
      ['Name', 'Student ID', 'Course', 'Date', 'Status', 'Notes'],
      ...records.filter((record) => athleteById.has(record.athleteId)).map((record) => {
        const athlete = athleteById.get(record.athleteId)
        return [athlete ? getAthleteName(athlete) : '', athlete?.studentId ?? '', record.course, record.date, record.status, record.note ?? '']
      }),
      ])
      return
    }

    downloadCsv('compliance-summary-sample.csv', [
      ['Name', 'Student ID', 'Sport', 'Attendance', 'Below 80%', 'Open alerts'],
      ...visibleAthletes.map((athlete) => [
        getAthleteName(athlete),
        athlete.studentId,
        athlete.sport,
        `${athlete.attendance}%`,
        athlete.attendance < 80 ? 'Yes' : 'No',
        openAlerts.filter((alert) => alert.athleteId === athlete.id).map((alert) => alert.type).join('; '),
      ]),
    ])
  }

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span>S</span><i /></div>
          <div className="brand-copy"><strong>Schreiner</strong><span>ATHLETICS</span></div>
          <button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>

        <div className="workspace-label">ATHLETICS</div>
        <nav className="side-nav" aria-label="Main navigation">
          {([
            ['overview', 'Overview', 'overview'],
            ['roster', 'Team roster', 'roster'],
            ['attendance', 'Attendance', 'attendance'],
            ['alerts', 'Alerts', 'alerts'],
            ['reports', 'Reports', 'reports'],
          ] as [Page, string, IconName][]).map(([id, label, icon]) => (
            <button key={id} className={`nav-link ${page === id ? 'nav-active' : ''}`} onClick={() => navigate(id)}>
              <Icon name={icon} />
              <span>{label}</span>
              {id === 'alerts' && openAlerts.length > 0 && <span className="nav-count">{openAlerts.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="season-card">
            <span className="season-kicker">CURRENT TERM</span>
            <strong>Spring 2025</strong>
            <span className="season-date"><Icon name="calendar" size={14} /> Jan 13 – May 9</span>
          </div>
          <div className="profile-switch">
            <span className="avatar avatar-coach">{roleInfo.initials}</span>
            <span className="profile-copy"><strong>{roleInfo.name}</strong><small>{roleInfo.title}</small></span>
          </div>
          <label className="role-picker"><span>SWITCH DEMO ROLE</span><select aria-label="Switch demo role" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}>
            <option value="coach">Coach</option>
            <option value="advisor">Academic Advisor</option>
            <option value="athleticAdministrator">Athletic Administrator</option>
            <option value="systemAdministrator">System Administrator</option>
          </select></label>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumbs"><span>Athletics</span><span className="crumb-slash">/</span><strong>{pageTitles[page]}</strong></div>
          <div className="topbar-actions">
            <label className="global-search">
              <Icon name="search" size={17} />
              <input aria-label="Search athletes" placeholder="Search athletes..." value={query} onChange={(event) => { setQuery(event.target.value); setPage('roster') }} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="notification-button" onClick={() => navigate('alerts')} aria-label={`${openAlerts.length} open alerts`}>
              <Icon name="bell" />
              {openAlerts.length > 0 && <span className="notification-dot" />}
            </button>
            <div className="topbar-divider" />
            <span className="avatar avatar-coach topbar-avatar">{roleInfo.initials}</span>
          </div>
        </header>

        <div className="page-content">
          <div className="demo-notice"><span className="demo-dot" /><strong>Sample workspace</strong><span>Demo data only · Not connected to live student records</span></div>
          {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
          <div className="role-notice"><strong>{roleInfo.title} demo view</strong><span>{roleInfo.description}. Role selection is a local demo control, not authentication or security.</span></div>
          {page === 'overview' && <OverviewPage
            athletes={visibleAthletes}
            averageAttendance={averageAttendance}
            atRiskCount={atRiskCount}
            openAlerts={openAlerts}
            onNavigate={navigate}
            onSelectAthlete={setSelectedAthlete}
          />}
          {page === 'roster' && <RosterPage
            allAthletes={visibleAthletes}
            totalAthletes={visibleAthletes.length}
            query={query}
            setQuery={setQuery}
            sports={sports}
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            riskFilter={riskFilter}
            setRiskFilter={setRiskFilter}
            filteredAthletes={filteredAthletes}
            onExport={exportRoster}
            onSelectAthlete={setSelectedAthlete}
          />}
          {page === 'attendance' && <AttendancePage
            athletes={visibleAthletes}
            records={records.filter((record) => visibleIds.has(record.athleteId))}
            filter={attendanceFilter}
            setFilter={setAttendanceFilter}
            canEdit={canEditAttendance}
            onSave={saveAttendanceRecord}
            onDelete={removeAttendanceRecord}
          />}
          {page === 'alerts' && <AlertsPage athletes={visibleAthletes} alerts={openAlerts} onResolve={resolveAlert} onSelectAthlete={(id) => {
            const athlete = visibleAthletes.find((item) => item.id === id)
            if (athlete) setSelectedAthlete(athlete)
          }} />}
          {page === 'reports' && <ReportsPage
            athletes={visibleAthletes}
            records={records.filter((record) => visibleIds.has(record.athleteId))}
            onExport={exportReport}
          />}
          <footer className="page-footer"><span>Schreiner University Athletics</span><span>Attendance support · Sample environment</span></footer>
        </div>
      </main>
      {selectedAthlete && visibleIds.has(selectedAthlete.id) && <AthleteDrawer
        athlete={currentAthletes.find((athlete) => athlete.id === selectedAthlete.id) ?? selectedAthlete}
        records={records}
        alerts={openAlerts.filter((alert) => alert.athleteId === selectedAthlete.id)}
        advisorNotes={advisorNotes.filter((note) => note.athleteId === selectedAthlete.id)}
        canAddNotes={canAddAdvisorNotes}
        canViewNotes={canAddAdvisorNotes}
        onSaveNote={(text) => saveAdvisorNote(selectedAthlete.id, text)}
        onClose={() => setSelectedAthlete(null)}
      />}
    </div>
  )
}

function OverviewPage({ athletes: roster, averageAttendance, atRiskCount, openAlerts, onNavigate, onSelectAthlete }: {
  athletes: Athlete[]
  averageAttendance: number
  atRiskCount: number
  openAlerts: AlertRecord[]
  onNavigate: (page: Page) => void
  onSelectAthlete: (athlete: Athlete) => void
}) {
  const distribution = [
    { label: '90–100%', count: roster.filter((athlete) => athlete.attendance >= 90).length, color: 'var(--green)' },
    { label: '80–89%', count: roster.filter((athlete) => athlete.attendance >= 80 && athlete.attendance < 90).length, color: 'var(--blue)' },
    { label: '70–79%', count: roster.filter((athlete) => athlete.attendance >= 70 && athlete.attendance < 80).length, color: 'var(--amber)' },
    { label: 'Below 70%', count: roster.filter((athlete) => athlete.attendance < 70).length, color: 'var(--red)' },
  ]
  let distributionStart = 0
  const distributionGradient = distribution.map((item) => {
    const start = distributionStart
    distributionStart += (item.count / (roster.length || 1)) * 100
    return `${item.color} ${start}% ${distributionStart}%`
  }).join(', ')

  return (
    <>
      <section className="welcome-row">
        <div><p className="eyebrow">SAMPLE DATA <span className="eyebrow-divider">·</span> SPRING 2025</p><h1>Good morning</h1><p className="welcome-subtitle">Here’s how your student-athletes are showing up this week.</p></div>
        <button className="button button-secondary" onClick={() => onNavigate('reports')}><Icon name="download" size={16} /> Export report</button>
      </section>

      <section className="metric-grid" aria-label="Attendance metrics">
        <MetricCard label="Roster size" value={roster.length.toString()} note="Active student-athletes" icon="users" tone="blue" />
        <MetricCard label="Average attendance" value={`${averageAttendance.toFixed(1)}%`} note={<><span className="trend-up"><Icon name="trend" size={13} /> 2.4%</span> vs. last month</>} icon="attendance" tone="green" />
        <MetricCard label="At-risk athletes" value={atRiskCount.toString()} note="Below 80% attendance" icon="alerts" tone="amber" action={() => onNavigate('roster')} />
        <MetricCard label="Open alerts" value={openAlerts.length.toString()} note="Needs your attention" icon="bell" tone="red" action={() => onNavigate('alerts')} />
      </section>

      <section className="overview-grid">
        <div className="card trend-card">
          <div className="card-heading"><div><h2>Attendance trend</h2><p>Team-wide weekly average</p></div><button className="period-select" aria-label="Selected period: last 7 weeks">Last 7 weeks <Icon name="chevron" size={14} /></button></div>
          <div className="trend-summary"><strong>{averageAttendance.toFixed(1)}%</strong><span className="trend-up"><Icon name="trend" size={14} /> 2.4%</span><small>compared to last month</small></div>
          <AttendanceChart />
        </div>

        <div className="card distribution-card">
          <div className="card-heading"><div><h2>Attendance distribution</h2><p>Students by attendance rate</p></div><button className="quiet-icon" onClick={() => onNavigate('roster')} aria-label="View team roster"><Icon name="arrow" size={17} /></button></div>
          <div className="distribution-content">
            <div className="donut" style={{ background: `conic-gradient(${distributionGradient})` }} role="img" aria-label={`${distribution.map((item) => `${item.count} students ${item.label}`).join(', ')}`}>
              <div><strong>{roster.length}</strong><span>athletes</span></div>
            </div>
            <div className="legend-list">{distribution.map((item) => <div className="legend-row" key={item.label}><span className="legend-label"><i style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.count}</strong></div>)}</div>
          </div>
          <div className="distribution-footer"><span>Attendance goal</span><strong>80% <span>minimum</span></strong></div>
        </div>
      </section>

      <section className="card alerts-card">
        <div className="card-heading alerts-heading"><div><div className="heading-with-count"><h2>Recent attendance issues</h2><span className="subtle-count">{openAlerts.length}</span></div><p>Students who may need a check-in</p></div><button className="text-button" onClick={() => onNavigate('alerts')}>View all alerts <Icon name="arrow" size={15} /></button></div>
        {openAlerts.length === 0 ? <EmptyState title="All caught up" detail="There are no open attendance alerts right now." /> : <div className="alert-list">{openAlerts.slice(0, 3).map((alert) => {
          const athlete = roster.find((item) => item.id === alert.athleteId)
          if (!athlete) return null
          return <button className="alert-row" key={alert.id} onClick={() => onSelectAthlete(athlete)}>
            <span className={`alert-symbol ${alert.severity === 'Critical' ? 'alert-symbol-critical' : ''}`}><Icon name={alert.severity === 'Critical' ? 'alerts' : 'clock'} size={17} /></span>
            <span className="alert-person"><strong>{getAthleteName(athlete)}</strong><small>{athlete.sport} <span>·</span> {athlete.studentId}</small></span>
            <span className={`severity-pill severity-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
            <span className="alert-description">{alert.type}</span>
            <span className="alert-date">{formatDate(alert.date)}</span>
            <Icon name="arrow" size={16} />
          </button>
        })}</div>}
      </section>
    </>
  )
}

function MetricCard({ label, value, note, icon, tone, action }: {
  label: string
  value: string
  note: ReactNode
  icon: IconName
  tone: string
  action?: () => void
}) {
  return <button className={`metric-card metric-${tone} ${action ? 'metric-action' : ''}`} onClick={action} disabled={!action}>
    <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon name={icon} size={18} /></span></div>
    <strong className="metric-value">{value}</strong>
    <span className="metric-note">{note}</span>
  </button>
}

function AttendanceChart() {
  const chartWidth = 640
  const chartHeight = 156
  const points = attendanceTrend.map((point, index) => {
    const x = 12 + index * ((chartWidth - 24) / (attendanceTrend.length - 1))
    const y = chartHeight - 14 - ((point.value - 75) / 25) * (chartHeight - 24)
    return { ...point, x, y }
  })
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const area = `${line} L ${points.at(-1)?.x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  return <div className="chart-wrap">
    <svg className="attendance-chart" viewBox={`0 0 ${chartWidth} ${chartHeight + 25}`} preserveAspectRatio="none" role="img" aria-label="Weekly attendance trend from 87 percent to 89 percent">
      {[80, 85, 90, 95].map((value) => {
        const y = chartHeight - 14 - ((value - 75) / 25) * (chartHeight - 24)
        return <g key={value}><line x1="10" x2={chartWidth} y1={y} y2={y} className="chart-grid" /><text x="0" y={y - 4} className="chart-axis-label">{value}%</text></g>
      })}
      <path d={area} className="chart-area" />
      <path d={line} className="chart-line" />
      {points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="3.5" className="chart-point"><title>{point.label}: {point.value}%</title></circle>)}
      {points.map((point) => <text key={point.label} x={point.x} y={chartHeight + 17} textAnchor="middle" className="chart-date">{point.label}</text>)}
    </svg>
  </div>
}

function RosterPage({ allAthletes, totalAthletes, query, setQuery, sports, sportFilter, setSportFilter, riskFilter, setRiskFilter, filteredAthletes, onExport, onSelectAthlete }: {
  allAthletes: Athlete[]
  totalAthletes: number
  query: string
  setQuery: (value: string) => void
  sports: string[]
  sportFilter: string
  setSportFilter: (value: string) => void
  riskFilter: string
  setRiskFilter: (value: string) => void
  filteredAthletes: Athlete[]
  onExport: () => void
  onSelectAthlete: (athlete: Athlete) => void
}) {
  const [classificationFilter, setClassificationFilter] = useState('All classes')
  const [sortBy, setSortBy] = useState('Name A–Z')
  const classifications = [...new Set(allAthletes.map((athlete) => athlete.classification))].sort()
  const rosterRows = [...filteredAthletes]
    .filter((athlete) => classificationFilter === 'All classes' || athlete.classification === classificationFilter)
    .sort((a, b) => {
      if (sortBy === 'Attendance high–low') return b.attendance - a.attendance
      if (sortBy === 'Attendance low–high') return a.attendance - b.attendance
      if (sortBy === 'Classification') return a.classification.localeCompare(b.classification) || a.lastName.localeCompare(b.lastName)
      return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    })

  return <>
    <section className="section-title-row"><div><p className="eyebrow">STUDENT-ATHLETE DIRECTORY</p><h1>Team roster</h1><p className="welcome-subtitle">Search and review attendance across your assigned student-athletes.</p></div><button className="button button-secondary" onClick={onExport}><Icon name="download" size={16} /> Export CSV</button></section>
    <section className="card roster-card">
      <div className="roster-toolbar">
        <label className="roster-search"><Icon name="search" size={17} /><input aria-label="Search roster by name or student ID" placeholder="Search name or student ID..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={14} /></button>}</label>
        <label className="filter-select"><span className="sr-only">Filter by sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option>All sports</option>{sports.map((sport) => <option key={sport}>{sport}</option>)}</select><Icon name="chevron" size={14} /></label>
        <label className="filter-select"><span className="sr-only">Filter by attendance risk</span><select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}><option>All levels</option><option>On track</option><option>At risk</option><option>Critical</option></select><Icon name="chevron" size={14} /></label>
        <label className="filter-select"><span className="sr-only">Filter by classification</span><select value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)}><option>All classes</option>{classifications.map((classification) => <option key={classification}>{classification}</option>)}</select><Icon name="chevron" size={14} /></label>
        <label className="filter-select"><span className="sr-only">Sort roster</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option>Name A–Z</option><option>Attendance high–low</option><option>Attendance low–high</option><option>Classification</option></select><Icon name="chevron" size={14} /></label>
      </div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>STUDENT-ATHLETE</th><th>SPORT</th><th>CLASS</th><th>ATTENDANCE</th><th>RISK STATUS</th><th>COACH</th><th><span className="sr-only">View details</span></th></tr></thead>
        <tbody>{rosterRows.map((athlete) => <tr key={athlete.id}>
          <td><button className="student-cell" onClick={() => onSelectAthlete(athlete)}><span className={`avatar avatar-${athlete.sport.toLowerCase().replaceAll(/[^a-z]/g, '')}`}>{initials(athlete)}</span><span><strong>{getAthleteName(athlete)}</strong><small>{athlete.studentId}</small></span></button></td>
          <td>{athlete.sport}</td><td>{athlete.classification}</td>
          <td><div className="attendance-cell"><span className="attendance-track"><i style={{ width: `${athlete.attendance}%` }} className={attendanceClass(athlete.attendance)} /></span><strong>{athlete.attendance}%</strong></div></td>
          <td><span className={`risk-status risk-${attendanceClass(athlete.attendance)}`}><i />{getAttendanceLevel(athlete.attendance)}</span></td>
          <td>{athlete.coach}</td><td><button className="table-action" onClick={() => onSelectAthlete(athlete)} aria-label={`View ${getAthleteName(athlete)} profile`}><Icon name="arrow" size={16} /></button></td>
        </tr>)}</tbody>
      </table></div>
      <div className="table-footer"><span>Showing <strong>{rosterRows.length}</strong> of <strong>{totalAthletes}</strong> student-athletes</span><span>Attendance threshold: <strong>80%</strong></span></div>
      {rosterRows.length === 0 && <div className="table-empty"><EmptyState title="No athletes found" detail="Try changing your search or filters." /></div>}
    </section>
  </>
}

function AttendancePage({ athletes: roster, records, filter, setFilter, canEdit, onSave, onDelete }: {
  athletes: Athlete[]
  records: AttendanceRecord[]
  filter: string
  setFilter: (value: string) => void
  canEdit: boolean
  onSave: (record: AttendanceRecord) => void
  onDelete: (record: AttendanceRecord) => void
}) {
  const [query, setQuery] = useState('')
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const filteredRows = records.filter((record) => {
    const athlete = roster.find((item) => item.id === record.athleteId)
    if (!athlete) return false
    const matchesStatus = filter === 'All statuses' || record.status === filter
    const matchesQuery = `${getAthleteName(athlete)} ${athlete.studentId} ${record.course} ${record.note ?? ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesStatus && matchesQuery
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  const pageSize = 10
  const pageCount = Math.ceil(filteredRows.length / pageSize)
  const rows = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  useEffect(() => {
    setPageIndex(0)
  }, [filter, query])

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(pageCount - 1, 0)))
  }, [pageCount])

  const startEditing = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setFormOpen(true)
  }

  const finishForm = () => {
    setEditingRecord(null)
    setFormOpen(false)
  }

  return <>
    <section className="section-title-row"><div><p className="eyebrow">CLASSROOM CHECK-INS</p><h1>Attendance</h1><p className="welcome-subtitle">Review class check-ins and keep attendance records up to date.</p></div>{canEdit ? <button className="button button-primary" onClick={() => { setEditingRecord(null); setFormOpen((open) => !open) }}>{formOpen && !editingRecord ? 'Close form' : 'Record attendance'}</button> : <span className="permission-note">Read only for this demo role</span>}</section>
    <section className="card roster-card">
      {formOpen && canEdit && <AttendanceForm athletes={roster} records={records} existing={editingRecord} onSave={(record) => { onSave(record); finishForm() }} onCancel={finishForm} />}
      <div className="roster-toolbar">
        <label className="roster-search"><Icon name="search" size={17} /><input aria-label="Search attendance records" placeholder="Search athlete or course..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={14} /></button>}</label>
        <div className="toolbar-summary"><strong>Attendance history</strong><span>{filteredRows.length} entries</span></div>
        <label className="filter-select"><span className="sr-only">Filter attendance status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All statuses</option><option>Present</option><option>Late</option><option>Absent</option><option>Excused</option><option>Unknown</option></select><Icon name="chevron" size={14} /></label>
      </div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>STUDENT-ATHLETE</th><th>COURSE</th><th>DATE</th><th>STATUS</th><th>NOTES</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{rows.map((record) => <AttendanceRow key={record.id} record={record} athlete={roster.find((item) => item.id === record.athleteId)!} canEdit={canEdit} onEdit={startEditing} onDelete={onDelete} />)}</tbody>
      </table></div>
      {filteredRows.length === 0 && <div className="table-empty"><EmptyState title="No records found" detail={query ? 'Try another athlete or course search.' : 'There are no attendance records for this filter.'} /></div>}
      <div className="table-footer"><span>Showing <strong>{rows.length ? pageIndex * pageSize + 1 : 0}–{Math.min((pageIndex + 1) * pageSize, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong> records</span><div className="pagination"><button className="pagination-button" disabled={pageIndex === 0} onClick={() => setPageIndex((current) => current - 1)}>Previous</button><span>Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}</span><button className="pagination-button" disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex((current) => current + 1)}>Next</button></div></div>
    </section>
  </>
}

function AttendanceForm({ athletes: roster, records, existing, onSave, onCancel }: {
  athletes: Athlete[]
  records: AttendanceRecord[]
  existing: AttendanceRecord | null
  onSave: (record: AttendanceRecord) => void
  onCancel: () => void
}) {
  const [athleteId, setAthleteId] = useState(existing?.athleteId ?? roster[0]?.id ?? '')
  const athlete = roster.find((item) => item.id === athleteId)
  const [course, setCourse] = useState(existing?.course ?? athlete?.courses[0] ?? '')
  const [date, setDate] = useState(existing?.date ?? localDateValue())
  const [status, setStatus] = useState<AttendanceRecord['status']>(existing?.status ?? 'Present')
  const [note, setNote] = useState(existing?.note ?? '')
  const [formError, setFormError] = useState('')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!athleteId || !course || !date) {
      setFormError('Choose a student-athlete, course, and date.')
      return
    }
    if (new Date(`${date}T00:00:00`).getTime() > new Date(`${localDateValue()}T00:00:00`).getTime()) {
      setFormError('Attendance cannot be recorded for a future date.')
      return
    }
    const duplicate = records.some((record) =>
      record.id !== existing?.id
      && record.athleteId === athleteId
      && record.course === course
      && record.date === date,
    )
    if (duplicate) {
      setFormError('An attendance record already exists for this student, course, and date.')
      return
    }
    onSave({
      id: existing?.id ?? `manual-${crypto.randomUUID()}`,
      athleteId,
      course,
      date,
      status,
      note: note.trim() || undefined,
      source: 'manual',
    })
  }

  return <form className="attendance-form" onSubmit={submit}>
    <div className="form-heading"><div><h2>{existing ? 'Edit attendance record' : 'Record attendance'}</h2><p>Choose a class meeting and save its attendance status.</p></div></div>
    {formError && <p className="form-error" role="alert">{formError}</p>}
    <div className="form-grid">
      <label className="form-field"><span>Student-athlete</span><select required value={athleteId} onChange={(event) => { setAthleteId(event.target.value); setCourse(roster.find((item) => item.id === event.target.value)?.courses[0] ?? '') }}>{roster.map((item) => <option key={item.id} value={item.id}>{getAthleteName(item)} · {item.studentId}</option>)}</select></label>
      <label className="form-field"><span>Course</span><select required value={course} onChange={(event) => setCourse(event.target.value)}>{(athlete?.courses ?? []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="form-field"><span>Date</span><input type="date" required max={localDateValue()} value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="form-field"><span>Status</span><select required value={status} onChange={(event) => setStatus(event.target.value as AttendanceRecord['status'])}><option>Present</option><option>Late</option><option>Absent</option><option>Excused</option><option>Unknown</option></select></label>
      <label className="form-field form-field-wide"><span>Note <small>(optional, 300 characters max)</small></span><input maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a brief attendance note..." /></label>
    </div>
    <div className="form-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary">{existing ? 'Save changes' : 'Save attendance'}</button></div>
  </form>
}

function AttendanceRow({ record, athlete, canEdit, onEdit, onDelete }: {
  record: AttendanceRecord
  athlete: Athlete
  canEdit: boolean
  onEdit: (record: AttendanceRecord) => void
  onDelete: (record: AttendanceRecord) => void
}) {
  return <tr><td><span className="table-person">{getAthleteName(athlete)}<small>{athlete.studentId}</small></span></td><td>{record.course}</td><td>{formatDate(record.date)}</td><td><span className={`record-status record-${record.status.toLowerCase()}`}><i />{record.status}</span></td><td className="record-note">{record.note ?? '—'}</td><td>{canEdit && record.source === 'manual' && <div className="row-actions"><button className="table-action" onClick={() => onEdit(record)} aria-label={`Edit attendance for ${getAthleteName(athlete)} in ${record.course}`}><Icon name="reports" size={15} /></button><button className="table-action delete-action" onClick={() => { if (window.confirm(`Delete the ${record.course} attendance record for ${getAthleteName(athlete)}?`)) onDelete(record) }} aria-label={`Delete attendance for ${getAthleteName(athlete)} in ${record.course}`}><Icon name="close" size={15} /></button></div>}</td></tr>
}

function AlertsPage({ athletes: roster, alerts: openAlerts, onResolve, onSelectAthlete }: {
  athletes: Athlete[]
  alerts: AlertRecord[]
  onResolve: (alert: AlertRecord) => void
  onSelectAthlete: (id: string) => void
}) {
  return <>
    <section className="section-title-row"><div><p className="eyebrow">PROACTIVE STUDENT SUPPORT</p><h1>Alerts & follow-up</h1><p className="welcome-subtitle">Attendance patterns that may need a conversation or intervention.</p></div><span className="alert-total"><Icon name="bell" size={15} /> {openAlerts.length} open</span></section>
    <section className="alerts-page-list">{openAlerts.length === 0 ? <div className="card empty-card"><EmptyState title="All caught up" detail="There are no open attendance alerts right now." /></div> : openAlerts.map((alert) => {
      const athlete = roster.find((item) => item.id === alert.athleteId)
      if (!athlete) return null
      return <article className="card alert-detail-card" key={alert.id}>
        <span className={`alert-symbol ${alert.severity === 'Critical' ? 'alert-symbol-critical' : ''}`}><Icon name={alert.severity === 'Critical' ? 'alerts' : 'clock'} size={18} /></span>
        <div className="alert-detail-main"><div className="alert-detail-heading"><button className="plain-link" onClick={() => onSelectAthlete(athlete.id)}>{getAthleteName(athlete)}</button><span className={`severity-pill severity-${alert.severity.toLowerCase()}`}>{alert.severity}</span></div><p>{alert.type}</p><small>{athlete.sport} · {athlete.studentId} · {formatDate(alert.date)}</small><div className="alert-detail-note">{alert.detail}</div></div>
        <button className="button button-secondary resolve-button" onClick={() => onResolve(alert)}><Icon name="check" size={15} /> Mark resolved</button>
      </article>
    })}</section>
    <p className="demo-footnote">Resolved alerts remain in your browser and are hidden from the open-alert view.</p>
  </>
}

function ReportsPage({ athletes: roster, records, onExport }: {
  athletes: Athlete[]
  records: AttendanceRecord[]
  onExport: (report: ReportType) => void
}) {
  return <>
    <section className="section-title-row"><div><p className="eyebrow">ATTENDANCE & COMPLIANCE</p><h1>Reports</h1><p className="welcome-subtitle">Download current attendance data for the athletes in your role’s view.</p></div></section>
    <section className="report-grid">
      <ReportCard icon="roster" title="Team attendance report" detail="Roster, sport, classification, attendance rate, and risk status." metadata={`${roster.length} student-athletes · Current term`} action={() => onExport('team')} />
      <ReportCard icon="alerts" title="Students below threshold" detail="A focused list of athletes whose attendance is below 80%." metadata={`${roster.filter((athlete) => athlete.attendance < 80).length} students · 80% threshold`} action={() => onExport('risk')} />
      <ReportCard icon="attendance" title="Attendance history" detail="Class meeting, date, status, and notes for every visible record." metadata={`${records.length} records · Current sample`} action={() => onExport('attendance')} />
      <ReportCard icon="reports" title="Compliance summary" detail="Attendance threshold status and unresolved alert types by athlete." metadata={`${roster.length} student-athletes · 80% threshold`} action={() => onExport('compliance')} />
    </section>
    <div className="report-note"><span className="notice-icon">i</span><p><strong>CSV exports use the current saved browser data.</strong><br />PDF/Excel formatting, server-generated reports, and saved report history still require the production backend.</p></div>
  </>
}

function ReportCard({ icon, title, detail, metadata, action }: { icon: IconName; title: string; detail: string; metadata: string; action: () => void }) {
  return <article className="card report-card"><span className="report-icon"><Icon name={icon} size={19} /></span><h2>{title}</h2><p>{detail}</p><small>{metadata}</small><button className="button button-secondary" onClick={action}><Icon name="download" size={15} /> Download CSV</button></article>
}

function AthleteDrawer({ athlete, records, alerts: athleteAlerts, advisorNotes, canAddNotes, canViewNotes, onSaveNote, onClose }: {
  athlete: Athlete
  records: AttendanceRecord[]
  alerts: AlertRecord[]
  advisorNotes: AdvisorNote[]
  canAddNotes: boolean
  canViewNotes: boolean
  onSaveNote: (text: string) => void
  onClose: () => void
}) {
  const [noteDraft, setNoteDraft] = useState('')
  const [noteError, setNoteError] = useState('')
  const athleteRecords = records.filter((record) => record.athleteId === athlete.id).sort((a, b) => b.date.localeCompare(a.date))
  const saveNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!noteDraft.trim()) {
      setNoteError('Write a note before saving.')
      return
    }
    onSaveNote(noteDraft)
    setNoteDraft('')
    setNoteError('')
  }

  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside className="athlete-drawer" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="drawer-header"><div><span className="eyebrow">STUDENT-ATHLETE PROFILE</span><button className="drawer-close icon-button" onClick={onClose} aria-label="Close profile"><Icon name="close" /></button></div>
        <div className="drawer-profile"><span className={`avatar avatar-large avatar-${athlete.sport.toLowerCase().replaceAll(/[^a-z]/g, '')}`}>{initials(athlete)}</span><div><h2 id="profile-title">{getAthleteName(athlete)}</h2><p>{athlete.sport} <span>·</span> {athlete.classification}</p></div></div>
      </div>
      <div className="drawer-body">
        <div className="profile-id"><span>STUDENT ID</span><strong>{athlete.studentId}</strong><span>ASSIGNED COACH</span><strong>{athlete.coach}</strong></div>
        <div className="profile-stats"><div><span>Attendance</span><strong className={attendanceClass(athlete.attendance)}>{athlete.attendance}%</strong></div><div><span>Classes missed</span><strong>{athlete.missedClasses}</strong></div><div><span>Consecutive</span><strong>{athlete.consecutiveAbsences}</strong></div></div>
        <section className="profile-section"><div className="profile-section-heading"><h3>Current schedule</h3><span>{athlete.courses.length} courses</span></div>{athlete.courses.map((course) => <div className="course-row" key={course}><span className="course-dot" />{course}<span>Spring 2025</span></div>)}</section>
        <section className="profile-section"><div className="profile-section-heading"><h3>Recent attendance</h3><span>{athleteRecords.length} records</span></div>{athleteRecords.length ? athleteRecords.map((record) => <div className="profile-record" key={record.id}><span><strong>{record.course}</strong><small>{formatDate(record.date)}{record.note ? ` · ${record.note}` : ''}</small></span><span className={`record-status record-${record.status.toLowerCase()}`}><i />{record.status}</span></div>) : <p className="profile-empty">No recent attendance records.</p>}</section>
        <section className="profile-section"><div className="profile-section-heading"><h3>Risk status</h3></div><span className={`risk-status risk-${attendanceClass(athlete.attendance)}`}><i />{getAttendanceLevel(athlete.attendance)}</span>{athleteAlerts.length > 0 && <div className="profile-alert-note">{athleteAlerts.length} open alert{athleteAlerts.length === 1 ? '' : 's'}: {athleteAlerts.map((alert) => alert.type).join('; ')}</div>}</section>
        {canViewNotes && <section className="profile-section">
          <div className="profile-section-heading"><h3>Advisor notes</h3><span>{advisorNotes.length} notes</span></div>
          {advisorNotes.map((note) => <article className="advisor-note" key={note.id}><p>{note.text}</p><small>{note.author} · {formatDateTime(note.createdAt)}</small></article>)}
          {canAddNotes && <form className="advisor-note-form" onSubmit={saveNote}>
            <label className="form-field"><span>Add a private follow-up note</span><textarea rows={3} maxLength={2000} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Record an advising follow-up..." /></label>
            {noteError && <p className="form-error" role="alert">{noteError}</p>}
            <button type="submit" className="button button-primary">Save advisor note</button>
          </form>}
        </section>}
        <p className="profile-demo-note">Sample profile — not connected to a live student record.</p>
      </div>
    </aside>
  </div>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-state-icon"><Icon name="check" size={19} /></span><strong>{title}</strong><span>{detail}</span></div>
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default App
