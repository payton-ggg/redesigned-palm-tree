import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
const port = 3001;

app.use(cors()); // Разрешаем CORS

const dedustUrl = "https://app.dedust.io/pools?search=holy";
const tonViewerUrl =
  "https://tonviewer.com/EQAWVv2x6txoc5Nel9CltbfYSBMOOf0R9sb7GnqY-4ncmjcQ";

// Функция для парсинга данных с сайта DeDust
async function getPoolData() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Безопасные параметры для серверов
  });
  const page = await browser.newPage();

  try {
    await page.goto(dedustUrl, {
      waitUntil: "networkidle2",
      timeout: 90000, // Увеличенное время ожидания
    });

    // Ожидаем появления элементов на странице
    await page.waitForSelector(".app-earn__content-table-cell-pool-name", {
      visible: true,
    });

    // Извлекаем данные
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
      (elements) => elements.map((el) => el.href)
    );

    return { poolNames, poolTexts, poolHref };
  } catch (error) {
    console.error("Ошибка при парсинге DeDust:", error);
    return null;
  } finally {
    await browser.close(); // Закрываем браузер после завершения работы
  }
}

// Функция для парсинга данных с сайта Tonview
async function getElementData() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(tonViewerUrl, {
      waitUntil: "networkidle2",
      timeout: 90000, // Увеличенное время ожидания
    });

    // Ожидание нужного элемента
    await page.waitForSelector(".bdtytpm.nygz236.t1g1t0q6.b1qs25iq.t1cmncij", {
      visible: true,
    });

    const elementData = await page.$eval(
      ".bdtytpm.nygz236.t1g1t0q6.b1qs25iq.t1cmncij",
      (el) => el.innerText.trim().replace(/,/g, "")
    );

    return { elementData };
  } catch (error) {
    console.error("Ошибка при парсинге Tonview:", error);
    return null;
  } finally {
    await browser.close(); // Закрываем браузер после завершения работы
  }
}

// API для передачи данных в React
app.get("/api/pool-info", async (req, res) => {
  const data = await getPoolData();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: "Не удалось получить данные с DeDust." });
  }
});

app.get("/api/element-info", async (req, res) => {
  const data = await getElementData();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: "Не удалось получить данные с Tonview." });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}/api/pool-info`);
});
