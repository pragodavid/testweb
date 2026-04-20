# Kuchař – týdenní plánování jídel

## Kontext
Na základě každý týden staženého letáku Kaufland (viz `kaufland-letak-tydenne.md`)
chceme automaticky sestavit týdenní jídelníček — Claude agent přečte PDF leták,
vybere akční zboží a navrhne jídla na každý den v týdnu.

## Přístup: Naplánovaný Claude agent (schedule skill)

Agent běží každou neděli po stažení letáku (navazuje na trigger z kaufland-letak-tydenne.md).

## Kroky implementace

### 1. Rozšířit existující týdenní trigger (kaufland-letak-tydenne.md)
Po stažení letáku agent navíc:

```
Po stažení PDF letáků proveď:

1. Přečti stažené PDF soubory z /home/dejvaval/LAB/{dnešní datum dd-mm-yy}/.
2. Identifikuj akční zboží — maso, ryby, zelenina, ovoce, mléčné výrobky.
3. Navrhni jídelníček na 7 dní (pondělí–neděle): snídaně, oběd, večeře.
   Upřednostni akční zboží z letáku, navrhni rozumné a pestré kombinace.
4. Vytvoř nákupní seznam ingrediencí pro celý týden.
5. Ulož výsledek jako /home/dejvaval/LAB/jidelnicek/jidelnicek-{datum dd-mm-yy}.md
   ve formátu markdown s tabulkou jídel a sekcí nákupní seznam.
```

### 2. Formát výstupního souboru

```markdown
# Jídelníček {dd.mm.yy} – {dd.mm.yy}

## Jídelníček
| Den       | Snídaně | Oběd | Večeře |
|-----------|---------|------|--------|
| Pondělí   | ...     | ...  | ...    |
...

## Nákupní seznam
- [ ] položka 1
- [ ] položka 2
...
```

## Kritické soubory
- Zdroj letáků: `/home/dejvaval/LAB/{datum}/Kaufland-*.pdf`
- Výstup: `/home/dejvaval/LAB/jidelnicek/jidelnicek-{datum}.md`
- Související plán: `/home/dejvaval/LAB/jidelnicek/kaufland-letak-tydenne.md`

## Ověření
- Po nastavení spustit trigger ručně a zkontrolovat výstup jídelníček v jidelnicek/
- Zkontrolovat, zda obsahuje 7 dní jídel a nákupní seznam
