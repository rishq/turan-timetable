#!/usr/bin/env python3
"""Offline importer: aSc timetable PDF -> data/schedules/timetable.json + import-report.json.

Day/slot/span are derived from the drawn grid borders (not text order). Nothing is
guessed: anything that cannot be resolved is kept raw and flagged `needs_review`.
Usage: python3 scripts/import_pdf.py [data/source/timetable-spring-2026.pdf]
"""
import sys, json, re, hashlib, collections
import pdfplumber

SRC = sys.argv[1] if len(sys.argv) > 1 else "data/source/timetable-spring-2026.pdf"
OUT = "data/schedules/timetable.json"
REPORT = "data/schedules/import-report.json"
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"]
DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
TYPES = {"лекция": "lecture", "практика": "practical", "семинар": "seminar",
         "лабораторная": "laboratory", "лабораторное": "laboratory"}
TRANSLIT = {"ВТПО": "vtpo", "РЭТ": "ret", "ПИ": "pi"}
SZ_TITLE, SZ_TITLE_SHRUNK, SZ_TEACHER, SZ_ROOM = 6.44, 5.8, 6.12, 5.05
TYPE_RE = re.compile(r"\(\s*(лекция|практика|семинар|лабораторная|лабораторное)\s*\)\s*$", re.I)


def near(a, b, t=1.0):
    return abs(a - b) <= t


def snap(vals, tol=1.0):
    out = []
    for v in sorted(vals):
        if not out or v - out[-1] > tol:
            out.append(v)
    return out


def page_grid(page):
    V, H = [], []
    for l in page.lines:
        if near(l["x0"], l["x1"], 0.5):
            V.append((l["x0"], l["top"], l["bottom"]))
        elif near(l["top"], l["bottom"], 0.5):
            H.append((l["top"], l["x0"], l["x1"]))
    return V, snap([v[0] for v in V]), snap([h[0] for h in H])


def group_title(page):
    cs = [c for c in page.chars if c["size"] > 20 and c["top"] < 60 and c["x0"] > 200]
    cs.sort(key=lambda c: c["x0"])
    return "".join(c["text"] for c in cs).strip()


def slot_headers(page, col_b):
    words = page.extract_words()
    times = [w for w in words if re.fullmatch(r"\d{1,2}:\d{2}", w["text"]) and 100 < w["top"] < 125]
    cols = collections.defaultdict(list)
    for w in times:
        for i in range(len(col_b) - 1):
            if col_b[i] <= (w["x0"] + w["x1"]) / 2 < col_b[i + 1]:
                cols[i].append(w)
    res = []
    for i in sorted(cols):
        ws = sorted(cols[i], key=lambda w: w["x0"])
        res.append((ws[0]["text"], ws[-1]["text"]))
    return res


def hhmm(s):
    h, m = s.split(":")
    return f"{int(h):02d}:{m}"


def lines_of(chars, gap=2.0):
    rows = collections.defaultdict(list)
    for c in chars:
        rows[round(c["top"])].append(c)
    out = []
    for k in sorted(rows):
        cs = sorted(rows[k], key=lambda c: c["x0"])
        s = ""
        for i, c in enumerate(cs):
            if i and c["x0"] - cs[i - 1]["x1"] > gap and not s.endswith(" "):
                s += " "
            s += c["text"]
        out.append(s.strip())
    return out


def key(s):
    return re.sub(r"[^0-9a-zа-яёәіңғүұқөһ]", "", s.lower())


