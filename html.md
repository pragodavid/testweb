# Plán tvorby HTML jídelníčku

## Účel
Interaktivní HTML stránka s týdenním jídelníčkem pro 4člennou rodinu.
Vychází z akční nabídky Kaufland (středa–úterý). Každou neděli se generuje nová verze.

---

## Struktura souboru

```
jidelnicek-dd-mm-yy.html
├── <header>          — název, období platnosti, datum vytvoření
├── <div.filters>     — filtry dnů + chodů (sticky)
├── <main>
│   ├── .day-card × 7 — karty pro každý den (St–Út)
│   │   └── .meal-row × 3 — snídaně / oběd / večeře
│   │       └── .meal-name (klikatelné → modal s receptem)
│   └── .shopping-section — nákupní seznam
└── #modal-overlay    — modální okno s receptem
```

---

## Filtry

### Filtry dnů
- Tlačítka: Středa / Čtvrtek / Pátek / Sobota / Neděle / Pondělí / Úterý
- Výchozí stav: vše aktivní (zelené)
- Toggle: klik = skryje/zobrazí daný den

### Filtry chodů
- Tlačítka: Snídaně / Oběd / Večeře
- Výchozí stav: vše aktivní
- Toggle: klik = skryje/zobrazí daný chod

### Závislost nákupního seznamu na filtrech ⭐
- Každá položka nákupního seznamu má atributy `data-days` a `data-meals`
- `data-days` = seznam dnů oddělených mezerou, např. `"st pa ne"`
- `data-meals` = seznam chodů, např. `"snidane obed"`
- Pravidlo zobrazení: položka je viditelná pokud **alespoň jeden** z jejích dnů
  je aktivní A **alespoň jeden** z jejích chodů je aktivní
- Součty (celkem za den, celkem za týden) se přepočítají po každé změně filtru
- Sekce „Nákupní seznam" se skryje/zobrazí nadpis prázdného stavu pokud
  žádná položka neodpovídá filtru

---

## Recepty (modální okno)

- Každý `.meal-name` má atribut `data-recipe="id"`
- Recepty uloženy v JS objektu `recipes{}`
- Struktura receptu: `{ title, meta, ingredients[], steps[], tip }`
- Modal se otevře klikem na název jídla, zavře: ✕ / klik mimo / Escape
- Animace otevření (scale + fade)

---

## Nákupní seznam — datový model

Každá položka v `<tbody>` musí mít:

```html
<tr data-days="st ct" data-meals="obed vecere">
  <td><input type="checkbox" class="item-check" data-price="134"></td>
  <td>Kuřecí stehna</td>
  ...
</tr>
```

### Mapování položek na dny a chody

| Položka | Dny | Chody |
|---|---|---|
| Kuřecí stehna | st ne | obed vecere |
| Mléko | st so ut | snidane |
| Hovězí maso | ct | obed |
| Filé z tresky | pa | obed |
| Vepřová krkovice | so | obed |
| Bílý jogurt | pa | snidane |
| Vejce | pa so ne po ut | snidane obed vecere |
| Máslo | ct so ne ut | snidane |
| Šunka | pa | vecere |
| Smetana | ct so | obed vecere |
| Klobása | po | obed |
| Mleté maso | po ut | vecere obed |
| Papriky | ut | obed |
| Eidam | so ut | vecere |
| Listové těsto | pa | vecere |
| Jahody | ut | snidane |
| Brambory | st pa so ut | obed vecere |
| Těstoviny | st po | vecere |
| Rýže | ne ut | obed |
| Ovesné vločky | st | snidane |
| Mrkev | st ct ne | obed |
| Celer, petržel | ct ne | obed |
| Cibule | ct so po | obed |
| Česnek | st so ne po | obed vecere |
| Rajčatová omáčka | pa po ut | vecere obed |
| Mouka | pa so | snidane vecere |
| Tortilly | ne | vecere |
| Tuňák | st | vecere |
| Kukuřice | st | vecere |
| Koření, olej | st ct pa so ne po ut | snidane obed vecere |
| Pečivo, chléb | ct ne | snidane |
| Avokádo | po | snidane |
| Banány | st ut | snidane |

---

## JS logika filtrování nákupního seznamu

```javascript
function applyFilters() {
  // 1. Skryj/zobraz karty dnů a řádky chodů (stávající logika)
  // 2. Pro každou položku nákupního seznamu:
  document.querySelectorAll('#shopping-table tbody tr[data-days]').forEach(row => {
    const rowDays  = row.dataset.days.split(' ');
    const rowMeals = row.dataset.meals.split(' ');
    const dayMatch  = rowDays.some(d => activeDays.has(d));
    const mealMatch = rowMeals.some(m => activeMeals.has(m));
    row.classList.toggle('hidden', !(dayMatch && mealMatch));
  });
  // 3. Přepočítat celkovou sumu (jen viditelné + nezaškrtnuté)
  recalcTotal();
}

function recalcTotal() {
  let total = 0;
  let checked = 0;
  document.querySelectorAll('#shopping-table tbody tr[data-days]').forEach(row => {
    if (row.classList.contains('hidden')) return;
    const price = parseInt(row.querySelector('.item-check').dataset.price);
    total += price;
    if (row.querySelector('.item-check').checked) checked += price;
  });
  // Aktualizuj zobrazení
}
```

