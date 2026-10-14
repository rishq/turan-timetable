import { describe, expect, it } from 'vitest'
import { addDays, dayIdOf, formatCountdown, formatDuration, parseHHmm, toLocalISODate } from '../lib/time'
import { at } from './helpers'

describe('time', () => {
  it('parses valid and rejects invalid HH:mm', () => {
    expect(parseHHmm('8:00')).toBe(480)
    expect(parseHHmm('17:10')).toBe(1030)
    for (const bad of ['24:00', '12:60', 'abc', '', '9:5']) expect(parseHHmm(bad)).toBeNull()
  })
  it('maps local weekday, Sunday last', () => {
    expect(dayIdOf(at(2, 12))).toBe('mon')
    expect(dayIdOf(at(7, 12))).toBe('sat')
    expect(dayIdOf(at(8, 12))).toBe('sun')
  })
  it('handles day boundaries and month rollover', () => {
    expect(dayIdOf(at(2, 0, 0, 0))).toBe('mon')
    expect(dayIdOf(at(2, 23, 59, 59))).toBe('mon')
    expect(toLocalISODate(addDays(new Date(2026, 0, 31, 23, 59), 1))).toBe('2026-02-01')
  })
  it('formats durations and countdowns', () => {
    expect(formatDuration(3900)).toBe('1 ч 05 мин')
    expect(formatDuration(3600)).toBe('1 ч')
    expect(formatDuration(1500)).toBe('25 мин')
    expect(formatDuration(45)).toBe('45 с')
    expect(formatCountdown(3725)).toBe('1:02:05')
    expect(formatCountdown(65)).toBe('01:05')
    expect(formatCountdown(-5)).toBe('00:00')
  })
})
