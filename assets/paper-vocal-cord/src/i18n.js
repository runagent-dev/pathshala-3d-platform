// Every string the figure shows, in Bangla and English. The book's words, pages 198–199 (topic 7.3 শব্দ তরঙ্গ):
// "শব্দ তরঙ্গ তৈরি করতে তার একটা উৎসের দরকার, সেটাকে প্রবাহিত করার জন্য একটা মাধ্যমের দরকার এবং সেই শব্দ গ্রহণ
// করার জন্য কোনো এক ধরনের রিসিভার দরকার", কণ্ঠ, ভোকাল কর্ড, স্বরযন্ত্র (Larynx), কম্পন, "দুটো পর্দা ভালভের মতো কাজ
// করে", "পুরুষেরা কম কম্পাঙ্কের শব্দ তৈরি করে মেয়েরা বেশি কম্পাঙ্কের শব্দ তৈরি করে। সে কারণে পুরুষের গলার স্বর মোটা,
// নারীর স্বর তীক্ষ্ণ", and the নিজে করো: "একটি কাগজ কেটে নিয়ে দুই আঙুলের মাঝে রেখে মুখে লাগিয়ে ফুঁ দাও। কাগজের কাটা
// টুকরো দুটো স্বরযন্ত্র বা ভোকাল কর্ডের মতো কেঁপে শব্দ তৈরি করবে। বিভিন্নভাবে কাগজ কেটে বিভিন্ন রকম শব্দ তৈরি করতে
// পার কিনা দেখো"; chapter 7's সংকোচন, প্রসারণ, তরঙ্গদৈর্ঘ্য (λ), কম্পাঙ্ক (f). The page writes উপরে. Use t('key', vars)
// in code and t.num() for numbers; a {key} that is not a var is another string of the same language (units after a
// no-break space). Questions (q_*) are plain text; choices, notes and worked answers may hold HTML.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'কাগজের ভোকাল কর্ড',
    view: 'দেখার ধরন',
    view_front_short: 'আগের মতো দেখো',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'কম্পাঙ্ক',
    u_hz: 'Hz',
    u_m: 'm',

    // the row of words: how the paper is cut
    cuts: 'কাটা টুকরোর মাপ',
    cut_long: 'লম্বা টুকরো',
    cut_mid: 'মাঝারি',
    cut_short: 'ছোট টুকরো',
    cutname_long: 'লম্বা টুকরো',
    cutname_mid: 'মাঝারি টুকরো',
    cutname_short: 'ছোট টুকরো',
    res_f: '{f}\u00a0{u_hz}',

    // the action
    act_blow: 'ফুঁ দাও',
    act_blow_cut: '{cut} কেটে ফুঁ দাও',
    act_again: 'আবার ফুঁ দাও',
    act_stop: 'ফুঁ থামাও',
    act_home: 'শুরুর অবস্থা',

    // the result
    out_idle: 'কাটা টুকরো দুটোর মাঝে ফুঁ দাও, দেখো কী কাঁপে।',
    out_f: 'প্রতি সেকেন্ডে প্রায় {f} বার কাঁপে: কম্পাঙ্ক <b>{f}&nbsp;{u_hz}</b> (হার্টজ), {voice} স্বর।',
    voice_deep: 'মোটা',
    voice_middle: 'মাঝারি',
    voice_shrill: 'তীক্ষ্ণ',
    key_line:
      '<i class="pv-sw pv-dark"></i>সংকোচন <i class="pv-sw pv-light"></i>প্রসারণ <span class="pv-note">সময় {k} গুণ ধীর, কম্পন বড় ও λ ছোট করে দেখানো</span>',

    // the rule, growing
    rule_0: '<b>ফুঁ দিলে কাগজের কাটা টুকরো দুটো ভোকাল কর্ডের মতো কাঁপে।</b> আমাদের স্বরযন্ত্রে দুটো পর্দা ঠিক এভাবে খোলে আর বন্ধ হয়।',
    rule_1: '<b>কম্পন দিয়ে শব্দ তৈরি হয়।</b> উৎস কাঁপা টুকরো, মাধ্যম বাতাস, রিসিভার তোমার কান। বাতাসের কণা নিজের জায়গায় দোলে; সংকোচন আর প্রসারণ এগিয়ে যায়।',
    rule_2:
      '<b>ছোট টুকরো তাড়াতাড়ি কাঁপে: কম্পাঙ্ক বেশি, স্বর তীক্ষ্ণ।</b> ছোট টুকরোর দৈর্ঘ্য কম, তাই দ্রুত কাঁপে; লম্বা টুকরো ধীরে কাঁপে: কম্পাঙ্ক কম, স্বর মোটা। কম্পাঙ্ক বাড়লে তরঙ্গদৈর্ঘ্য ছোট হয়।',
    rule_3: '<b>পুরুষেরা কম কম্পাঙ্কের শব্দ তৈরি করে, মেয়েরা বেশি কম্পাঙ্কের।</b> সে কারণে পুরুষের গলার স্বর মোটা, নারীর স্বর তীক্ষ্ণ, ঠিক লম্বা আর ছোট টুকরোর মতো।',

    // labels on the picture
    lbl_flap: 'কাটা টুকরো',
    lbl_blow: 'ফুঁ',
    lbl_lambda: 'λ ≈ {l}&nbsp;{u_m}',
    lbl_bead: 'বাতাসের একটি কণা',
    g_y: 'চাপ',
    g_x: 'উৎস থেকে দূরত্ব (m)',
    g_c: 'সংকোচন',
    g_r: 'প্রসারণ',
    g_aria: 'বাতাসের চাপ আর উৎস থেকে দূরত্বের গ্রাফ: সংকোচনে চাপ বেশি, প্রসারণে কম; পাশাপাশি দুটি সংকোচনের দূরত্ব তরঙ্গদৈর্ঘ্য λ।',

    hint_locked: 'পরীক্ষার সময় ছবিটি দেখো, উত্তর বেছে নাও।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবিটি বদলায় না। দেখে উত্তর বেছে নাও।',

    q_what: 'ছবিতে কাগজে ফুঁ দেওয়া হচ্ছে। কোনটি কেঁপে শব্দ তৈরি করছে?',
    c_what_flaps: 'কাগজের কাটা টুকরো দুটো',
    c_what_fingers: 'কাগজ ধরে রাখা ক্লিপটি',
    c_what_breath: 'ফুঁয়ের বাতাসই শব্দ তৈরি করে',
    c_what_sheet: 'পুরো কাগজটা একসাথে',
    why_what: '<b>কাটা টুকরো দুটো</b>: এরা ভোকাল কর্ডের মতো খোলে আর বন্ধ হয়; প্রতিবার খুললে বাতাসে একটা ধাক্কা লাগে।',
    mis_what_fingers: 'ক্লিপ কাগজটা স্থির ধরে রাখে, কাঁপে না।',
    mis_what_breath: 'ফুঁ শুধু টুকরো দুটোকে ঠেলে; না কেটে ফুঁ দিলে এই শব্দ হয় না। টুকরো দুটোর কম্পনই শব্দের উৎস।',
    mis_what_sheet: 'কাগজের বড় অংশ প্রায় স্থির থাকে; কাঁপে শুধু কাটা টুকরো দুটো, যাদের মাঝ দিয়ে বাতাস যায়।',

    q_bead: 'সবুজটি বাতাসের একটি কণা। শব্দ তরঙ্গ চলার সময় কণাটি কী করছে?',
    c_bead_swing: 'নিজের জায়গায় সামনে-পিছে দুলছে',
    c_bead_fly: 'কাগজ থেকে দূরে উড়ে চলে যাচ্ছে',
    c_bead_updown: 'নিজের জায়গায় উপরে-নিচে দুলছে',
    c_bead_still: 'একদম স্থির হয়ে আছে',
    why_bead: '<b>নিজের জায়গায় সামনে-পিছে দোলে</b>, শব্দ যেদিকে যায় সেদিকেই। বাতাস মাধ্যম: সে কম্পন বয়ে নেয়, নিজে চলে যায় না।',
    mis_bead_fly: 'ফুঁয়ের স্রোত নয়: কণা জায়গা ছাড়ে না, এগিয়ে যায় শুধু সংকোচন আর প্রসারণ।',
    mis_bead_updown: 'শব্দ তরঙ্গে কণা দোলে তরঙ্গ চলার দিকেই, আড়াআড়ি নয়।',
    mis_bead_still: 'তরঙ্গ এলে কণা দোলে: সবুজ দাগের দুই পাশে কণাটিকে দেখো।',

    q_short: 'ছবিতে মাঝারি টুকরো কাঁপছে। টুকরোটি আরও ছোট করে কাটলে কী হবে?',
    c_short_up: 'কম্পাঙ্ক বাড়বে, স্বর তীক্ষ্ণ হবে',
    c_short_down: 'কম্পাঙ্ক কমবে, স্বর মোটা হবে',
    c_short_same: 'কম্পাঙ্ক একই থাকবে, শব্দ শুধু জোরে হবে',
    c_short_mixed: 'কম্পাঙ্ক বাড়বে, স্বর মোটা হবে',
    why_short: '<b>কম্পাঙ্ক বাড়বে, স্বর তীক্ষ্ণ হবে</b>: ছোট টুকরো কাঁপে প্রায় {fs}&nbsp;{u_hz}-এ, মাঝারিটি {fm}&nbsp;{u_hz}-এ। এখন ছোট টুকরোটি কাঁপছে।',
    mis_short_down: 'উল্টো হলো: ছোট টুকরো প্রতি সেকেন্ডে বেশি বার কাঁপে।',
    mis_short_same: 'বদলায় কম্পাঙ্ক: ছোট টুকরো প্রতি সেকেন্ডে বেশি বার কাঁপে।',
    mis_short_mixed: 'বেশি কম্পাঙ্কের স্বর তীক্ষ্ণ হয়, মোটা নয়।',

    q_widest: 'ছবিতে টুকরো দুটো যখন সবচেয়ে বেশি খোলে, তখন ফাঁক থেকে কী বেরিয়ে আসে?',
    c_widest_comp: 'একটি সংকোচন: ঘন বাতাসের একটি পট্টি',
    c_widest_rare: 'একটি প্রসারণ: পাতলা বাতাসের একটি পট্টি',
    c_widest_fly: 'বাতাসের কণাগুলো, যারা দূরে উড়ে যায়',
    c_widest_both: 'একটি সংকোচন আর একটি প্রসারণ একসাথে',
    why_widest: '<b>একটি সংকোচন</b>: টুকরো দুটো খুললে ফুঁয়ের বাতাস ফাঁক দিয়ে ঠেলে বেরোয়, সামনের বাতাস চাপা পড়ে ঘন হয়। বন্ধ হলে পাতলা বাতাস, প্রসারণ।',
    mis_widest_rare: 'প্রসারণ বেরোয় টুকরো দুটো বন্ধ হওয়ার সময়, খোলা অবস্থায় নয়।',
    mis_widest_fly: 'কণা নিজের জায়গায় দোলে; এগিয়ে যায় শুধু সংকোচন আর প্রসারণ।',
    mis_widest_both: 'প্রতিবার খোলায় একটি সংকোচন; প্রসারণ আসে অর্ধেক দোলনকাল পরে, বন্ধ হওয়ার সময়।',

    q_lambda: 'ছবির কমলা দাগটি (λ) কোন দূরত্ব দেখাচ্ছে?',
    c_lambda_cc: 'পাশাপাশি দুটি সংকোচনের মাঝের দূরত্ব',
    c_lambda_cr: 'একটি সংকোচন থেকে পরের প্রসারণের দূরত্ব',
    c_lambda_amp: 'একটি কণা কতটা দূর পর্যন্ত দোলে',
    c_lambda_flap: 'কাটা টুকরোর দৈর্ঘ্য',
    why_lambda: '<b>পাশাপাশি দুটি সংকোচনের দূরত্ব</b>: এটাই তরঙ্গদৈর্ঘ্য λ, এখানে প্রায় {lm}&nbsp;{u_m} (λ = v ÷ f = {v} ÷ {fm})।',
    mis_lambda_cr: 'সংকোচন থেকে পরের প্রসারণ মাত্র অর্ধেক λ।',
    mis_lambda_amp: 'কণার দোলনের দূরত্ব হলো বিস্তার, তরঙ্গদৈর্ঘ্য নয়; তা অনেক ছোট।',
    mis_lambda_flap: 'টুকরোর দৈর্ঘ্য মাত্র কয়েক মিলিমিটার; λ প্রায় এক মিটার।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A paper vocal cord',
    view: 'View',
    view_front_short: 'Back to the start view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Frequency',
    u_hz: 'Hz',
    u_m: 'm',

    cuts: 'Length of the cut flaps',
    cut_long: 'Long flaps',
    cut_mid: 'Medium',
    cut_short: 'Short flaps',
    cutname_long: 'The long flaps',
    cutname_mid: 'The medium flaps',
    cutname_short: 'The short flaps',
    res_f: '{f}\u00a0{u_hz}',

    act_blow: 'Blow',
    act_blow_cut: 'Cut {cut} and blow',
    act_again: 'Blow again',
    act_stop: 'Stop blowing',
    act_home: 'Start again',

    out_idle: 'Blow between the two cut flaps and watch what vibrates.',
    out_f: 'About {f} vibrations a second: frequency <b>{f}&nbsp;{u_hz}</b> (hertz), a {voice} voice.',
    voice_deep: 'deep',
    voice_middle: 'middle',
    voice_shrill: 'shrill',
    key_line:
      '<i class="pv-sw pv-dark"></i>compression <i class="pv-sw pv-light"></i>rarefaction <span class="pv-note">time {k}× slower, swing larger, λ shorter</span>',

    rule_0: '<b>Blow, and the two cut flaps vibrate like vocal cords.</b> In our larynx two membranes open and shut just like this.',
    rule_1:
      '<b>Sound is made by vibration.</b> The source is the vibrating flaps, the medium is the air, the receiver is your ear. Each air particle swings in its place; the compressions and rarefactions travel on.',
    rule_2:
      '<b>Short flaps vibrate fast: higher frequency, a shrill voice.</b> Being shorter, a short flap vibrates faster; long flaps vibrate slowly: lower frequency, a deep voice. The higher the frequency, the shorter the wavelength.',
    rule_3:
      '<b>Men make sound of lower frequency, women of higher frequency.</b> That is why a man’s voice is deep and a woman’s shrill, just like the long and the short flaps.',

    lbl_flap: 'cut flap',
    lbl_blow: 'blow',
    lbl_lambda: 'λ ≈ {l}&nbsp;{u_m}',
    lbl_bead: 'one air particle',
    g_y: 'pressure',
    g_x: 'distance from the source (m)',
    g_c: 'compression',
    g_r: 'rarefaction',
    g_aria:
      'Graph of the air pressure against the distance from the source: high at compressions, low at rarefactions; two neighbouring compressions are one wavelength λ apart.',

    hint_locked: 'During the test, look at the picture and pick an answer.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The picture stays as it is during the test. Look, then pick an answer.',

    q_what: 'Someone is blowing on the paper. What vibrates and makes the sound?',
    c_what_flaps: 'The two cut flaps',
    c_what_fingers: 'The clip holding the paper',
    c_what_breath: 'The blown air itself makes the sound',
    c_what_sheet: 'The whole sheet at once',
    why_what: '<b>The two cut flaps</b>: they open and shut like vocal cords, and each opening gives the air a push.',
    mis_what_fingers: 'The clip holds the paper still; it does not vibrate.',
    mis_what_breath: 'The breath only pushes the flaps; blowing on uncut paper does not make this sound. The flaps’ vibration is the source.',
    mis_what_sheet: 'Most of the sheet hardly moves; only the two cut flaps vibrate, with the air passing between them.',

    q_bead: 'The green dot is one particle of air. What does it do while the sound wave passes?',
    c_bead_swing: 'Swings to and fro in its place',
    c_bead_fly: 'Flies away from the paper',
    c_bead_updown: 'Swings up and down in its place',
    c_bead_still: 'Stays perfectly still',
    why_bead:
      '<b>It swings to and fro in its place</b>, along the way the sound goes. Air is the medium: it carries the vibration but does not travel itself.',
    mis_bead_fly: 'It is not the breath’s flow: the particle stays put; only the compressions and rarefactions travel.',
    mis_bead_updown: 'In a sound wave particles swing along the way the wave goes, not across it.',
    mis_bead_still: 'When the wave arrives the particle swings: watch it on both sides of the green mark.',

    q_short: 'The medium flaps are vibrating. What happens if you cut them even shorter?',
    c_short_up: 'Frequency rises; the voice gets shriller',
    c_short_down: 'Frequency falls; the voice gets deeper',
    c_short_same: 'Frequency stays; the sound is only louder',
    c_short_mixed: 'Frequency rises; the voice gets deeper',
    why_short:
      '<b>The frequency rises and the voice gets shriller</b>: short flaps vibrate at about {fs}&nbsp;{u_hz}, the medium ones at {fm}&nbsp;{u_hz}. The short flaps are vibrating now.',
    mis_short_down: 'The other way round: a short flap vibrates more times a second.',
    mis_short_same: 'What changes is the frequency: a short flap vibrates more times a second.',
    mis_short_mixed: 'A higher frequency sounds shrill, not deep.',

    q_widest: 'When the two flaps are open widest, what comes out of the gap?',
    c_widest_comp: 'A compression: a band of squeezed air',
    c_widest_rare: 'A rarefaction: a band of thinned air',
    c_widest_fly: 'The air particles, which fly away',
    c_widest_both: 'A compression and a rarefaction together',
    why_widest:
      '<b>A compression</b>: when the flaps open, the breath pushes through the gap and squeezes the air in front. When they shut, the air thins: a rarefaction.',
    mis_widest_rare: 'A rarefaction leaves while the flaps shut, not while they are open.',
    mis_widest_fly: 'The particles swing in place; only the compressions and rarefactions travel.',
    mis_widest_both: 'Each opening sends one compression; the rarefaction comes half a period later, as they shut.',

    q_lambda: 'What distance does the orange mark (λ) in the picture show?',
    c_lambda_cc: 'The distance between two neighbouring compressions',
    c_lambda_cr: 'The distance from a compression to the next rarefaction',
    c_lambda_amp: 'How far one particle swings',
    c_lambda_flap: 'The length of a cut flap',
    why_lambda:
      '<b>The distance between two neighbouring compressions</b>: that is the wavelength λ, here about {lm}&nbsp;{u_m} (λ = v ÷ f = {v} ÷ {fm}).',
    mis_lambda_cr: 'From a compression to the next rarefaction is only half a λ.',
    mis_lambda_amp: 'How far a particle swings is the amplitude, not the wavelength; it is much smaller.',
    mis_lambda_flap: 'A flap is only a few millimetres long; λ is about a metre.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    const s = dict[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
  }
  t.num = num;
  t.lang = code;
  return t;
}
