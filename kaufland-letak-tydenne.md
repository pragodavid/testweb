# Kaufland leták – týdenní automatické stahování

## Kontext
Každou neděli je potřeba:
1. Vytvořit novou podsložku v `/home/dejvaval/LAB` s aktuálním datem (formát `dd-mm-yy`)
2. Stáhnout akční leták Kaufland pro nadcházející týden (PDF)
3. Smazat starou podsložku z předchozího týdne včetně obsahu

URL PDF se každý týden mění (jiné UUID), proto nestačí statický bash skript —
je potřeba vždy znovu načíst stránku https://prodejny.kaufland.cz/letak.html
a dynamicky najít aktuální PDF odkazy.

## Přístup: Naplánovaný Claude agent (schedule skill)

Použijeme `schedule` skill, který vytvoří opakující se remote trigger —
Claude agent spouštěný každou neděli dle cronu.

## Kroky implementace

### 1. Spustit `schedule` skill
Vytvoříme nový trigger s:
- **Cron výraz:** `0 8 * * 0` (každou neděli v 8:00)
- **Working directory:** `/home/dejvaval/LAB`
- **Prompt pro agenta:**

```
Proveď následující kroky v pořadí:

1. Zjisti dnešní datum a vytvoř název složky ve formátu dd-mm-yy (např. "20-04-26").
2. V adresáři /home/dejvaval/LAB najdi existující podsložku ve formátu dd-mm-yy
   (např. ls | grep -E '^[0-9]{2}-[0-9]{2}-[0-9]{2}$') — to je stará složka ke smazání.
3. Vytvoř novou podsložku /home/dejvaval/LAB/{dnešní datum dd-mm-yy}.
4. Načti stránku https://prodejny.kaufland.cz/letak.html a najdi přímé PDF odkazy
   na leták platný pro příští týden (hledej .pdf URL v HTML).
5. Stáhni všechny nalezené PDF soubory do nové složky pomocí wget.
6. Smaž starou podsložku včetně obsahu (rm -rf).
7. Ověř výsledek: zobraz ls -lh /home/dejvaval/LAB/{nová složka}/.
```

### 2. Ověření triggeru
Po vytvoření spustit trigger manuálně (run now) a zkontrolovat výstup.

## Kritické soubory / příkazy
- Pracovní adresář: `/home/dejvaval/LAB`
- Stránka letáků: `https://prodejny.kaufland.cz/letak.html`
- PDF storage pattern: `https://object.storage.eu01.onstackit.cloud/leaflets/pdfs/{UUID}/Kaufland-*.pdf`

## Ověření
- Po nastavení spustit trigger ručně a zkontrolovat, zda se vytvoří složka a stáhnou PDF
- Zkontrolovat, zda se smaže stará složka

---

## Notifikace + potvrzení + nasazení na GitHub

### Proč ne Google Messages přímou cestou
Google Messages (SMS/RCS) nemá veřejné API pro programatické odesílání ze serveru.
**Řešení:** Gmail notifikace — na Androidu se zobrazí jako push upozornění okamžitě,
vizuálně srovnatelné se zprávou. Odesíláme přes Gmail MCP (účet: pragodavid@gmail.com).

---

### Celý týdenní tok (nedělní cyklus)

```
12:00  → Trigger A: Claude agent odešle Gmail notifikaci s návrhem odpovědi
         ↓
       Uživatel odpoví "ANO" (nebo "spustit")
         ↓
12:xx  → Trigger B: Claude agent zachytí odpověď a spustí hlavní workflow:
           1. Stáhne leták Kaufland
           2. Vygeneruje nový jidelnicek-dd-mm-yy.html
           3. Nasadí HTML na GitHub (testweb)
           4. Odešle potvrzovací Gmail "✅ Hotovo – stránka je živá"
```

---

### Trigger A — Gmail notifikace (každou neděli v 12:00)

**Cron:** `0 12 * * 0`

**Prompt agenta:**
```
Odešli Gmail zprávu na pragodavid@gmail.com s tímto obsahem:

Předmět: 🛒 Kaufland jídelníček – spustit generování?

Tělo:
Ahoj! Je neděle a je čas vygenerovat nový týdenní jídelníček.

📋 Co se provede:
• Stáhne se akční leták Kaufland pro příští týden
• Vygeneruje se nový interaktivní jídelníček s recepty
• Stránka se zveřejní na: https://pragodavid.github.io/testweb

▶️ Pro spuštění odpověz na tento e-mail slovem: ANO

(Pokud nechceš tento týden generovat, odpověz: NE nebo zprávu ignoruj.)
```

---

### Trigger B — Sledování odpovědi a spuštění workflow

**Cron:** `*/15 12-14 * * 0` (každých 15 minut od 12:00 do 14:00 v neděli)

**Prompt agenta:**
```
Zkontroluj Gmail příchozí poštu (pragodavid@gmail.com):
Hledej odpověď na e-mail s předmětem obsahujícím "Kaufland jídelníček"
odeslanou dnes po 12:00.

Pokud nalezneš odpověď obsahující "ANO" nebo "spustit" (case-insensitive):

1. Zjisti dnešní datum (formát dd-mm-yy).
2. Najdi existující složku dd-mm-yy v /home/dejvaval/LAB/ — smaž ji (rm -rf).
3. Vytvoř novou složku /home/dejvaval/LAB/{datum}.
4. Načti https://prodejny.kaufland.cz/letak.html, najdi PDF letáky příštího týdne.
5. Stáhni PDF do nové složky pomocí wget.
6. Vygeneruj nový jidelnicek-{datum}.html do /home/dejvaval/LAB/jidelnicek/
   (podle šablony z html.md — s filtry, recepty a nákupním seznamem).
7. Zkopíruj HTML do /home/dejvaval/repos/testweb/index.html
   a také jako jidelnicek-{datum}.html.
8. git -C /home/dejvaval/repos/testweb add index.html jidelnicek-{datum}.html
9. git -C /home/dejvaval/repos/testweb commit -m "Jídelníček {datum}"
10. git -C /home/dejvaval/repos/testweb push origin main
11. Odešli potvrzovací Gmail na pragodavid@gmail.com:
    Předmět: ✅ Jídelníček {datum} je živý
    Tělo: "Nový jídelníček byl úspěšně zveřejněn.
    🔗 https://pragodavid.github.io/testweb"

Pokud odpověď nenajdeš nebo obsahuje "NE": nedělej nic.
```

---

### Implementace (spustit schedule skill)

Vytvořit 2 triggery pomocí `schedule` skill:

| Trigger | Cron | Popis |
|---|---|---|
| `kaufland-notifikace` | `0 12 * * 0` | Odešle Gmail s výzvou ke spuštění |
| `kaufland-workflow` | `*/15 12-14 * * 0` | Sleduje odpověď a spustí celý workflow |

---

### Poznámky
- Trigger B se sám zastaví po nalezení odpovědi (hotovo = neprovede znovu)
- Pokud uživatel neodpoví do 14:00, workflow se ten týden nespustí
- Repozitář: https://github.com/pragodavid/testweb
- Veřejná URL: https://pragodavid.github.io/testweb
