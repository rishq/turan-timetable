# Import report

Source: `data/source/timetable-spring-2026.pdf` (aSc «Расписание», Университет Туран, 28 pages, created 2026-01-26; embedded title decodes to a spring ('весенний') timetable dated 23.01.2026).

Regenerate: `npm run import:pdf` (needs Python 3 + `pdfplumber`). Output: `data/schedules/timetable.json`, `data/schedules/import-report.json`.

## Method

- Grid geometry (10 slot columns × 6 day rows) is read from the drawn borders; a lesson that spans slots is one merged cell. Day, start/end slot and times therefore come from position, never from text order.
- Subject / teacher / room are separated by font size (6.44 / 6.12 / 5.05 pt; subjects shrink to 5.8 pt in narrow cells).
- Subject spelling is taken from unwrapped occurrences elsewhere in the PDF; words split by line wraps (e.g. «искусственног|о») are rejoined only when the joined word exists unbroken elsewhere.
- Original Russian/Kazakh text is preserved (e.g. Айнақұл Әлжан Жақанұлы). Source typos are kept (e.g. «Русcкий» with a Latin c; «Маршрутизация масштабирование» without a comma).

## Results

- Pages: 28 → groups: 28 (every page is a distinct group/variant; none duplicated)
- Lessons: 359 (practical: 140, lecture: 171, seminar: 44, other: 4)
- Distinct subjects: 51; teachers: 34
- Pages whose grid differs from page 1: 0
- Overlapping lessons within a group: 0; duplicate ids: 0
- Records flagged `needs_review` by the importer: 0

## Validation performed

1. For every one of the 28 pages, the number of extracted lessons equals the number of «(лекция)/(практика)/(семинар)» markers (+ «Физическая культура» entries, which print no type) in the PDF text layer: **0 mismatches**.
2. Pages 1 and 14 were compared cell-by-cell with a rendered image of the page (day, slot span, room, teacher): exact match.
3. Automated checks in `src/tests/dataset.test.ts` (slot bounds, ordered times, no overlaps/duplicates, Kazakh letters, page-1 regression).

## NOT yet verified (honest limits)

- Only pages 1 and 14 were compared visually; the other 26 are covered by the count cross-check and geometry rules, not by eye. A human pass over a sample is still recommended before calling the data confirmed. All records are therefore `verification: "extracted"`, none `confirmed`.
- **Semester dates are not in the PDF.** The file is a spring-2026 timetable (dated 23.01.2026); `effectiveFrom/To` are `null` and `completeness` is `unknown`. Check it is the timetable you want for the current term.
- Four 'Физическая культура' entries print no lesson type → stored as `other` (note on the record).
- Lessons spanning slots 5–6 include the 12:50–13:10 break in their displayed time range (12:00–14:00), as the grid merges those cells.
- Group names like `ВТПО231(4)`, `РЭТ231(4)_1`, `ВТПО252(3)_2` are used exactly as printed; the meaning of `(4)`, `(3)`, `(2)` and `_N` suffixes is not stated in the PDF and is not interpreted.
- Where the same subject appears under different spellings in different groups (e.g. «Web-технологии I» vs «Web - технологии»; «Системы искусственного интеллекта» vs «… - I») they remain separate subjects, as printed.

## Lessons per group

| Group | PDF page | Lessons |
|---|---|---|
| ВТПО231(4) | 1 | 10 |
| ВТПО232(4) | 2 | 10 |
| РЭТ232(4) | 3 | 12 |
| РЭТ231(4)_1 | 4 | 13 |
| РЭТ231(4)_2 | 5 | 12 |
| РЭТ231(4)_3 | 6 | 12 |
| ПИ232(4) | 7 | 12 |
| ВТПО241(4) | 8 | 14 |
| ВТПО242(4) | 9 | 14 |
| ПИ242(4) | 10 | 14 |
| РЭТ241(4)_1 | 11 | 17 |
| РЭТ241(4)_2 | 12 | 17 |
| РЭТ242(4) | 13 | 17 |
| ВТПО241(3) | 14 | 12 |
| ВТПО242(3) | 15 | 12 |
| ПИ242(3) | 16 | 11 |
| РЭТ241(3) | 17 | 14 |
| РЭТ242(3) | 18 | 14 |
| ВТПО251(4) | 19 | 10 |
| ВТПО252(4) | 20 | 10 |
| ПИ251(4) | 21 | 10 |
| ПИ252(4) | 22 | 9 |
| РЭТ251(4) | 23 | 11 |
| ВТПО252(3)_1 | 24 | 14 |
| ВТПО252(3)_2 | 25 | 14 |
| ВТПО252(2) | 26 | 16 |
| ПИ252(3) | 27 | 14 |
| РЭТ252(3) | 28 | 14 |

## Distinct subjects (verify spellings)

- 1C и интеграция систем
- Cisco - II
- UX/UI - дизайн
- Web - технологии
- Web-технологии I
- Академическое письмо
- Алгоритмизация и программирование
- Аналитика данных
- Антенно-фидерные устройства
- Архитектура и организация вычислительных систем
- Введение в предпринимательство
- Высшая математика - ІІ
- Дискретная математика
- Инженерия программного обеспечения
- Иностранный язык - II
- Казахский (Русcкий) язык - II
- Компьютерная графика и прикладные пакеты моделирования сетей телекоммуникаций
- Компьютерные сети
- Культурология
- Маршрутизация масштабирование и коммутация сетей (Cisco)
- Методы и средства защиты компьютерной информации
- Метрология стандартизация и сертификация техники связи
- Мультимедиа технологии
- Объектно-ориентированное программирование
- Операционная система Linux
- Политология
- Программирование на языке Java - II
- Программирование на языке Python
- Программирование цифровых устройств
- Проектирование и разработка архитектуры клиент серверного ПО (Cisco)
- Психология
- Радиовещание и акустика
- Радиопередающие и радиоприемные устройства
- Радиосети спутниковой связи
- Сети и системы телекоммуникаций
- Системное программирование
- Системы искусственного интеллекта
- Системы искусственного интеллекта - I
- Сотовые сети
- Социология
- Тестирование и сертификация программного обеспечения
- Технология интернет вещей
- Технология печатных плат и поверхностного монтажа
- Управление и контроль командной разработки программного обеспечения
- Физика - II
- Физическая культура - II
- Физическая культура - IV
- Цифровая коммутация
- Цифровое телевидение и видеотехника
- Электроника
- Электроника и схемотехника
