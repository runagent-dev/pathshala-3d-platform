// All text and facts for the "how big is it?" animation. Sizes are in metres.
// Prose uses Bangla digits; scientific notation keeps 10ⁿ m, as the textbook's Table 1.05 does.

/** Table 1.05 (SI prefixes), top = biggest. `base` is the metre itself (not a prefix, shown for reference). */
export const PREFIXES = [
  { key: 'E', exp: 18 },
  { key: 'P', exp: 15 },
  { key: 'T', exp: 12 },
  { key: 'G', exp: 9 },
  { key: 'M', exp: 6 },
  { key: 'k', exp: 3 },
  { key: 'h', exp: 2 },
  { key: 'da', exp: 1 },
  { key: 'base', exp: 0 },
  { key: 'd', exp: -1 },
  { key: 'c', exp: -2 },
  { key: 'm', exp: -3 },
  { key: 'µ', exp: -6 },
  { key: 'n', exp: -9 },
  { key: 'p', exp: -12 },
  { key: 'f', exp: -15 },
  { key: 'a', exp: -18 },
];

/**
 * The stops, smallest first (that is also their order in the row).
 * w, h: how much room the model takes (m), used to frame it. size: the fact that is shown.
 */
export const STOPS = [
  { id: 'quark', prefix: 'a', w: 1.4e-18, h: 1.4e-18, pitch: 6 },
  { id: 'nucleus', prefix: 'f', w: 2.6e-15, h: 2.6e-15, pitch: 12 },
  { id: 'atom', prefix: 'p', w: 1.12e-10, h: 1.12e-10, pitch: 14 },
  { id: 'dna', prefix: 'n', w: 1.02e-8, h: 2.6e-9, pitch: 10 },
  { id: 'rbc', prefix: 'µ', w: 1.25e-5, h: 9e-6, pitch: 16 },
  { id: 'ant', prefix: 'm', w: 6e-3, h: 2.4e-3, pitch: 24 },
  { id: 'ball', prefix: 'c', w: 7.4e-2, h: 7.4e-2, pitch: 12 },
  { id: 'mango', prefix: 'd', w: 0.14, h: 0.1, pitch: 18 },
  { id: 'student', prefix: 'base', w: 0.62, h: 1.55, pitch: 6 },
  { id: 'bus', prefix: 'da', w: 13, h: 4.2, pitch: 12 },
  { id: 'field', prefix: 'h', w: 125, h: 62, pitch: 42 },
  { id: 'bridge', prefix: 'k', w: 8e3, h: 2.6e3, pitch: 38 },
  // noCompare: no "… এতটুকু" dot for the previous stop (the bridge is in Bangladesh, already marked on the globe)
  { id: 'earth', prefix: 'M', w: 1.3e7, h: 1.3e7, pitch: 10, noCompare: true },
  { id: 'sun', prefix: 'G', w: 1.6e9, h: 1.6e9, pitch: 8 },
  { id: 'solar', prefix: 'T', w: 9.4e12, h: 6.6e12, pitch: 50 },
  { id: 'star', prefix: 'P', w: 4.7e16, h: 1.4e16, pitch: 30 },
  { id: 'galaxy', prefix: 'E', w: 6.5e24, h: 4.8e24, pitch: 56 }, // the book's value (page 17): 6 × 10²⁴ m
];

/** The animation: from the student down to the quark, back, then up to the galaxy, and back again. One stop per row of Table 1.05. */
export const SEQUENCE = ['student', 'mango', 'ball', 'ant', 'rbc', 'dna', 'atom', 'nucleus', 'quark', 'student', 'bus', 'field', 'bridge', 'earth', 'sun', 'solar', 'star', 'galaxy', 'student'];

