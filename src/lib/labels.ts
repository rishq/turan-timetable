import type { DayId, LessonType } from '../types/schedule'
import type { MessageKey } from './i18n'

export const DAY_SHORT: Record<DayId, string> = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' }
export const DAY_LONG: Record<DayId, string> = {
  mon: 'Понедельник', tue: 'Вторник', wed: 'Среда', thu: 'Четверг', fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье',
}
export const TYPE_KEY: Record<LessonType, MessageKey> = {
  lecture: 'typeLecture', practical: 'typePractical', seminar: 'typeSeminar', laboratory: 'typeLaboratory', other: 'typeOther',
}
export const typeVar = (t: LessonType) => `var(--t-${t})`
