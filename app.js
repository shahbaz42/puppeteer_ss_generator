import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import puppeteer from 'puppeteer';
import genericPool from 'generic-pool';

const POOL_MAX = 20;
const POOL_MIN = 10;
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

const browserPool = genericPool.createPool(factory, {
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



app.get("/getImageTest", async (req, res) => {
    // console.log(browserPool.pending);
    if(browserPool.pending >= POOL_MAX) {
        // console.log("Service Unavailable");
        return res.status(503).send("Service Unavailable");
    }
    let browser = null;
    try {
        browser = await browserPool.acquire();
        const page = await browser.newPage();

        await page.goto('https://www.google.com/');
        await page.setViewport({ width: 1366, height: 768 });
        const imageData = await page.screenshot({ encoding: "base64", type: "jpeg" });
        await page.close();
        res.status(200).send(imageData);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    } finally {
        // console.log("Closing Page");
        if(browser !== null) {
            await browserPool.release(browser);
        }
    }
});


app.post("/getImage", async (req, res) => {
    if(browserPool.pending >= POOL_MAX) {
        return res.status(503).send("Service Unavailable");
    }
    const htmlBase64 = req.body.html;
    const height = req.body.height;
    const width = req.body.width;

    const html = Buffer.from(htmlBase64, 'base64').toString('utf-8');
    
    let browser = null;
    try {
        browser = await browserPool.acquire();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" }); 
        await page.setViewport({ width: width, height: height });
        const imageData = await page.screenshot({ encoding: "base64", type: "jpeg" });
        await page.close();
        res.status(200).send(imageData);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    } finally {
        // console.log("Closing Page");
        if(browser !== null) {
            await browserPool.release(browser);
        }
    }
});

app.listen(process.env.PORT || 8000, () => {
    console.log("Server is up and running");
});

