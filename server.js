import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
const port = 3000;

// Разрешаем CORS для клиентской части
app.use(cors());

const dedustUrl = "https://app.dedust.io/pools?search=holy";
const tonViewerUrl =
  "https://tonviewer.com/EQAWVv2x6txoc5Nel9CltbfYSBMOOf0R9sb7GnqY-4ncmjcQ";

// Парсинг данных с сайта DeDust
async function getPoolData() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    // Переход на страницу DeDust
    await page.goto(dedustUrl, {
      waitUntil: "networkidle2",
    });

    // Ожидаем появления нужных элементов
    await page.waitForSelector(".app-earn__content-table-cell-pool-name", {
      visible: true,
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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // Переход на страницу
    await page.goto(tonViewerUrl, {
      waitUntil: "networkidle2",
    });

    // Ожидание элемента, содержащего все классы
    await page.waitForSelector(".bdtytpm.nygz236.t1g1t0q6.b1qs25iq.t1cmncij", {
      visible: true,
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
  console.log(`Сервер запущен на http://localhost:${port}`);
});
