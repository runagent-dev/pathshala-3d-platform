// Every string the animation shows, in Bangla and English. STEPS are the parts students can tap to jump to.

/** The parts of the animation: when each starts (seconds) and its caption key. */
export const STEPS = [
  { at: 0, key: 'step_start' },
  { at: 2, key: 'step_move' },
  { at: 9, key: 'step_end' },
];

export const STRINGS = {
  bn: {
    title: '{{title}}',
    play: 'চালাও',
    pause: 'থামাও',
    seconds: '{t} সেকেন্ড',
    step_start_short: 'শুরু',
    step_move_short: 'চলছে',
    step_end_short: 'শেষ',
    step_start: 'বলটি স্থির। প্রতি সেকেন্ডে এটি কতদূর যায়, দাগ দিয়ে দেখানো হবে।',
    step_move: 'বলটি প্রতি সেকেন্ডে সমান দূরত্ব যায়: এটাই সমবেগ।',
    step_end: 'সাত সেকেন্ডে সাতটি সমান ঘর: দূরত্ব = বেগ × সময়।',
  },
  en: {
    title: '{{title}}',
    play: 'Play',
    pause: 'Pause',
    seconds: '{t} s',
    step_start_short: 'Start',
    step_move_short: 'Moving',
    step_end_short: 'End',
    step_start: 'The ball is at rest. Marks will show how far it goes each second.',
    step_move: 'The ball covers the same distance every second: uniform velocity.',
    step_end: 'Seven seconds, seven equal gaps: distance = velocity × time.',
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
