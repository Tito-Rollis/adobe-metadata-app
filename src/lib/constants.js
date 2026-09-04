/** Adobe Stock categories */
export const ADOBE_STOCK_CATEGORIES = [
  'Animals',
  'Buildings and Architecture',
  'Business',
  'Drinks',
  'Environment',
  'States of Mind',
  'Food',
  'Graphic Resources',
  'Hobbies and Leisure',
  'Industry',
  'Landscape',
  'Lifestyle',
  'People',
  'Plants and Flowers',
  'Culture and Religion',
  'Science',
  'Social Issues',
  'Sports',
  'Technology',
  'Transport',
  'Travel'
];

export const MAX_TITLE_LENGTH = 70;
export const MAX_KEYWORDS = 49;
export const MIN_KEYWORDS = 15;
export const OPTIMAL_KEYWORDS = 35;
export const TOP_KEYWORDS_COUNT = 10;

/** Shutterstock categories (valid values for CSV column D) */
export const SHUTTERSTOCK_CATEGORIES = [
  'Abstract',
  'Animals/Wildlife',
  'Arts',
  'Backgrounds/Textures',
  'Beauty/Fashion',
  'Buildings/Landmarks',
  'Business/Finance',
  'Celebrities',
  'Education',
  'Food and Drink',
  'Healthcare/Medical',
  'Holidays',
  'Industrial',
  'Interiors',
  'Miscellaneous',
  'Nature',
  'Objects',
  'Parks/Outdoor',
  'People',
  'Religion',
  'Science',
  'Signs/Symbols',
  'Sports/Recreation',
  'Technology',
  'Transportation',
  'Vintage'
];

/**
 * Map Adobe Stock category to closest Shutterstock category
 * @param {string} adobeCategory
 * @returns {string}
 */
export function mapToShutterstockCategory(adobeCategory) {
  const map = {
    'Animals':                  'Animals/Wildlife',
    'Buildings and Architecture':'Buildings/Landmarks',
    'Business':                 'Business/Finance',
    'Drinks':                   'Food and Drink',
    'Environment':              'Nature',
    'States of Mind':           'Abstract',
    'Food':                     'Food and Drink',
    'Graphic Resources':        'Backgrounds/Textures',
    'Hobbies and Leisure':      'Sports/Recreation',
    'Industry':                 'Industrial',
    'Landscape':                'Nature',
    'Lifestyle':                'People',
    'People':                   'People',
    'Plants and Flowers':       'Nature',
    'Culture and Religion':     'Religion',
    'Science':                  'Science',
    'Social Issues':            'Miscellaneous',
    'Sports':                   'Sports/Recreation',
    'Technology':               'Technology',
    'Transport':                'Transportation',
    'Travel':                   'Parks/Outdoor',
  };
  return map[adobeCategory] || 'Miscellaneous';
}

/**
 * Compound nouns / proper nouns that should NOT be split into two keywords.
 * All lowercase for comparison.
 */
export const COMPOUND_KEYWORDS = new Set([
  // Animals
  'golden retriever', 'german shepherd', 'great dane', 'border collie',
  'cocker spaniel', 'labrador retriever', 'shih tzu', 'great white',
  'polar bear', 'grizzly bear', 'brown bear', 'black bear',
  'killer whale', 'blue whale', 'sperm whale', 'manta ray',
  'bald eagle', 'barn owl', 'great horned', 'white shark',
  'great barrier', 'sea turtle', 'bull shark', 'tiger shark',
  'snow leopard', 'mountain lion', 'mountain goat', 'wild boar',

  // Landmarks & places
  'eiffel tower', 'golden gate', 'golden gate bridge', 'great wall',
  'great barrier reef', 'niagara falls', 'times square', 'central park',
  'empire state', 'statue liberty', 'big ben', 'buckingham palace',
  'mount everest', 'grand canyon', 'northern lights', 'aurora borealis',
  'milky way', 'dead sea', 'red sea', 'black sea', 'north sea',
  'pacific ocean', 'atlantic ocean', 'indian ocean', 'arctic ocean',
  'amazon river', 'nile river', 'sahara desert', 'gobi desert',

  // Food & drink
  'hot dog', 'ice cream', 'french fries', 'fried rice', 'fried chicken',
  'green tea', 'black tea', 'black coffee', 'orange juice', 'apple juice',
  'olive oil', 'soy sauce', 'fish sauce', 'chili pepper', 'bell pepper',
  'sweet potato', 'red wine', 'white wine', 'sparkling water',
  'chocolate cake', 'cheese cake', 'birthday cake', 'wedding cake',
  'peanut butter', 'cream cheese', 'sour cream', 'whipped cream',

  // Nature & environment
  'solar panel', 'wind turbine', 'rain forest', 'coral reef',
  'sand dune', 'sand castle', 'rock climbing', 'rock formation',
  'waterfall river', 'ocean wave', 'ocean sunset', 'mountain range',
  'mountain peak', 'mountain top', 'snow mountain', 'rice field',
  'flower field', 'wheat field', 'corn field', 'oil field',
  'palm tree', 'pine tree', 'cherry blossom', 'lotus flower',

  // People & demographics
  'african american', 'native american', 'latin american',
  'south asian', 'east asian', 'southeast asian', 'middle eastern',
  'mixed race', 'light skin', 'dark skin',

  // Technology
  'artificial intelligence', 'machine learning', 'deep learning',
  'virtual reality', 'augmented reality', 'social media',
  'smart phone', 'smart watch', 'smart home', 'smart city',
  'electric car', 'electric vehicle', 'solar energy', 'wind energy',
  'computer screen', 'laptop computer', 'tablet computer',
  'credit card', 'debit card', 'shopping cart',

  // Sports & activities
  'martial arts', 'rock climbing', 'sky diving', 'scuba diving',
  'mountain biking', 'road cycling', 'cross country', 'long jump',
  'high jump', 'pole vault', 'shot put', 'triple jump',
  'figure skating', 'speed skating', 'ice hockey', 'field hockey',
  'beach volleyball', 'table tennis', 'lawn tennis',

  // Business & work
  'business meeting', 'business woman', 'business man',
  'office worker', 'team work', 'hard work', 'work life',
  'real estate', 'stock market', 'supply chain',

  // General compound nouns
  'close up', 'wide angle', 'bird eye', 'eye level',
  'slow motion', 'time lapse', 'black white', 'black and white',
  'high contrast', 'low light', 'high key', 'low key',
  'soft focus', 'shallow depth', 'long exposure',
  'aerial view', 'bird view', 'top view', 'side view', 'front view',
  'full length', 'half body', 'waist up', 'chest up',
  'outdoor activity', 'indoor activity',
  'day light', 'sun light', 'moon light', 'street light',
  'golden hour', 'blue hour', 'magic hour',
]);

/**
 * Split a keyword into parts if it contains a space and is NOT a compound noun.
 * Returns array of keywords (1 item if no split needed, 2+ if split).
 * @param {string} keyword - lowercase keyword
 * @returns {string[]}
 */
export function splitKeyword(keyword) {
  const kw = keyword.trim().toLowerCase();
  const words = kw.split(/\s+/);

  // Only split 2-word keywords — 3+ word proper nouns kept as-is
  if (words.length !== 2) return [kw];

  // Keep compound nouns intact
  if (COMPOUND_KEYWORDS.has(kw)) return [kw];

  // Split into two separate keywords
  return words;
}
