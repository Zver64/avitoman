import { Cookie, Page } from 'puppeteer'

export function parseCookies(
  cookieString: string,
  domain: string
): Omit<Cookie, 'size'>[] {
  return cookieString.split(';').map((cookiePart) => {
    const [name, value] = cookiePart.split('=').map((c) => c.trim())
    // You'll need to provide the appropriate domain, path, and expiration date
    const cookie: Omit<Cookie, 'size'> = {
      name,
      value,
      domain, // Replace with the actual domain
      path: '/', // Default path
      expires: Date.now() / 1000 + 60 * 60 * 24 * 7, // 1 week from now in Unix time
      httpOnly: true, // Typically set to true for server-side cookies
      secure: true, // Set to true if your site is HTTPS
      sameSite: 'Lax', // Can be 'Strict', 'Lax', or 'None'
      session: false,
      // Add other properties as needed
    }
    return cookie
  })
}

export function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

export async function checkForBlock(page: Page) {
  const pageTitle = await page.title()
  if (pageTitle.includes('Доступ ограничен')) {
    console.log('blocked')
    return true
  }
  return false
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
