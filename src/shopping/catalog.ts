import type { CategoryId } from './types';

/** Ordered roughly the way you walk through a supermarket. */
export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'produce', label: 'Fruit & vegetables', emoji: '🥬' },
  { id: 'bakery', label: 'Bakery', emoji: '🥖' },
  { id: 'dairy', label: 'Dairy & eggs', emoji: '🧀' },
  { id: 'meat', label: 'Meat & fish', emoji: '🥩' },
  { id: 'frozen', label: 'Frozen', emoji: '🧊' },
  { id: 'pantry', label: 'Pantry', emoji: '🥫' },
  { id: 'snacks', label: 'Snacks & sweets', emoji: '🍪' },
  { id: 'drinks', label: 'Drinks', emoji: '🧃' },
  { id: 'household', label: 'Household', emoji: '🧽' },
  { id: 'personal', label: 'Personal care', emoji: '🧴' },
  { id: 'other', label: 'Other', emoji: '🛒' },
];

export const categoryMeta = (id: CategoryId) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const categoryRank = (id: CategoryId) => CATEGORIES.findIndex((c) => c.id === id);

/* ---------- Category guessing ---------- */

const KEYWORDS: Record<CategoryId, string[]> = {
  produce: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'berries', 'strawberry', 'blueberry',
    'raspberry', 'avocado', 'tomato', 'tomatoes', 'potato', 'potatoes', 'onion', 'garlic', 'carrot', 'cucumber',
    'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'pepper', 'zucchini', 'courgette', 'mushroom',
    'celery', 'cabbage', 'herb', 'herbs', 'parsley', 'basil', 'cilantro', 'coriander', 'mint', 'dill', 'ginger',
    'pear', 'peach', 'plum', 'mango', 'pineapple', 'melon', 'watermelon', 'kiwi', 'cherry', 'cherries', 'salad',
    'fruit', 'vegetable', 'veggies', 'corn', 'leek', 'radish', 'beetroot', 'eggplant', 'aubergine', 'tofu',
    'green beans', 'sweet potato', 'spring onion',
  ],
  bakery: ['bread', 'baguette', 'bagel', 'croissant', 'bun', 'buns', 'roll', 'rolls', 'tortilla', 'pita', 'muffin', 'cake', 'pastry', 'brioche', 'loaf'],
  dairy: [
    'milk', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'gouda', 'brie', 'butter', 'yogurt', 'yoghurt',
    'cream', 'egg', 'eggs', 'kefir', 'ricotta', 'margarine', 'cream cheese', 'sour cream', 'cottage cheese',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'bacon', 'ham', 'turkey', 'sausage', 'sausages', 'salami', 'steak', 'mince', 'lamb',
    'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'prawns', 'cod', 'ground beef', 'chicken breast',
  ],
  frozen: ['frozen', 'pizza', 'fries', 'ice cream', 'frozen peas', 'ice'],
  pantry: [
    'rice', 'pasta', 'spaghetti', 'penne', 'noodle', 'noodles', 'flour', 'sugar', 'salt', 'oil', 'vinegar', 'cereal',
    'oat', 'oats', 'oatmeal', 'bean', 'beans', 'lentil', 'lentils', 'chickpea', 'chickpeas', 'sauce', 'ketchup',
    'mustard', 'mayo', 'mayonnaise', 'honey', 'jam', 'spice', 'spices', 'soup', 'coffee', 'tea', 'stock', 'broth',
    'yeast', 'nuts', 'almonds', 'cinnamon', 'paprika', 'olive oil', 'peanut butter', 'canned tomatoes',
    'baking powder', 'soy sauce',
  ],
  snacks: ['chips', 'crisps', 'cookie', 'cookies', 'biscuit', 'biscuits', 'chocolate', 'candy', 'popcorn', 'cracker', 'crackers', 'pretzel', 'pretzels', 'granola', 'snack', 'snacks'],
  drinks: ['water', 'juice', 'soda', 'cola', 'beer', 'wine', 'lemonade', 'kombucha', 'sparkling water', 'orange juice'],
  household: [
    'detergent', 'sponge', 'sponges', 'foil', 'bleach', 'cleaner', 'battery', 'batteries', 'napkins', 'bulb',
    'paper towel', 'paper towels', 'toilet paper', 'dish soap', 'trash bags', 'garbage bags', 'bin bags',
    'plastic wrap', 'aluminum foil', 'dishwasher tablets', 'laundry',
  ],
  personal: [
    'shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'soap', 'lotion', 'razor', 'razors',
    'tissues', 'floss', 'sunscreen', 'vitamins', 'hand soap', 'cotton pads', 'shower gel',
  ],
  other: [],
};

