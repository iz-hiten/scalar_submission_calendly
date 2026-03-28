# Calendly Clone — Scheduling Platform

A full-featured scheduling and booking web application that closely replicates Calendly's design, user experience, and core functionality. Built as part of an SDE Intern Fullstack Assignment.

---

## Live Demo

> Deploy URL: *(add your deployed URL here)*
> GitHub: *(add your repo URL here)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Backend / DB | Firebase Firestore (NoSQL) |
| Auth | Firebase Authentication (Google OAuth) |
| Server | Express.js (wraps Vite in dev, serves dist in prod) |
| Icons | Lucide React |
| Date Handling | date-fns |
| Drag & Drop | @dnd-kit (installed, ready to extend) |

---

## Project Structure

```
├── server.ts                  # Express server — Vite middleware in dev, static in prod
├── firestore.rules            # Firestore security rules
├── firebase-applet-config.json # Firebase project config
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Router setup, protected routes
│   ├── firebase.ts            # Firebase init, auth, Firestore exports, error handler
│   ├── types.ts               # All TypeScript interfaces
│   ├── index.css              # Global styles
│   ├── lib/
│   │   ├── utils.ts           # cn() helper (clsx + tailwind-merge)
│   │   └── user.ts            # Demo user config / getCurrentUser helper
│   ├── components/
│   │   ├── Layout.tsx         # App shell — sidebar + header + outlet
│   │   ├── Sidebar.tsx        # Collapsible navigation sidebar
│   │   ├── Header.tsx         # Top bar — user avatar, invite modal, profile dropdown
│   │   ├── Calendar.tsx       # Reusable month calendar with available day highlighting
│   │   ├── HelpSidebar.tsx    # Slide-in contextual help panel
│   │   ├── BookMeetingModal.tsx       # Host-side "book on behalf" modal
│   │   ├── OfferTimeSlotsModal.tsx    # Generate email snippet with available slots
│   │   ├── ShareAvailabilityModal.tsx # Email composer for sharing availability
│   │   ├── SingleUseLinkModal.tsx     # Create single-use booking links with custom settings
│   │   └── AddToWebsiteModal.tsx      # Embed code generator (inline/popup widget/popup text)
│   └── pages/
│       ├── Login.tsx          # Google OAuth + demo mode login
│       ├── Dashboard.tsx      # Main scheduling hub — event types, single-use links, polls
│       ├── Availability.tsx   # Weekly availability schedule editor
│       ├── Meetings.tsx       # View/cancel/filter/export booked meetings
│       ├── BookingPage.tsx    # Public booking page (/b/:slug)
│       └── ProfilePage.tsx    # Public profile/landing page (/u/:userId)
```

---

## Features

### Core Features

#### 1. Event Types Management
- Create event types with name, duration, URL slug, location, description, and color
- Edit all fields of an existing event type
- Delete event types (with confirmation)
- Clone event types
- Toggle event types on/off (active/inactive)
- Bulk select + bulk delete / bulk toggle active
- Each event type gets a unique public booking link: `/b/:slug`
- Copy link to clipboard with visual feedback

#### 2. Availability Settings
- Set available days of the week with checkboxes
- Set one or multiple time slots per day (e.g. 9am–12pm and 2pm–5pm)
- Add / remove time intervals per day
- Timezone display and selection (full IANA timezone list)
- Changes saved to Firestore with "Save Changes" button
- Availability is read by the public booking page in real time

#### 3. Public Booking Page (`/b/:slug`)
- Month calendar view — only available days are selectable
- Already-booked time slots are hidden from the picker
- Time slots generated dynamically from the host's availability + event duration
- Double-booking prevention — checks Firestore before confirming
- Booking form: invitee name, email, notes, guest emails
- Booking confirmation screen with full meeting details
- Accessible without login

#### 4. Meetings Page
- View upcoming meetings (today + future)
- View past meetings
- View cancelled meetings (separate tab)
- Cancel a meeting with confirmation
- Expand any meeting card to see full details: email, location, notes, booking link
- Search meetings by invitee name or email
- Filter meetings by event type
- Export filtered meetings as a CSV file

#### 5. Public Profile / Landing Page (`/u/:userId`)
- Shows all active event types for a user
- Click any event type to go to its booking page
- "Powered by Calendly" badge

### Bonus Features

#### Single-Use Links
- Create one-time booking links from any event type (the "1x" button on event cards)
- Customize duration, location, availability schedule, and date range per link
- Add a contact to pre-fill the booking form
- "Create & copy link" — writes to Firestore and copies URL instantly
- "Share" — opens the share email modal for the new link

#### Offer Time Slots (Email)
- Select specific time slots from your availability across multiple days
- Edit or delete days from the preview
- "Available times" popover with checkboxes, select all / clear
- Copy a formatted text snippet to paste into any email

#### Share Availability (Email Composer)
- Full email composer with To / Cc / Bcc fields
- Rich text toolbar: Bold, Italic, Underline, lists, link insertion, undo/redo
- Pre-filled body with the user's name and a live booking page link
- Editable subject line
- Send reminder checkbox with configurable days dropdown

