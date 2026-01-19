# Cloudflare PM Prototype — Feedback DJ - Insights Generator

This repository contains a lightweight prototype built on **Cloudflare Workers** to explore how product teams can aggregate and analyze scattered customer feedback and turn it into actionable insights.

---

## 🔍 What the Prototype Does

- Aggregates mock customer feedback from multiple sources (e.g., support, GitHub, Discord)
- Uses **Workers AI** to generate a concise, daily-style product briefing
- Highlights:
  - Key feedback themes
  - Overall sentiment
  - A top customer complaint
  - A recommended next action for the product team
- Caches feedback and results using **Cloudflare KV**
- Serves a minimal web interface directly from a Cloudflare Worker

---

## 🧱 Architecture Overview

- **Cloudflare Workers**  
  Hosts the backend logic and serves both API responses and a minimal HTML UI.

- **Workers AI**  
  Analyzes raw feedback text to generate summaries, themes, and sentiment.

- **Cloudflare KV**  
  Stores mock feedback entries and caches generated briefings.

---

## 🚀 Live Demo

👉 **Deployed Worker:**  
`https://workers.priyashathacker06.workers.dev`

---

## 🛠️ Technologies Used

- Cloudflare Workers
- Cloudflare Workers AI
- Cloudflare KV
- JavaScript
- Wrangler CLI

---

## 📌 Notes

- This project uses **mock data** only; no real third-party integrations are used.

---

© 2026, Priyasha Thacker, Inc.