/** Romanian item names (written with diacritics; matching ignores them, so "rosii" finds "roșii"). */
const KEYWORDS_RO: Record<CategoryId, string[]> = {
  produce: [
    'măr', 'mere', 'banană', 'banane', 'portocală', 'portocale', 'lămâie', 'lămâi', 'struguri', 'căpșuni', 'afine',
    'zmeură', 'fructe', 'avocado', 'roșie', 'roșii', 'cartof', 'cartofi', 'ceapă', 'usturoi', 'morcov', 'morcovi',
    'castravete', 'castraveți', 'salată', 'spanac', 'broccoli', 'conopidă', 'ardei', 'dovlecel', 'dovlecei',
    'ciuperci', 'țelină', 'varză', 'pătrunjel', 'mărar', 'busuioc', 'mentă', 'ghimbir', 'pere', 'piersici', 'prune',
    'ananas', 'pepene', 'cireșe', 'vinete', 'legume', 'verdețuri', 'ridichi', 'praz', 'porumb', 'sfeclă', 'tofu',
  ],
  bakery: ['pâine', 'baghetă', 'covrigi', 'cornuri', 'chifle', 'lipie', 'lipii', 'prăjitură', 'cozonac', 'franzelă', 'chec'],
  dairy: [
    'lapte', 'brânză', 'cașcaval', 'telemea', 'unt', 'iaurt', 'smântână', 'ou', 'ouă', 'kefir', 'sana', 'urdă',
    'parmezan', 'frișcă', 'margarină', 'cremă de brânză',
  ],
  meat: [
    'pui', 'carne', 'vită', 'porc', 'costiță', 'șuncă', 'salam', 'cârnați', 'crenvurști', 'mici', 'pește', 'somon',
    'ton', 'creveți', 'curcan', 'pulpe', 'slănină', 'pastramă',
  ],
  frozen: ['înghețată', 'congelat', 'congelate', 'congelată'],
  pantry: [
    'orez', 'paste', 'făină', 'zahăr', 'sare', 'ulei', 'oțet', 'cereale', 'ovăz', 'fasole', 'linte', 'năut', 'sos',
    'muștar', 'maioneză', 'miere', 'gem', 'dulceață', 'condimente', 'supă', 'cafea', 'ceai', 'drojdie', 'nuci',
    'migdale', 'bulion', 'mălai', 'zacuscă', 'conservă', 'conserve', 'unt de arahide', 'roșii în conservă',
    'praf de copt', 'bicarbonat', 'vanilie', 'zahăr vanilat', 'cacao',
  ],
  snacks: ['chipsuri', 'biscuiți', 'ciocolată', 'bomboane', 'covrigei', 'napolitane', 'sticksuri', 'alune'],
  drinks: ['apă', 'suc', 'bere', 'vin', 'limonadă', 'apă minerală', 'apă plată'],
  household: [
    'detergent', 'burete', 'bureți', 'folie', 'înălbitor', 'baterii', 'becuri', 'șervețele', 'saci', 'hârtie igienică',
    'prosoape de hârtie', 'saci de gunoi', 'tablete de vase', 'balsam de rufe',
  ],
  personal: [
    'șampon', 'balsam', 'pastă de dinți', 'periuță', 'deodorant', 'săpun', 'loțiune', 'vitamine', 'aparat de ras',
    'gel de duș', 'cremă de mâini', 'dischete demachiante', 'șervețele umede', 'ață dentară',
  ],
  other: [],
};

/** Lower-case and strip diacritics: "Roșii" → "rosii". */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

function buildIndex(source: Record<CategoryId, string[]>) {
  const index = new Map<string, CategoryId>();
  for (const [cat, words] of Object.entries(source) as [CategoryId, string[]][]) {
    for (const w of words) {
      const key = fold(w);
      if (!index.has(key)) index.set(key, cat);
    }
  }
  return index;
}

const INDEX_EN = buildIndex(KEYWORDS);
const INDEX_RO = buildIndex(KEYWORDS_RO);
const PHRASES = [...INDEX_RO.entries(), ...INDEX_EN.entries()]
  .filter(([k]) => k.includes(' '))
  .sort((a, b) => b[0].length - a[0].length);