#### Add to Website
- Three embed types: Inline embed, Popup widget, Popup text
- Per-type settings: colors, hide page details, hide cookie banner, button text, link text, position
- Live-generated embed code that updates as you change settings
- Copy code to clipboard

#### Help Sidebar
- Contextual help panel slides in from the right
- Different content for Scheduling, Meetings, and Availability pages

#### Meeting Polls
- Create group scheduling polls with multiple time options
- Vote counts tracked per option
- Open/closed status

---

## Database Schema (Firestore)

### `eventTypes/{id}`
```ts
{
  id: string
  name: string
  duration: number          // minutes
  slug: string              // unique URL slug
  description?: string
  location?: string
  color: string             // Tailwind bg class e.g. "bg-[#8247e5]"
  userId: string
  order?: number
  isActive?: boolean
  createdAt: string         // ISO timestamp
}
```

### `availability/{userId}`
```ts
{
  userId: string
  timezone: string          // IANA timezone e.g. "Asia/Kolkata"
  days: {
    [dayName: string]: {    // "Monday", "Tuesday", etc.
      enabled: boolean
      slots: Array<{ start: string, end: string }>  // "09:00", "17:00"
    }
  }
}
```

### `meetings/{id}`
```ts
{
  id: string
  eventTypeId: string
  userId: string            // owner's UID
  date: string              // "yyyy-MM-dd"
  startTime: string         // "HH:mm"
  endTime: string           // "HH:mm"
  inviteeName: string
  inviteeEmail: string
  notes?: string
  guests?: string
  status: 'upcoming' | 'past' | 'cancelled'
  createdAt: string
}
```

### `singleUseLinks/{id}`
```ts
{
  id: string
  name: string
  duration: number
  slug: string
  expiresAt: string         // ISO timestamp
  isUsed: boolean
  userId: string
  eventTypeId?: string
  location?: string
  weeklyHours?: object      // custom availability override
  timezone?: string
  noticeTime?: string
  createdAt: string
}
```

### `meetingPolls/{id}`
```ts
{
  id: string
  name: string
  duration: number
  options: Array<{
    date: string
    startTime: string
    endTime: string
    votes: number
  }>
  userId: string
  status: 'open' | 'closed'
  createdAt: string
}
```

### `invites/{id}`
```ts
{
  email: string
  invitedBy: string         // UID of inviter
  status: 'pending' | 'accepted'
  createdAt: string
}
```

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
The Firebase config is already in `firebase-applet-config.json`. If using your own project, replace the values:
```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "firestoreDatabaseId": "your-database-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "your-sender-id"
}
```

### 4. Deploy Firestore Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` directly into the Firebase Console → Firestore → Rules tab and click Publish.

### 5. Run the development server
```bash
npm run dev
```

App runs at `http://localhost:3000`

### 6. Build for production
```bash
npm run build
npm run preview
```

---

## Authentication & Demo Mode

The app supports two modes:

**Google Sign-In** — Click "Continue with Google" on the login page. Your real Firebase UID is used for all data operations.

**Demo Mode** — Click "Continue to Demo Mode". The app uses a fallback user (`default-user`) and shows sample event types, links, and polls if no real data exists. The public booking page (`/b/:slug`) and profile page (`/u/:userId`) are always accessible without any login.

> For the interviewer: the app is pre-configured to work out of the box in demo mode. All core features are functional without signing in.

---

## Key Design Decisions

**No separate backend API** — Firestore is used directly from the frontend with security rules enforcing access control. This keeps the stack simple while still being production-safe.

**Double-booking prevention** — Before confirming a booking, the app queries Firestore for existing non-cancelled meetings at the same `userId + date + startTime`. If a conflict exists, the user is redirected to pick a different slot.

**Real-time updates** — Event types, availability, meetings, single-use links, and polls all use Firestore `onSnapshot` listeners, so the UI updates instantly when data changes.

**Public pages are truly public** — `/b/:slug` and `/u/:userId` require no authentication. Firestore rules allow public reads on `eventTypes`, `availability`, `singleUseLinks`, `meetingPolls`, and `meetings`.

**Availability drives everything** — The booking page reads the host's availability from Firestore and generates time slots dynamically based on the event duration. Already-booked slots are filtered out before display.

---

## Assumptions

- One host per event type (One-on-One format)
- Timezone is stored as an IANA string and displayed to invitees; no automatic conversion between timezones is performed
- Email sending is simulated (the Share modal composes an email but does not actually send — a real integration would require SendGrid/Resend/etc.)
- The "Powered by Calendly" badge on public pages is intentional as part of the Calendly clone design
- Sample/seed data is injected client-side when Firestore returns empty results for the demo user

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Express + Vite) on port 3000 |
| `npm run build` | Production build via Vite |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type check (no-emit) |
| `npm run clean` | Remove dist folder |
