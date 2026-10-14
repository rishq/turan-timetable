import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { AppProvider } from '../app/providers/AppProvider'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let el: HTMLElement
let dark = false

/** Wait (real time) until lazy chunks / dataset finished loading. */
const settle = async () => {
  for (let i = 0; i < 100; i++) {
    await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
    if (!(el.textContent ?? '').includes('Загрузка')) break
  }
}
async function mount() {
  el = document.createElement('div')
  document.body.append(el)
  root = createRoot(el)
  await act(async () => { root.render(<AppProvider><App /></AppProvider>) })
  await settle()
}
const go = async (route: string) => { await act(async () => { window.location.hash = `#/${route}`; window.dispatchEvent(new HashChangeEvent('hashchange')) }); await settle() }
const text = () => el.textContent ?? ''

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
  dark = false
  window.matchMedia = ((q: string) => ({ matches: q.includes('dark') ? dark : false, addEventListener() {}, removeEventListener() {}, media: q })) as unknown as typeof window.matchMedia
  // Monday 2 March 2026, 10:20 local (device timezone)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 2, 10, 20))
})
afterEach(() => { act(() => root.unmount()); el.remove(); vi.useRealTimers() })

describe('app (real dataset)', () => {
  it('asks to choose a group on first launch, never invents a schedule', async () => {
    await mount()
    expect(text()).toContain('Выберите группу')
    expect(text()).not.toContain('Операционная система')
  })

  it('selecting a group persists it and shows the live "now" lesson', async () => {
    await mount()
    await go('groups')
    const btn = [...el.querySelectorAll('button')].find((b) => b.textContent?.startsWith('ВТПО231(4)'))!
    await act(async () => { btn.click() })
    await settle()
    expect(JSON.parse(localStorage.getItem('tt.prefs.v1')!).groupId).toBe('vtpo231-4')
    expect(text()).toContain('Понедельник')
    expect(text()).toContain('Сейчас')
    expect(text()).toContain('Операционная система Linux') // Mon 10:00–12:50 in the PDF
    expect(el.querySelector('[aria-current="time"]')).not.toBeNull()
  })

  it('restores the saved group after relaunch', async () => {
    localStorage.setItem('tt.prefs.v1', JSON.stringify({ groupId: 'vtpo231-4' }))
    await mount()
    expect(text()).toContain('Операционная система Linux')
  })

  it('does not call a group with no lessons today a confirmed free day', async () => {
    localStorage.setItem('tt.prefs.v1', JSON.stringify({ groupId: 'vtpo231-4' }))
    vi.setSystemTime(new Date(2026, 2, 8, 12, 0)) // Sunday
    await mount()
    expect(text()).toContain('занятий в расписании нет')
    expect(text()).toContain('может быть неполным')
  })

  it('persists and applies the theme', async () => {
    localStorage.setItem('tt.prefs.v1', JSON.stringify({ theme: 'dark' }))
    await mount()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('switching theme in Settings is saved', async () => {
    await mount()
    await go('settings')
    const dark = [...el.querySelectorAll('[role=radio]')].find((b) => b.textContent === 'Тёмная') as HTMLElement
    await act(async () => { dark.click() })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('tt.prefs.v1')!).theme).toBe('dark')
  })

  it('has accessible navigation with the current page marked', async () => {
    await mount()
    await go('week')
    const navs = el.querySelectorAll('nav')
    expect(navs.length).toBe(2) // sidebar (lg) + bottom bar (mobile); CSS shows one
    expect(el.querySelectorAll('a[aria-current="page"]').length).toBe(2)
    expect(el.querySelector('main')).not.toBeNull()
  })

  it('shows an offline notice when the network drops', async () => {
    await mount()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    await act(async () => { window.dispatchEvent(new Event('offline')) })
    expect(text()).toContain('работает офлайн')
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    await act(async () => { window.dispatchEvent(new Event('online')) })
    expect(text()).not.toContain('работает офлайн')
  })

  it('searches by teacher across all groups (lazy chunk)', async () => {
    await mount()
    await go('search')
    const input = el.querySelector('input[type=search]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Нусупбеков')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await settle()
    expect(text()).toContain('Электроника и схемотехника')
  })
})
