import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import puppeteer from 'puppeteer';
import genericPool from 'generic-pool';

const POOL_MAX = 8;
const POOL_MIN = 1;
const PAGE_MAX = 8;

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const minimal_args = [
    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain',
  ];

const factory = {
    create: async () => {
        const browser = await puppeteer.launch({
            headless: "new",
        }, minimal_args);
        return browser;
    },
    destroy: async (browser) => {
        await browser.close();
    }
};

const pool = genericPool.createPool(factory, {
    max: POOL_MAX,
    min: POOL_MIN,
});

let count = 0;

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});


// const browser2 = await puppeteer.launch({
//     headless: "new",
// }, minimal_args);

// const page = await browser2.newPage();



app.get("/getImage", async (req, res) => {
    const browser = await pool.acquire();
    const page = await browser.newPage();
    // const page = await browser2.newPage();
    console.log(pool.borrowed);

    count = count + 1;

    try {
        await page.goto('https://www.google.com/');
        await page.setViewport({ width: 1366, height: 768 });
        await page.screenshot({ path: `screenshot_${count}.png` });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    } finally {
        console.log("Releasing page");
        await pool.release(browser);
        // await page.close();
    }

    res.status(200).send("OK");
});

app.listen(process.env.PORT || 8000, () => {
    console.log("Server is up and running");
});

