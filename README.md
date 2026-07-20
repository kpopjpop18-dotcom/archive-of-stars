# Archive of Stars

A mobile-first, installable K-pop photocard gacha game. The app works immediately in a single browser using local storage, so it is ideal for prototyping the game loop and managing initial cards. The included Supabase schema is the production-ready shared data model for accounts, recovery, inventories, trading, analytics, and admin moderation.

## Deploy to Netlify

1. Upload this folder to a GitHub repository or drag it into Netlify.
2. Set the build command to `npm install`; publish directory is `public`; functions directory is `netlify/functions` (these are also declared in `netlify.toml`).
3. Configure a private admin password before use. In `public/app.js`, change the placeholder comparison `atiny-admin` in `checkAdmin()`; for real deployment, validate this with a server-side environment variable instead of browser code.
4. The **Cards & Import** panel accepts an A4 PDF. The deployment function renders every page and splits its 2 columns × 3 rows into six trimmed WEBP photocards. Uploads should be modest in size due to serverless request limits.

## Make it shared / production data

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Create a private Storage bucket named `photocards`; store cropped imports there rather than saving images in a browser.
3. Add the Supabase JavaScript client and replace the small `localStorage` adapter at the top of `public/app.js` with authenticated API calls. Use anonymous authentication and associate the displayed recovery code with a hashed server-side value. Never store raw recovery codes or an admin password in a browser.
4. Turn on Row Level Security, and keep spin selection, cooldown enforcement, trade acceptance, bans, recovery, and admin actions in database RPC functions or Netlify functions. This prevents client-side cheats.

## Included game features

- Animated, weighted random wheel with common, rare, and ultra-rare pulls; admin test pulls are unlimited.
- Nine default editable binders, collection progress, duplicates, full-screen card viewer, and mobile navigation.
- Custom profile, collector ID, recovery code, personal share QR visual, offline PWA installation, and cached app shell.
- Admin card management, custom image upload, PDF six-grid import, binder renaming/creation, and collector overview.

The demo cards appear only until your own images are imported; no third-party photos are packaged with the project.
