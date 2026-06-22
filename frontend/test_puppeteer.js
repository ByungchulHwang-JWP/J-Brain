const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@example.com');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('Logged in, current URL:', page.url());
  
  // Try to click "대시보드" -> "운영 현황"
  await page.goto('http://localhost:5174/admin/dashboard', { waitUntil: 'networkidle0' });
  console.log('Dashboard URL:', page.url());
  
  await browser.close();
})();
