# Datafy Associates - Digital Dashboard

Solar energy, digital twin, and topographical mapping website built with Next.js 14, Mapbox GL, and Tailwind CSS.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Mapbox Token

This project uses Mapbox GL for geospatial maps. The token is referenced via the `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable.

1. Sign up at https://www.mapbox.com and get a **public** token (starts with `pk.`).
2. Create a `.env.local` file in the project root (or edit the existing one) and add:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token_here
```

> ⚠️ Do **not** hardcode the token in source files. Use the env var as shown above. Never commit secret tokens to GitHub — push protection will block them.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```
