/**
 * Mirror the month-by-month garden tasks into public/monthly-guides.json.
 *
 * /imerologio-sporas shows one month at a time, which is right for "what do I do now" and
 * left the page with three tasks where thirty-seven exist. The React page lists the whole
 * year below the picker; this gives the server-rendered version the same thing, so the
 * crawler and the reader see one page, not two.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MONTH_NAMES_EL, MONTHLY_GUIDES } from '../src/components/SeasonalAdviceBar';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, '..', 'public', 'monthly-guides.json');

const months = MONTH_NAMES_EL.map((name: string, i: number) => ({
  name,
  tasks: ((MONTHLY_GUIDES as Record<number, Array<{ title: string; desc: string; badge: string }>>)[i] || [])
    .map((t) => ({ title: t.title, desc: t.desc, badge: t.badge })),
}));

fs.writeFileSync(out, JSON.stringify(months, null, 2), 'utf8');
console.log(`monthly-guides.json: ${months.length} months, ${months.reduce((s, m) => s + m.tasks.length, 0)} tasks`);