export const STRINGS = {
  bn: {
    title: 'কোনটা কত বড়?',
    play: 'চালাও',
    pause: 'থামাও',
    journey_small: 'ছোটর দিকে যাত্রা',
    journey_big: 'বড়র দিকে যাত্রা',
    journey_home: 'আবার শিক্ষার্থীর কাছে',
    base_name: 'মিটার',
    base_note: 'মূল একক',
    table: 'টেবিল ১.০৫: SI উপসর্গ',
    tap_hint: 'যেটা দেখতে চাও, তাতে চাপ দাও',
    choose: 'কোনটা দেখতে চাও',
    going: 'যাচ্ছি: {name}',
    quark_short: 'কোয়ার্ক', mango_short: 'আম', bus_short: 'বাস', field_short: 'ফুটবল মাঠ',
    nucleus_short: 'নিউক্লিয়াস', atom_short: 'পরমাণু', dna_short: 'DNA', rbc_short: 'রক্তকণিকা', ant_short: 'পিঁপড়া',
    ball_short: 'ক্রিকেট বল', student_short: 'শিক্ষার্থী', bridge_short: 'পদ্মা সেতু', earth_short: 'পৃথিবী', sun_short: 'সূর্য',
    solar_short: 'সৌরজগৎ', star_short: 'নিকটতম তারা', galaxy_short: 'গ্যালাক্সি',
    approx: '≈',
    here: '{name} এতটুকু',

    p_E: 'এক্সা', p_P: 'পেটা', p_T: 'টেরা', p_G: 'গিগা', p_M: 'মেগা', p_k: 'কিলো', p_h: 'হেক্টো', p_da: 'ডেকা',
    p_base: 'মিটার', p_d: 'ডেসি', p_c: 'সেন্টি', p_m: 'মিলি', 'p_µ': 'মাইক্রো', p_n: 'ন্যানো', p_p: 'পিকো', p_f: 'ফেমটো', p_a: 'এটো',
    u_E: 'এক্সামিটার', u_P: 'পেটামিটার', u_T: 'টেরামিটার', u_G: 'গিগামিটার', u_M: 'মেগামিটার', u_k: 'কিলোমিটার', u_base: 'মিটার',
    u_c: 'সেন্টিমিটার', u_m: 'মিলিমিটার', 'u_µ': 'মাইক্রোমিটার', u_n: 'ন্যানোমিটার', u_p: 'পিকোমিটার', u_f: 'ফেমটোমিটার', u_a: 'এটোমিটার',

    quark_name: 'কোয়ার্ক (প্রোটন ও নিউট্রনের ভেতরের কণা)',
    quark_size: 'আকার ১ এটোমিটারের চেয়েও ছোট',
    quark_sci: '< 1 × 10⁻¹⁸ m',
    quark_note: 'এত ছোট যে এখনো মাপা যায়নি; ধূসর বৃত্তটি ১ এটোমিটার',
    nucleus_name: 'নিউক্লিয়াস (পরমাণুর কেন্দ্র)',
    nucleus_size: 'ব্যাসার্ধ ≈ ১ ফেমটোমিটার',
    nucleus_sci: '1 × 10⁻¹⁵ m',
    nucleus_note: 'লাল: প্রোটন · ধূসর: নিউট্রন',
    atom_name: 'একটি পরমাণু',
    atom_size: 'ব্যাস ≈ ১০০ পিকোমিটার',
    atom_sci: '1 × 10⁻¹⁰ m',
    atom_note: 'বোঝার সুবিধার জন্য মাঝের নিউক্লিয়াস অনেক বড় করে আঁকা',
    dna_name: 'DNA অণু',
    dna_size: 'প্রস্থ ≈ ২ ন্যানোমিটার',
    dna_sci: '2 × 10⁻⁹ m',
    dna_note: '',
    rbc_name: 'লোহিত রক্তকণিকা',
    rbc_size: 'ব্যাস ≈ ৮ মাইক্রোমিটার',
    rbc_sci: '8 × 10⁻⁶ m',
    rbc_note: '',
    ant_name: 'পিঁপড়া',
    ant_size: 'দৈর্ঘ্য ≈ ৫ মিলিমিটার',
    ant_sci: '5 × 10⁻³ m',
    ant_note: '',
    ball_name: 'ক্রিকেট বল',
    ball_size: 'ব্যাস ≈ ৭.২ সেন্টিমিটার',
    ball_sci: '7.2 × 10⁻² m',
    ball_note: '',
    mango_name: 'একটি আম',
    mango_size: 'দৈর্ঘ্য ≈ ১০ সেন্টিমিটার = ১ ডেসিমিটার',
    mango_sci: '1 × 10⁻¹ m',
    mango_note: '',
    student_name: 'একজন শিক্ষার্থী',
    student_size: 'উচ্চতা ≈ ১.৫ মিটার',
    student_sci: '1.5 m',
    student_note: 'মিটার দৈর্ঘ্যের SI একক',
    bus_name: 'একটি বাস',
    bus_size: 'দৈর্ঘ্য ≈ ১২ মিটার = ১.২ ডেকামিটার',
    bus_sci: '1.2 × 10¹ m',
    bus_note: '',
    field_name: 'ফুটবল মাঠ',
    field_size: 'দৈর্ঘ্য ≈ ১০৫ মিটার ≈ ১ হেক্টোমিটার',
    field_sci: '1.05 × 10² m',
    field_note: '',
    bridge_name: 'পদ্মা সেতু',
    bridge_size: 'দৈর্ঘ্য ≈ ৬.১৫ কিলোমিটার',
    bridge_sci: '6.15 × 10³ m',
    bridge_note: 'উচ্চতা বাড়িয়ে দেখানো হয়েছে',
    earth_name: 'পৃথিবী',
    earth_size: 'ব্যাস ≈ ১২.৭ মেগামিটার (১২,৭৪২ কিলোমিটার)',
    earth_sci: '1.27 × 10⁷ m',
    earth_note: '',
    sun_name: 'সূর্য',
    sun_size: 'ব্যাস ≈ ১.৪ গিগামিটার (১৩,৯২,০০০ কিলোমিটার)',
    sun_sci: '1.39 × 10⁹ m',
    sun_note: '',
    solar_name: 'সৌরজগৎ (নেপচুনের কক্ষপথ পর্যন্ত)',
    solar_size: 'ব্যাস ≈ ৯ টেরামিটার',
    solar_sci: '9 × 10¹² m',
    solar_note: 'নীল বৃত্ত: পৃথিবীর কক্ষপথ',
    star_name: 'নিকটতম তারা (প্রক্সিমা সেন্টরি)',
    star_size: 'দূরত্ব ≈ ৪০ পেটামিটার (৪.২ আলোকবর্ষ)',
    star_sci: '4 × 10¹⁶ m',
    star_note: '',
    galaxy_name: 'গ্যালাক্সি',
    galaxy_size: 'দৈর্ঘ্য ≈ ৬০ লক্ষ এক্সামিটার',
    galaxy_sci: '6 × 10²⁴ m',
    galaxy_note: 'টেবিলের সবচেয়ে বড় উপসর্গ এক্সা (10¹⁸)-র চেয়েও অনেক বড়',

    pin_student: 'শিক্ষার্থী',
    pin_bus: 'বাস',
    pin_field: 'ফুটবল মাঠ',
    pin_bridge: 'পদ্মা সেতু',
    pin_earth: 'পৃথিবী',
    pin_sun: 'সূর্য',
    pin_solar: 'সৌরজগৎ',
    pin_star: 'প্রক্সিমা সেন্টরি',
    pin_star_cmp: 'নিকটতম তারার দূরত্ব',
    pin_bangladesh: 'বাংলাদেশ',
  },
  en: {
    title: 'How big is it?',
    play: 'Play',
    pause: 'Pause',
    journey_small: 'Going smaller',
    journey_big: 'Going bigger',
    journey_home: 'Back to the student',
    base_name: 'metre',
    base_note: 'base unit',
    table: 'Table 1.05: SI prefixes',
    tap_hint: 'Tap the one you want to see',
    choose: 'Choose what to see',
    going: 'Going to: {name}',
    quark_short: 'quark', mango_short: 'mango', bus_short: 'bus', field_short: 'football field',
    nucleus_short: 'nucleus', atom_short: 'atom', dna_short: 'DNA', rbc_short: 'blood cell', ant_short: 'ant',
    ball_short: 'cricket ball', student_short: 'student', bridge_short: 'Padma Bridge', earth_short: 'Earth', sun_short: 'Sun',
    solar_short: 'solar system', star_short: 'nearest star', galaxy_short: 'galaxy',
    approx: '≈',
    here: '{name}, this small',

    p_E: 'exa', p_P: 'peta', p_T: 'tera', p_G: 'giga', p_M: 'mega', p_k: 'kilo', p_h: 'hecto', p_da: 'deca',
    p_base: 'metre', p_d: 'deci', p_c: 'centi', p_m: 'milli', 'p_µ': 'micro', p_n: 'nano', p_p: 'pico', p_f: 'femto', p_a: 'atto',
    u_E: 'exametres', u_P: 'petametres', u_T: 'terametres', u_G: 'gigametres', u_M: 'megametres', u_k: 'kilometres', u_base: 'metres',
    u_c: 'centimetres', u_m: 'millimetres', 'u_µ': 'micrometres', u_n: 'nanometres', u_p: 'picometres', u_f: 'femtometres', u_a: 'attometres',

    quark_name: 'Quark (inside protons and neutrons)', quark_size: 'smaller than 1 attometre', quark_sci: '< 1 × 10⁻¹⁸ m', quark_note: 'too small to have been measured; the grey circle is 1 attometre',
    mango_name: 'A mango', mango_size: 'length ≈ 10 centimetres = 1 decimetre', mango_sci: '1 × 10⁻¹ m', mango_note: '',
    bus_name: 'A bus', bus_size: 'length ≈ 12 metres = 1.2 decametres', bus_sci: '1.2 × 10¹ m', bus_note: '',
    field_name: 'Football field', field_size: 'length ≈ 105 metres ≈ 1 hectometre', field_sci: '1.05 × 10² m', field_note: '',
    nucleus_name: 'Nucleus (centre of an atom)', nucleus_size: 'radius ≈ 1 femtometre', nucleus_sci: '1 × 10⁻¹⁵ m', nucleus_note: 'red: protons · grey: neutrons',
    atom_name: 'An atom', atom_size: 'diameter ≈ 100 picometres', atom_sci: '1 × 10⁻¹⁰ m', atom_note: 'the nucleus is drawn much bigger than it is',
    dna_name: 'DNA molecule', dna_size: 'width ≈ 2 nanometres', dna_sci: '2 × 10⁻⁹ m', dna_note: '',
    rbc_name: 'Red blood cell', rbc_size: 'diameter ≈ 8 micrometres', rbc_sci: '8 × 10⁻⁶ m', rbc_note: '',
    ant_name: 'Ant', ant_size: 'length ≈ 5 millimetres', ant_sci: '5 × 10⁻³ m', ant_note: '',
    ball_name: 'Cricket ball', ball_size: 'diameter ≈ 7.2 centimetres', ball_sci: '7.2 × 10⁻² m', ball_note: '',
    student_name: 'A student', student_size: 'height ≈ 1.5 metres', student_sci: '1.5 m', student_note: 'the metre is the SI unit of length',
    bridge_name: 'Padma Bridge', bridge_size: 'length ≈ 6.15 kilometres', bridge_sci: '6.15 × 10³ m', bridge_note: 'height exaggerated',
    earth_name: 'Earth', earth_size: 'diameter ≈ 12.7 megametres (12,742 km)', earth_sci: '1.27 × 10⁷ m', earth_note: '',
    sun_name: 'Sun', sun_size: 'diameter ≈ 1.4 gigametres (1,392,000 km)', sun_sci: '1.39 × 10⁹ m', sun_note: '',
    solar_name: 'Solar system (to Neptune’s orbit)', solar_size: 'diameter ≈ 9 terametres', solar_sci: '9 × 10¹² m', solar_note: 'blue ring: Earth’s orbit',
    star_name: 'Nearest star (Proxima Centauri)', star_size: 'distance ≈ 40 petametres (4.2 light-years)', star_sci: '4 × 10¹⁶ m', star_note: '',
    galaxy_name: 'A galaxy', galaxy_size: 'length ≈ 6 million exametres', galaxy_sci: '6 × 10²⁴ m', galaxy_note: 'far bigger than exa (10¹⁸), the largest prefix in the table',

    pin_student: 'student', pin_bus: 'bus', pin_field: 'football field', pin_bridge: 'Padma Bridge', pin_earth: 'Earth', pin_sun: 'Sun', pin_solar: 'solar system', pin_star: 'Proxima Centauri', pin_star_cmp: 'distance to the nearest star',
    pin_bangladesh: 'Bangladesh',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

export function createI18n(lang = 'bn') {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const num = (x) => (code === 'bn' ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
