import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, PREFS_KEY, loadPrefs, pushRecent, resolveTheme, savePrefs, toggleFavorite } from '../lib/prefs'

beforeEach(() => localStorage.clear())

describe('prefs persistence', () => {
  it('returns defaults when nothing is stored', () => expect(loadPrefs(localStorage)).toEqual(DEFAULT_PREFS))
  it('round-trips theme, group, favorites and week start', () => {
    const p = { ...DEFAULT_PREFS, theme: 'dark' as const, groupId: 'g1', favorites: ['g1', 'g2'], weekStart: 'sun' as const }
    savePrefs(p, localStorage)
    expect(loadPrefs(localStorage)).toEqual(p)
  })
  it('survives corrupted or hostile stored data', () => {
    localStorage.setItem(PREFS_KEY, '{not json')
    expect(loadPrefs(localStorage)).toEqual(DEFAULT_PREFS)
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: 'neon', favorites: [1, 'a'], recent: 'x' }))
    const p = loadPrefs(localStorage)
    expect(p.theme).toBe('system')
    expect(p.favorites).toEqual(['a'])
    expect(p.recent).toEqual([])
  })
  it('tolerates unavailable storage', () => {
    expect(loadPrefs(null)).toEqual(DEFAULT_PREFS)
    expect(() => savePrefs(DEFAULT_PREFS, null)).not.toThrow()
    const full = { getItem: () => null, setItem: () => { throw new Error('quota') } }
    expect(() => savePrefs(DEFAULT_PREFS, full)).not.toThrow()
  })
  it('keeps at most 5 recents, most recent first, no duplicates', () => {
    expect(pushRecent(['a', 'b', 'c', 'd', 'e'], 'c')).toEqual(['c', 'a', 'b', 'd', 'e'])
    expect(pushRecent(['a', 'b', 'c', 'd', 'e'], 'z')).toEqual(['z', 'a', 'b', 'c', 'd'])
  })
  it('toggles favorites', () => {
    expect(toggleFavorite([], 'a')).toEqual(['a'])
    expect(toggleFavorite(['a'], 'a')).toEqual([])
  })
  it('resolves system theme', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })
})
