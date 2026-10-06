/**
 * Speisekarte – übernommen aus der gedruckten Karte des Sofra Kempten.
 * Preise in Euro. Allergen-Kennzeichnung gemäß Legende A–N.
 */

export const allergens = {
  A: 'Glutenhaltiges Getreide',
  B: 'Milch & Laktose',
  C: 'Eier',
  D: 'Sesamsamen',
  E: 'Sellerie',
  F: 'Senf',
  G: 'Sojabohnen',
  H: 'Schwefeldioxid & Sulfite',
  I: 'Schalenfrüchte',
  J: 'Erdnüsse',
  K: 'Krebstiere',
  L: 'Fische',
  M: 'Lupinen',
  N: 'Weichtiere',
} as const

export type AllergenCode = keyof typeof allergens

export type Art =
  | 'cag'
  | 'doner'
  | 'kofte'
  | 'falafel'
  | 'pizza'
  | 'pide'
  | 'soup'
  | 'salad'
  | 'mezze'
  | 'fries'
  | 'baklava'
  | 'kunefe'
  | 'drink'
  | 'coffee'

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  allergens: AllergenCode[]
  /** Pflichtauswahl bei der Bestellung, z. B. Beilage oder Sorte */
  choice?: Choice
  signature?: boolean
}

export interface Choice {
  label: string
  values: string[]
}

export interface MenuCategory {
  id: string
  title: string
  turkish?: string
  note?: string
  art: Art
  /** Schnell-Notizen, die Gäste im Warenkorb antippen können */
  wishes?: string[]
  items: MenuItem[]
}

const meat: AllergenCode[] = ['A', 'B', 'E', 'F']
const side: Choice = { label: 'Beilage', values: ['Reis', 'Pommes'] }
const softdrinks: Choice = {
  label: 'Getränk',
  values: ['Coca-Cola', 'Coca-Cola Zero', 'Fanta', 'Sprite', 'Mezzo Mix', 'Uludağ'],
}
const water: Choice = { label: 'Sorte', values: ['Still', 'Spritzig'] }
const grillWishes = ['Scharf', 'Nicht scharf', 'Ohne Zwiebeln', 'Ohne Tomaten', 'Ohne Salat']

