import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
const port = 3001;

// Разрешаем CORS для клиентской части
app.use(cors({
  origin: 'http://localhost:3000', // Разрешаем запросы с вашего фронтенда
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}));

const dedustUrl = "https://app.dedust.io/pools?search=holy";
const tonViewerUrl =
  "https://tonviewer.com/EQAWVv2x6txoc5Nel9CltbfYSBMOOf0R9sb7GnqY-4ncmjcQ";
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  timeout: 180000
});

// Парсинг данных с сайта DeDust
async function getPoolData() {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    // Переход на страницу DeDust
    await page.goto(dedustUrl, {
      waitUntil: 'networkidle2', // Ждет, пока не завершатся все сетевые запросы
      timeout: 180000 // Увеличение времени ожидания до 60 секунд
    });
    console.log('Страница загружена');

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3");

    // Ожидаем появления нужных элементов
    await page.waitForSelector(".app-earn__content-table-cell-pool-text", {
      visible: true,
      timeout: 180000,
    });

    // Извлекаем текст из всех элементов с этим классом
    const poolNames = await page.$$eval(
      ".app-earn__content-table-cell-pool-name",
      (elements) => elements.map((el) => el.innerText.trim())
    );

    const poolTexts = await page.$$eval(
      ".app-earn__content-table-cell-text",
      (elements) => elements.map((el) => el.innerText.trim())
    );

    const poolHref = await page.$$eval(
      ".app-earn__content-table a",
      (elements) => elements.map((el) => el.href) // Извлечение всех ссылок
    );

    // Закрываем браузер
    await browser.close();

    return { poolNames, poolTexts, poolHref };
  } catch (error) {
    console.error("Ошибка при парсинге:", error);
    await browser.close();
    return null;
  }
}

// Парсинг данных с сайта Tonview
async function getElementData() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    timeout: 60000 // Увеличение времени ожидания
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });


  try {
    // Переход на страницу
    await page.goto(tonViewerUrl, {
      waitUntil: 'networkidle2', // Ждет, пока не завершатся все сетевые запросы
      timeout: 90000 // Увеличение времени ожидания до 60 секунд
    });

    // Ожидание элемента, содержащего все классы
    await page.waitForSelector(".bdtytpm.nygz236.t1g1t0q6.b1qs25iq.t1cmncij", {
      visible: true,
      timeout: 60000,
    });

    // Извлекаем текст элемента с указанными классами
    const elementData = await page.$eval(
      ".bdtytpm.nygz236.t1g1t0q6.b1qs25iq.t1cmncij",
      (el) => el.innerText.trim().replace(/,/g, "")
    );

    // Закрываем браузер
    await browser.close();

    return { elementData };
  } catch (error) {
    console.error("Ошибка при парсинге:", error);
    await browser.close();
    return null;
  }
}

// API для передачи данных в React
app.get("/api/pool-info", async (req, res) => {
  const data = await getPoolData();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: "Не удалось получить данные." });
  }
});

app.get("/api/element-info", async (req, res) => {
  const data = await getElementData();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: "Не удалось получить данные." });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}/api/element-info`);
});
