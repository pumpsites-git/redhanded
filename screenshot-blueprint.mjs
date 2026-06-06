import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

const html = readFileSync('/root/.openclaw/workspace/redhanded/blueprint.html', 'utf8');
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/root/.openclaw/workspace/redhanded/blueprint-full.png', fullPage: true });
console.log('Blueprint screenshot saved');

await browser.close();
