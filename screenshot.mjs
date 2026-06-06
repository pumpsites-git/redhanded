import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3847', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/redhanded-home.png', fullPage: true });

// Detail page
await page.goto('http://localhost:3847/judge/3', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/redhanded-judge.png', fullPage: true });

await browser.close();
console.log('Screenshots saved');
