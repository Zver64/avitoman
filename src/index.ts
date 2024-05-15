import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import {
  COOKIES,
  COOKIES_FILE,
  FILE_TXT,
  RESULT_DIR,
  SEARCH_LINK,
} from './constants'
import fs from 'fs'
import { checkForBlock, delay, parseCookies, sleep } from './utils'
import { Browser, Cookie } from 'puppeteer'

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    const pages = await browser.pages()
    const page = pages[0]

    const initialCookies = loadCookies()

    if (initialCookies) {
      page.setCookie(...initialCookies)
    }

    if (!fs.existsSync(RESULT_DIR)) {
      fs.mkdirSync(RESULT_DIR)
    }
    fs.writeFileSync(`${RESULT_DIR}/${FILE_TXT}`, '')

    await page.goto(SEARCH_LINK, { waitUntil: 'domcontentloaded' })

    const isBlocked = await checkForBlock(page)
    if (isBlocked) {
      return
    }

    saveCookies(await page.cookies())

    // get all items on page
    const items = await page.$$(
      'div[data-marker="catalog-serp"] div[data-marker="item"]'
    )

    console.log(`found ${items.length} cars on page`)
    const pagePromises = []
    for (const item of items) {
      const linkItem = await item.$$('a[data-marker="item-title"]')
      const handle = await linkItem[0].getProperty('href')
      const link = await handle.jsonValue()
      await sleep(10000)
      pagePromises.push(parseCar(link, browser))
    }
    await Promise.all(pagePromises)

    await browser.close()
  })

async function parseCar(link: string, browser: Browser) {
  const page = await browser.newPage()
  const cookies = loadCookies()
  if (cookies) {
    page.setCookie(...cookies)
  }

  try {
    await page.goto(link, { waitUntil: 'domcontentloaded' })
  } catch (err: any) {
    console.log('Error when opening a car: ', link, err.message)
    return
  }

  const isBlocked = await checkForBlock(page)
  if (isBlocked) {
    throw new Error('blocked by avito')
  }

  saveCookies(await page.cookies())

  try {
    await page.waitForFunction(
      (text) =>
        document.body.innerText.includes(text[0]) ||
        document.body.innerText.includes(text[1]),
      { timeout: 5000 },
      ['ДТП не найдены', 'Проверка на ДТП']
    )
    console.log('found car: ', link)
    fs.appendFileSync(`${RESULT_DIR}/${FILE_TXT}`, link + '\n')
  } catch {
    console.log('skip...')
    page.close()
  }
}

function saveCookies(cookies: Cookie[]) {
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2))
}

function loadCookies() {
  return (
    fs.existsSync(COOKIES_FILE) &&
    (JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8')) as Cookie[])
  )
}
