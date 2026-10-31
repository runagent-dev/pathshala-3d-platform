// Every string the figure shows, in Bangla and English. The book's words on pages 81–83 (topic 3.7): নিউটনের দ্বিতীয়
// গতিসূত্র, টান বল T, মাধ্যাকর্ষণ বল Mg, কপিকল, সুতা, ত্বরণ, ধনাত্মক, ঋণাত্মক, "উপরের দিকের রাশি ধনাত্মক", "একটি
// সুতায় একটি মাত্র টান বল কাজ করে", "টান বল সব সময় সুতা বরাবর এবং বস্তু থেকে দূরের দিকে কাজ করে". The well's own
// words: কূপ, দড়ি (the book's সুতা), বালতি, পানি.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_N} (Bangla "নিউটন"), {u_n} (the short "N" on the
// picture), {u_kg}, {u_v} (m/s) and {u_a} (ms⁻², written with <sup>: the bundled font has no ⁻ ² ₁ ₂), always after a
// no-break space (written   below).

export const STRINGS = {
  bn: {
    title: 'কূপ থেকে পানি তোলা: দড়ির টান ও ত্বরণ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ত্বরণ',
    u_N: 'নিউটন',
    u_n: 'N',
    u_kg: 'kg',
    u_v: 'm/s',
    u_a: 'ms<sup>−2</sup>',

    // the row of words: four things to try
    experiments: 'কী করবে বেছে নাও',
    chip_hold: 'ধরে রাখো',
    chip_pull: 'জোরে টানো',
    chip_ease: 'ঢিল দাও',
    chip_full: 'বেশি পানি',
    res_a: 'a = {a}',

    // the action and the quiet buttons
    act_hold: 'ধরে রাখো',
    act_pull: 'টানো',
    act_ease: 'ঢিল দাও',
    act_next_hold: 'এবার ধরে রাখো',
    act_next_pull: 'এবার জোরে টানো',
    act_next_ease: 'এবার ঢিল দাও',
    act_next_full: 'বেশি পানিতে টানো',
    act_again: 'আবার করো',
    act_home: 'শুরুতে ফেরাও',
    act_example: 'বইয়ের উদাহরণ',

    // the formula: the steppers, the law
    name_T: 'দড়ির টান',
    name_M: 'বালতি ও পানি',
    less_T: 'টান কমাও',
    more_T: 'টান বাড়াও',
    less_M: 'পানি কমাও',
    more_M: 'পানি বাড়াও',
    law_label: 'বালতির জন্য নিউটনের দ্বিতীয় গতিসূত্র: T − Mg = Ma',

    // the result line: what the bucket does with these numbers
    out_run_still: '<b>বালতি স্থির,</b> ত্বরণ নেই',
    out_run_up: '<b>বালতি উপরে উঠছে</b>',
    out_run_down: '<b>বালতি নিচে নামছে</b>',
    out_top: '<b>বালতি উঠে এল</b> (a = {a} {u_a})',
    out_water: '<b>বালতি পানিতে নেমে গেল</b> (a = {a} {u_a})',
    out_still: '<b>বালতি যেখানে ছিল সেখানেই আছে</b> (a = {a})',

    // the rule: the book's words, one idea at a time
    rule_start: '<b>একটি সুতায় একটি মাত্র টান বল কাজ করে:</b> লোকটির হাতে আর বালতিতে দড়ির টান একই, T।',
    rule_still: '<b>T = Mg হলে লব্ধি বল শূন্য:</b> বালতির ত্বরণ নেই, তাই হাতে ধরা বালতি স্থির থাকে।',
    rule_one_rope: '<b>টান বল সব সময় সুতা বরাবর, বস্তু থেকে দূরের দিকে:</b> বালতিতে উপরে, হাতে কপিকলের দিকে। কপিকল শুধু দিক বদলায়।',
    rule_down: '<b>উপরের দিক ধনাত্মক:</b> T &lt; Mg হলে a ঋণাত্মক, ত্বরণ নিচের দিকে। বই লেখে T − Mg = M(−a)।',
    rule_mass: '<b>একই টানে ভর বেশি হলে ত্বরণ কম:</b> লব্ধি বল (T − Mg) কমে, আর তাকে ভাগ করতে হয় বেশি ভর দিয়ে।',
    rule_law:
      '<b>নিউটনের দ্বিতীয় গতিসূত্র:</b> বাম দিকে বলগুলোর যোগফল, ডান দিকে ভর × ত্বরণ: <span class="c-T">T</span> − <span class="c-W">Mg</span> = <span class="c-M">M</span><span class="c-a">a</span>। বইয়ের ছবিগুলো দেখো: বইয়ের উদাহরণ।',

    // labels on the picture
    lbl_T: 'T = {v} {u_n}',
    lbl_W: 'Mg = {v} {u_n}',
    lbl_a: 'a = {v} {u_a}',
    sym_T: 'T',
    sym_W: 'Mg',
    sym_a: 'a',
    lbl_M: 'M = {m} kg',

    // the notes on the stage
    note_head: 'কূপটি অর্ধেক কেটে দেখানো।',
    note_body: 'দড়ি হালকা, কপিকল মসৃণ ধরা হয়েছে · সময় {k} গুণ ধীর',
    note_body_short: 'সময় {k} গুণ ধীর',
    sign: '<b>↑</b> উপরের দিক ধনাত্মক',
    note_scale: 'তীরের দৈর্ঘ্য বলের সমানুপাতিক; ত্বরণের তীর আলাদা মাপে',
    speed: 'বেগ <b>{v} m/s{dir}</b> · সময় {t} s',

    hint_wait: 'দেখো বালতির কী হয়।',
    hint_arrows: 'টানো বোতাম চাপলে ছবিতে এর তীর দেখা যাবে।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    // 1: a from T and M
    q_calc: 'লোকটি {T} {u_N} টানে, বালতি ও পানি {M} kg। বালতির ত্বরণ কত? (g = {g}, উপরের দিক ধনাত্মক)',
    why_calc: '<b>{a} {u_a}:</b> T − Mg = Ma, তাই a = ({T} − {W}) ÷ {M}। (Mg = {M} × {g} = {W} {u_N})',
    mis_nog: 'বালতির ওজন Mg নিচে টানে: তা বাদ দিতে হয়।',
    mis_plus: 'ওজন নিচের দিকে, টান উপরে: দুটো বিপরীত, যোগ হয় না।',
    mis_byW: 'ভাগ করতে হয় ভর M দিয়ে, ওজন Mg দিয়ে নয়।',

    // 2: held still
    q_hold: 'লোকটি {M} kg বালতিটি এক জায়গায় স্থির ধরে আছে। দড়ির টান কত? (g = {g})',
    why_hold: '<b>{T} {u_N}:</b> স্থির মানে a = {z}, তাই T − Mg = {z}, T = Mg = {M} × {g}।',
    mis_kg: 'kg হলো ভর; বল নিউটনে: ভর × g।',
    mis_zero: 'টান না থাকলে বালতি পড়ে যেত।',
    mis_double: 'স্থির ধরতে ওজনের সমান টানই যথেষ্ট।',

    // 3: T < Mg: which way?
    q_ease: 'বালতি ও পানি {M} kg (ওজন {W} {u_N}), লোকটি টানে {T} {u_N}। বালতির ত্বরণ কোন দিকে?',
    c_down: 'নিচের দিকে (a ঋণাত্মক)',
    c_up: 'উপরের দিকে (a ধনাত্মক)',
    c_none: 'ত্বরণ নেই, স্থির থাকবে',
    c_up_slow: 'উপরে, তবে ধীরে ধীরে',
    why_ease: '<b>নিচের দিকে, a = {a} {u_a}:</b> T ({T}) &lt; Mg ({W}), তাই লব্ধি বল নিচে। T − Mg = M(−a)।',
    mis_up: 'টান ওজনের চেয়ে কম: লব্ধি বল নিচের দিকে।',
    mis_none: 'স্থির থাকতে টান ওজনের সমান হতে হয়।',
    mis_up_slow: 'উপরে উঠতে টান ওজনের চেয়ে বেশি হতে হয়।',

    // 4: one rope, one pull
    q_same: 'লোকটির হাতে দড়ির টান {T} {u_N}। বালতিকে দড়ি কত জোরে উপরে টানে?',
    why_same: '<b>{T} {u_N}:</b> একটি সুতায় একটি মাত্র টান বল। কপিকল শুধু দিক বদলায়।',
    mis_weight: 'দড়ি বালতির ওজনের সমান টানে না; টানে লোকটির টানের সমান।',
    mis_net: 'এটা লব্ধি বল (T − Mg), দড়ির টান নয়।',
    mis_half: 'কপিকল টান ভাগ করে না: পুরো টানই বালতিতে।',

    // 5: the same pull, more water
    q_full: 'লোকটি {T} {u_N} টানলে {M} kg বালতির ত্বরণ {a} {u_a}। একই টানে আরও {extra} kg পানি দিলে ত্বরণ কত?',
    why_full: '<b>{a2} {u_a}:</b> এখন M = {M2} kg, Mg = {W} {u_N}; a = ({T} − {W}) ÷ {M2}। আগে ছিল {a1}।',
    mis_same: 'ভর বাড়লে ওজনও বাড়ে, লব্ধি বল কমে: ত্বরণ কমে।',
    mis_ratio: 'শুধু ভাগের ভর নয়, ওজন Mg-ও বেড়েছে।',
    mis_nog2: 'বালতির ওজন Mg বাদ দিতে হয়।',

    // the book's examples window
    ex_title: 'বইয়ের উদাহরণ',
    ex_tab_single: 'চিত্র {n}',
    ex_tab_two: 'চিত্র {n}',
    ex_close: 'বন্ধ করো',
    ex_prev: 'আগের ধাপ',
    ex_next: 'পরের ধাপ',
    ex_name_M: 'ঝুলন্ত ভর',
    ex_name_m: 'টেবিলের বস্তু',
    ex_less_M: 'ঝুলন্ত ভর কমাও',
    ex_more_M: 'ঝুলন্ত ভর বাড়াও',
    ex_less_m: 'বস্তুর ভর কমাও',
    ex_more_m: 'বস্তুর ভর বাড়াও',
    ex_q_single: 'একটি ভরের ওজন অন্য বস্তুর উপরে বল প্রয়োগ করছে: <b>M</b> ঝুলছে, সুতা আর কপিকল দিয়ে টেবিলের <b>m</b>-কে টানে। ত্বরণ কত? (টেবিল মসৃণ)',
    ex_q_two: 'কপিকল দিয়ে একটি ভরকে দুই পাশ থেকে দুটি ওজন টানছে: বামে m<sub>2</sub> = {m2} kg, ডানে m<sub>1</sub> = {m1} kg। ত্বরণ কত?',
    ex_hint: 'প্রতিটি ভরের জন্য প্রতিটি দিক বরাবর নিউটনের দ্বিতীয় সূত্র। পরের ধাপ চাপো।',
    ex_s1: 'm বস্তু, অনুভূমিক (ডান দিক ধনাত্মক): টান বল T ডানে, ত্বরণও ডানে।',
    ex_s2: 'উল্লম্ব বরাবর m: তলের প্রতিক্রিয়া N আর mg-র লব্ধি শূন্য, তাই উল্লম্ব ত্বরণ নেই।',
    ex_s3: 'M ভর (উপরের দিক ধনাত্মক): একই সুতা, তাই একই T; ত্বরণ নিচে বলে −a।',
    ex_s4: 'দুটো সমীকরণ মিলিয়ে (প্রথমটির T বসিয়ে):',
    ex_s5: 'সুতার টান ঝুলন্ত ভরের ওজন {W} N-এর চেয়ে কম।',
    ex_t1: 'm<sub>1</sub> ভর (উপরে ওঠে): T<sub>1</sub> উপরে।',
    ex_t2: 'm বস্তু (বাম দিকে যায়): T<sub>2</sub> বামে, T<sub>1</sub> ডানে।',
    ex_t3: 'm<sub>2</sub> ভর (নিচে নামে): T<sub>2</sub> উপরে।',
    ex_t4: 'প্রথম আর তৃতীয়টি থেকে:',
    ex_t5: 'দ্বিতীয়টির সঙ্গে মিলিয়ে। m না জানলে a বের করা যায় না।',
    ex_run: 'ছেড়ে দাও',
    ex_running: 'চলছে…',
    ex_again: 'আবার ছাড়ো',
    ex_chip: 'মসৃণ টেবিল · সময় {k} গুণ ধীর',
  },
  en: {
    title: 'Drawing water from a well: rope tension and acceleration',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn around',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Acceleration',
    u_N: 'N',
    u_n: 'N',
    u_kg: 'kg',
    u_v: 'm/s',
    u_a: 'ms<sup>−2</sup>',

    experiments: 'Choose what to do',
    chip_hold: 'Hold it',
    chip_pull: 'Pull hard',
    chip_ease: 'Ease off',
    chip_full: 'More water',
    res_a: 'a = {a}',

    act_hold: 'Hold it',
    act_pull: 'Pull',
    act_ease: 'Ease off',
    act_next_hold: 'Now hold it',
    act_next_pull: 'Now pull hard',
    act_next_ease: 'Now ease off',
    act_next_full: 'Pull more water',
    act_again: 'Again',
    act_home: 'Back to the start',
    act_example: 'Book example',

    name_T: 'rope’s pull',
    name_M: 'full bucket',
    less_T: 'Pull less',
    more_T: 'Pull more',
    less_M: 'Less water',
    more_M: 'More water',
    law_label: 'Newton’s second law for the bucket: T − Mg = Ma',

    out_run_still: '<b>The bucket stays still,</b> no acceleration',
    out_run_up: '<b>The bucket rises</b>',
    out_run_down: '<b>The bucket sinks</b>',
    out_top: '<b>The bucket came up</b> (a = {a} {u_a})',
    out_water: '<b>The bucket went down into the water</b> (a = {a} {u_a})',
    out_still: '<b>The bucket stayed where it was</b> (a = {a})',

    rule_start: '<b>One string carries one tension:</b> the rope pulls the man’s hands and the bucket with the same T.',
    rule_still: '<b>T = Mg: the resultant force is zero.</b> No acceleration, so a bucket held still stays still.',
    rule_one_rope:
      '<b>Tension always acts along the string, away from the body:</b> up on the bucket, towards the pulley on the hands. The pulley only turns it.',
    rule_down: '<b>Up is positive:</b> if T &lt; Mg, a is negative: the acceleration is downward. The book writes T − Mg = M(−a).',
    rule_mass: '<b>The same pull with more mass gives less acceleration:</b> the resultant (T − Mg) shrinks and is shared by more mass.',
    rule_law:
      '<b>Newton’s second law:</b> the sum of the forces on the left, mass × acceleration on the right: <span class="c-T">T</span> − <span class="c-W">Mg</span> = <span class="c-M">M</span><span class="c-a">a</span>. See the book’s pictures: Book example.',

    lbl_T: 'T = {v} {u_n}',
    lbl_W: 'Mg = {v} {u_n}',
    lbl_a: 'a = {v} {u_a}',
    sym_T: 'T',
    sym_W: 'Mg',
    sym_a: 'a',
    lbl_M: 'M = {m} kg',

    note_head: 'The well is shown cut in half.',
    note_body: 'Light rope, smooth pulley · time slowed {k} times',
    note_body_short: 'Time slowed {k} times',
    sign: '<b>↑</b> up is positive',
    note_scale: 'Force arrows are drawn to scale; the acceleration arrow has its own scale',
    speed: 'velocity <b>{v} m/s{dir}</b> · time {t} s',

    hint_wait: 'Watch what the bucket does.',
    hint_arrows: 'Press Pull to see its arrow in the picture.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_look: 'Look…',
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

    q_calc: 'The man pulls with {T} {u_N}; the bucket and water are {M} kg. What is the bucket’s acceleration? (g = {g}, up is positive)',
    why_calc: '<b>{a} {u_a}:</b> T − Mg = Ma, so a = ({T} − {W}) ÷ {M}. (Mg = {M} × {g} = {W} {u_N})',
    mis_nog: 'The bucket’s weight Mg pulls down: take it away.',
    mis_plus: 'Weight is down, the pull is up: opposite, not added.',
    mis_byW: 'Divide by the mass M, not by the weight Mg.',

    q_hold: 'The man holds the {M} kg bucket still in one place. What is the rope’s tension? (g = {g})',
    why_hold: '<b>{T} {u_N}:</b> still means a = {z}, so T − Mg = {z}, T = Mg = {M} × {g}.',
    mis_kg: 'kg is mass; force is in newtons: mass × g.',
    mis_zero: 'Without tension the bucket would fall.',
    mis_double: 'A pull equal to the weight is enough to hold it still.',

    q_ease: 'The bucket and water are {M} kg (weight {W} {u_N}); the man pulls {T} {u_N}. Which way is the bucket’s acceleration?',
    c_down: 'Downward (a negative)',
    c_up: 'Upward (a positive)',
    c_none: 'No acceleration, it stays still',
    c_up_slow: 'Up, but slowly',
    why_ease: '<b>Downward, a = {a} {u_a}:</b> T ({T}) &lt; Mg ({W}), so the resultant is down. T − Mg = M(−a).',
    mis_up: 'The pull is less than the weight: the resultant is down.',
    mis_none: 'To stay still the pull must equal the weight.',
    mis_up_slow: 'To rise, the pull must be more than the weight.',

    q_same: 'The rope pulls the man’s hands with {T} {u_N}. How hard does the rope pull the bucket up?',
    why_same: '<b>{T} {u_N}:</b> one string carries one tension. The pulley only turns it.',
    mis_weight: 'The rope does not pull with the bucket’s weight; it pulls with the man’s pull.',
    mis_net: 'That is the resultant (T − Mg), not the rope’s tension.',
    mis_half: 'The pulley does not share the pull: all of it reaches the bucket.',

    q_full:
      'Pulling with {T} {u_N}, the {M} kg bucket accelerates at {a} {u_a}. With {extra} kg more water and the same pull, what is the acceleration?',
    why_full: '<b>{a2} {u_a}:</b> now M = {M2} kg, Mg = {W} {u_N}; a = ({T} − {W}) ÷ {M2}. Before it was {a1}.',
    mis_same: 'More mass means more weight and a smaller resultant: a drops.',
    mis_ratio: 'Not only the mass you divide by: the weight Mg grew too.',
    mis_nog2: 'Take away the bucket’s weight Mg.',

    ex_title: 'Book example',
    ex_tab_single: 'Fig. {n}',
    ex_tab_two: 'Fig. {n}',
    ex_close: 'Close',
    ex_prev: 'Back',
    ex_next: 'Next step',
    ex_name_M: 'hanging mass',
    ex_name_m: 'body on the table',
    ex_less_M: 'Less hanging mass',
    ex_more_M: 'More hanging mass',
    ex_less_m: 'Lighter body',
    ex_more_m: 'Heavier body',
    ex_q_single:
      'The weight of one mass puts a force on another body: <b>M</b> hangs and pulls <b>m</b> on the table through a string over a pulley. What is the acceleration? (smooth table)',
    ex_q_two:
      'Two weights pull a body from both sides over pulleys: m<sub>2</sub> = {m2} kg on the left, m<sub>1</sub> = {m1} kg on the right. What is the acceleration?',
    ex_hint: 'Newton’s second law for each mass along each direction. Press Next step.',
    ex_s1: 'Body m, horizontal (right positive): the tension T is to the right, and so is the acceleration.',
    ex_s2: 'Vertically on m: the surface’s reaction N and mg add to zero, so no vertical acceleration.',
    ex_s3: 'Mass M (up positive): the same string, so the same T; its acceleration is down, so −a.',
    ex_s4: 'Putting the two together (the first one’s T in the second):',
    ex_s5: 'The string’s tension is less than the hanging weight {W} N.',
    ex_t1: 'Mass m<sub>1</sub> (goes up): T<sub>1</sub> up.',
    ex_t2: 'Body m (goes left): T<sub>2</sub> to the left, T<sub>1</sub> to the right.',
    ex_t3: 'Mass m<sub>2</sub> (goes down): T<sub>2</sub> up.',
    ex_t4: 'From the first and the third:',
    ex_t5: 'Together with the second. Without m, a cannot be found.',
    ex_run: 'Let go',
    ex_running: 'Running…',
    ex_again: 'Again',
    ex_chip: 'Smooth table · time slowed {k} times',
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
    const fill = (s) =>
      s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : typeof dict[k] === 'string' && !dict[k].includes('{') ? dict[k] : m));
    return fill(dict[key] ?? key);
  }
  t.num = num;
  t.lang = code;
  return t;
}
