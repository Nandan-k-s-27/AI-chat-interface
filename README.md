# MCA AI Chat Project

An AI Chat application built with React, Vite, TypeScript, and Tailwind CSS.

## Quick Start

Run these commands from the **project root** (`AI_Chat/`):

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm lint

# Preview production build
npm run preview
```

## Project Structure

```
AI_Chat/
├── app/                    # Main React application
│   ├── src/
│   │   ├── components/    # React components (UI & features)
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── App.tsx        # Root component
│   │   └── main.tsx       # Entry point
│   ├── package.json       # App dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── tsconfig.json      # TypeScript configuration
├── package.json           # Root package (proxies to app/)
└── README.md             # This file
```

## Development

The project root `package.json` proxies all commands to the `app/` folder. You can run:

- `npm run dev` — Start Vite dev server at http://localhost:5173/
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
- `npm audit fix` — Fix dependencies with vulnerabilities

## Notes

- Dependencies are in `app/package.json`
- TypeScript is strict mode enabled
- Tailwind CSS is configured for styling
- Path alias `@/` maps to `src/`

## Security

Currently 7 vulnerabilities reported from dependencies. Run `npm audit fix` to address them.
