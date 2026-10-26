// Every string the figure shows, in Bangla (the book's words, pages 75–76, ৩.৬: বল, বল প্রয়োগ, প্রযুক্ত বল, বেগ,
// বেগের পরিবর্তন, ত্বরণ, ভর, ভরবেগ, ভরবেগের পরিবর্তনের হার, সমানুপাতিক, সমানুপাতিক ধ্রুবক k, F = ma, নিউটনের
// দ্বিতীয় সূত্র, ঠেলাগাড়ি, ঘর্ষণ) and English. Units are the book's Latin symbols (kg, m/s, ms⁻², kg m/s, s); forces
// in Bangla are "নিউটন" (English N), as in the chapter's other figures (docs/book-notes.md). Powers as <sup>: the
// bundled font has no superscript digits. A number and its unit never break apart (no-break spaces). Use
// t('key', vars) in code, and t.num() for numbers (Bangla digits when the language is Bangla).

const NB = ' ';
const MS2 = `ms<sup>−2</sup>`;
const MS = 'm/s';
const KGMS = `kg${NB}m/s`;

export const STRINGS = {
  bn: {
    title: 'নিউটনের দ্বিতীয় গতি সূত্র',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ত্বরণ',
    examples: 'কী বদলাবে, বেছে নাও',

    ex_base: 'খালি গাড়ি',
    ex_force: 'দ্বিগুণ বল',
    ex_mass: 'দ্বিগুণ ভর',
    ex_back: 'উল্টো দিকে বল',
    res_a: `{a}${NB}${MS2}`,

    // the action (the big button and the numbered ring on the cart)
    act_base: `গাড়িটি {t}${NB}সেকেন্ড ঠেলো`,
    act_force: `দুজনে মিলে {t}${NB}সেকেন্ড ঠেলো`,
    act_mass: `বোঝাই গাড়িটি {t}${NB}সেকেন্ড ঠেলো`,
    act_back: 'ঠেলো, তারপর উল্টো দিকে থামাও',
    act_on_base: 'এবার খালি গাড়ি ঠেলো',
    act_on_force: 'এবার দুজনে মিলে ঠেলো',
    act_on_mass: 'এবার বস্তা তুলে ঠেলো',
    act_on_back: 'এবার উল্টো দিকে থামাও',
    act_again: 'আবার ঠেলো',
    act_home: 'শুরুতে ফেরাও',

    // the result line: the number that matters in <b>
    out_rest: `গাড়িটি স্থির: বেগ <b>{v}</b>${NB}${MS}`,
    out_push: `t${NB}=${NB}{t}${NB}s, বেগ v${NB}=${NB}<b>{v}</b>${NB}${MS}`,
    out_coast: `ঠেলা শেষ: বেগ <b>{v}</b>${NB}${MS}, আর বদলাচ্ছে না`,
    out_brake: `উল্টো ঠেলার {t}${NB}s: বেগ <b>{v}</b>${NB}${MS}`,
    out_result: `a = (v − u) ÷ t = ({v} − {u}) ÷ {t} = <b>{a}</b>${NB}${MS2}`,

    // the rule line: the book's words in <b>, growing with what the student has found
    rule_start: `<b>বল প্রয়োগ করলে বস্তুর বেগের পরিবর্তন হয়।</b> {who} {F}${NB}নিউটন বলে {t}${NB}সেকেন্ড ঠেলবে; {what} {m}${NB}kg। বেগ কত দ্রুত বাড়ে, দেখো।`,
    who_1: 'একজন',
    who_2: 'দুজন মিলে',
    what_0: 'খালি গাড়ির ভর',
    what_n: 'বস্তাসহ গাড়ির ভর',
    rule_start_back: `<b>বল প্রয়োগ করলে বেগ বাড়ে, আবার কমেও।</b> পেছনের জন {t}${NB}সেকেন্ড ঠেলবে, তারপর সামনের জন উল্টো দিকে {F}${NB}নিউটন বলে {t}${NB}সেকেন্ড ঠেলে থামাবে।`,
    rule_push: '<b>বল যতক্ষণ কাজ করছে, বেগ ততক্ষণ বাড়ছে:</b> প্রতি সেকেন্ডে সমান পরিমাণ। বেগের পরিবর্তনের হারই ত্বরণ।',
    rule_coast: 'ঠেলা শেষ: সামনে-পেছনে কোনো বল নেই, তাই বেগ আর বদলাচ্ছে না।',
    rule_brake: '<b>বল বাম দিকে, গাড়ি চলছে ডান দিকে:</b> তাই বেগ কমছে। ভরবেগের পরিবর্তন হচ্ছে বলের দিকে, বাম দিকে।',
    rule_fma: `<b>F = ma</b> (সমানুপাতিক ধ্রুবক k = {k} ধরে): {F}${NB}নিউটন = {m}${NB}kg × {a}${NB}${MS2}।`,
    rule_force: `<b>বল দ্বিগুণ, ত্বরণও দ্বিগুণ</b> ({a0} থেকে {a1}${NB}${MS2}): ত্বরণ বলের সমানুপাতিক।`,
    rule_mass: `<b>ভর দ্বিগুণ, ত্বরণ অর্ধেক</b> ({a0} থেকে {a1}${NB}${MS2}): একই বলে ভারী বস্তুর ত্বরণ কম।`,
    rule_back: `<b>যেদিকে বল প্রয়োগ করা হয় ভরবেগের পরিবর্তনও সেদিকে ঘটে:</b> বল বাম দিকে (ডান দিক ধনাত্মক (+) ধরে ঋণাত্মক), তাই ভরবেগ {p0} থেকে কমে {p1}${NB}${KGMS} হলো।`,
    rule_ask_force: 'বল দ্বিগুণ করলে কী হবে?',
    rule_ask_mass: 'ভর দ্বিগুণ করলে কী হবে?',
    rule_ask_back: 'উল্টো দিকে বল দিলে কী হবে?',
    rule_ask_base: 'খালি গাড়িতে একজনের ঠেলায় কী হয়?',
    rule_law:
      '<b>নিউটনের দ্বিতীয় সূত্র:</b> বস্তুর ভরবেগের পরিবর্তনের হার তার উপর প্রযুক্ত বলের সমানুপাতিক এবং যেদিকে বল প্রয়োগ করা হয় ভরবেগের পরিবর্তনও সেদিকে ঘটে। <b>F = ma</b>',

    // on the scene
    l_force: `F = {F}${NB}নিউটন`,
    l_mass: `m = {m}${NB}kg`,
    l_acc: 'ত্বরণ a',
    l_vel: `v = {v}${NB}${MS}`,
    l_marks: 'প্রতি সেকেন্ডে দাগ',
    l_dp: 'ভরবেগের পরিবর্তন',
    l_cart: `গাড়ি {m}${NB}kg`,
    l_sack: `প্রতি বস্তা {m}${NB}kg`,
    l_A: 'ক',
    l_B: 'খ',
    note_head: 'মসৃণ মেঝে:',
    note: 'ঘর্ষণ নেই ধরা হয়েছে',
    note_short: 'ঘর্ষণ নেই',
    hint_wait: 'ঠেলা চলছে: দেখো বেগ কীভাবে বদলায়।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'দৃশ্যটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_look: 'দেখো…',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। দেখে উত্তর বেছে নাও।',
    opt_a: `{a}${NB}${MS2}`,

    q_calc: `{who} মোট {F}${NB}নিউটন বলে গাড়িটি ঠেলবে। ছবি থেকে মোট ভর বের করো: ঠেলার সময় গাড়িটির ত্বরণ কত হবে?`,
    why_calc: `<b>{a}${NB}${MS2}</b>: m = {mc} + {n} × {ms} = {M}${NB}kg, তাই a = F ÷ m = {F} ÷ {M} = {a}${NB}${MS2}।`,
    not_cart: 'শুধু গাড়ির ভর নয়, বস্তাগুলোর ভরও যোগ করতে হয়।',
    not_sacks: 'গাড়ির নিজের ভরও যোগ করতে হয়।',
    not_one_less: 'একটি বস্তা বাদ পড়েছে: সবগুলো গুনে নাও।',
    not_inverse: 'a = F ÷ m, m ÷ F নয়।',

    q_double_force: `ছবিতে দেখো, একজনের {t}${NB}সেকেন্ডের ঠেলায় বেগ কত হলো। দুজনে মিলে ঠেললে (দ্বিগুণ বল) ঠেলার সময় ত্বরণ কত হবে?`,
    q_double_mass: `ছবিতে দেখো, {t}${NB}সেকেন্ডের ঠেলায় বেগ কত হলো। একই বলে, বস্তা তুলে ভর দ্বিগুণ করলে ত্বরণ কত হবে?`,
    why_double_force: `<b>{a}${NB}${MS2}</b>: আগে a = ({v} − {u}) ÷ {t} = {a0}${NB}${MS2}; ভর একই রেখে বল দ্বিগুণ করলে ত্বরণও দ্বিগুণ।`,
    why_double_mass: `<b>{a}${NB}${MS2}</b>: আগে a = ({v} − {u}) ÷ {t} = {a0}${NB}${MS2}; বল একই রেখে ভর দ্বিগুণ করলে ত্বরণ অর্ধেক।`,
    not_same: 'ত্বরণ গাড়ির নিজের কোনো স্থির মান নয়: a = F ÷ m।',
    not_flip_force: 'বল বাড়লে ত্বরণ বাড়ে, কমে না।',
    not_flip_mass: 'একই বলে ভর বাড়লে ত্বরণ কমে।',
    not_square_force: 'ত্বরণ বলের সমানুপাতিক: দ্বিগুণ বলে দ্বিগুণ, চার গুণ নয়।',
    not_square_mass: 'ভর দ্বিগুণে ত্বরণ অর্ধেক, এক-চতুর্থাংশ নয়।',

    q_dir: 'গাড়িটি ডান দিকে চলছে, আর সামনের জন একে বাম দিকে ঠেলছে। এখন গাড়িটির ভরবেগের পরিবর্তন কোন দিকে?',
    d_left: 'বাম দিকে',
    d_right: 'ডান দিকে',
    d_none: 'কোনো দিকে না, ভরবেগ একই থাকবে',
    d_later: 'আগে ডান দিকে, থামার পর বাম দিকে',
    why_dir: '<b>বাম দিকে</b>: যেদিকে বল প্রয়োগ করা হয় ভরবেগের পরিবর্তনও সেদিকে ঘটে। তাই বেগ কমে, গাড়িটি থামে।',
    not_right: 'গাড়ি চলছে ডানে, কিন্তু পরিবর্তন হয় বলের দিকে।',
    not_none: 'বল থাকলে ভরবেগ বদলায়।',
    not_later: 'থামার আগেও পরিবর্তন বলের দিকে: তাই তো বেগ কমছে।',

    q_pair: `প্রত্যেকে {F}${NB}নিউটন বলে ঠেলছে; গাড়ি {mc}${NB}kg, প্রতি বস্তা {ms}${NB}kg। খ গাড়ির ত্বরণ ক গাড়ির তুলনায় কেমন হবে?`,
    r_same: 'সমান',
    r_twice: 'দ্বিগুণ',
    r_half: 'অর্ধেক',
    r_four: 'চার গুণ',
    r_quarter: 'এক-চতুর্থাংশ',
    why_pair: `<b>{r}</b>: ক: a = {Fa} ÷ {ma} = {aa}${NB}${MS2}; খ: a = {Fb} ÷ {mb} = {ab}${NB}${MS2}।`,
    not_byforce: 'শুধু কতজন ঠেলছে দেখলে হবে না, ভরও দেখতে হয়।',
    not_bymass: 'ভর বেশি হলে ত্বরণ কম, বেশি নয়।',
    not_flip: 'উল্টো হয়ে গেছে: ক আর খ মিলিয়ে দেখো।',
    not_other: 'a = F ÷ m দিয়ে দুটিরই হিসাব করে দেখো।',

    q_law: 'নিউটনের দ্বিতীয় সূত্র অনুযায়ী, বস্তুর উপর প্রযুক্ত বলের সমানুপাতিক হলো তার—',
    w_rate: 'ভরবেগের পরিবর্তনের হার',
    w_time: 'ভরবেগের পরিবর্তনের সময়',
    w_p: 'ভরবেগ',
    w_v: 'বেগ',
    why_law: `<b>ভরবেগের পরিবর্তনের হার</b>: দুজনের মোট {F}${NB}নিউটন বলে গাড়ির ভরবেগ প্রতি সেকেন্ডে {F}${NB}${KGMS} করে বাড়ে।`,
    not_time: 'যত বেশি বল, তত তাড়াতাড়ি পরিবর্তন: সময় নয়, হার।',
    not_p: 'বল না থাকলেও ভরবেগ থাকে, যেমন সমবেগে চলায়।',
    not_v: 'বল না থাকলেও বস্তু সমবেগে চলতে পারে।',
  },
  en: {
    title: "Newton's second law of motion",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Acceleration',
    examples: 'Choose what changes',

    ex_base: 'Empty cart',
    ex_force: 'Double force',
    ex_mass: 'Double mass',
    ex_back: 'Force backward',
    res_a: `{a}${NB}${MS2}`,

    act_base: `Push the cart for {t}${NB}s`,
    act_force: `Two people push for {t}${NB}s`,
    act_mass: `Push the loaded cart for {t}${NB}s`,
    act_back: 'Push, then stop it from the front',
    act_on_base: 'Now the empty cart',
    act_on_force: 'Now two people push',
    act_on_mass: 'Now load sacks and push',
    act_on_back: 'Now stop it from the front',
    act_again: 'Push again',
    act_home: 'Back to start',

    out_rest: `The cart is at rest: velocity <b>{v}</b>${NB}${MS}`,
    out_push: `t${NB}=${NB}{t}${NB}s, velocity v${NB}=${NB}<b>{v}</b>${NB}${MS}`,
    out_coast: `Push over: velocity <b>{v}</b>${NB}${MS}, not changing`,
    out_brake: `Pushed back for {t}${NB}s: velocity <b>{v}</b>${NB}${MS}`,
    out_result: `a = (v − u) ÷ t = ({v} − {u}) ÷ {t} = <b>{a}</b>${NB}${MS2}`,

    rule_start: `<b>A force changes a body's velocity.</b> {who} will push with {F}${NB}N for {t}${NB}s; {what} {m}${NB}kg. Watch how fast the velocity grows.`,
    who_1: 'One person',
    who_2: 'Two people',
    what_0: 'the empty cart has a mass of',
    what_n: 'with the sacks the mass is',
    rule_start_back: `<b>A force can make the velocity grow, and shrink.</b> The person behind pushes for {t}${NB}s, then the person in front pushes back with {F}${NB}N for {t}${NB}s to stop it.`,
    rule_push:
      '<b>While the force acts, the velocity grows:</b> by the same amount every second. The rate of change of velocity is the acceleration.',
    rule_coast: 'The push is over: no force forward or back, so the velocity no longer changes.',
    rule_brake:
      '<b>The force is to the left, the cart moves to the right:</b> so it slows down. Its momentum changes in the direction of the force, to the left.',
    rule_fma: `<b>F = ma</b> (taking the constant of proportionality k = {k}): {F}${NB}N = {m}${NB}kg × {a}${NB}${MS2}.`,
    rule_force: `<b>Double the force, double the acceleration</b> ({a0} to {a1}${NB}${MS2}): the acceleration is proportional to the force.`,
    rule_mass: `<b>Double the mass, half the acceleration</b> ({a0} to {a1}${NB}${MS2}): the same force speeds a heavier body up less.`,
    rule_back: `<b>The momentum changes in the direction the force is applied:</b> the force is to the left (negative, taking to the right as positive (+)), so the momentum fell from {p0} to {p1}${NB}${KGMS}.`,
    rule_ask_force: 'What if the force is doubled?',
    rule_ask_mass: 'What if the mass is doubled?',
    rule_ask_back: 'What if the force acts backward?',
    rule_ask_base: 'What does one push do to the empty cart?',
    rule_law:
      "<b>Newton's second law:</b> the rate of change of a body's momentum is proportional to the force applied to it, and the momentum changes in the direction the force is applied. <b>F = ma</b>",

    l_force: `F = {F}${NB}N`,
    l_mass: `m = {m}${NB}kg`,
    l_acc: 'acceleration a',
    l_vel: `v = {v}${NB}${MS}`,
    l_marks: 'a mark every second',
    l_dp: 'change of momentum',
    l_cart: `cart {m}${NB}kg`,
    l_sack: `each sack {m}${NB}kg`,
    l_A: 'A',
    l_B: 'B',
    note_head: 'Smooth floor:',
    note: 'friction left out',
    note_short: 'no friction',
    hint_wait: 'Pushing now: watch how the velocity changes.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the scene, think, then pick an answer.',
    q_look: 'Look…',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Look and pick an answer.',
    opt_a: `{a}${NB}${MS2}`,

    q_calc: `{who} will push the cart with {F}${NB}N in all. Work out the total mass from the picture: what is the acceleration while they push?`,
    why_calc: `<b>{a}${NB}${MS2}</b>: m = {mc} + {n} × {ms} = {M}${NB}kg, so a = F ÷ m = {F} ÷ {M} = {a}${NB}${MS2}.`,
    not_cart: 'Not just the cart: add the sacks too.',
    not_sacks: "Add the cart's own mass too.",
    not_one_less: 'A sack is missing: count them all.',
    not_inverse: 'a = F ÷ m, not m ÷ F.',

    q_double_force: `Look at the velocity after one person's {t}${NB}s push. If two people push (double the force), what is the acceleration?`,
    q_double_mass: `Look at the velocity after the {t}${NB}s push. With the same force, if sacks double the mass, what is the acceleration?`,
    why_double_force: `<b>{a}${NB}${MS2}</b>: before, a = ({v} − {u}) ÷ {t} = {a0}${NB}${MS2}; same mass, double the force: double the acceleration.`,
    why_double_mass: `<b>{a}${NB}${MS2}</b>: before, a = ({v} − {u}) ÷ {t} = {a0}${NB}${MS2}; same force, double the mass: half the acceleration.`,
    not_same: "The acceleration is not a fixed number of the cart's: a = F ÷ m.",
    not_flip_force: 'More force gives more acceleration, not less.',
    not_flip_mass: 'With the same force, more mass gives less acceleration.',
    not_square_force: 'Acceleration is proportional to force: double, not four times.',
    not_square_mass: 'Double the mass: half the acceleration, not a quarter.',

    q_dir: 'The cart moves to the right, and the person in front pushes it to the left. Which way does its momentum change now?',
    d_left: 'To the left',
    d_right: 'To the right',
    d_none: 'Neither: the momentum stays the same',
    d_later: 'Right first, then left once it stops',
    why_dir: '<b>To the left</b>: the momentum changes in the direction the force is applied. So the velocity falls and the cart stops.',
    not_right: 'The cart moves right, but the change goes the way of the force.',
    not_none: 'A force changes the momentum.',
    not_later: 'Even before it stops the change is along the force: that is why it slows.',

    q_pair: `Each person pushes with {F}${NB}N; the cart is {mc}${NB}kg, each sack {ms}${NB}kg. How does B's acceleration compare with A's?`,
    r_same: 'The same',
    r_twice: 'Twice',
    r_half: 'Half',
    r_four: 'Four times',
    r_quarter: 'A quarter',
    why_pair: `<b>{r}</b>: A: a = {Fa} ÷ {ma} = {aa}${NB}${MS2}; B: a = {Fb} ÷ {mb} = {ab}${NB}${MS2}.`,
    not_byforce: 'Not just how many push: look at the mass too.',
    not_bymass: 'More mass means less acceleration, not more.',
    not_flip: 'Upside down: compare A and B again.',
    not_other: 'Work out a = F ÷ m for both.',

    q_law: "By Newton's second law, the force applied to a body is proportional to its—",
    w_rate: 'rate of change of momentum',
    w_time: 'time of change of momentum',
    w_p: 'momentum',
    w_v: 'velocity',
    why_law: `<b>Rate of change of momentum</b>: with {F}${NB}N from the two, the cart's momentum grows by {F}${NB}${KGMS} every second.`,
    not_time: 'More force, faster change: a rate, not a time.',
    not_p: 'A body can have momentum with no force, moving at a steady velocity.',
    not_v: 'A body can move at a steady velocity with no force.',
  },
};

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
