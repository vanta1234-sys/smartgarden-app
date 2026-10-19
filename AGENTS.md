# Agent Instructions & Persistent Rules

## Mandatory Synchronization & Deployment Rules
- **Permanent Sync Rule**: Every time a conversation resumes after a pause (> 1 hour or when the user returns), ALWAYS verify and synchronize the local codebase and preview state with the live production site `https://smartgarden.gr` (specifically fetching `https://smartgarden.gr/latest_articles.json` into `public/latest_articles.json` and `src/data/master50Articles.ts`).
- **Permanent Auto-Deploy Rule**: The agent is directly responsible for performing the production deployment to `https://smartgarden.gr` via build and automated FTP upload. Whenever changes to articles, SEO sitemaps, or features are made, the agent must build and deploy them directly to live production without requiring the user to do manual exports or uploads.
- Ensure the preview builds with 0 errors and reflects the exact live count and state (currently 86 articles and counting).

- **Front-end deploy check (rule since 2026-10-20)**: after ANY deploy that changes the front end, run `node scripts/ops/check_articles.mjs` (real headless Chrome, every live article, desktop and phone). It must end with "0 with findings". Never judge a page only from the local dev server: the live server has data the dev server lacks (ad slot ids, article.php preload, real photos), and that is how two empty 280px ad blocks went live on every article on 2026-10-20.
