# React Migration Plan (from Next.js to CRA + TypeScript)

## Branch
- `react-migration-cra-ts`

## Steps

1) Unzip the existing archive
- Unpack `finance-main.zip` into the repository root.
- Confirm the app structure: detect whether it uses `pages/` (Next <=12) or `app/` (Next 13+).

2) Inventory and remove/replace Next-specific items
- Files/config:
  - `next.config.js`
  - `.next/` (build output) if present
- Routing:
  - `pages/` → migrate to `src/pages/` with `react-router-dom`
  - For Next 13: `app/` routes → `src/pages/` components + routes
  - `_app.(ts|tsx|js|jsx)` and `_document.(ts|tsx|js|jsx)` → replaced by CRA `index.tsx` + HTML in `public/index.html`
  - `next/head` → replace with `<Helmet>` (from `react-helmet-async`) or plain `document.title`
- Components:
  - `next/image` → `<img>` with proper `src`, `alt`, sizes and responsive styles
  - `next/link` → `<Link>` from `react-router-dom`
  - `next/navigation` → `useNavigate` from `react-router-dom`
- Data fetching:
  - Remove `getServerSideProps` / `getStaticProps`
  - Use client-side `fetch`/`axios` calling Django APIs
  - Move server-only logic to backend
- API routes:
  - Remove `pages/api` or `app/api`; these move to Django
- Env usage:
  - Replace `process.env.NEXT_PUBLIC_*` with CRA `REACT_APP_*` variables

3) Initialize CRA (TypeScript)
- Create React App (TypeScript):
  - If bootstrapping fresh: `npx create-react-app web --template typescript`
  - Or in-place: add CRA structure manually in root, then move sources into `src/`
- Add dependencies:
  - `react-router-dom`
  - optional: `axios`, `react-helmet-async`
- Scripts in `package.json`:
  - `start`, `build`, `test`

4) Directory structure (target)
```
.
├─ public/
│  ├─ index.html
│  └─ assets/ (static files)
├─ src/
│  ├─ index.tsx
│  ├─ App.tsx
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Accounts.tsx
│  │  ├─ Transactions.tsx
│  │  ├─ Budgets.tsx
│  │  ├─ Categories.tsx
│  │  └─ Reports.tsx
│  ├─ components/
│  │  ├─ NavBar.tsx
│  │  ├─ AccountList.tsx
│  │  ├─ TransactionTable.tsx
│  │  └─ ...
│  ├─ api/
│  │  ├─ client.ts (axios/fetch base)
│  │  ├─ auth.ts
│  │  ├─ accounts.ts
│  │  ├─ transactions.ts
│  │  ├─ budgets.ts
│  │  ├─ categories.ts
│  │  └─ reports.ts
│  ├─ hooks/
│  ├─ types/
│  ├─ styles/
│  └─ router.tsx
├─ .env (uses REACT_APP_* vars)
├─ package.json
└─ README.md
```

5) Routing example (react-router)
- `src/router.tsx` sets up routes:
  - `/` → Home
  - `/accounts`
  - `/transactions`
  - `/budgets`
  - `/categories`
  - `/reports`

6) API client
- `src/api/client.ts`:
  - Base URL: `REACT_APP_API_BASE_URL` (e.g., `http://localhost:8000/api`)
  - Interceptors for JWT: `access` token from local storage
- Separate files per resource for typed methods: `getAccounts`, `createAccount`, etc.

7) Env variables
- `.env` example:
  - `REACT_APP_API_BASE_URL=http://localhost:8000/api`
- In code: `process.env.REACT_APP_API_BASE_URL`

8) Testing and cleanup
- Remove all Next imports and usage
- Verify build/start commands work: `npm start`, `npm run build`
- Confirm pages render and fetch data from Django endpoints

## Notes
- If SSR features exist, they must move to Django or be replaced by client-side rendering.
- For SEO needs, CRA can use `react-helmet-async` but won’t provide SSR out-of-the-box.
- If you prefer Vite for performance, we can adapt the same structure to Vite + TS afterward.

## Next.js Artifacts to remove
- `next.config.js`
- `pages/` or `app/` directories (migrated content kept under `src/`)
- `pages/api` or `app/api` (moved to Django)
- `_app.*`, `_document.*`
- Imports from `next/*`

## Package scripts (target)
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```