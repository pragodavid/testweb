# Jídelníček – souhrn projektu, nastavení a konverzace

**Datum vytvoření:** 19. 4. 2026  
**Poslední aktualizace:** 20. 4. 2026  
**Autor:** David Valášek (pragodavid@gmail.com)

---

## Co jsme vytvořili

Automatizovaný systém týdenního jídelníčku napojený na akční letáky Kaufland:

1. Každou neděli v **8:00** přijde e-mail s dotazem na spuštění
2. Po odpovědi **ANO** agent ve **13:00** stáhne leták, vygeneruje HTML jídelníček a zveřejní ho na GitHubu
3. Stránka je živá na **https://pragodavid.github.io/testweb**

---

## Soubory projektu

| Soubor | Popis |
|---|---|
| `jidelnicek-19-04-26.html` | Interaktivní HTML jídelníček (22.4.–28.4.2026) |
| `kaufland-letak-tydenne.md` | Plán stahování letáků + notifikační workflow |
| `html.md` | Specifikace HTML struktury, filtrů, GitHub Pages |
| `kuchar.md` | Plán týdenního plánování jídel z letáku |
| `jidelnicek.md` | Tento soubor – souhrn projektu |

---

## HTML jídelníček – funkce

- **Filtry dnů:** Středa–Úterý (odpovídá platnosti letáku Kaufland)
- **Filtry chodů:** Snídaně / Oběd / Večeře
- **Nákupní seznam:** závislý na filtrech — zobrazí jen položky pro vybrané dny a chody, dynamicky přepočítává součet
- **Recepty:** kliknutím na název jídla se otevře modální okno s ingrediencemi, postupem a tipem kuchaře (21 receptů)
- **Pro 4 osoby**, preferuje akční zboží Kaufland

---

## Automatizace – triggery

### Trigger 1: kaufland-notifikace
- **ID:** `trig_015ozsZh1X4ZH8B1Yc82p1fr`
- **Čas:** každou neděli v **8:00 Prague** (6:00 UTC)
- **Akce:** odešle e-mail přes Resend API na pragodavid@gmail.com
- **URL:** https://claude.ai/code/scheduled/trig_015ozsZh1X4ZH8B1Yc82p1fr

### Trigger 2: kaufland-workflow
- **ID:** `trig_01EZWUEhYc3z6oizyrZm82cH`
- **Čas:** každou neděli v **13:00 Prague** (11:00 UTC)
- **Akce:** zkontroluje Gmail pro odpověď ANO → stáhne leták → aktualizuje HTML → pushne na GitHub → pošle potvrzovací e-mail
- **URL:** https://claude.ai/code/scheduled/trig_01EZWUEhYc3z6oizyrZm82cH

---

## Přístupové údaje a služby

| Služba | Detail |
|---|---|
| **Resend.com** | Odesílání e-mailů, účet: pragodavid@gmail.com |
| **Resend API klíč** | `re_XPyRCKU8_89R6zgsXL73JpK4Z9CgLqKfY` |
| **Odesílatel (free tier)** | onboarding@resend.dev |
| **GitHub repozitář** | https://github.com/pragodavid/testweb |
| **GitHub Pages URL** | https://pragodavid.github.io/testweb |
| **GitHub PAT** | uložen v memory: `reference_claude_email.md` |
| **Gmail MCP** | pragodavid@gmail.com (čtení odpovědí) |

---

## Nedělní cyklus – krok za krokem

```
Neděle 8:00   → Trigger 1 spustí se
               → Odešle e-mail: "🛒 Kaufland jídelníček – spustit generování?"
               → Obsah: co se provede + instrukce "odpověz ANO"

Ty             → Odpovíš ANO na e-mail (kdykoli do 13:00)

Neděle 13:00  → Trigger 2 spustí se
               → Zkontroluje Gmail přes MCP
               → Najde odpověď ANO → spustí workflow:
                   1. Zjistí datum (dd-mm-yy)
                   2. Stáhne leták z prodejny.kaufland.cz/letak.html
                   3. Aktualizuje HTML (datum, období platnosti)
                   4. Pushne na GitHub (testweb)
                   5. Odešle potvrzovací e-mail: "✅ Jídelníček je živý"

               → Pokud odpověď NE nebo žádná → nedělá nic
```

---

## GitHub Pages – nastavení

1. Repozitář: https://github.com/pragodavid/testweb
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. `index.html` = aktuální týdenní jídelníček
4. Archivní soubory: `jidelnicek-dd-mm-yy.html`

---

## Konverzace – co jsme probírali (19. 4. 2026)

1. **Stažení letáku** — stáhli jsme PDF letáky Kaufland 22.4.–28.4.2026 do `/home/dejvaval/LAB/19-04-26/`
2. **Složka jidelnicek** — vytvořena, obsahuje plány a HTML
3. **HTML jídelníček** — vytvořen `jidelnicek-19-04-26.html` s filtry, recepty a nákupním seznamem
4. **Recepty** — doplněno 21 receptů s modálním oknem (ingredience, postup, tip)
5. **Nákupní seznam závislý na filtrech** — každá položka tagována `data-days` + `data-meals`
6. **GitHub nasazení** — pushnut na https://github.com/pragodavid/testweb, živé na GitHub Pages
7. **Plán html.md** — specifikace celého HTML včetně GitHub Pages workflow
8. **E-mailová notifikace** — testováno přes Gmail MCP (koncept) a Resend API
9. **Resend.com** — registrace pod pragodavid@gmail.com, API klíč funkční, test e-mail doručen a potvrzen odpovědí
10. **Dva nedělní triggery** — nastaveny v Anthropic cloud (schedule skill), první spuštění 26. 4. 2026
11. **Čas notifikace** — změněn z 12:00 na 8:00 Prague

### 20. 4. 2026 (aktualizace)
12. **GitHub repo** — `.md` soubory přidány do repozitáře `pragodavid/testweb` (dokumentace projektu)
13. **Stav systému** — vše připraveno, první automatické spuštění proběhne 26. 4. 2026 v 8:00 Prague
14. **Živá stránka** — https://pragodavid.github.io/testweb (jídelníček 22.4.–28.4.2026)

---

## Stav k 20. 4. 2026

| Komponenta | Stav |
|---|---|
| HTML jídelníček | ✅ Živý na GitHub Pages |
| Trigger 1 (notifikace 8:00) | ✅ Aktivní |
| Trigger 2 (workflow 13:00) | ✅ Aktivní |
| Resend API | ✅ Funkční |
| Gmail MCP | ✅ Nakonfigurován |
| Dokumentace v repozitáři | ✅ Aktualizována |

---

## Struktura adresáře LAB/jidelnicek

```
/home/dejvaval/LAB/jidelnicek/
├── jidelnicek.md              ← tento soubor
├── jidelnicek-19-04-26.html   ← aktuální HTML jídelníček
├── kaufland-letak-tydenne.md  ← plán stahování + notifikace + GitHub
├── html.md                    ← specifikace HTML a GitHub Pages
└── kuchar.md                  ← plán týdenního plánování jídel
```
