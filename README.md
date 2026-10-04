# CampusSwap

CampusSwap is a student-only marketplace for finding academic resources from people in your campus community. Buy, rent, or swap textbooks, notes, calculators, and lab equipment, or post a request when you need something specific.

## Features

- Campus account registration, sign-in, and protected student activity
- Browse listings by category, course, semester, mode, search, and price
- Create, edit, and manage listings, with a live form preview
- Buy, rent, and swap flows with seller contact details for handover
- Open request board with direct email contact and owner fulfillment
- Real-time in-app notifications for sellers when buyers request items
- My Activity tabs for managing listings, requests, deals, and revoking pending requests
- Demo seed data and a vibrant, brutalist-style responsive interface

## Tech Stack

- Client: React, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, Lucide, Axios, react-hot-toast
- Server: Node.js 22+, Express, TypeScript, SQLite (`node:sqlite`), JWT, bcryptjs, Zod
- Storage: Local SQLite database at the repository root

## Setup

1. Install Node.js 22 or newer.
2. Install dependencies from the repository root:

   ```sh
   npm run install:all
   ```

3. Create `server/.env` with a JWT secret and the campus email domains allowed to register:

   ```env
   JWT_SECRET=replace-with-a-long-random-secret
   CAMPUS_EMAIL_DOMAINS=campus.edu
   ```

   Multiple domains can be comma-separated. The default registration domain, when the variable is omitted, is `campus.edu`.

4. Start the client and server from the repository root:

   ```sh
   npm run dev
   ```

   The client is at `http://localhost:5173`; the API is at `http://localhost:5000`.

5. To rebuild both applications:

   ```sh
   npm run build
   ```

## Demo Data

From the `server` directory, reset and refill the local database with:

```sh
npm run seed
```

This replaces existing users, listings, requests, and transactions with six demo users, twenty listings, six open requests, and three completed deals.

All accounts use the password `demo1234`:

- `aarav@campus.edu`
- `ananya@campus.edu`
- `kabir@campus.edu`
- `meera@campus.edu`
- `ishaan@campus.edu`
- `sara@campus.edu`

## Future Scope

- Verify campus email ownership and support institution-managed domain lists
- Add moderation and reporting for listings and requests
- Add buyer deal acceptance and rental return confirmation
- Add optional listing photos
- Move from the local SQLite file to a hosted database for multi-campus deployment
