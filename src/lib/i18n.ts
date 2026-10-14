import { ru } from './locales/ru'

export type Dict = typeof ru
export type MessageKey = keyof Dict

/** Add a locale here (and a file in ./locales) to make it selectable in Settings. */
export const LOCALES: { id: string; label: string; dict: Dict }[] = [{ id: 'ru', label: 'Русский', dict: ru }]

export function dictFor(locale: string): Dict {
  return (LOCALES.find((l) => l.id === locale) ?? LOCALES[0]!).dict
}

export type T = (key: MessageKey, vars?: Record<string, string | number>) => string

export function createT(locale: string): T {
  const dict = dictFor(locale)
  return (key, vars) => {
    const s: string = dict[key]
    return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : s
  }
}
