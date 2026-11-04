// Every string of the figure, in Bangla (the book's words, pages 45–46, 2.7: গতির সমীকরণ, আদি বেগ u, ত্বরণ a,
// সময় t, সমত্বরণ, ধনাত্মক, ঋণাত্মক; বেগ–সময় গ্রাফ as in the book's উদাহরণ) and English. The book writes the
// initial velocity u (the owner's reference writes v₀), so the figure does too: x = x₀ + ut + ½at², v = u + at.
// Units as the book: m, m/s, ms⁻² (p44), s. Subscripts and powers are HTML (<sub>, <sup>): the bundled Noto Sans
// Bengali has no ₀ ² ⁻. Numbers go in as {vars}, so they show in the language's digits (t.num()); between a number
// and its unit there is a no-break space, so they never part.

const X0 = '<i>x</i><sub>0</sub>';
const HALF = '½<i>at</i><sup>2</sup>';
const MS2 = 'ms<sup>−2</sup>';

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'গতির সমীকরণ: সমত্বরণে গাড়ি',
    view: 'দেখার ধরন',
    view_front_short: 'শুরুর দৃশ্য',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'অবস্থান',

    // the four sliders
    name_x0: 'আদি অবস্থান',
    name_u: 'আদি বেগ',
    name_a: 'ত্বরণ',
    name_t: 'সময়',
    aria_x0: 'আদি অবস্থান x₀, মিটারে',
    aria_u: 'আদি বেগ u, মিটার প্রতি সেকেন্ডে',
    aria_a: 'ত্বরণ a, মিটার প্রতি বর্গ সেকেন্ডে',
    aria_t: 'সময় t, সেকেন্ডে',
    u_m: 'm',
    u_ms: 'm/s',
    u_ms2: MS2,
    u_s: 's',
    // the buttons
    act_run: 'চালাও',
    act_pause: 'থামাও',
    act_continue: 'চালিয়ে যাও',
    act_again: 'আবার চালাও',
    act_reset: 'আবার শুরু',
    act_back: 'এক ধাপ পেছনে',
    act_fwd: 'এক ধাপ সামনে',
    step_back: 'পেছনে',
    step_fwd: 'সামনে',
    // the formula, the graphs and their live equations
    formula: `<i>x</i> = ${X0} + <i>ut</i> + <span class="pvc-frac"><span>1</span><span>2</span></span><i>at</i><sup>2</sup>`,
    graph_x: 'অবস্থান–সময় গ্রাফ',
    graph_v: 'বেগ–সময় গ্রাফ',
    // the one sentence
    rule_sum: `সমত্বরণে অবস্থান <i>x</i> তিন অংশের যোগফল: <span class="q-x0">${X0}</span> + <span class="q-u"><i>ut</i></span> + <span class="q-a">${HALF}</span>`,
    rule_turn: 'বেগ আর ত্বরণ উল্টো দিকে: <i>t</i> = {tt} s-এ গাড়িটি এক মুহূর্ত থেমে উল্টো দিকে চলে।',
    rule_end_right: 'গাড়িটি অক্ষের ডান মাথায় (<i>x</i> = {x} m) পৌঁছে থেমেছে।',
    rule_end_left: 'গাড়িটি অক্ষের বাম মাথায় (<i>x</i> = {x} m) পৌঁছে থেমেছে।',
    // the labels on the 3D view (short)
    lbl_axis: 'x (m)',
    lbl_end: 'শেষ মাথায় থামল',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'একটি উত্তর বেছে নাও।',
    q_right: 'ঠিক!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি ঠিক।',
    q_great: 'চমৎকার! সব ঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবি স্থির থাকে। দেখো, হিসাব করো, তারপর উত্তর বেছে নাও।',
    q_x: `গাড়িটি এখন যেখানে আছে (x<sub>0</sub>, অক্ষ থেকে পড়ো), সেখান থেকে u = {u} m/s আর a = {a} ${MS2} নিয়ে চলবে। {t} s পরে তার অবস্থান x কত?`,
    q_v: `গাড়িটির আদি বেগ u = {u} m/s, ত্বরণ a = {a} ${MS2}। {t} s পরে তার বেগ v কত?`,
    q_coef: 'একটি গাড়ির অবস্থান <span class="eom-nw">x = ({h})t<sup>2</sup> + ({u})t + ({x0})</span>। গাড়িটির ত্বরণ a কত?',
    q_turn: 'একটি গাড়ির বেগ <span class="eom-nw">v = ({a})t + ({u})</span>। কত সময় পরে গাড়িটি এক মুহূর্তের জন্য থামবে?',
    q_part: `গাড়িটি {t} s চলেছে। ${X0} আর ut তীরের মান লেখা আছে, x পড়ো অক্ষ থেকে। ${HALF} অংশটি কত?`,
    why_x: `<b>{r} m</b>: x = ${X0} + ut + ½at<sup>2</sup> = ({x0}) + ({u}) × {t} + ½ × ({a}) × {t}<sup>2</sup> = {r} m।`,
    why_v: '<b>{r} m/s</b>: v = u + at = ({u}) + ({a}) × {t} = {r} m/s।',
    why_coef: `<b>{r} ${MS2}</b>: t<sup>2</sup>-এর সংখ্যাটি হলো ½a = {h}, তাই a = {two} × ({h}) = {r} ${MS2}।`,
    why_turn: '<b>{r} s</b>: থামলে v = {z}, তাই ({a})t + ({u}) = {z}, t = −u ÷ a = {r} s।',
    why_part: `<b>{r} m</b>: অক্ষে x = {x} m, তাই ½at<sup>2</sup> = x − ${X0} − ut = {x} − ({x0}) − ({ut}) = {r} m।`,
    oops_no_half: ' {p} m এসেছে ½ বাদ দিয়ে at<sup>2</sup> নিলে।',
    oops_no_x0: ` {p} m শুধু সরণ ut + ½at<sup>2</sup>; শুরুর অবস্থান ${X0} যোগ করতে হয়।`,
    oops_no_a: ' {p} m হয় ত্বরণ না থাকলে; ½at<sup>2</sup> অংশ বাদ পড়েছে।',
    oops_vt: ' {p} m এসেছে শেষ বেগ v দিয়ে পুরো সময় চলেছে ধরলে; বেগ তো ধীরে ধীরে বেড়েছে।',
    oops_one_second: ' {p} m/s হলো মাত্র {one} s পরের বেগ; at-এ সময় দিয়ে গুণ করতে হয়।',
    oops_no_u: ' {p} m/s শুধু বেগের বদল at; আদি বেগ u যোগ করতে হয়।',
    oops_sign: ' {p}: চিহ্ন উল্টে গেছে।',
    oops_times: ' {p}: যোগের বদলে গুণ করা হয়েছে।',
    oops_half: ' {p} হলো ½a; a তার দ্বিগুণ।',
    oops_wrong_term: ' {p} অন্য পদের সংখ্যা; ত্বরণ আছে t<sup>2</sup>-এর পদে।',
    oops_flip: ' {p} s হলো a ÷ u; লাগে u ÷ a।',
    oops_add: ' {p} s হলো যোগফল; লাগে u ÷ a।',
    oops_whole: ` {p} m পুরো x; এর থেকে ${X0} আর ut বাদ দিতে হয়।`,
    oops_no_ut: ` {p} m হলো x − ${X0}; ut-ও বাদ দিতে হয়।`,
    oops_no_square: ' {p} m হলো ½at; t-এর বর্গ নিতে হয়।',
  },
  en: {
    panel_hide: 'Hide text',
    panel_show: 'Show text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Equations of motion: a car with uniform acceleration',
    view: 'View',
    view_front_short: 'Starting view',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Position',

    name_x0: 'Initial position',
    name_u: 'Initial velocity',
    name_a: 'Acceleration',
    name_t: 'Time',
    aria_x0: 'Initial position x0, in metres',
    aria_u: 'Initial velocity u, in metres per second',
    aria_a: 'Acceleration a, in metres per second squared',
    aria_t: 'Time t, in seconds',
    u_m: 'm',
    u_ms: 'm/s',
    u_ms2: MS2,
    u_s: 's',
    act_run: 'Run',
    act_pause: 'Pause',
    act_continue: 'Continue',
    act_again: 'Run again',
    act_reset: 'Reset',
    act_back: 'Step back',
    act_fwd: 'Step forward',
    step_back: 'Back',
    step_fwd: 'Forward',
    formula: `<i>x</i> = ${X0} + <i>ut</i> + <span class="pvc-frac"><span>1</span><span>2</span></span><i>at</i><sup>2</sup>`,
    graph_x: 'Position–time graph',
    graph_v: 'Velocity–time graph',
    rule_sum: `With uniform acceleration the position <i>x</i> is the sum of three parts: <span class="q-x0">${X0}</span> + <span class="q-u"><i>ut</i></span> + <span class="q-a">${HALF}</span>`,
    rule_turn: 'Velocity and acceleration opposite: the car stops at <i>t</i> = {tt} s and turns back.',
    rule_end_right: 'The car has reached the right end of the axis (<i>x</i> = {x} m) and stopped.',
    rule_end_left: 'The car has reached the left end of the axis (<i>x</i> = {x} m) and stopped.',
    lbl_axis: 'x (m)',
    lbl_end: 'stopped at the end',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Pick an answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right.',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Look, work it out and pick an answer.',
    q_x: `The car starts where it is now (x<sub>0</sub>, read it off the axis) with u = {u} m/s and a = {a} ${MS2}. Where is it after {t} s?`,
    q_v: `The car starts with u = {u} m/s and a = {a} ${MS2}. What is its velocity v after {t} s?`,
    q_coef: 'A car moves as <span class="eom-nw">x = ({h})t<sup>2</sup> + ({u})t + ({x0})</span>. What is its acceleration a?',
    q_turn: 'A car moves with <span class="eom-nw">v = ({a})t + ({u})</span>. After how long does it stop for a moment?',
    q_part: `The car has run for {t} s. The ${X0} and ut arrows show their values; read x off the axis. What is the part ${HALF}?`,
    why_x: `<b>{r} m</b>: x = ${X0} + ut + ½at<sup>2</sup> = ({x0}) + ({u}) × {t} + ½ × ({a}) × {t}<sup>2</sup> = {r} m.`,
    why_v: '<b>{r} m/s</b>: v = u + at = ({u}) + ({a}) × {t} = {r} m/s.',
    why_coef: `<b>{r} ${MS2}</b>: the number with t<sup>2</sup> is ½a = {h}, so a = {two} × ({h}) = {r} ${MS2}.`,
    why_turn: '<b>{r} s</b>: when it stops v = {z}, so ({a})t + ({u}) = {z}, t = −u ÷ a = {r} s.',
    why_part: `<b>{r} m</b>: on the axis x = {x} m, so ½at<sup>2</sup> = x − ${X0} − ut = {x} − ({x0}) − ({ut}) = {r} m.`,
    oops_no_half: ' {p} m comes from at<sup>2</sup> without the ½.',
    oops_no_x0: ` {p} m is only the displacement ut + ½at<sup>2</sup>; add the starting position ${X0}.`,
    oops_no_a: ' {p} m is where it would be without acceleration; the ½at<sup>2</sup> part is missing.',
    oops_vt: ' {p} m assumes the final velocity v all the time; the velocity grew gradually.',
    oops_one_second: ' {p} m/s is the velocity after only {one} s; multiply a by the time.',
    oops_no_u: ' {p} m/s is only the change at; add the initial velocity u.',
    oops_sign: ' {p}: the sign is reversed.',
    oops_times: ' {p}: multiplied instead of added.',
    oops_half: ' {p} is ½a; a is twice that.',
    oops_wrong_term: ' {p} belongs to another term; the acceleration is in the t<sup>2</sup> term.',
    oops_flip: ' {p} s is a ÷ u; it takes u ÷ a.',
    oops_add: ' {p} s is the sum; it takes u ÷ a.',
    oops_whole: ` {p} m is the whole x; take away ${X0} and ut.`,
    oops_no_ut: ` {p} m is x − ${X0}; take away ut too.`,
    oops_no_square: ' {p} m is ½at; t must be squared.',
  },
};

// a number and its unit never part at a line break: "{a} m/s" → "{a} m/s" (in every string above)
const UNIT = /(\}|[\d০-৯]) (m\/s|ms<sup>|m|s)(?=[\s.,;:!?)।/<-]|$|<sup>)/g;
for (const dict of Object.values(STRINGS)) for (const [k, v] of Object.entries(dict)) dict[k] = v.replace(UNIT, '$1 $2');

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/** t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. */
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
