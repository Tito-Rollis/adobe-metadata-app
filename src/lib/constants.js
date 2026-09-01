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
