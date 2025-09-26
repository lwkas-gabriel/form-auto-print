const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');

const url = process.env.URL || "https://main-sd-preprod.dev.essr.ch/formation/formation-secretaire-medicale-ppc";

//console.log("Using URL:", url);

const modalButtonSelector = "#main-cta";
const modalSelector = ".popup__modal";
const iframeSelector = "#lead-redirect-iframe";
const formSelector = "app-form form";

const viewports = [
  // Tablet
  { width: 800, height: 1280 }, // Android tablets 7–10"
  { width: 1024, height: 600 }, // Small/older tablets (7")
  { width: 1024, height: 768 }, // Classic iPad

  // Smartphones
  { width: 320, height: 568 }, // Older iPhones (5/SE)
  { width: 360, height: 640 }, // Standard mid-range Android
  { width: 360, height: 800 }, // Recent Androids
  { width: 375, height: 667 }, // iPhone 6/7/8
  { width: 375, height: 812 }, // iPhone X / XS / 11 Pro
  { width: 390, height: 844 }, // iPhone 12/13/14
  { width: 412, height: 915 }, // Large Androids (Note, OnePlus, Xiaomi)
  { width: 414, height: 896 }, // iPhone XR / XS Max / 11 / 11 Pro Max
  { width: 430, height: 932 }, // iPhone 14 Pro Max / 15 Pro Max

  // Notebook
  { width: 1280, height: 800 }, // Older 13" MacBook / Dell/HP
  { width: 1366, height: 768 }, // Standard notebooks
  { width: 1440, height: 900 }, // MacBook Air 13", some Lenovo/HP
  { width: 1536, height: 864 }, // Mid-range Windows 10/11
  { width: 1600, height: 900 }, // 15" notebooks

  // Desktop
  { width: 1920, height: 1080 }, // Full HD
  { width: 2560, height: 1440 }, // 2K / QHD
];


const browsers = [
  { name: "chromium", instance: chromium },
  { name: "firefox", instance: firefox },
  { name: "webkit", instance: webkit },
];

(async () => {
  for (const browserType of browsers) {
    const browser = await browserType.instance.launch();
    const context = await browser.newContext({ viewport: null });
    context.setDefaultTimeout(60000);

    for (const vp of viewports) {
      const page = await context.newPage();
      await page.setViewportSize(vp);

      console.log(`Loading page on ${browserType.name} ${vp.width}x${vp.height}`);
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await page.waitForSelector(modalButtonSelector, { state: "visible" });
      await page.click(modalButtonSelector);

      await page.waitForSelector(modalSelector, { state: "visible" });

      const iframeElement = await page.waitForSelector(iframeSelector);
      const frame = await iframeElement.contentFrame();

      await frame.waitForSelector(formSelector, { state: "visible" });

      const modalHandle = await page.$(modalSelector);
      const filename = `screenshots/screenshot-${browserType.name}-${vp.width}x${vp.height}.png`;
      await modalHandle.screenshot({ path: filename });

      console.log(`Screenshot saved: ${filename}`);
      await page.close();
    }

    await browser.close();
  }

  const files = fs.readdirSync('screenshots').filter(f => f.endsWith('.png'));
  fs.writeFileSync('screenshots/list.txt', files.join(','));
  console.log("All screenshots saved. List generated in screenshots/list.txt");
})();
