import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const OUT_DIR = path.join(process.cwd(), 'pw-artifacts');

const pages = [
  { name: 'home', path: '/' },
  { name: 'projects', path: '/projects.html' },
  { name: 'about', path: '/about.html' },
  { name: 'contacts', path: '/contacts.html' },
  { name: 'admin', path: '/admin?key=vova777' },
];

function url(p) {
  if (!p.startsWith('/')) p = `/${p}`;
  return `${BASE}${p}`;
}

await fs.mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

for (const p of pages) {
  await page.addInitScript(() => {
    // stabilize: avoid admin prompts later if any click happens
    sessionStorage.setItem('gitvova_admin_token', 'vova-admin-2026');
  });

  await page.goto(url(p.path), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(OUT_DIR, `${p.name}-light.png`), fullPage: true });

  const toggle = page.locator('#theme-toggle');
  if ((await toggle.count()) > 0) {
    await toggle.click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT_DIR, `${p.name}-dark.png`), fullPage: true });
  }
}

await context.close();
await browser.close();

process.stdout.write(`Saved screenshots to ${OUT_DIR}\n`);

