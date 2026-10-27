# Sinka Home & Living — Admin Panel

Lightweight, production-ready foundation and back-office management panel for **Sinka Home & Living**. Developed and hosted independently from the customer storefront, communicating with the centralized Sinka REST backend.

---

## 1. Project Purpose

The Sinka Admin Panel provides an operational back-office workspace for catalog administrators, inventory supervisors, and operations staff. It is decoupled from the customer storefront (`sinka-frontend`) to allow independent deployment cycles, distinct security controls, and tailored administrative user interfaces without carrying consumer-facing storefront bundle overhead.

---

## 2. Technology Stack

| Technology | Purpose | Version |
|---|---|---|
| **React** | Component-based UI framework | `^18.3.1` |
| **JavaScript (ES Modules)** | Modern application syntax (No TypeScript) | ES2020+ |
| **Vite** | Build tool, HMR development server, and Rollup bundler | `^6.2.0` |
| **Tailwind CSS v4** | Utility-first CSS styling system | `^4.0.9` |
| **`@tailwindcss/vite`** | Official direct Vite compiler integration | `^4.0.9` |
| **React Router DOM** | Client-side declarative routing (`createBrowserRouter`) | `^7.3.0` |
| **Axios** | Centralized HTTP request client | `^1.8.1` |
| **Lucide React** | Featherweight accessible icon suite | `^1.16.0` |
| **ESLint 9** | Flat configuration code quality and hook linting | `^9.21.0` |

---

## 3. Strict Folder Structure

```text
sinka-admin/
├── public/
│   └── favicon.svg           # Sinka House emblem brand favicon
├── src/
│   ├── app/
│   │   ├── App.jsx           # Minimal application root mounting RouterProvider
│   │   └── router.jsx        # Route definitions using createBrowserRouter (v7)
│   ├── assets/
│   │   ├── icons/            # Static brand icon assets (.gitkeep)
│   │   └── images/           # Static administrative graphics (.gitkeep)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx    # Sticky admin header with breadcrumbs & status
│   │   │   └── Sidebar.jsx   # Responsive navigation drawer for implemented routes
│   │   └── ui/
│   │       ├── Button.jsx    # Polymorphic button adhering to Sinka brand tokens
│   │       ├── Input.jsx     # Accessible form input with error announcements
│   │       └── LoadingIndicator.jsx # Accessible status loader
│   ├── layouts/
│   │   └── AdminLayout.jsx   # Shell composition joining Sidebar, Header & Outlet
│   ├── lib/
│   │   └── api.js            # Centralized Axios instance with error normalization
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx # Auth screen documenting backend integration status
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx # Clean admin dashboard landing page
│   │   └── NotFoundPage.jsx  # Accessible 404 handler
│   ├── services/
│   │   └── auth.service.js   # Service boundary aligned with backend auth contracts
│   ├── styles/
│   │   └── globals.css       # Tailwind v4 import, theme variables & Sinka tokens
│   ├── constants.js          # Shared application constants
│   └── main.jsx              # Application entry point with React.StrictMode
├── .env.example              # Documented environment template
├── .gitignore                # Git exclusions (dependencies, build artifacts, envs)
├── eslint.config.js          # ESLint 9 flat configuration
├── index.html                # HTML entry point with preconnected typography
├── package.json              # Project scripts and dependencies
├── package-lock.json         # Pinned reproducible dependency graph
├── README.md                 # Project documentation
└── vite.config.js            # Vite 6 config with React & Tailwind plugins
```

---

## 4. Prerequisites

- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **Sinka Backend**: Running locally on `http://localhost:5001` or accessible over the network.

---

## 5. Getting Started

### Installation

Clone the repository and install dependencies without modifying flags:

```bash
npm install
```

### Development Server

Start the local Vite development server:

```bash
npm run dev
```

The admin portal will be available at `http://localhost:5174`.

### Code Quality / Linting

Execute ESLint across JavaScript and JSX files:

```bash
npm run lint
```

### Production Build

Compile and bundle for production deployment:

```bash
npm run build
```

Compiled assets are generated in the `dist/` directory.

### Preview Production Build

Preview the production bundle locally:

```bash
npm run preview
```

---

## 6. Environment Variables

Create a `.env.local` file by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Configuration Keys

| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the Sinka backend REST API | `http://localhost:5001/api` |

> **Security Note:** Variables prefixed with `VITE_` are bundled into client-side code and exposed to the browser. Never place private keys, database credentials, or server-side secrets in `.env*` files in this repository.

---

## 7. Current Authentication Integration Status

The Sinka backend (`Sinka-backend`) enforces the following identity model:

1. **Authentication Mechanism:** The backend currently authenticates users by verifying Firebase ID tokens via `POST /api/auth/firebase-login` with payload `{ idToken: string }`.
2. **Authorization & RBAC:** Incoming authenticated requests provide an `Authorization: Bearer <FIREBASE_ID_TOKEN>` header. The backend middleware (`requireAuth` & `requireRole('admin')`) retrieves the customer record from MongoDB and verifies `req.user.role === 'admin'`.
3. **Dedicated Admin Credentials:** There is currently **no dedicated username/password** or back-office credential endpoint (e.g. `/api/auth/admin-login`) implemented on the backend.
4. **Current Admin Shell Handling:** In adherence to strict security rules, no fake authentication, mock tokens, or insecure client-only role checks have been implemented. The application shell provides full navigation and status transparency, with `/login` presenting technical requirements for the backend team to finalize dedicated administrative provisioning.

---

## 8. Deployment Considerations for Separate Admin Frontend

1. **Independent Hosting:** Host this repository as an independent static site on Cloudflare Pages, AWS S3/CloudFront, Vercel, or Netlify.
2. **CORS Configuration:** Ensure `Sinka-backend`'s `CORS_ORIGIN` environment variable includes the admin panel's production domain (e.g., `https://admin.sinka.com`).
3. **HTTP Security Headers:** Configure web server hosting headers:
   - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' <BACKEND_URL>; frame-ancestors 'none';`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
