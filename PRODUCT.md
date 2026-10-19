# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people in Greece who grow plants in pots on a balcony or terrace (flat dwellers). They arrive from a Google search with one specific question ("why are my lemon leaves yellow", "when can I put basil out") and usually read on a phone, in the moment the problem is in front of them.

Also served, confirmed by the owner: vegetable-garden and garden owners (frost dates, irrigation, fertilising, pruning) and professionals / agronomists who want measured, citable values (pH, EC, cold tolerance in °C, pot volume).

## Product Purpose

SmartGarden.gr is a Greek-language digital gardening magazine: a new scientifically grounded guide every day for the Greek and Mediterranean climate, plus tools and data (planting calendar, frost dates, climate comparison, plant database, soil and dosage calculators, lunar calendar, "ask the agronomist"). It exists so a Greek grower gets an answer that fits Greek conditions instead of generic or imported advice. Success is a reader who finds the exact answer, trusts the numbers, and comes back; the site is also meant to earn from advertising and from its video channels.

## Positioning

Three things a neighbouring Greek gardening site could not easily copy, confirmed by the owner:

1. Data made for Greece: first/last frost dates, a 15-city climate comparison, a plant database with cold tolerance in °C, pH, light and pot size, a monthly sowing calendar.
2. A documented guide every day, with botanical names and measured values rather than general wisdom.
3. Video and channels that run alongside the articles (YouTube, TikTok, Pinterest, Facebook).

## Operating Context

The site is a React single-page app with PHP pages rendered on the server for search engines and link previews, on shared hosting (DNHOST, Plesk) behind Cloudflare. A scheduled job publishes one new article per day and the matching Facebook post, Pinterest pin and short video; long videos are made by hand-written scripts. Content is Greek first; articles also carry an English field.

## Capabilities and Constraints

- Greek first: content and interface are in Greek, English is secondary (confirmed).
- The pages the server renders and the React views must show the same content; a change to either is made in both (confirmed). Article photos, plant links, page titles and FAQ markup are each implemented twice on purpose.
- The name SmartGarden.gr and the current logo stay as they are (confirmed).
- Ad slots exist in `public/ads-slots.json` for a planned AdSense setup. The owner did not list their positions as a binding constraint; treat them as undecided.
- Tools and data live under their own routes (`/imerologio-sporas`, `/klima-kipoy`, `/pagetos`, `/fyta`, `/xoma`, `/selini`, `/rotiste`, author page `/syntaktis`).

## Brand Commitments

The name SmartGarden.gr and the existing logo (`logo.webp`, `public/logo-schema.png`). The about page describes the voice as practical and technically documented; nothing further has been confirmed as binding.

## Evidence on Hand

- 92 published articles (as of 2026-10-19) in `public/latest_articles.json`.
- Data sets: `public/plants.json`, `public/frost_dates.json`, `public/monthly-guides.json`, `public/category-faqs.json`.
- The owner's own balcony photographs, catalogued in `public/real-photos.json` and `public/photos/`, plus a stock-photo catalogue (`public/photo-catalogue.json`).
- A YouTube channel with Shorts and long videos, and Pinterest, Facebook and TikTok accounts.
- Absent, so future work must not invent them: customer testimonials, reader or traffic numbers, press coverage, awards, named experts' endorsements.

## Product Principles

1. Greek conditions before general advice: every recommendation is tied to the Greek climate and to a measured value.
2. Answer the question that brought the reader first, then give depth.
3. What the server renders for search and what the reader sees in the app must agree.
4. Never invent evidence: photos are real and match the topic, numbers come from the data sets, and nothing is claimed that the site cannot show.