def extract():
    pages, raw = [], []
    ref = {}
    with pdfplumber.open(SRC) as pdf:
        for pn, page in enumerate(pdf.pages, 1):
            V, xs, ys = page_grid(page)
            col_b = [x for x in xs if x > 90][:11]
            row_b = [y for y in ys if y > 120][:7]
            slots = slot_headers(page, col_b)
            gname = group_title(page)
            if not ref:
                ref = {"col": col_b, "row": row_b, "slots": slots}
            grid_ok = (len(col_b) == 11 and len(row_b) == 7 and slots == ref["slots"] and
                       all(near(a, b, 1.5) for a, b in zip(col_b, ref["col"])) and
                       all(near(a, b, 1.5) for a, b in zip(row_b, ref["row"])))
            pages.append({"page": pn, "group": gname, "grid_ok": grid_ok})
            for d in range(6):
                y0, y1 = row_b[d], row_b[d + 1]
                ym = (y0 + y1) / 2
                ncols = len(col_b) - 1

                def border(bx):
                    return any(near(v[0], bx, 1.0) and v[1] <= ym <= v[2] for v in V)
                s = 0
                while s < ncols:
                    e = s
                    while e + 1 < ncols and not border(col_b[e + 1]):
                        e += 1
                    xa, xb = col_b[s], col_b[e + 1]
                    cs = [c for c in page.chars
                          if xa <= (c["x0"] + c["x1"]) / 2 <= xb and y0 <= (c["top"] + c["bottom"]) / 2 <= y1]
                    if cs:
                        t = [c for c in cs if near(c["size"], SZ_TITLE, 0.15) or near(c["size"], SZ_TITLE_SHRUNK, 0.1)]
                        te = [c for c in cs if near(c["size"], SZ_TEACHER, 0.1)]
                        r = [c for c in cs if near(c["size"], SZ_ROOM, 0.1)]
                        oth = [c for c in cs if not any(c is z for grp in (t, te, r) for z in grp)]
                        raw.append({"page": pn, "group": gname, "day": d, "s": s, "e": e,
                                    "title": lines_of(t), "teacher": lines_of(te), "room": lines_of(r),
                                    "other": "".join(c["text"] for c in oth)})
                    s = e + 1
    return pages, raw, ref["slots"]


def build(pages, raw, slots):
    def strip_type(t):
        m = TYPE_RE.search(t)
        return (t[:m.start()].strip(), m) if m else (t.strip(), None)

    def name_lines(lines):
        """Title lines with a trailing type-only line removed."""
        if len(lines) > 1 and TYPE_RE.fullmatch(lines[-1].strip()):
            return lines[:-1]
        return lines

    def tok(t):
        return re.sub(r"[^0-9a-zа-яёәіңғүұқөһ]", "", t.lower())
    # canonical subject spelling: from titles whose name fits on ONE line (no wrap ambiguity)
    single = collections.defaultdict(collections.Counter)
    # reliable whole words: tokens that sit in the interior of a line (never cut by a wrap)
    vocab = set()
    for x in raw:
        nl = name_lines(x["title"])
        if len(nl) == 1:
            nm = strip_type(nl[0])[0]
            single[key(nm)][nm] += 1
        for ln in x["title"]:
            ws = ln.split()
            vocab.update(tok(w) for w in ws[1:-1])
            if len(x["title"]) == 1:
                vocab.update(tok(w) for w in ws)
    vocab_full = set(vocab)
    for ctr in single.values():
        for nm in ctr:
            vocab_full.update(tok(w) for w in nm.split())
    tsingle = collections.defaultdict(collections.Counter)
    for x in raw:
        if len(x["teacher"]) == 1:
            tsingle[key(x["teacher"][0])][x["teacher"][0]] += 1
    slot_defs = [{"n": i + 1, "start": hhmm(a), "end": hhmm(b)} for i, (a, b) in enumerate(slots)]
    groups, subjects, teachers, lessons = {}, {}, {}, []
    for x in raw:
        subj0, m = strip_type(" ".join(x["title"]))
        flags = []
        k = key(strip_type("".join(x["title"]))[0])
        if k in single:
            subj = single[k].most_common(1)[0][0]
        else:
            subj = subj0
            nl = name_lines(x["title"])
            for p_, n_ in zip(nl, nl[1:]):
                lw, fw = (p_.split() or [""])[-1], (n_.split() or [""])[0]
                if tok(lw) + tok(fw) in vocab_full and tok(lw) not in vocab_full:
                    flags.append(f"mid-word break joined without space: '{lw}'+'{fw}'")
                    subj = subj.replace(lw + " " + fw, lw + fw)
        ltype = TYPES[m.group(1).lower()] if m else "other"
        notes = [] if m else ["lesson type not printed in source (kept as 'other')"]
        subj = re.sub(r"\s+", " ", subj)
        tk = key("".join(x["teacher"]))
        teacher = tsingle[tk].most_common(1)[0][0] if tk in tsingle else (" ".join(x["teacher"]) or None)
        teacher = re.sub(r"\s+", " ", teacher).strip() if teacher else None
        room = " ".join(x["room"]) or None
        gid = re.sub(r"_", "-", re.sub(r"\((\d)\)", r"-\1", x["group"]))
        for a, b in TRANSLIT.items():
            if gid.startswith(a):
                gid = b + gid[len(a):]
        gid = gid.lower()
        groups.setdefault(gid, {"id": gid, "name": x["group"], "sourcePages": []})["sourcePages"].append(x["page"])
        sid = "s-" + hashlib.sha1(key(subj).encode()).hexdigest()[:8]
        subjects[sid] = subj
        tid = None
        if teacher:
            tid = "t-" + hashlib.sha1(key(teacher).encode()).hexdigest()[:8]
            teachers[tid] = teacher
        if not teacher: flags.append("teacher missing")
        if not room: flags.append("classroom missing")
        if x["other"]: flags.append("unclassified text: " + x["other"])
        if sum(len(TYPE_RE.findall(l)) for l in x["title"]) > 1 or len(x["teacher"]) > 2 or len(x["room"]) > 1:
            flags.append("cell may contain more than one lesson")
        lessons.append({
            "id": f"{gid}-{DAYS[x['day']]}-{x['s']+1}-{ltype}-{sid[2:6]}", "groupId": gid,
            "day": DAYS[x["day"]], "slotStart": x["s"] + 1, "slotEnd": x["e"] + 1,
            "start": slot_defs[x["s"]]["start"], "end": slot_defs[x["e"]]["end"],
            "subjectId": sid, "type": ltype, "teacherId": tid, "teacher": teacher, "room": room,
            "variant": None, "source": {"page": x["page"], "rawSubject": " ".join(x["title"])},
            "verification": "needs_review" if flags else "extracted", "flags": flags, "notes": notes})
    return slot_defs, groups, subjects, teachers, lessons


