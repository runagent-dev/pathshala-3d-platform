// Every string the animation shows, in Bangla (the book's words, page 152–153) and English. STEPS are the parts
// students can tap to jump to; CUES are the captions within them (seconds from the start).

/** The parts of the animation (the chips): when each starts and its key. */
export const STEPS = [
  { at: 0, key: 'solid' },
  { at: 9, key: 'liquid' },
  { at: 19, key: 'gas' },
  { at: 28, key: 'balloon' },
  { at: 45, key: 'why' },
  { at: 58.5, key: 'pressure' },
  { at: 66.5, key: 'heat' },
];

/** The captions, in order. */
export const CUES = [
  { at: 0, key: 'c_solid' },
  { at: 9, key: 'c_liquid' },
  { at: 13.6, key: 'c_hole' },
  { at: 19, key: 'c_gas' },
  { at: 28, key: 'c_blow' },
  { at: 32, key: 'c_tape' },
  { at: 35, key: 'c_needle' },
  { at: 38.6, key: 'c_leak' },
  { at: 45, key: 'c_inside' },
  { at: 48.4, key: 'c_hit' },
  { at: 50.4, key: 'c_one' },
  { at: 52.2, key: 'c_force' },
  { at: 55.6, key: 'c_back' },
  { at: 58.5, key: 'c_many' },
  { at: 61.2, key: 'c_pressure' },
  { at: 66.5, key: 'c_heat' },
  { at: 71, key: 'c_more' },
];