---

## Checkbox v nákupním seznamu

Vlastní checkbox pomocí `appearance: none` + `::after`:
- **nezaškrtnutý** — prázdný čtvereček se šedým okrajem
- **zaškrtnutý** — červené pozadí (`#d32f2f`) s křížkem `✕` (= mám doma, vyřazuji z nákupu)

---

## Popis nad nákupním seznamem

Za `<h2>` nákupní sekce se přidává `<p>` s textem:
> Zde můžeš položky vyřadit z nákupního seznamu, protože je máš v domácích zásobách.

---

## PDF generátor (pdfmake)

PDF se generuje klientsky v prohlížeči pomocí [pdfmake 0.2.7](https://pdfmake.github.io/docs/).

CDN v `<head>` (Roboto font — plná podpora češtiny):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>
```

### Struktura PDF dokumentu

**Strana 1 — Přehled**
- Zelené záhlaví (název + datum + Kaufland info)
- Sekce „Aktivní filtry": zobrazené dny a chody
- Tabulka jídelníčku: Den / Chod / Název jídla / Popis a čas
  - Název jídla = podtržený modrý odkaz → `linkToDestination: recipeId` (skočí na recept v PDF)

**Strany 2+ — Recepty (dle zafiltrovaného pohledu)**
- Každý recept začíná na nové stránce (`pageBreak: 'before'`)
- Nadpis receptu má `id: recipeId` = cíl interního odkazu
- Obsah: meta (čas, počet osob) → Suroviny (odrážkový seznam) → Postup (číslovaný seznam) → Tip (zelený box s levou linkou)
- Zápatí: číslo strany / celkem · název jídelníčku

### Funkce buildDocDefinition()

```javascript
buildDocDefinition()
  → DL = mapování kódů dnů na česká jména
  → ML = mapování kódů chodů na česká jména
  → visibleMeals[] = DOM querySelectorAll('.day-card:not(.hidden) .meal-row:not(.hidden)')
  → recipeOrder[]  = unikátní recipeId v pořadí zobrazení
  → tableBody      = header + řádky s linkToDestination
  → recipesContent[] = { stack: [...], pageBreak: 'before' } pro každý recept
  → vrací docDefinition pro pdfMake.createPdf()
```

Helper `stripHtml(html)` — odstraní HTML tagy, emoji (Unicode ranges + whitelist), nadbytečné mezery.

### Tlačítko „Stáhnout PDF"
```javascript
pdfMake.createPdf(buildDocDefinition()).download('jidelnicek.pdf')
```

---

## EmailJS integrace — odesílání PDF jako přílohy

| Parametr | Hodnota |
|---|---|
| Public Key | `2O9xlPmD5Yc5OXnAI` |
| Service ID | `service_2h3ehkd` |
| Template ID | `template_seall0o` |

**Proměnné v šabloně:** `{{to_email}}`, `{{subject}}`, `{{message}}`, `{{attachment}}`

⚠️ **Šablona musí mít nakonfigurován parametr `attachment`** (v EmailJS dashboardu), jinak email dorazí bez přílohy.

Email obsahuje pouze:
- Předmět: `Jídelníček – PDF příloha`
- Text: `V příloze se nachází PDF s jídelníčkem dle vašeho výběru.`
- Příloha: vygenerovaný PDF soubor `jidelnicek.pdf`

### Postup odeslání (JS)
```javascript
pdfMake.createPdf(buildDocDefinition()).getBlob(blob => {
  const fd = new FormData();
  fd.append('service_id',  'service_2h3ehkd');
  fd.append('template_id', 'template_seall0o');
  fd.append('user_id',     '2O9xlPmD5Yc5OXnAI');
  fd.append('to_email',    emailAddr);
  fd.append('subject',     'Jídelníček – PDF příloha');
  fd.append('message',     'V příloze se nachází PDF s jídelníčkem dle vašeho výběru.');
  fd.append('attachment',  new File([blob], 'jidelnicek.pdf', { type: 'application/pdf' }), 'jidelnicek.pdf');
  fetch('https://api.emailjs.com/api/v1.0/email/send-form', { method: 'POST', body: fd });
});
```

SDK se načítá z CDN v `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script>emailjs.init('2O9xlPmD5Yc5OXnAI');</script>
```

---

## CSS konvence

| Barva | Použití |
|---|---|
| `#2e7d32` (tmavě zelená) | Primární barva, header, aktivní den |
| `#f9a825` (žlutá) | Snídaně |
| `#388e3c` (zelená) | Oběd |
| `#1565c0` (modrá) | Večeře, nákupní seznam header |
| `#ff6f00` (oranžová) | AKCE badge |
| `#e8f5e9` | Světle zelené pozadí karet |
| `#4a148c` (fialová) | Email sekce header |
| `#d32f2f` (červená) | Zaškrtnutý checkbox (mám doma) |

---

## Workflow generování nového HTML každou neděli

1. Claude agent stáhne PDF leták (viz `kaufland-letak-tydenne.md`)
2. Přečte PDF a identifikuje akční položky
3. Sestaví jídelníček (středa–úterý příštího týdne)
4. Vygeneruje nový HTML soubor `jidelnicek-dd-mm-yy.html`
   - Zachovat EmailJS `<script>` v `<head>` (Public Key, Service ID, Template ID — viz sekce EmailJS integrace)
   - Zachovat strukturu emailové sekce a JS logiku sestavení zprávy
5. Uloží přípravný dokument `html-dd-mm-yy.md`
6. Zkopíruje HTML do `~/repos/testweb/` jako `index.html` i `jidelnicek-dd-mm-yy.html`
7. `git add + commit + push origin main`
8. Smaže starý HTML a starý přípravný dokument z LAB

---

## Propojení s GitHub Pages

### Repozitář
- **URL:** https://github.com/pragodavid/testweb
- **Veřejná adresa:** https://pragodavid.github.io/testweb
- **Větev pro Pages:** `gh-pages` (nebo `main` složka `/docs`)

### Jednorázové nastavení (provést ručně)

1. V repozitáři přejít na **Settings → Pages**
2. Source: `Deploy from a branch` → větev `gh-pages`, složka `/ (root)`
3. Uložit — za chvíli bude stránka dostupná na `pragodavid.github.io/testweb`

### Struktura repozitáře

```
testweb/
├── index.html                      ← aktuální jídelníček (přejmenovaný symlink)
├── jidelnicek-19-04-26.html        ← archiv předchozích týdnů
├── jidelnicek-dd-mm-yy.html        ← nový vygenerovaný soubor
└── .github/
    └── workflows/
        └── deploy-jidelnicek.yml   ← GitHub Actions workflow
```

### GitHub Actions workflow — automatické nasazení každou neděli

Soubor: `.github/workflows/deploy-jidelnicek.yml`

```yaml
name: Deploy jídelníček

on:
  schedule:
    - cron: '30 8 * * 0'   # každou neděli v 8:30 (po stažení letáku v 8:00)
  workflow_dispatch:         # možnost spustit ručně

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Stáhnout nový jídelníček z LAB
        run: |
          # Zkopíruje aktuální HTML z LAB serveru nebo jej vygeneruje
          # (upravit dle skutečného zdroje — SCP, API, nebo inline generování)
          DATE=$(date +%d-%m-%y)
          cp jidelnicek-${DATE}.html index.html

      - name: Commit a push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add index.html jidelnicek-*.html
          git commit -m "Jídelníček $(date +%d.%m.%Y)" || echo "Žádné změny"
          git push
```

### Workflow nasazení (týdenní cyklus)

```
Neděle 8:00  → Claude agent stáhne leták Kaufland
Neděle 8:10  → Vygeneruje nový jidelnicek-dd-mm-yy.html do LAB/jidelnicek/
Neděle 8:15  → Zkopíruje HTML do repozitáře testweb, přejmenuje na index.html
Neděle 8:20  → git add + commit + push → GitHub Actions nasadí na Pages
Neděle 8:30  → Stránka živá na pragodavid.github.io/testweb
```

### Propojení Claude agenta s GitHubem

Do promptu týdenního triggeru (viz `kaufland-letak-tydenne.md`) přidat:

```
Po vygenerování HTML souboru:
1. Zkopíruj /home/dejvaval/LAB/jidelnicek/jidelnicek-{datum}.html
   do lokálního klonu repozitáře ~/repos/testweb/ jako index.html
2. git -C ~/repos/testweb add index.html
3. git -C ~/repos/testweb commit -m "Jídelníček {datum}"
4. git -C ~/repos/testweb push origin main
```

---

## Ověření funkčnosti

- [ ] Filtry dnů skryjí kartu dne i odpovídající položky v nákupním seznamu
- [ ] Filtry chodů skryjí řádky jídel i odpovídající položky v nákupním seznamu
- [ ] Kombinace filtrů funguje správně (průnik dnů ∩ chodů)
- [ ] Součet nákupního seznamu odpovídá pouze zobrazeným položkám
- [ ] Recepty se otevřou klikem na název jídla
- [ ] Modal se zavře klávesou Escape
- [ ] Responzivita na mobilu (320px+) — skrývají se sloupce Množství (3) a Cena/ks (4), Položka zůstává viditelná
- [ ] Tlačítko „Stáhnout PDF" vygeneruje a stáhne PDF s filtry + recepty
- [ ] V PDF jsou názvy jídel klikatelné (interní link skočí na recept)
- [ ] Tlačítko „Odeslat PDF emailem" odešle email s PDF přílohou (vyžaduje `{{attachment}}` v EmailJS šabloně)
