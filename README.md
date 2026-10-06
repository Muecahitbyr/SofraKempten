# Sofra – Cağ Kebab & Drehspieß · Kempten

Website für das Restaurant **Sofra**, Kronenstraße 2, 87435 Kempten (Allgäu).

## Starten

```bash
npm install
npm run dev        # Website + Bestell-API auf http://localhost:5173
npm run build      # Produktions-Build nach /dist
npm start          # Produktionsserver (Website + API), Port 3000
```

Für den Betrieb unbedingt eine eigene PIN setzen:

```bash
STAFF_PIN=4711 PORT=3000 npm start
```

## Tischbestellung

1. Gäste legen Gerichte mit **+** in den Warenkorb (bei Bedarf mit Auswahl wie Beilage oder Sorte).
2. Sie wählen ihre **Tischnummer** und bestellen – bezahlt wird vor Ort.
3. Die Bestellung erscheint sofort live in der **Küchenansicht** unter `/kueche` (PIN-geschützt, Standard im Dev-Modus: `1234`), mit Ton.
4. Das Personal setzt den Status *Annehmen → Serviert*; der Gast sieht den Status live auf seinem Handy.

5. Pro Gericht können Gäste **Wünsche** angeben (Schnellauswahl wie „Scharf“, „Ohne Zwiebeln“ oder freier Text) – sie stehen hervorgehoben auf der Küchenkarte.
6. Über die **Glocke** (oder den Hinweis in der Speisekarte) können Gäste einen **Mitarbeiter rufen** oder die **Rechnung** (Bar/Karte) anfordern. Die Rufe erscheinen oben in der Küchenansicht mit eigenem Ton; mit „Erledigt“ sieht der Gast die Rückmeldung.

**QR-Codes für die Tische:** `https://eure-domain.de/?tisch=7` wählt Tisch 7 automatisch vor.

- Die Anzahl der Tische steht in `src/data/site.ts` (`tables`).
- Preise werden ausschließlich auf dem Server aus `src/data/menu.ts` berechnet.
- Bestellungen sind im Produktionsbetrieb nur während der Öffnungszeiten möglich (im Dev-Modus immer – zum Testen).
- Gespeichert wird in `server/data/` (`orders.json`, `calls.json`); Bestellungen werden nach 14, Service-Rufe nach 2 Tagen automatisch gelöscht.
- Die Schnell-Wünsche je Kategorie stehen in `src/data/menu.ts` (`wishes`).

## Reservierung

Das Formular (Tag, Uhrzeit passend zu den Öffnungszeiten, Personen, Kontakt, Nachricht) öffnet beim Absenden das E-Mail-Programm
des Gastes mit einer fertigen Nachricht. Die Empfängeradresse steht in `src/data/site.ts` → **`reservationEmail`** – bitte dort eure echte Adresse eintragen.
- Der Server braucht Node.js ≥ 22.6 und muss dauerhaft laufen (z. B. VPS, Railway, Render, Fly.io) – reines Static-Hosting reicht dafür nicht.

## Technik

- **Vite + React + TypeScript**
- **Motion** (Framer Motion) für Scroll-, Parallax- und Layout-Animationen
- **Lenis** für weiches Scrollen
- Schriften **lokal** eingebunden (Inter, Instrument Serif) – keine Verbindung zu Google Fonts
- Google Maps lädt erst nach Klick (Zwei-Klick-Lösung)

## Inhalte pflegen

| Was                          | Datei                  |
| ---------------------------- | ---------------------- |
| Speisekarte, Preise, Allergene | `src/data/menu.ts`   |
| Adresse, Öffnungszeiten, Social Links | `src/data/site.ts` |
| Impressum & Datenschutz      | `src/pages/Legal.tsx`  |
| Bestell-API & Server         | `server/`              |
| Küchenansicht                | `src/pages/Kitchen.tsx` |
| Logo / Favicon               | `public/logo.jpg`      |

Social-Media-Links erscheinen automatisch, sobald in `site.ts` eine URL eingetragen ist.
Die Rechtstexte enthalten Platzhalter in `[eckigen Klammern]` und müssen vor dem Livegang ergänzt und geprüft werden.

## Struktur

```
server/         Bestell-API, JSON-Speicher, Produktionsserver
src/
  components/   Sektionen (Hero, CagStory, Signatures, Bento, MenuSection, Visit …)
    art/        Line-Art-Illustrationen (SVG)
    ui/         Bausteine (Reveal, SpotlightCard, Magnetic, Icons)
  data/         Speisekarte & Stammdaten
  hooks/        Öffnungsstatus, „Dein Tisch“-Merkliste, Media Queries
  lib/          Formatierung, Öffnungszeiten-Logik, Smooth Scroll
  pages/        Startseite, Küche, Impressum, Datenschutz
  styles/       Design-Tokens & Styles je Bereich
```
