# Athlete Academic Attendance Tracker

Responsive React and TypeScript prototype for the Schreiner University Athletics attendance dashboard, based on the provided system specification.

## Run locally

```powershell
npm install
npm run dev
```

Create a production build with `npm run build`.

## Prototype scope

The app uses fictional sample data in `src/data.ts`. Attendance entries can be added, edited, and removed by the demo Athletic Administrator and System Administrator roles; dashboard metrics and risk alerts update from those entries. Advisors can add student notes. Roster filters, attendance history, alert resolution, and CSV report exports use the current browser data.

The selected demo role filters a coach to their assigned athletes and shows role-specific actions. It is a UI demonstration only, not authentication or a security boundary. Sample records and changes are stored in the browser's local storage on that device and are not shared or backed up. Clearing browser storage removes demo changes. Do not enter real student information or use the prototype for eligibility decisions.

Microsoft Entra ID sign-in, secure server-side authorization, the ASP.NET Core API, Azure SQL persistence, audit logging, production report generation, PDF/Excel exports, and Azure deployment are not implemented yet.
