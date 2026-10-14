import { expect, test } from '@playwright/test'

test('first launch: pick a group, see today, relaunch keeps the group', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Выберите группу' })).toBeVisible()
  await page.getByRole('link', { name: 'Группы' }).first().click()
  await page.getByRole('searchbox', { name: 'Найти группу' }).fill('ВТПО231')
  await page.getByRole('button', { name: /^ВТПО231\(4\)/ }).click()
  await expect(page.locator('main')).toContainText('ВТПО231(4)')
  await page.reload()
  await expect(page.locator('main')).toContainText('ВТПО231(4)')
})

test('week view: agenda on mobile, grid on desktop, details sheet opens', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('tt.prefs.v1', JSON.stringify({ groupId: 'vtpo231-4' })))
  await page.goto('/#/week')
  if (info.project.name === 'desktop') {
    await expect(page.getByRole('grid')).toBeVisible()
    await page.getByRole('button', { name: /Операционная система Linux/ }).first().click()
  } else {
    await expect(page.getByRole('tablist')).toBeVisible()
    await page.getByRole('tab', { name: /^Пн/ }).click()
    await page.getByRole('button', { name: /Операционная система Linux/ }).first().click()
  }
  await expect(page.getByRole('dialog')).toContainText('Турганбай Куралай Егынбайкызы')
  // No horizontal page scroll on any viewport.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('responsive navigation: bottom bar on mobile, sidebar on desktop', async ({ page }, info) => {
  await page.goto('/')
  const bottom = page.locator('nav').last()
  const side = page.locator('aside nav')
  if (info.project.name === 'desktop') { await expect(side).toBeVisible(); await expect(bottom).toBeHidden() }
  else { await expect(bottom).toBeVisible(); await expect(side).toBeHidden() }
})

test('works offline after first load', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('tt.prefs.v1', JSON.stringify({ groupId: 'vtpo231-4' })))
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // let the service worker take control
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('main')).toContainText('ВТПО231(4)')
  await expect(page.getByRole('status').filter({ hasText: 'офлайн' })).toBeVisible()
})

test('theme persists across reloads', async ({ page }) => {
  await page.goto('/#/settings')
  await page.getByRole('radio', { name: 'Тёмная' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