/**
 * Best-effort section for an item name.
 * Romanian names lead with the noun ("suc de portocale" is juice), English ones end with it
 * ("chocolate milk" is milk), so Romanian words are read first-to-last and English last-to-first.
 */
export function guessCategory(name: string): CategoryId {
  const n = fold(name);
  if (!n) return 'other';
  for (const [phrase, cat] of PHRASES) if (` ${n} `.includes(` ${phrase} `)) return cat;
  const words = n.split(/[^a-z]+/).filter(Boolean);
  for (const w of words) {
    const hit = INDEX_RO.get(w);
    if (hit) return hit;
  }
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    for (const variant of [w, w.replace(/es$/, ''), w.replace(/s$/, '')]) {
      const hit = INDEX_EN.get(variant);
      if (hit) return hit;
    }
  }
  return 'other';
}

/* ---------- Quantity parsing ---------- */

const UNIT =
  '(?:x|kg|g|gr|l|ml|cl|lb|lbs|oz|pcs?|packs?|bottles?|cans?|bags?|boxes?|jars?|dozen|bunch(?:es)?|loaf|loaves' +
  '|buc(?:ăți|ati)?|pachete|pachet|sticle|sticlă|sticla|cutii|cutie|borcane|borcan|pungi|pungă|punga|legături|legătură' +
  '|plicuri|plic|role|rolă|rola)';
const LEADING = new RegExp(`^(\\d+(?:[.,]\\d+)?\\s*${UNIT}?)\\s+(.+)$`, 'i');
/** "Flour 500g", "milk x2" — a unit is required so names like "Omega 3" stay intact. */
const TRAILING = new RegExp(`^(.+?)\\s+(?:x\\s*(\\d+)|(\\d+(?:[.,]\\d+)?\\s*${UNIT}))$`, 'i');
/** "Făina - 2 kg", "Ouă: 10", "Lapte, 2 l" — an explicit separator, so a bare number is fine. */
const TRAILING_SEP = new RegExp(`^(.+?)\\s*[-–—:,]\\s*(?:x\\s*(\\d+)|(\\d+(?:[.,]\\d+)?\\s*${UNIT}?))$`, 'i');

