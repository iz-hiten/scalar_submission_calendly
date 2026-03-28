# Calendly Clone — Scheduling Platform

A full-featured scheduling and booking web application that closely replicates Calendly's design, user experience, and core functionality. Built as part of an SDE Intern Fullstack Assignment.

---

## Live Demo

> Deploy URL: *[(deployed link](https://calendly-scalar-submission.vercel.app/))*

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
| AI Chatbot | Google Gemini API (`@google/genai`) |
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
├── .env                       # Local env vars (GEMINI_API_KEY, APP_URL) — not committed
├── .env.example               # Template for required env vars
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Router setup, protected routes
│   ├── firebase.ts            # Firebase init, auth, Firestore exports, error handler
│   ├── types.ts               # All TypeScript interfaces
│   ├── index.css              # Global styles + scrollbar utilities
│   ├── lib/
│   │   ├── utils.ts           # cn() helper (clsx + tailwind-merge)
│   │   └── user.ts            # Demo user config / getCurrentUser helper
│   ├── components/
│   │   ├── Layout.tsx         # App shell — sidebar + header + outlet + chat + onboarding
│   │   ├── Sidebar.tsx        # Collapsible desktop sidebar + mobile bottom nav + drawer
│   │   ├── Header.tsx         # Top bar — user avatar, invite modal, profile dropdown
│   │   ├── Calendar.tsx       # Reusable month calendar with available day highlighting
│   │   ├── HelpSidebar.tsx    # Slide-in contextual help panel
│   │   ├── ChatWidget.tsx     # Gemini AI chatbot — floating FAB + chat panel
│   │   ├── Onboarding.tsx     # First-visit spotlight tour (localStorage-gated)
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
- View upcoming, past, and cancelled meetings across separate tabs
- Cancel a meeting with confirmation
- Expand any meeting card to see full details: email, location, notes, booking link
- Search meetings by invitee name or email
- Filter meetings by event type
- Export filtered meetings as a CSV file

#### 5. Public Profile / Landing Page (`/u/:userId`)
- Shows all active event types for a user
- Click any event type to go to its booking page
- "Powered by Calendly" badge

---

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

#### Meeting Polls
- Create group scheduling polls with multiple time options
- Vote counts tracked per option
- Open/closed status

#### Help Sidebar
- Contextual help panel slides in from the right
- Different content for Scheduling, Meetings, and Availability pages

---

### New Features

#### Responsive Design (Mobile-First)
- **Bottom navigation bar** on mobile — Scheduling, Meetings, Availability tabs always accessible
- **Slide-in drawer** for the full nav menu on mobile (triggered by "More" in the bottom bar)
- Desktop sidebar is unchanged — same collapsible behavior
- All pages (Dashboard, Meetings, Availability, BookingPage) stack and reflow correctly on small screens
- Event type cards, meeting cards, and modal layouts adapt to mobile viewports
- Tabs scroll horizontally instead of overflowing on narrow screens

#### Sidebar Create Button
- The "Create" button in the sidebar (and its collapsed `+` icon) now works from any page
- Navigates to the Dashboard and immediately opens the "New Event Type" modal
- Uses a custom DOM event (`open-create-modal`) so the sidebar and Dashboard stay decoupled

#### AI Chatbot (Gemini)
- Floating chat bubble (FAB) in the bottom-right corner of every authenticated page
- Opens a full chat panel with header, message history, and rich input bar
- Powered by **Google Gemini 2.5 Flash** via `@google/genai`
- System-prompted to act as a Calendly assistant — answers scheduling questions, explains features, redirects off-topic queries
- Persistent chat session across the page lifetime (single module-level instance — no duplicate API calls)
- Client-side throttle enforces ~13 RPM to stay safely under the free-tier 15 RPM limit
- Animated typing indicator (bouncing dots) while waiting for a response
- Error bubbles for rate limits (with retry countdown), missing API key, and network failures
- Unread dot on the FAB when new bot messages arrive while the panel is closed
- Input: auto-growing textarea, Enter to send, Shift+Enter for newline, toolbar icons (attachment, emoji, GIF, mic)

#### First-Visit Onboarding Tour
- 8-step spotlight tour shown automatically on first visit
- Stored in `localStorage` — never shown again after completion or dismissal
- Each step dims the entire screen and cuts a glowing spotlight around the relevant UI element (SVG mask technique)
- Steps cover: Welcome → Sidebar → Create button → Event cards → Availability → Meetings → AI chatbot → Done
- Tooltip card with step counter, progress bar, dot navigation, Back/Next buttons, and skip (×)
- Clicking outside the tooltip also dismisses the tour
- To replay: `localStorage.removeItem('calendly_onboarding_done')` in the browser console

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Get your key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key-here"

APP_URL="http://localhost:3000"
```

Vite exposes `GEMINI_API_KEY` to the frontend via `process.env.GEMINI_API_KEY` (configured in `vite.config.ts`).

> The `.env` file is git-ignored. Never commit your real API key.

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
  userId: string
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
  expiresAt: string
  isUsed: boolean
  userId: string
  eventTypeId?: string
  location?: string
  weeklyHours?: object
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
  options: Array<{ date: string; startTime: string; endTime: string; votes: number }>
  userId: string
  status: 'open' | 'closed'
  createdAt: string
}
```

### `invites/{id}`
```ts
{
  email: string
  invitedBy: string
  status: 'pending' | 'accepted'
  createdAt: string
}
```

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Authentication enabled
- A Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 4. Configure Firebase
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

### 5. Deploy Firestore Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into Firebase Console → Firestore → Rules → Publish.

### 6. Run the development server
```bash
npm run dev
```

App runs at `http://localhost:3000`

### 7. Build for production
```bash
npm run build
npm run preview
```

---

## Authentication & Demo Mode

**Google Sign-In** — Click "Continue with Google". Your real Firebase UID is used for all data.

**Demo Mode** — Click "Continue to Demo Mode". Uses a fallback `default-user` with sample event types, links, and polls. The public booking page (`/b/:slug`) and profile page (`/u/:userId`) are always accessible without login.

---

## Key Design Decisions

**No separate backend API** — Firestore is used directly from the frontend with security rules enforcing access control.

**Double-booking prevention** — Before confirming a booking, the app queries Firestore for existing non-cancelled meetings at the same `userId + date + startTime`.

**Real-time updates** — Event types, availability, meetings, links, and polls all use Firestore `onSnapshot` listeners.

**Single Gemini session** — The AI client and chat session are module-level singletons. React re-renders and StrictMode double-invocations cannot create duplicate sessions or fire extra API calls. A `useRef` in-flight guard prevents concurrent sends.

**Onboarding is localStorage-gated** — No login means no user ID to track, so `localStorage` is the right primitive. Clear `calendly_onboarding_done` to replay the tour.

**Mobile nav strategy** — Rather than hiding the sidebar behind a hamburger (which adds a second nav element), mobile gets a bottom tab bar (the most natural mobile pattern) plus a full-screen drawer for less-used nav items.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Express + Vite) on port 3000 |
| `npm run build` | Production build via Vite |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type check (no-emit) |
| `npm run clean` | Remove dist folder |
