This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Location data

City and team coordinates live in `data/` and are generated, not hand-maintained:

```bash
npm run build:data
```

That script pulls the Census 2024 Gazetteer (places + ZCTAs), the Census sub-county
population estimates, and the ESPN team/venue endpoints, then writes `data/places.json`
(~32k US places), `data/teams.json` (~630 pro and college teams with venue coordinates),
`data/states.json`, and joins them. `data/places-extra.json` and `data/aliases.json` are
hand-maintained: boroughs, regions, Canadian cities, and nicknames Census has no record of.

Re-run it when teams relocate or a new Gazetteer vintage is published. Coordinate fixes for
stale ESPN venue records go in `TEAM_COORD_OVERRIDES` in `scripts/build-data.mjs`; the script
logs any team whose coordinates drift more than 30 miles from its listed venue city.

`GET /api/diagnostics?city=Boston&asOf=20251109` reports how a city resolved, the nearest
teams with distances, which leagues were fetched, and the top scored candidates with their
full score breakdown. `asOf` replays a past date, which is how college-season behavior gets
checked out of season.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