if __name__ == "__main__":
    pages, raw, slots = extract()
    slot_defs, groups, subjects, teachers, lessons = build(pages, raw, slots)
    by = collections.defaultdict(list)
    for l in lessons:
        by[(l["groupId"], l["day"])].append(l)
    overlaps = []
    for ls in by.values():
        for a in range(len(ls)):
            for b in range(a + 1, len(ls)):
                if ls[b]["start"] < ls[a]["end"] and ls[a]["start"] < ls[b]["end"]:
                    overlaps.append([ls[a]["id"], ls[b]["id"]])
    ids = collections.Counter(l["id"] for l in lessons)
    data = {"meta": {"source": SRC,
                     "sourceNote": "aSc Расписание, Университет Туран; PDF metadata title decodes to a spring ('весенний') timetable dated 23.01.2026",
                     "effectiveFrom": None, "effectiveTo": None, "kind": "recurring-weekly",
                     "completeness": "unknown", "slots": slot_defs,
                     "days": [{"id": a, "label": b} for a, b in zip(DAYS, DAY_LABELS)]},
            "groups": sorted(groups.values(), key=lambda g: g["sourcePages"][0]),
            "subjects": [{"id": k, "name": v} for k, v in sorted(subjects.items(), key=lambda kv: kv[1])],
            "teachers": [{"id": k, "name": v} for k, v in sorted(teachers.items(), key=lambda kv: kv[1])],
            "lessons": lessons}
    json.dump(data, open(OUT, "w"), ensure_ascii=False, indent=1)
    report = {"pages": len(pages), "groups": len(groups), "lessons": len(lessons),
              "subjects": len(subjects), "teachers": len(teachers),
              "pagesWithGridMismatch": [p["page"] for p in pages if not p["grid_ok"]],
              "overlaps": overlaps, "duplicateIds": [i for i, c in ids.items() if c > 1],
              "needsReview": [{"id": l["id"], "page": l["source"]["page"], "flags": l["flags"]}
                              for l in lessons if l["flags"]],
              "groupPages": {g["id"]: g["sourcePages"] for g in groups.values()}}
    json.dump(report, open(REPORT, "w"), ensure_ascii=False, indent=1)
    print({k: (v if not isinstance(v, (list, dict)) else len(v)) for k, v in report.items()})
