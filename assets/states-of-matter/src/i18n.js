// Every string the animation shows, in Bangla (the book's words, pages 150–152) and English. STEPS are the parts a
// student can tap to jump to; CAPTIONS change the sentence under the picture within a part.
import { T } from './story.js';

/** The parts of the animation: when each starts (seconds) and its chip. */
export const STEPS = [
  { at: 0, key: 'one' },
  { at: T.solid - 1.5, key: 'solid' },
  { at: T.heat - 0.5, key: 'liquid' },
  { at: T.boil - 0.5, key: 'gas' },
  { at: T.cycle, key: 'cycle' },
];

/** The sentence under the picture, and the row about shape and volume, from each time on. */
export const CAPTIONS = [
  { at: 0, key: 'cap_one', props: 'formula' },
  { at: T.split, key: 'cap_split', props: 'formula' },
  { at: T.solid - 1.5, key: 'cap_solid', props: 'solid' },
  { at: T.heat - 0.5, key: 'cap_melt', props: 'solid' },
  { at: T.liquid - 0.5, key: 'cap_liquid', props: 'liquid' },
  { at: T.boil - 0.5, key: 'cap_boil', props: 'liquid' },
  { at: T.gas - 0.5, key: 'cap_gas', props: 'gas' },
  { at: T.cycle, key: 'cap_cycle', props: 'same' },
];

/** Shape and volume of each state (book p151): fixed (true) or not. */
export const PROPS = {
  solid: { shape: true, volume: true },
  liquid: { shape: false, volume: true },
  gas: { shape: false, volume: false },
};

export const STRINGS = {
  bn: {
    title: 'পদার্থের তিন অবস্থা: কঠিন, তরল এবং গ্যাস',
    play: 'চালাও',
    pause: 'থামাও',
    parts: 'অংশগুলো',
    step_one: 'অণু',
    step_solid: 'কঠিন',
    step_liquid: 'তরল',
    step_gas: 'গ্যাস',
    step_cycle: 'তিন অবস্থা',
    cap_one: 'সব পদার্থ অণু দিয়ে তৈরি। এটি পানির একটি অণু: পানির সব ধর্ম এর মধ্যে আছে।',
    cap_split: 'অণুটি ভেঙে দিলে হয় একটি অক্সিজেন আর দুটি হাইড্রোজেন পরমাণু; তখন সেটি আর পানি থাকে না।',
    cap_solid: 'কঠিন (বরফ): অণুগুলো খুব কাছাকাছি, নিয়মিত সাজানো। নিজ অবস্থানে থেকে কাঁপে, স্থান বদলাতে পারে না।',
    cap_melt: 'তাপ দিলে বরফ গলে পানি হয়। অণুগুলো একই থাকে, শুধু তাদের সাজানো ভেঙে যায়।',
    cap_liquid: 'তরল (পানি): অণুগুলো কাছাকাছি; কাঁপে এবং একটার পাশ দিয়ে অন্যটি চলে যেতে পারে।',
    cap_boil: 'আরও তাপ দিলে পানি ফুটতে থাকে, আর জলীয় বাষ্প হয়ে উড়ে যায়।',
    cap_gas: 'গ্যাস (জলীয় বাষ্প): অণুগুলোর মাঝে দূরত্ব অনেক বেশি; তারা মুক্তভাবে ছোটাছুটি করে।',
    cap_cycle: 'একই পানির তিন অবস্থা। তাপ দিলে বরফ থেকে পানি, পানি থেকে জলীয় বাষ্প; ঠান্ডা করলে উল্টো পথে ফেরে।',
    formula: 'পানির অণু H<sub>2</sub>O = {o}টি অক্সিজেন (O) + {h}টি হাইড্রোজেন (H) পরমাণু',
    same: 'অণু একই (H<sub>2</sub>O); অবস্থা নির্ভর করে অণুগুলো কীভাবে আছে তার ওপর।',
    shape_yes: 'নিয়মিত আকার আছে',
    shape_no: 'নিয়মিত আকার নেই',
    volume_yes: 'নির্দিষ্ট আয়তন আছে',
    volume_no: 'নির্দিষ্ট আয়তন নেই',
    lens_one: 'পানির একটি অণু',
    lens_solid: 'বরফের অণু',
    lens_liquid: 'পানির অণু',
    lens_gas: 'জলীয় বাষ্পের অণু',
    magnified: 'অনেক বড় করে দেখানো',
    not_water: 'আর পানি নয়',
    state_solid: 'বরফ (কঠিন)',
    state_liquid: 'পানি (তরল)',
    state_gas: 'জলীয় বাষ্প (গ্যাস)',
    heat: 'তাপ দিলে',
    cool: 'ঠান্ডা করলে',
    flame: 'তাপ',
  },
  en: {
    title: 'The three states of matter: solid, liquid and gas',
    play: 'Play',
    pause: 'Pause',
    parts: 'Parts',
    step_one: 'Molecule',
    step_solid: 'Solid',
    step_liquid: 'Liquid',
    step_gas: 'Gas',
    step_cycle: 'All three',
    cap_one: 'All matter is made of molecules. This is one molecule of water: it has all the properties of water.',
    cap_split: 'Split the molecule and you get one oxygen and two hydrogen atoms; then it is no longer water.',
    cap_solid: 'Solid (ice): the molecules are very close, in a regular pattern. Each vibrates in its place but cannot move away.',
    cap_melt: 'Heat the ice and it melts into water. The molecules stay the same; only their pattern breaks up.',
    cap_liquid: 'Liquid (water): the molecules are close; they vibrate and can slide past one another.',
    cap_boil: 'Heat it more and the water boils, and goes off as water vapour.',
    cap_gas: 'Gas (water vapour): the molecules are far apart and move about freely.',
    cap_cycle: 'One water, three states. Heating turns ice into water and water into vapour; cooling goes back the other way.',
    formula: 'A water molecule H<sub>2</sub>O = {o} oxygen (O) + {h} hydrogen (H) atoms',
    same: 'The molecule is the same (H<sub>2</sub>O); the state depends on how the molecules are arranged.',
    shape_yes: 'Has a fixed shape',
    shape_no: 'No fixed shape',
    volume_yes: 'Has a fixed volume',
    volume_no: 'No fixed volume',
    lens_one: 'One water molecule',
    lens_solid: 'Molecules in ice',
    lens_liquid: 'Molecules in water',
    lens_gas: 'Molecules in vapour',
    magnified: 'Shown hugely enlarged',
    not_water: 'Not water any more',
    state_solid: 'Ice (solid)',
    state_liquid: 'Water (liquid)',
    state_gas: 'Water vapour (gas)',
    heat: 'Heating',
    cool: 'Cooling',
    flame: 'Heat',
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
