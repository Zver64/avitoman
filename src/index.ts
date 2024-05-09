import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { COOKIES, COOKIES_FILE, FILE_TXT, SEARCH_LINK } from './constants'
import fs from 'fs'
import { checkForBlock, delay, parseCookies } from './utils'
import { Browser, Cookie } from 'puppeteer'

const cars: string[] = []

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false, slowMo: 300 })
  .then(async (browser) => {
    const pages = await browser.pages()
    const page = pages[0]

    const initialCookies = fs.existsSync(COOKIES_FILE)
      ? JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'))
      : parseCookies(COOKIES, 'www.avito.ru')

    page.setCookie(...initialCookies)

    const pagePromises = []
    fs.writeFileSync(FILE_TXT, '')

    await page.goto(SEARCH_LINK, { waitUntil: 'domcontentloaded' })
    await page.mouse.move(50, 50)
    // await page.reload()

    const isBlocked = await checkForBlock(page)
    if (isBlocked) {
      return
    }

    const pageCookies = await page.cookies()
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(pageCookies, null, 2))

    // get all items on page
    const items = await page.$$(
      'div[data-marker="catalog-serp"] div[data-marker="item"]'
    )
    console.log(`found ${items.length} cars on page`)
    for (const item of items) {
      const linkItem = await item.$$('a[data-marker="item-title"]')
      const handle = await linkItem[0].getProperty('href')
      const link = await handle.jsonValue()
      pagePromises.push(parseCar(link, browser))
    }
    await Promise.all(pagePromises)

    await browser.close()
  })
  .then(() => {
    fs.writeFileSync('cars.json', JSON.stringify(cars, null, 2))
  })

async function parseCar(link: string, browser: Browser) {
  const page = await browser.newPage()

  try {
    await page.goto(link)
  } catch (err: any) {
    console.log('Error when opening a car: ', link, err.message)
    return
  }

  const isBlocked = await checkForBlock(page)
  if (isBlocked) {
    throw new Error('blocked by avito')
  }

  try {
    await page.waitForFunction(
      (text) =>
        document.body.innerText.includes(text[0]) ||
        document.body.innerText.includes(text[1]),
      { timeout: 5000 },
      ['ДТП не найдены', 'Проверка на ДТП']
    )
    console.log('found car: ', link)
    fs.appendFileSync(FILE_TXT, link + '\n')
    // cars.push(link)
  } catch {
    console.log('skip...')
    page.close()
  }
}
