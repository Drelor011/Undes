/**
 * Ündes — Data: Categories & Moods
 */

window.UNDES = window.UNDES || {};

window.UNDES.categories = [
  { id: 'love',          icon: 'heart',     label: { kz: 'Махаббат',     ru: 'Любовь',       en: 'Love' } },
  { id: 'sadness',       icon: 'cloud-rain', label: { kz: 'Мұң',          ru: 'Грусть',       en: 'Sadness' } },
  { id: 'inspiration',   icon: 'sparkles',   label: { kz: 'Шабыт',        ru: 'Вдохновение',  en: 'Inspiration' } },
  { id: 'loneliness',    icon: 'moon',       label: { kz: 'Жалғыздық',    ru: 'Одиночество',  en: 'Loneliness' } },
  { id: 'nature',        icon: 'trees',      label: { kz: 'Табиғат',      ru: 'Природа',      en: 'Nature' } },
  { id: 'dreams',        icon: 'star',       label: { kz: 'Арман',        ru: 'Мечты',        en: 'Dreams' } },
  { id: 'freedom',       icon: 'feather',    label: { kz: 'Еркіндік',     ru: 'Свобода',      en: 'Freedom' } },
  { id: 'philosophy',    icon: 'compass',    label: { kz: 'Философия',    ru: 'Философия',    en: 'Philosophy' } }
];

// Mood cards (use category ids, with a friendly emoji-free glyph + tagline)
window.UNDES.moods = [
  { id: 'love',         tagline: { kz: 'Жүрекке жылы сөз',     ru: 'Тёплые слова сердцу',     en: 'Warm words for the heart' } },
  { id: 'sadness',      tagline: { kz: 'Көңілдегі мұңды тап',  ru: 'Найти грусть в словах',   en: 'Find sadness in words' } },
  { id: 'inspiration', tagline: { kz: 'Жаңа шабыт ал',        ru: 'Зарядиться вдохновением', en: 'Catch a new spark' } },
  { id: 'loneliness',   tagline: { kz: 'Жалғыздықпен сырлас',  ru: 'Побыть наедине с собой',  en: 'Be alone with yourself' } },
  { id: 'nature',       tagline: { kz: 'Табиғаттың үні',       ru: 'Голос природы',           en: 'The voice of nature' } },
  { id: 'dreams',       tagline: { kz: 'Армандар әлемі',       ru: 'Мир мечтаний',            en: 'A world of dreams' } },
  { id: 'freedom',      tagline: { kz: 'Еркіндік құсы',        ru: 'Птица свободы',           en: 'The bird of freedom' } },
  { id: 'philosophy',   tagline: { kz: 'Терең ой',            ru: 'Глубокая мысль',          en: 'A deeper thought' } }
];