export const menu: MenuCategory[] = [
  {
    id: 'hauptgerichte',
    title: 'Hauptgerichte',
    turkish: 'Ana Yemekler',
    art: 'cag',
    wishes: grillWishes,
    items: [
      {
        id: 'cag-teller',
        name: 'Cağ Kebab Teller',
        description: 'mit Reis oder Pommes, Salat, Meze und Brot',
        price: 18,
        allergens: meat,
        choice: side,
        signature: true,
      },
      { id: 'cag-brot', name: 'Cağ Kebab im Brot', price: 9, allergens: meat, signature: true },
      {
        id: 'doener-teller',
        name: 'Döner Teller',
        description: 'mit Reis oder Pommes, Salat und Brot',
        price: 11,
        allergens: meat,
        choice: side,
      },
      { id: 'doener-brot', name: 'Döner im Brot', price: 8, allergens: meat },
      { id: 'doener-duerum', name: 'Döner Dürüm', price: 9, allergens: meat },
      {
        id: 'koefte-teller',
        name: 'Köfte Teller',
        description: 'mit Reis oder Pommes, Salat und Brot',
        price: 15,
        allergens: meat,
        choice: side,
      },
      { id: 'koefte-brot', name: 'Köfte im Brot', price: 9, allergens: meat },
      { id: 'falafel-brot', name: 'Falafel im Brot', price: 8, allergens: ['A', 'D'] },
      { id: 'falafel-duerum', name: 'Falafel im Dürüm', price: 9, allergens: ['A', 'D'] },
    ],
  },
  {
    id: 'doener-menue',
    title: 'Döner Menü',
    turkish: 'Menü',
    art: 'doner',
    wishes: grillWishes,
    items: [
      {
        id: 'doener-menue',
        name: 'Döner Menü',
        description: 'Döner im Brot, Pommes + 1 Getränk (0,33 l)',
        price: 12,
        allergens: meat,
        choice: softdrinks,
        signature: true,
      },
    ],
  },
  {
    id: 'pizza',
    title: 'Pizza',
    art: 'pizza',
    wishes: ['Scharf', 'Ohne Zwiebeln', 'Gut durchgebacken'],
    items: [
      { id: 'pizza-margherita', name: 'Pizza Margherita', description: 'mit Tomatensauce und Käse', price: 9, allergens: ['A', 'B'] },
      { id: 'pizza-salami', name: 'Pizza Salami', description: 'mit Tomatensauce und Salami (Rind)', price: 11, allergens: ['A', 'B'] },
      { id: 'pizza-funghi', name: 'Pizza Funghi', description: 'mit Tomatensauce und frischen Champignons', price: 11, allergens: ['A', 'B'] },
      {
        id: 'pizza-quattro',
        name: 'Pizza Quattro Formaggi',
        description: 'mit Tomatensauce, Mozzarella, Parmesan, Gorgonzola und Edamer',
        price: 13,
        allergens: ['A', 'B'],
      },
      { id: 'pizza-sucuk', name: 'Pizza Sucuk', description: 'mit Tomatensauce und Sucuk', price: 13, allergens: ['A', 'B'] },
      {
        id: 'pizza-doener',
        name: 'Pizza Döner',
        description: 'mit Tomatensauce, Dönerfleisch und Zwiebeln',
        price: 13.5,
        allergens: meat,
      },
    ],
  },
  {
    id: 'pide',
    title: 'Pide',
    turkish: 'Fırından',
    art: 'pide',
    wishes: ['Scharf', 'Ohne Zwiebeln', 'Gut durchgebacken'],
    items: [
      { id: 'pide-kaese', name: 'Pide mit Käse', price: 9, allergens: ['A', 'B'] },
      {
        id: 'pide-kusbasi',
        name: 'Pide Kuşbaşı',
        description: 'mit feingeschnittenem Rindfleisch',
        price: 13,
        allergens: ['A'],
        signature: true,
      },
      { id: 'pide-sucuk', name: 'Pide mit Sucuk und Käse', price: 13, allergens: ['A', 'B'] },
    ],
  },
  {
    id: 'suppen',
    title: 'Suppen',
    turkish: 'Çorbalar',
    note: 'Traditionell serviert mit frischem Brot und Zitrone.',
    art: 'soup',
    wishes: ['Extra Zitrone', 'Scharf', 'Ohne Brot'],
    items: [
      { id: 'mercimek', name: 'Mercimek Çorbası', description: 'Linsensuppe türkischer Art', price: 7, allergens: ['A', 'E'] },
      { id: 'iskembe', name: 'İşkembe Çorbası', description: 'Kuttelsuppe türkischer Art', price: 8, allergens: ['A', 'B', 'C'] },
      { id: 'kelle-paca', name: 'Kelle Paça Çorbası', description: 'Lammkopfsuppe', price: 9, allergens: ['A', 'B', 'C'] },
    ],
  },
  {
    id: 'vorspeisen',
    title: 'Vorspeisen',
    turkish: 'Mezeler',
    art: 'mezze',
    wishes: ['Ohne Zwiebeln', 'Ohne Oliven', 'Extra Brot'],
    items: [
      { id: 'salat-gemischt', name: 'Gemischter Salat', description: 'saisonal', price: 6.5, allergens: [] },
      { id: 'salat-tomate-mozzarella', name: 'Tomaten-Mozzarella-Salat', price: 9, allergens: ['B'] },
      {
        id: 'insalata-tonno',
        name: 'Insalata Tonno',
        description: 'mit Thunfisch, serviert mit Zwiebeln, Oliven, Mais und frischem Brot',
        price: 10.5,
        allergens: ['A', 'L', 'H'],
      },
      {
        id: 'mezze-teller',
        name: 'Mezze Teller',
        description: 'Orientalische Antipasti mit frischem Brot',
        price: 10.5,
        allergens: ['A', 'B', 'D', 'H'],
        signature: true,
      },
    ],
  },
  {
    id: 'beilagen',
    title: 'Beilagen',
    art: 'fries',
    wishes: ['Extra knusprig'],
    items: [
      { id: 'pommes', name: 'Pommes', price: 4, allergens: [] },
      { id: 'wedges', name: 'Wedges', price: 5, allergens: ['A'] },
    ],
  },
  {
    id: 'nachtisch',
    title: 'Nachtisch',
    turkish: 'Tatlılar',
    art: 'baklava',
    wishes: ['Nach dem Essen bringen', 'Zum Teilen'],
    items: [
      {
        id: 'baklava',
        name: 'Baklava',
        description: 'Pistazie oder Walnuss, 3 Stück',
        price: 5,
        allergens: ['A', 'B', 'I'],
        signature: true,
        choice: { label: 'Sorte', values: ['Pistazie', 'Walnuss'] },
      },
      { id: 'kuenefe', name: 'Künefe', price: 12, allergens: ['A', 'B', 'I'], signature: true },
    ],
  },
  {
    id: 'kalte-getraenke',
    title: 'Kalte Getränke',
    turkish: 'Soğuk İçecekler',
    art: 'drink',
    wishes: ['Mit Eis', 'Ohne Eis', 'Mit Glas'],
    items: [
      { id: 'wasser-025', name: 'Wasser (0,25 l)', description: 'Still oder Spritzig', price: 2, allergens: [], choice: water },
      { id: 'wasser-075', name: 'Wasser (0,75 l)', description: 'Still oder Spritzig', price: 4.7, allergens: [], choice: water },
      {
        id: 'softdrinks',
        name: 'Softdrinks (0,33 l)',
        price: 3,
        allergens: [],
        choice: softdrinks,
      },
      { id: 'ayran', name: 'Ayran (0,25 l)', price: 2.5, allergens: ['B'] },
    ],
  },
  {
    id: 'heisse-getraenke',
    title: 'Heiße Getränke',
    turkish: 'Sıcak İçecekler',
    art: 'coffee',
    wishes: ['Nach dem Essen bringen', 'Mit Zucker', 'Hafermilch'],
    items: [
      { id: 'espresso', name: 'Espresso', price: 2.5, allergens: [] },
      { id: 'cafe', name: 'Café', price: 3.5, allergens: [] },
      { id: 'cafe-latte', name: 'Café Latte', price: 4, allergens: ['B'] },
      { id: 'cappuccino', name: 'Cappuccino', price: 4, allergens: ['B'] },
      { id: 'latte-macchiato', name: 'Latte Macchiato', price: 4, allergens: ['B'] },
      { id: 'heisse-schokolade', name: 'Heiße Schokolade', price: 3.5, allergens: ['B'] },
    ],
  },
]

export const allItems = menu.flatMap((c) => c.items.map((item) => ({ ...item, category: c })))

export const itemById = new Map(allItems.map((i) => [i.id, i]))

export const itemCount = allItems.length
