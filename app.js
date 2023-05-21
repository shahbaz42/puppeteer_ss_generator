import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import puppeteer from 'puppeteer';

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const browser = await puppeteer.launch();
let count = 0;

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.get("/getImage", async (req, res) => {
    const page = await browser.newPage();
    count = count + 1;

    await page.goto('https://developer.chrome.com/');

    // Set screen size
    await page.setViewport({ width: 1366, height: 768 });

    await page.screenshot({ path: `screenshot_${count}.png` });

    page.close();

    res.status(200).send("OK");
});

app.listen(process.env.PORT || 8000, () => {
    console.log("Server is up and running");
});

