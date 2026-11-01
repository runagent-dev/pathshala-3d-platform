// Every string the figure shows, in Bangla and English. The book's words on page 134 (topic 5.3, তরলের ভেতর চাপ):
// গভীরতা, তরলের স্তম্ভ ("তোমার উপরে তরলের যে স্তম্ভটুকু থাকবে তার ওজন থেকেই তোমার উপরের চাপ"), A ক্ষেত্রফলের একটি পৃষ্ঠ,
// আয়তন Ah, ঘনত্ব ρ, ওজন বা বল F = mg = (Ahρ)g, P = F/A = hρg, "নির্দিষ্ট ঘনত্বের তরলে গভীরতার সাথে সাথে চাপ বাড়তে
// থাকে", "পানির বেলায় আনুমানিক প্রতি দশ মিটার গভীরতায় বাতাসের চাপের সমপরিমাণ চাপ বেড়ে যায়", "ভূপৃষ্ঠে বায়ুমণ্ডলের
// চাপকে 1 atm বলা হয়, যার পরিমাণ হলো 101325 Pa", চিত্র 5.02 "তরলের উচ্চতার জন্য নিচের পৃষ্ঠে চাপ সৃষ্টি হয়"; on
// page 135, a liquid cannot be squeezed, so its density stays the same. The page writes উপর. The scene's own words:
// ট্যাংক, ছিদ্র, স্কেল.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_m}, {u_Pa}, {u_N}, {u_cm2}, {u_rho}, {u_g} (with <sup>:
// the bundled font has no superscript digits), always after a no-break space (&nbsp;).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তরলের ভেতর চাপ: গভীরতা বাড়লে চাপ বাড়ে',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'চাপ',
    u_m: 'm',
    u_Pa: 'Pa',
    u_N: 'N',
    u_cm2: 'cm<sup>2</sup>',
    u_m2: 'm<sup>2</sup>',
    u_rho: 'kg&nbsp;m<sup>−3</sup>',
    u_g: 'm&nbsp;s<sup>−2</sup>',

    // the row of words: the three holes
    holes: 'ট্যাংকের ছিদ্র',
    chip_top: 'উপরের ছিদ্র',
    chip_mid: 'মাঝের ছিদ্র',
    chip_bot: 'নিচের ছিদ্র',
    at_top: 'উপরের ছিদ্রে',
    at_mid: 'মাঝের ছিদ্রে',
    at_bot: 'নিচের ছিদ্রে',

    // the action and the quiet buttons
    act_open: 'ছিদ্রটি খোলো',
    act_next: 'পরের ছিদ্র খোলো',
    act_close: 'ছিদ্রগুলো বন্ধ করো',
    act_zoom: 'কাছে দেখো',
    act_unzoom: 'পুরোটা দেখো',
    act_home: 'শুরুতে ফেরাও',

    // the result: the book's P = hρg with the student's numbers
    sum: '<i>P</i> = <i>hρg</i> = {h}&nbsp;{u_m} × {rho}&nbsp;{u_rho} × {g}&nbsp;{u_g} = <b>{P}&nbsp;{u_Pa}</b>',
    sum_label: 'চাপ = গভীরতা × ঘনত্ব × অভিকর্ষজ ত্বরণ',

    // the rule: the book's words, one idea at a time
    rule_start: '<b>তরলের গভীরে গেলে চাপ অনুভব করা যায়।</b> উপরে তরলের যে স্তম্ভটুকু থাকে, তার ওজন থেকেই চাপ। একটি ছিদ্র খুলে দেখো।',
    rule_column:
      '<b>A পৃষ্ঠের উপরের তরলটুকুর আয়তন Ah,</b> তার ওজন বা বল F = (Ahρ)g = {F}&nbsp;{u_N}। কাজেই চাপ P = F/A = hρg: A যত বড়ই হোক, একই তরলে চাপ শুধু গভীরতার উপর নির্ভর করে।',
    rule_depth: '<b>নির্দিষ্ট ঘনত্বের তরলে গভীরতার সাথে সাথে চাপ বাড়তে থাকে:</b> গভীরতা দ্বিগুণ হলে চাপও দ্বিগুণ। যে ছিদ্র যত গভীরে, তার পানি তত জোরে বের হয়।',
    rule_atm:
      '<b>পানির বেলায় আনুমানিক প্রতি দশ মিটার গভীরতায় বাতাসের চাপের সমপরিমাণ চাপ বেড়ে যায়:</b> {ten}&nbsp;{u_m} পানির নিচে hρg = {P10}&nbsp;{u_Pa}, আর ভূপৃষ্ঠে বায়ুমণ্ডলের চাপ 1 atm = {atm}&nbsp;{u_Pa}।',

    // the graph (the book's figure 5.03, for this tank)
    g_x: 'গভীরতা h (m)',
    g_y: 'চাপ P (Pa)',
    graph_label: 'চাপ–গভীরতা গ্রাফ: গভীরতার সাথে সাথে চাপ সমান হারে বাড়ে',

    // notes on the stage
    note_drag: 'A পৃষ্ঠটি টেনে উপরে-নিচে সরাও',
    note_arrows: 'লাল তীর যত লম্বা, চাপ তত বেশি',

    // labels on the picture
    lbl_h: 'h = {v}&nbsp;{u_m}',
    lbl_h_q: 'h = ?',
    lbl_P: 'P = {v}&nbsp;{u_Pa}',
    lbl_A: 'A = {v}&nbsp;{u_cm2}',
    lbl_F: 'F = {v}&nbsp;{u_N}',
    lbl_column: 'তরলের স্তম্ভ',
    lbl_grow: 'গভীরতা বাড়লে চাপ বাড়ে',
    lbl_gauge: 'গভীরতা ({u_m})',
    lbl_this: 'এই ছিদ্র',

    hint_wait: 'পানি বের হচ্ছে, দেখো কতদূর যায়।',

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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_hole: 'চিহ্নিত ছিদ্রের গভীরতায় পানির চাপ কত? গভীরতা বাম পাশের স্কেল থেকে পড়ো।',
    why_hole: '<b>{P}&nbsp;{u_Pa}</b>: ছিদ্রটি {h}&nbsp;{u_m} গভীরে, তাই P = hρg = {h} × {rho} × {g} = {P}&nbsp;{u_Pa}।',
    mis_no_g: 'এখানে g দিয়ে গুণ করা হয়নি: তরলের ওজন = ভর × g।',
    mis_cm: 'গভীরতা মিটারে নিতে হবে: {cm}&nbsp;cm = {h}&nbsp;{u_m}।',
    mis_other: 'এটি অন্য একটি ছিদ্রের গভীরতার চাপ।',

    q_far: 'তিনটি ছিদ্রই একই মাপের। নিচের ছিদ্রের পানি সবচেয়ে জোরে বের হয়ে সবচেয়ে দূরে পড়ছে কেন?',
    c_deep: 'তার উপরে তরলের স্তম্ভ সবচেয়ে উঁচু',
    c_denser: 'নিচের দিকের পানির ঘনত্ব বেশি',
    c_gravity: 'নিচের পানির উপর g বেশি',
    c_air: 'নিচে বাতাসের চাপ বেশি',
    why_far: '<b>উপরের তরল স্তম্ভ সবচেয়ে উঁচু:</b> h সবচেয়ে বেশি, তাই চাপ P = hρg সবচেয়ে বেশি; বেশি চাপ পানিকে বেশি জোরে ঠেলে বের করে।',
    mis_denser: 'বই বলছে, তরলকে চাপ দিয়ে সংকুচিত করা যায় না, তাই ঘনত্ব একই থাকে।',
    mis_gravity: 'g সব জায়গায় একই, {g}&nbsp;{u_g}।',
    mis_air: 'ট্যাংকের সব জায়গায় বাতাসের চাপ প্রায় একই; পার্থক্য পানির স্তম্ভে।',

    q_double: 'A পৃষ্ঠটিকে {h1}\u00a0{u_m} থেকে {h2}\u00a0{u_m} গভীরে নামালে তার উপর পানির চাপ কী হবে?',
    c_twice: 'দ্বিগুণ হবে',
    c_half: 'অর্ধেক হবে',
    c_same: 'একই থাকবে',
    c_four: 'চার গুণ হবে',
    why_double: '<b>দ্বিগুণ হবে</b>: P = hρg, তাই h দ্বিগুণ হলে চাপও দ্বিগুণ ({P1}&nbsp;{u_Pa} থেকে {P2}&nbsp;{u_Pa})।',
    mis_half: 'গভীরে নামলে উপরের স্তম্ভ লম্বা হয়, তাই চাপ বাড়ে।',
    mis_same: 'A একই থাকলেও উপরের স্তম্ভের ওজন দ্বিগুণ হয়।',
    mis_four: 'চাপ h-এর সাথে সমান হারে বাড়ে, h<sup>2</sup>-এর সাথে নয়।',

    q_column: 'ছিদ্রগুলো বন্ধ। A পৃষ্ঠের উপর পানির চাপ কীসের জন্য তৈরি হয়?',
    c_weight: 'A-এর উপরের তরল স্তম্ভের ওজনের জন্য',
    c_wall: 'ট্যাংকের দেয়ালের ধাক্কার জন্য',
    c_below: 'A-এর নিচের পানির ওজনের জন্য',
    c_hole: 'ছিদ্র বন্ধ, তাই কোনো চাপ নেই',
    why_column: '<b>উপরের তরল স্তম্ভের ওজনের জন্য</b>: F = (Ahρ)g, তাই P = F/A = hρg। ছিদ্র বন্ধ থাকলেও এই চাপ থাকে।',
    mis_wall: 'দেয়াল শুধু পানিকে আটকে রাখে; চাপ আসে উপরের তরলের ওজন থেকে।',
    mis_below: 'বই বলছে, A-এর উপরের স্তম্ভটুকুর ওজন থেকেই চাপ; নিচের পানি নয়।',
    mis_hole: 'ছিদ্র বন্ধ থাকলেও চাপ থাকে; ছিদ্র খুললে সেই চাপ পানিকে বাইরে ঠেলে দেয়।',

    q_ten: 'এই ট্যাংকের পানি যদি {d}\u00a0{u_m} গভীর হতো, তলায় শুধু পানির জন্য চাপ কত হতো?',
    why_ten: '<b>{P}&nbsp;{u_Pa}</b>: hρg = {d} × {rho} × {g}। বই বলছে, প্রতি দশ মিটারে বাতাসের চাপের (1 atm = {atm}&nbsp;{u_Pa}) প্রায় সমান চাপ বাড়ে।',
    mis_one_m: 'এটি {one}&nbsp;{u_m} গভীরের চাপ (এখনকার ট্যাংকের তলা)।',
    mis_no_g10: 'এখানে g দিয়ে গুণ করা হয়নি।',
    mis_hundred: 'এটি {hundred}&nbsp;{u_m} গভীরের চাপ।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Pressure in liquids: deeper, more pressure',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Pressure',
    u_m: 'm',
    u_Pa: 'Pa',
    u_N: 'N',
    u_cm2: 'cm<sup>2</sup>',
    u_m2: 'm<sup>2</sup>',
    u_rho: 'kg&nbsp;m<sup>−3</sup>',
    u_g: 'm&nbsp;s<sup>−2</sup>',

    holes: 'Holes in the tank',
    chip_top: 'Top hole',
    chip_mid: 'Middle hole',
    chip_bot: 'Bottom hole',
    at_top: 'At the top hole',
    at_mid: 'At the middle hole',
    at_bot: 'At the bottom hole',

    act_open: 'Open the hole',
    act_next: 'Open the next hole',
    act_close: 'Close the holes',
    act_zoom: 'Look close',
    act_unzoom: 'See it all',
    act_home: 'Back to the start',

    sum: '<i>P</i> = <i>hρg</i> = {h}&nbsp;{u_m} × {rho}&nbsp;{u_rho} × {g}&nbsp;{u_g} = <b>{P}&nbsp;{u_Pa}</b>',
    sum_label: 'pressure = depth × density × acceleration due to gravity',

    rule_start: '<b>Deep in a liquid you feel a pressure.</b> It comes from the weight of the column of liquid above you. Open a hole and see.',
    rule_column:
      '<b>The liquid above the surface A has the volume Ah</b> and its weight, the force F = (Ahρ)g = {F}&nbsp;{u_N}. So the pressure is P = F/A = hρg: whatever the size of A, in one liquid the pressure depends only on the depth.',
    rule_depth:
      '<b>In a liquid of a given density the pressure grows with depth:</b> twice the depth, twice the pressure. The deeper a hole, the harder its water comes out.',
    rule_atm:
      '<b>In water, about every ten metres of depth add a pressure equal to the air’s:</b> {ten}&nbsp;{u_m} under water hρg = {P10}&nbsp;{u_Pa}, and the atmosphere’s pressure at the ground is 1 atm = {atm}&nbsp;{u_Pa}.',

    g_x: 'depth h (m)',
    g_y: 'pressure P (Pa)',
    graph_label: 'Pressure–depth graph: the pressure grows at a steady rate with the depth',

    note_drag: 'Drag the surface A up and down',
    note_arrows: 'The longer the red arrow, the more the pressure',

    lbl_h: 'h = {v}&nbsp;{u_m}',
    lbl_h_q: 'h = ?',
    lbl_P: 'P = {v}&nbsp;{u_Pa}',
    lbl_A: 'A = {v}&nbsp;{u_cm2}',
    lbl_F: 'F = {v}&nbsp;{u_N}',
    lbl_column: 'column of liquid',
    lbl_grow: 'deeper, more pressure',
    lbl_gauge: 'depth ({u_m})',
    lbl_this: 'this hole',

    hint_wait: 'The water is coming out: see how far it goes.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Pick an answer from the picture.',

    q_hole: 'What is the water’s pressure at the depth of the marked hole? Read the depth off the scale on the left.',
    why_hole: '<b>{P}&nbsp;{u_Pa}</b>: the hole is {h}&nbsp;{u_m} deep, so P = hρg = {h} × {rho} × {g} = {P}&nbsp;{u_Pa}.',
    mis_no_g: 'This leaves out g: the liquid’s weight = mass × g.',
    mis_cm: 'Take the depth in metres: {cm}&nbsp;cm = {h}&nbsp;{u_m}.',
    mis_other: 'This is the pressure at another hole’s depth.',

    q_far: 'The three holes are the same size. Why does the water from the bottom hole come out hardest and land furthest?',
    c_deep: 'The column of liquid above it is the tallest',
    c_denser: 'The water lower down is denser',
    c_gravity: 'g is bigger on the lower water',
    c_air: 'The air’s pressure is bigger down there',
    why_far:
      '<b>The column of liquid above it is the tallest:</b> h is the biggest, so P = hρg is the biggest; more pressure pushes the water out harder.',
    mis_denser: 'The book says a liquid cannot be squeezed by pressure, so its density stays the same.',
    mis_gravity: 'g is the same everywhere, {g}&nbsp;{u_g}.',
    mis_air: 'The air’s pressure is about the same all round the tank; the difference is the column of water.',

    q_double: 'The surface A is lowered from {h1}\u00a0{u_m} to {h2}\u00a0{u_m} deep. What happens to the water’s pressure on it?',
    c_twice: 'It doubles',
    c_half: 'It halves',
    c_same: 'It stays the same',
    c_four: 'It becomes four times',
    why_double: '<b>It doubles</b>: P = hρg, so twice h is twice the pressure ({P1}&nbsp;{u_Pa} to {P2}&nbsp;{u_Pa}).',
    mis_half: 'Lower down the column above is taller, so the pressure grows.',
    mis_same: 'A stays the same, but the weight of the column above it doubles.',
    mis_four: 'The pressure grows in step with h, not with h<sup>2</sup>.',

    q_column: 'The holes are closed. What makes the water’s pressure on the surface A?',
    c_weight: 'The weight of the column of liquid above A',
    c_wall: 'The push of the tank’s wall',
    c_below: 'The weight of the water below A',
    c_hole: 'Nothing: the holes are closed, so there is no pressure',
    why_column: '<b>The weight of the column of liquid above A</b>: F = (Ahρ)g, so P = F/A = hρg. It is there with the holes closed too.',
    mis_wall: 'The wall only holds the water in; the pressure comes from the weight of the liquid above.',
    mis_below: 'The book says the pressure comes from the weight of the column above A, not the water below.',
    mis_hole: 'The pressure is there with the holes closed; open a hole and it pushes the water out.',

    q_ten: 'If the water in this tank were {d}\u00a0{u_m} deep, what would the pressure of the water alone be at the bottom?',
    why_ten:
      '<b>{P}&nbsp;{u_Pa}</b>: hρg = {d} × {rho} × {g}. The book says every ten metres add about the air’s pressure (1 atm = {atm}&nbsp;{u_Pa}).',
    mis_one_m: 'This is the pressure {one}&nbsp;{u_m} down (the bottom of this tank now).',
    mis_no_g10: 'This leaves out g.',
    mis_hundred: 'This is the pressure {hundred}&nbsp;{u_m} down.',
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
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
