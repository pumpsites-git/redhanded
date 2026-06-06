import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:3847', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/root/.openclaw/workspace/redhanded/redhanded-map.png', fullPage: true });

await browser.close();
console.log('Screenshot saved');
