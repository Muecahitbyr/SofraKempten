import { motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { site } from '../data/site'
import { scrollToTop } from '../lib/smoothScroll'
import { ease } from '../components/ui/Reveal'

/**
 * Rechtstexte. Felder in [eckigen Klammern] müssen vom Betreiber ergänzt
 * und die Texte vor Veröffentlichung rechtlich geprüft werden.
 */

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    scrollToTop(true)
    document.title = `${title} – Sofra Kempten`
    return () => {
      document.title = 'Sofra – Cağ Kebab & Drehspieß in Kempten'
    }
  }, [title])

  return (
    <main className="legal">
      <div className="container legal__inner">
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }}>
          {title}
        </motion.h1>
        <motion.div
          className="legal__body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.15 }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  )
}

export function Impressum() {
  return (
    <LegalPage title="Impressum">
      <p className="legal__notice">Platzhalter – bitte die Angaben in eckigen Klammern durch die echten Betreiberdaten ersetzen.</p>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Sofra – {site.title}
        <br />
        [Inhaber / Firmierung]
        <br />
        {site.address.street}
        <br />
        {site.address.zip} {site.address.city}
      </p>
      <h2>Kontakt</h2>
      <p>
        Telefon: [Telefonnummer]
        <br />
        E-Mail: [E-Mail-Adresse]
      </p>
      <h2>Umsatzsteuer-ID</h2>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [USt-IdNr.]</p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </LegalPage>
  )
}

export function Datenschutz() {
  return (
    <LegalPage title="Datenschutz">
      <p className="legal__notice">Muster – vor Veröffentlichung bitte rechtlich prüfen und um Angaben zum Hosting ergänzen.</p>
      <h2>Verantwortlicher</h2>
      <p>
        [Inhaber / Firmierung], {site.address.street}, {site.address.zip} {site.address.city}, [E-Mail-Adresse]
      </p>
      <h2>Hosting & Server-Logfiles</h2>
      <p>
        Beim Aufruf dieser Website werden durch den Hosting-Anbieter [Name des Hosters] technisch notwendige Daten (z. B. IP-Adresse,
        Datum und Uhrzeit, aufgerufene Seite) verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>
      <h2>Schriftarten</h2>
      <p>Alle Schriftarten werden lokal von unserem Server ausgeliefert. Es findet keine Verbindung zu Google Fonts statt.</p>
      <h2>Tischbestellung</h2>
      <p>
        Wenn du über die Website an deinen Tisch bestellst, verarbeiten wir die bestellten Gerichte, deine Tischnummer und eine optionale
        Anmerkung, um die Bestellung zuzubereiten und zu servieren (Art. 6 Abs. 1 lit. b DSGVO). Wir erheben dabei keinen Namen und keine
        Kontaktdaten. Bestelldaten werden nach spätestens 14 Tagen automatisch gelöscht.
      </p>
      <h2>Service-Ruf & Rechnung</h2>
      <p>
        Wenn du über die Website einen Mitarbeiter rufst oder die Rechnung anforderst, verarbeiten wir deine Tischnummer, die Art der Anfrage
        und ggf. die gewünschte Zahlungsart. Diese Daten werden nach spätestens 2 Tagen automatisch gelöscht.
      </p>
      <h2>Reservierungsanfragen</h2>
      <p>
        Das Reservierungsformular speichert keine Daten auf unserem Server. Beim Absenden öffnet sich dein eigenes E-Mail-Programm mit einer
        vorbereiteten Nachricht an {site.reservationEmail}. Die Angaben (Name, Telefon, ggf. E-Mail, Datum, Uhrzeit, Personenzahl, Nachricht)
        verarbeiten wir zur Bearbeitung deiner Reservierung (Art. 6 Abs. 1 lit. b DSGVO) und löschen sie, sobald sie dafür nicht mehr benötigt
        werden.
      </p>
      <h2>Lokale Speicherung</h2>
      <p>
        Dein Warenkorb, die gewählte Tischnummer und der Status deiner letzten Bestellung werden lokal in deinem Browser gespeichert (Local
        bzw. Session Storage). Du kannst diese Daten jederzeit über „Warenkorb leeren“ oder die Browsereinstellungen löschen.
      </p>
      <h2>Google Maps</h2>
      <p>
        Die Karte im Bereich „Besuch“ wird erst nach deinem Klick auf „Karte laden“ eingebunden. Erst dann werden Daten (u. a. deine
        IP-Adresse) an Google Ireland Limited übertragen. Rechtsgrundlage ist deine Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.
      </p>
      <h2>Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie
        das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.
      </p>
    </LegalPage>
  )
}
