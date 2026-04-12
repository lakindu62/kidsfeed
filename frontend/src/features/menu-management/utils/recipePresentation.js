const DIETARY_BADGE_LABELS = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  halal: 'Halal',
  glutenFree: 'Gluten-Free',
  dairyFree: 'Dairy-Free',
  nutFree: 'Nut-Free',
};

const PALETTES = [
  ['#acdcb2', '#7fb88d'],
  ['#f6cb9d', '#dea270'],
  ['#d5ecba', '#9ccd8c'],
  ['#f1b4a5', '#dd7b78'],
  ['#b8d2ef', '#7fa8d3'],
];

export function getRecipePalette(text = '') {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export function getRecipeDietaryBadges(flags = {}) {
  return Object.keys(DIETARY_BADGE_LABELS)
    .filter((key) => flags[key] === true)
    .map((key) => DIETARY_BADGE_LABELS[key]);
}
