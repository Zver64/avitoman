import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { sleep } from './utils'

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    const pages = await browser.pages()
    const page = pages[0]

    await page.goto('https://bot.sannysoft.com/')

    await sleep(5000)
    const newPage = await browser.newPage()
    newPage.goto('https://bot.sannysoft.com/')
    await sleep(5000)
    await browser.close()
  })
