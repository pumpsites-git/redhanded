import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:3848', { waitUntil: 'networkidle', timeout: 30000 });

// Wait for the map to render (it loads TopoJSON from CDN)
await page.waitForTimeout(8000);

// Check if map SVG exists
const mapExists = await page.evaluate(() => {
  const svgs = document.querySelectorAll('svg');
  return Array.from(svgs).map(s => ({ 
    width: s.getAttribute('width'), 
    children: s.children.length,
    viewBox: s.getAttribute('viewBox')
  }));
});
console.log('SVGs found:', JSON.stringify(mapExists));

// Check for any console errors
page.on('console', msg => {
  if (msg.type() === 'error') console.log('Browser error:', msg.text());
});

await page.screenshot({ path: '/root/.openclaw/workspace/redhanded/redhanded-map.png', fullPage: true });

await browser.close();
console.log('Screenshot saved');
