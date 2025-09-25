const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');

const url = process.env.URL || "https://main-sd-preprod.dev.essr.ch/formation/formation-secretaire-medicale-ppc";

console.log("Using URL:", url);

const modalButtonSelector = "#main-cta";
const modalSelector = ".popup__modal";
const iframeSelector = "#lead-redirect-iframe";
const formSelector = "app-form form";

const viewports = [
  { width: 800, height: 1280 },  
  { width: 412, height: 915 },   
  { width: 1536, height: 864 },  
  { width: 1920, height: 1080 }, 
  { width: 2560, height: 1440 },
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
