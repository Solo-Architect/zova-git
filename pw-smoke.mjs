import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3001';

function url(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${BASE}${path}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function withPage(browser, { name, path, beforeLoad } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const logs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    logs.push({
      at: nowIso(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });
  page.on('pageerror', (err) => {
    pageErrors.push({ at: nowIso(), message: String(err?.message || err) });
  });

  if (beforeLoad) await beforeLoad({ context, page });

  const target = url(path);
  const resp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(400);

  return {
    name: name || path,
    path,
    target,
    status: resp?.status() ?? null,
    page,
    context,
    logs,
    pageErrors,
  };
}

async function tryToggleTheme(page) {
  const btn = page.locator('#theme-toggle');
  const exists = await btn.count();
  if (!exists) return { ok: false, reason: 'toggle_not_found' };

  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await btn.click({ timeout: 10_000 });
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  return { ok: before !== after, before, after };
}

async function projectsChecks(page) {
  const res = {
    gridExists: false,
    cardsCount: null,
    filterSwitch: { ok: false, before: null, after: null },
    readmeModal: { ok: false, opened: false, closed: false },
    cardsVisible: { ok: false, sample: [] },
  };

  const grid = page.locator('#projectsGrid');
  res.gridExists = (await grid.count()) > 0;
  if (!res.gridExists) return res;

  await page.waitForTimeout(800); // wait fetch + render
  res.cardsCount = await page.locator('#projectsGrid .project-card').count();

  // Sanity: cards must be actually visible (not opacity:0, not display:none)
  res.cardsVisible.sample = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('#projectsGrid .project-card')).slice(0, 6);
    return els.map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        opacity: cs.opacity,
        display: cs.display,
        visibility: cs.visibility,
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    });
  });
  res.cardsVisible.ok = res.cardsVisible.sample.every((s) => {
    const op = Number(s.opacity);
    return s.display !== 'none' && s.visibility !== 'hidden' && op > 0.01 && s.width > 0 && s.height > 0;
  });

  const readmeBtn = page.locator('#projectsGrid .project-open-readme').first();
  if ((await readmeBtn.count()) > 0) {
    await readmeBtn.click();
    const overlay = page.locator('.readme-overlay');
    // Wait until overlay becomes visible (class toggle)
    const opened = await page
      .locator('.readme-overlay.visible')
      .waitFor({ timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    res.readmeModal.opened = opened;

    const closeBtn = page.locator('.readme-close');
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click();
      await page.waitForTimeout(200);
      const closed = await page
        .locator('.readme-overlay.visible')
        .waitFor({ state: 'detached', timeout: 2000 })
        .then(() => true)
        .catch(async () => {
          // fallback: it may still exist but without .visible
          const stillVisible = await overlay
            .evaluate((el) => el.classList.contains('visible'))
            .catch(() => false);
          return !stillVisible;
        });
      res.readmeModal.closed = closed;
    }
    res.readmeModal.ok = res.readmeModal.opened && res.readmeModal.closed;
  }

  const filterJs = page.locator('.filter-btn[data-filter="javascript"]');
  if ((await filterJs.count()) > 0) {
    const before = await page.locator('#projectsGrid .project-card').count();
    await filterJs.click();
    await page.waitForTimeout(250);
    const after = await page.locator('#projectsGrid .project-card').count();
    res.filterSwitch = { ok: true, before, after };
  }

  return res;
}

async function adminChecks(page) {
  const res = {
    dropZoneExists: false,
    selectBtnExists: false,
    deleteBtnExists: false,
    deleteConfirmShown: false,
    deleteConfirmText: null,
  };

  res.dropZoneExists = (await page.locator('#dropZone').count()) > 0;
  res.selectBtnExists = (await page.locator('#selectFileBtn').count()) > 0;

  // Wait projects render
  await page.waitForTimeout(1000);
  const delBtn = page.locator('#adminProjectsGrid .delete-project-btn').first();
  res.deleteBtnExists = (await delBtn.count()) > 0;

  let dialogSeen = false;
  page.once('dialog', async (dialog) => {
    dialogSeen = true;
    res.deleteConfirmShown = dialog.type() === 'confirm';
    res.deleteConfirmText = dialog.message();
    await dialog.dismiss(); // don't mutate data
  });

  if (res.deleteBtnExists) {
    await delBtn.click().catch(() => {});
    await page.waitForTimeout(400);
  }

  if (!dialogSeen) {
    // no dialog fired
    res.deleteConfirmShown = false;
  }

  return res;
}

function summarizeConsole({ logs, pageErrors }) {
  const severeConsole = logs.filter((l) => l.type === 'error');
  const warns = logs.filter((l) => l.type === 'warning' || l.type === 'warn');
  return {
    pageErrors,
    consoleErrors: severeConsole,
    consoleWarns: warns,
  };
}

const routes = [
  { name: 'home', path: '/' },
  { name: 'projects', path: '/projects.html' },
  { name: 'about', path: '/about.html' },
  { name: 'contacts', path: '/contacts.html' },
  { name: 'admin', path: '/admin?key=vova777', beforeLoad: async ({ page }) => {
      // Avoid prompts during checks (admin upload/delete would prompt token)
      await page.addInitScript(() => {
        sessionStorage.setItem('gitvova_admin_token', 'vova-admin-2026');
      });
    }
  },
];

const browser = await chromium.launch();
const report = [];

for (const r of routes) {
  const run = await withPage(browser, r);

  const theme = await tryToggleTheme(run.page);
  let extra = {};

  if (r.name === 'projects') extra.projects = await projectsChecks(run.page);
  if (r.name === 'admin') extra.admin = await adminChecks(run.page);

  report.push({
    name: run.name,
    url: run.target,
    status: run.status,
    theme,
    ...summarizeConsole(run),
    ...extra,
  });

  await run.context.close();
}

await browser.close();

// Print machine-readable JSON for the agent
process.stdout.write(JSON.stringify({ base: BASE, report }, null, 2));