/** "2 milk" → {name: "Milk", quantity: "2"}; "Făina - 2 kg" → {name: "Făina", quantity: "2 kg"}. */
export function parseItemText(raw: string): { name: string; quantity: string } {
  const text = raw.trim().replace(/\s+/g, ' ');
  const lead = text.match(LEADING);
  if (lead) return { name: capitalize(lead[2]), quantity: lead[1].replace(/\s*x$/i, '').trim() };
  const trail = text.match(TRAILING_SEP) ?? text.match(TRAILING);
  if (trail) return { name: capitalize(trail[1].trim()), quantity: (trail[2] ?? trail[3]).trim() };
  return { name: capitalize(text), quantity: '' };
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * +/- on a quantity, stepping by a size that suits the unit:
 * "2" → "3", "2 pachete" → "3 pachete", "2 kg" → "2.5 kg", "500 g" → "600 g", "" (one) → "2".
 */
export function bumpQuantity(q: string, delta: number): string {
  const text = q.trim();
  if (!text) return delta > 0 ? '2' : '';
  const m = text.match(/^(\d+(?:[.,]\d+)?)(\s*)(.*)$/);
  if (!m) return q;

  const usesComma = m[1].includes(',');
  const value = Number(m[1].replace(',', '.'));
  const unit = m[3].trim().toLowerCase();
  const step = /^(g|gr|ml)$/.test(unit) ? 100 : /^(kg|l)$/.test(unit) ? 0.5 : 1;

  const next = Math.round((value + delta * step) * 100) / 100;
  if (next <= 0) return q;
  if (step === 1 && next <= 1 && !unit) return '';

  const num = usesComma ? String(next).replace('.', ',') : String(next);
  return `${num}${m[2]}${m[3]}`;
}

/* ---------- Suggestions ---------- */

export interface Suggestion {
  name: string;
  category: CategoryId;
  quantity?: string;
}

export type SuggestionSetId = 'fridge' | 'pantry' | 'household';

export const SUGGESTION_SETS: { id: SuggestionSetId; label: string; emoji: string; items: Suggestion[] }[] = [
  {
    id: 'fridge',
    label: 'Fridge staples',
    emoji: '❄️',
    items: [
      { name: 'Lapte', category: 'dairy', quantity: '2 l' },
      { name: 'Ouă', category: 'dairy', quantity: '10' },
      { name: 'Unt', category: 'dairy', quantity: '200 g' },
      { name: 'Telemea', category: 'dairy', quantity: '500 g' },
      { name: 'Cașcaval', category: 'dairy', quantity: '300 g' },
      { name: 'Brânză de vaci', category: 'dairy' },
      { name: 'Brânză cheddar', category: 'dairy' },
      { name: 'Mozzarella', category: 'dairy' },
      { name: 'Cremă de brânză', category: 'dairy' },
      { name: 'Iaurt grecesc', category: 'dairy' },
      { name: 'Smântână', category: 'dairy' },
      { name: 'Kefir', category: 'dairy' },
      { name: 'Salată verde', category: 'produce' },
      { name: 'Spanac', category: 'produce' },
      { name: 'Roșii', category: 'produce', quantity: '1 kg' },
      { name: 'Castraveți', category: 'produce', quantity: '1 kg' },
      { name: 'Morcovi', category: 'produce', quantity: '1 kg' },
      { name: 'Ardei grași', category: 'produce', quantity: '4' },
      { name: 'Fructe de pădure', category: 'produce', quantity: '250 g' },
      { name: 'Lămâi', category: 'produce', quantity: '3' },
      { name: 'Verdețuri', category: 'produce' },
      { name: 'Tofu', category: 'produce' },
      { name: 'Piept de pui', category: 'meat', quantity: '1 kg' },
      { name: 'Carne tocată de vită', category: 'meat', quantity: '500 g' },
      { name: 'Costiță afumată', category: 'meat' },
      { name: 'Șuncă feliată', category: 'meat' },
      { name: 'Somon', category: 'meat' },
      { name: 'Humus', category: 'other' },
      { name: 'Suc de portocale', category: 'drinks', quantity: '1 l' },
      { name: 'Muștar', category: 'pantry' },
      { name: 'Maioneză', category: 'pantry' },
    ],
  },
  {
    id: 'pantry',
    label: 'Pantry basics',
    emoji: '🥫',
    items: [
      { name: 'Pâine', category: 'bakery' },
      { name: 'Paste', category: 'pantry', quantity: '2 pachete' },
      { name: 'Orez', category: 'pantry', quantity: '1 kg' },
      { name: 'Ulei de floarea-soarelui', category: 'pantry', quantity: '1 l' },
      { name: 'Ulei de măsline', category: 'pantry', quantity: '500 ml' },
      { name: 'Făină', category: 'pantry', quantity: '2 kg' },
      { name: 'Zahăr', category: 'pantry', quantity: '1 kg' },
      { name: 'Praf de copt', category: 'pantry', quantity: '2 plicuri' },
      { name: 'Mălai', category: 'pantry', quantity: '1 kg' },
      { name: 'Fulgi de ovăz', category: 'pantry', quantity: '500 g' },
      { name: 'Bulion', category: 'pantry' },
      { name: 'Roșii în conservă', category: 'pantry' },
      { name: 'Fasole', category: 'pantry' },
      { name: 'Zacuscă', category: 'pantry' },
      { name: 'Unt de arahide', category: 'pantry' },
      { name: 'Miere', category: 'pantry' },
      { name: 'Cereale', category: 'pantry' },
      { name: 'Cafea', category: 'pantry' },
      { name: 'Ceai', category: 'pantry' },
      { name: 'Ceapă', category: 'produce', quantity: '1 kg' },
      { name: 'Usturoi', category: 'produce' },
      { name: 'Cartofi', category: 'produce', quantity: '2 kg' },
    ],
  },
  {
    id: 'household',
    label: 'Household',
    emoji: '🧽',
    items: [
      { name: 'Hârtie igienică', category: 'household', quantity: '10 role' },
      { name: 'Prosoape de hârtie', category: 'household' },
      { name: 'Detergent de vase', category: 'household' },
      { name: 'Detergent de rufe', category: 'household' },
      { name: 'Saci de gunoi', category: 'household' },
      { name: 'Bureți de vase', category: 'household' },
      { name: 'Folie de aluminiu', category: 'household' },
      { name: 'Pastă de dinți', category: 'personal' },
      { name: 'Șampon', category: 'personal' },
      { name: 'Săpun lichid', category: 'personal' },
    ],
  },
];