export const STRINGS = {
  bn: {
    title: 'পদার্থের আণবিক গতিতত্ত্ব',
    play: 'চালাও',
    pause: 'থামাও',
    parts: 'অংশগুলো',
    solid_short: 'কঠিন',
    liquid_short: 'তরল',
    gas_short: 'গ্যাস',
    balloon_short: 'বেলুন',
    why_short: 'কারণ',
    pressure_short: 'চাপ',
    heat_short: 'তাপ',

    c_solid: 'একটি <b>কঠিন পদার্থ</b> টেবিলে রাখলে টেবিলের যে অংশটুকু স্পর্শ করে, শুধু সেখানেই <b class="kp">চাপ</b> প্রয়োগ করে।',
    c_liquid: '<b>তরল</b> টেবিলে রাখলে সারা টেবিলে গড়িয়ে যাবে, তাই রাখতে হয় পাত্রে। তরল শুধু নিচে নয়, চারদিকে পাত্রের গায়ে <b class="kp">চাপ</b> দেয়।',
    c_hole: 'পাত্রের গায়ে একটা <b>ফুটো</b> করলে তরলের চাপে এই ফুটো দিয়ে তরল বের হতে থাকে।',
    c_gas: '<b>গ্যাস</b> রাখতে হয় একটা <b>আবদ্ধ জায়গায়</b>। গ্যাস এই আবদ্ধ জায়গার চারদিকে <b class="kp">চাপ</b> প্রয়োগ করে।',
    c_blow: '<b>নিজে করো:</b> একটা বেলুন ফুলাও। বেলুনের ভেতরে গ্যাস (বাতাস) আবদ্ধ থাকে।',
    c_tape: 'বেলুনটির পৃষ্ঠে এক টুকরা <b>স্কচটেপ</b> ভালো করে লাগাও।',
    c_needle: 'এবারে একটা <b>সুচ</b> দিয়ে স্কচটেপের উপর দিয়ে বেলুনটাতে একটা ফুটো করো।',
    c_leak: 'বেলুনটা <b>ফাটবে না</b>! দেখো, বাতাসের চাপে <b>ফুটো দিয়ে বাতাস বের হয়ে যাচ্ছে</b>।',
    c_inside: 'কেন এমন হয়? <b>আণবিক গতিতত্ত্ব</b> দিয়ে দেখি: আবদ্ধ বেলুনের ভেতরে গ্যাসের অণুগুলো ছোটাছুটি করে।',
    c_hit: 'অণুগুলো প্রতিনিয়ত দেয়ালে এসে <b>আঘাত</b> করে এবং <b>প্রতিফলিত</b> হয়ে ফিরে যায়।',
    c_one: 'একটি অণুকে দেখো: এটি একটি <b class="km">ভরবেগে</b> দেয়ালে আঘাত করতে যাচ্ছে।',
    c_force: 'আঘাতের সময় অণু দেয়ালে <b class="kf">বল</b> প্রয়োগ করে। নিউটনের তৃতীয় সূত্র অনুযায়ী দেয়ালও একটি <b class="kf">পাল্টা বল</b> অণুর উপর প্রয়োগ করে।',
    c_back: 'পাল্টা বল অণুটিকে প্রতিফলিত করে দেয়: অণুটি <b class="km">অন্য ভরবেগে</b> (উল্টো দিকে) ফিরে যায়।',
    c_many: 'এভাবে <b>অসংখ্য অণু</b> দেয়ালে আঘাত করে বল প্রয়োগ করতে থাকে।',
    c_pressure: 'এই <b>সম্মিলিত বলটিই</b> গ্যাসের <b class="kp">চাপ</b> হিসেবে দেখা যায়: বেলুনের দেয়ালের সবখানে, ভেতর থেকে বাইরে।',
    c_heat: 'গ্যাসের <b class="kh">তাপ</b> বাড়িয়ে দিলে অণুগুলোর <b>গতিশক্তি বেড়ে যায়</b>: তারা আরো জোরে দেয়ালে আঘাত করে।',
    c_more: 'অর্থাৎ <b class="kp">চাপ বেড়ে যায়</b>: তীরগুলো বড় হলো, বেলুনও একটু ফুলে উঠল। (বিস্তারিত পরের অধ্যায়ে)',

    l_solid: 'কঠিন পদার্থ',
    l_table: 'টেবিল',
    l_touch: 'চাপ: শুধু স্পর্শের জায়গায়',
    l_liquid: 'তরল (পানি)',
    l_vessel: 'পাত্র',
    l_sides: 'চাপ: নিচে ও চারদিকে',
    l_hole: 'ফুটো',
    l_jet: 'তরলের চাপে বের হচ্ছে',
    l_gas: 'গ্যাস',
    l_closed: 'আবদ্ধ পাত্র',
    l_all: 'চাপ: চারদিকে',
    l_balloon: 'বেলুন',
    l_tape: 'স্কচটেপ',
    l_needle: 'সুচ',
    l_air: 'বাতাস বের হচ্ছে',
    l_wall: 'বেলুনের দেয়াল (রাবার)',
    l_molecule: 'গ্যাসের অণু',
    l_p_in: 'ভরবেগ',
    l_p_out: 'অন্য ভরবেগ',
    l_on_wall: 'অণুর বল (দেয়ালের উপর)',
    l_on_mol: 'পাল্টা বল (অণুর উপর)',
    l_hits: 'প্রতিটি আঘাতে দেয়ালে বল',
    l_pressure: 'গ্যাসের চাপ',
    l_heat: 'তাপ',
    l_more: 'চাপ বেড়েছে',

    lens_solid: 'কঠিন: অণুগুলো খুব কাছাকাছি, নিজের জায়গায় কাঁপে',
    lens_liquid: 'তরল: অণুগুলো কাছাকাছি, একে অপরের পাশ দিয়ে সরে',
    lens_gas: 'গ্যাস: অণুগুলো দূরে দূরে, দ্রুত ছোটাছুটি করে',
    lens_hot: 'গরম গ্যাস: অণুগুলো আরো দ্রুত',
    note_big: 'অণু চোখে দেখা যায় না: অনেক বড় করে আঁকা',
    note_slow: 'ধীর গতিতে দেখানো',
    note_freeze: 'আঘাতের মুহূর্তটি থামিয়ে দেখানো',
    note_size: 'আকার প্রকৃত অনুপাতে নয়',
    aria_stage: 'অ্যানিমেশন: কঠিন, তরল ও গ্যাসের চাপ, বেলুন আর সুচের পরীক্ষা, আর বেলুনের ভেতরে গ্যাসের অণুর আঘাত',
  },
  en: {
    title: 'Kinetic theory of matter',
    play: 'Play',
    pause: 'Pause',
    parts: 'Parts',
    solid_short: 'Solid',
    liquid_short: 'Liquid',
    gas_short: 'Gas',
    balloon_short: 'Balloon',
    why_short: 'Why',
    pressure_short: 'Pressure',
    heat_short: 'Heat',

    c_solid: 'A <b>solid</b> on a table presses (<b class="kp">pressure</b>) only on the part of the table it touches.',
    c_liquid: 'A <b>liquid</b> would run all over the table, so it is kept in a container. It presses not only down but on every side wall.',
    c_hole: 'Make a <b>hole</b> in the wall and the liquid’s pressure pushes it out through the hole.',
    c_gas: 'A <b>gas</b> must be kept in a <b>closed space</b>. It presses (<b class="kp">pressure</b>) on every part of that space.',
    c_blow: '<b>Try it:</b> blow up a balloon. The gas (air) is shut inside it.',
    c_tape: 'Stick a piece of <b>sellotape</b> firmly on the balloon.',
    c_needle: 'Now push a <b>needle</b> through the tape to make a hole in the balloon.',
    c_leak: 'The balloon does <b>not burst</b>! The air’s pressure pushes <b>air out through the hole</b>.',
    c_inside: 'Why? Use the <b>kinetic theory</b>: inside the closed balloon the gas molecules rush about.',
    c_hit: 'Again and again they <b>hit</b> the wall and <b>bounce back</b>.',
    c_one: 'Watch one molecule: it is about to hit the wall with some <b class="km">momentum</b>.',
    c_force:
      'During the hit the molecule pushes the wall with a <b class="kf">force</b>. By Newton’s third law the wall pushes back on the molecule with a <b class="kf">reaction force</b>.',
    c_back: 'The reaction force bounces the molecule back: it leaves with <b class="km">a different momentum</b> (the other way).',
    c_many: 'Like this, <b>countless molecules</b> keep hitting the wall and pushing it.',
    c_pressure: 'Together these forces are what we see as the gas’s <b class="kp">pressure</b>: on every part of the wall, from inside outwards.',
    c_heat: 'Heat the gas (<b class="kh">heat</b>) and the molecules’ <b>kinetic energy grows</b>: they hit the wall harder.',
    c_more: 'So the <b class="kp">pressure rises</b>: the arrows grew and the balloon swelled a little. (More in the next chapter.)',

    l_solid: 'Solid',
    l_table: 'Table',
    l_touch: 'Pressure: only where it touches',
    l_liquid: 'Liquid (water)',
    l_vessel: 'Container',
    l_sides: 'Pressure: down and on the sides',
    l_hole: 'Hole',
    l_jet: 'Pushed out by the pressure',
    l_gas: 'Gas',
    l_closed: 'Closed container',
    l_all: 'Pressure: on every side',
    l_balloon: 'Balloon',
    l_tape: 'Sellotape',
    l_needle: 'Needle',
    l_air: 'Air escaping',
    l_wall: 'Balloon wall (rubber)',
    l_molecule: 'Gas molecule',
    l_p_in: 'Momentum',
    l_p_out: 'Different momentum',
    l_on_wall: 'Molecule’s force (on the wall)',
    l_on_mol: 'Reaction (on the molecule)',
    l_hits: 'A force on the wall at every hit',
    l_pressure: 'Gas pressure',
    l_heat: 'Heat',
    l_more: 'More pressure',

    lens_solid: 'Solid: molecules close together, shaking in place',
    lens_liquid: 'Liquid: molecules close, sliding past each other',
    lens_gas: 'Gas: molecules far apart, rushing about',
    lens_hot: 'Hot gas: molecules even faster',
    note_big: 'Molecules are far too small to see: drawn huge',
    note_slow: 'Shown slowed down',
    note_freeze: 'The moment of the hit, paused',
    note_size: 'Not to scale',
    aria_stage: 'Animation: how solids, liquids and gases press, the balloon-and-needle activity, and gas molecules hitting the balloon wall',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? num(vars[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
