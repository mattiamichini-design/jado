---
title: "Hosting the playbook"
description: "Build the playbook site and deploy it on any Node.js host or on Vercel."
status: "observed"
lastReviewed: "2026-10-10"
---

This page covers the playbook site. The design process ends with the handoff described in the [workflow](/docs/delivery/release).

## Run it locally

```sh
npm ci
npm run dev
```

The development server listens on `127.0.0.1` and serves the playbook at `/docs`.

## Deploy

The site is a Next.js application. On any Node.js host, build and start it:

```sh
PLAYBOOK_BASE_URL=https://jado.example.com npm run build
npm run start
```

On Vercel, import the repository and keep the default Next.js settings.

## Base URL

`PLAYBOOK_BASE_URL` is the absolute origin of the deployed site, for example `https://jado.example.com`. Set it at build time. The site uses it for canonical URLs, Open Graph images, `robots.txt` and the sitemap.

On Vercel, the project's production domain is used when `PLAYBOOK_BASE_URL` is unset. On other hosts, an unset value falls back to `http://localhost:3000`, so set it for every public deployment.

## What is public

Every page, the search API, Markdown output and `llms.txt` are served without authentication. Keep secrets, credentials and client data out of the content, as described in [how to contribute](/docs/start).
