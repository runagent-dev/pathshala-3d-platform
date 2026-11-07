// Every string the figure shows, in Bangla and English. The book's words on page 137 (topic 5.3.1, আর্কিমিডিসের নীতি
// এবং প্লবতা): "কোনো বস্তু তরলে নিমজ্জিত করলে সেটি যে পরিমাণ তরল অপসারণ করে সেইটুকু তরলের সমান ওজন বস্তুটির ওজন থেকে
// কমে যায়।", চিত্র ৫.০৪ "একটি বস্তু যতটুকু তরল অপসারিত করে তার সমপরিমাণ ওজন হারায়।", and on page 138: F = Ahρg, "Ah
// হচ্ছে সিলিন্ডারের আয়তন, ρ তরলের ঘনত্ব এবং g মাধ্যাকর্ষণজনিত ত্বরণ", "ঊর্ধ্বমুখী এই বলটিকে প্লবতা (Buoyancy) বলে।";
// 5.3.2: "ঠিক যে পরিমাণ ডুবে থাকলে বস্তুর সমান ওজনের পানি অপসারণ করবে, ততটুকুই ডুববে". The pages write উপর.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not a
// var is another string of the same language (the units). intro / intro_short are the first screen's calm card; lead_*
// the line before the action; out_* the result; rule_* the rule, the book's words in bold. The questions (q_*) are plain
// text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'অপসারিত পানি: খেলনা জাহাজ যতটা পানি সরায়, তার ওজন জাহাজের ওজনের সমান',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage:
      'টেবিলে কানায় কানায় পানি-ভরা একটি কাচের পাত্র, তার নলের নিচে একটি নিক্তির উপর বিকার; একটি স্ট্যান্ডের হাতলে ঝোলানো ডিজিটাল নিক্তি থেকে সুতায় ঝুলছে একটি খেলনা মালবাহী জাহাজ; সামনে ছয়টি খেলনা কন্টেইনার',
    u_g: 'g',
    u_cm: 'cm',
    u_cm2: 'cm<sup>2</sup>',
    u_cm3: 'cm<sup>3</sup>',
    u_m3: 'm<sup>3</sup>',
    u_kg: 'kg',
    u_N: 'N',
    u_gacc: 'm/s<sup>2</sup>',

    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_lower: 'টেনে জাহাজ ওঠাও-নামাও',
    howto_box: 'যেকোনো কন্টেইনারে টোকা দাও',
    drag_me: 'টেনে জাহাজ ওঠাও-নামাও',
    aria_drag_arm: 'জাহাজ নামাও বা তোলো: উপর বা নিচের তীর চাপো',

    // the steps
    ex_label: 'ধাপ',
    ex_weigh: 'ওজন',
    ex_lower: 'নামাও',
    ex_buoy: 'প্লবতা',
    ex_load: 'বোঝাই',

    // the action and the quiet buttons
    act_weigh: 'নিক্তি চালু করো',
    act_lower: 'জাহাজ নামাও',
    act_buoy: 'সুতা খোলো',
    act_load: 'কন্টেইনার তোলো',
    act_more: 'আরও একটি তোলো ({n}/{max})',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',
    cap_any: 'যেকোনো কন্টেইনারে টোকা দাও',

    // the first screen: a few calm words
    intro:
      'টেবিলে কানায় কানায় পানি-ভরা একটি কাচের পাত্র। একটি খেলনা জাহাজ ঝুলছে ডিজিটাল নিক্তিতে। পাত্রের নল দিয়ে উপচে পড়া পানি যাবে পাশের বিকারে। চলো মেপে দেখি, জাহাজটি কতটা পানি সরায়।',
    intro_short: 'খেলনা জাহাজটি পানিতে নামালে কতটা পানি উপচে পড়বে? চলো মেপে দেখি।',

    // the line before the action: what the next tap will show
    lead_weigh: 'এবার জাহাজটি পানিতে নামাই। দুটি নিক্তিই দেখো।',
    lead_lower: 'নিক্তি এখন {r}&nbsp;g। এবার সুতা খুলে দেখি।',
    lead_lower_up: 'নিক্তি এখন {r}&nbsp;g। হাতল টেনে জাহাজটি আবার ভাসাও।',
    lead_buoy: 'এবার কন্টেইনার তোলো: {n} / {max} (প্রতিটি {box}&nbsp;g)',
    lead_load: 'কন্টেইনার তোলো: <b>{n} / {max}</b>',

    // the result line
    out_weigh: 'জাহাজের ভর <b class="dw-m">{m}&nbsp;{u_g}</b>; খালি বিকারে <b class="dw-w">{w}&nbsp;{u_g}</b>',
    out_air: 'জাহাজ এখনো পানির উপরে: নিক্তি <b class="dw-m">{m}&nbsp;{u_g}</b>',
    out_part: 'নিক্তির পাঠ কমেছে <b class="dw-m">{x}&nbsp;{u_g}</b>; বিকারে পড়েছে ঠিক <b class="dw-w">{x}&nbsp;{u_g}</b> পানি',
    out_float: 'নিক্তি <b class="dw-m">{zero}&nbsp;{u_g}</b>: জাহাজ ভাসছে। বিকারে <b class="dw-w">{x}&nbsp;{u_g}</b> পানি, জাহাজের ভরের সমান',
    out_lifted: 'জাহাজ তোলায় পাত্রের পানি নেমে গেছে; বিকারের <b class="dw-w">{x}&nbsp;{u_g}</b> পানি আর ফেরে না',
    out_buoy_v: 'অপসারিত পানি <i>V</i> = <b class="dw-w">{v}&nbsp;{u_cm3}</b> = {m3}&nbsp;{u_m3}',
    out_buoy_f: '<i>F</i> = <i>V</i>ρ<i>g</i> = {m3} × {rho} × {g} = <b class="dw-f">{F}&nbsp;{u_N}</b>',
    bar_ship: 'জাহাজ + মাল',
    bar_water: 'অপসারিত পানি',
    bar_aria: 'দুটি দণ্ড: জাহাজ ও মালের ভর {m} g, অপসারিত পানির ভর {w} g',

    // the rule: the book's words, the book's term in bold
    rule_weigh:
      'জাহাজের <b>ওজন</b> <i>W</i> = <i>mg</i> = {kg}&nbsp;{u_kg} × {g}&nbsp;{u_gacc} = {W}&nbsp;{u_N}। পানির ঘনত্ব ρ = {one}&nbsp;g/cm<sup>3</sup> = {rho}&nbsp;kg/m<sup>3</sup>।',
    rule_lower: 'কোনো বস্তু তরলে নিমজ্জিত করলে সেটি যে পরিমাণ তরল অপসারণ করে সেইটুকু তরলের সমান <b>ওজন বস্তুটির ওজন থেকে কমে যায়</b>।',
    rule_buoy: 'পানি জাহাজকে উপরে ঠেলে। ঊর্ধ্বমুখী এই বলটিকে <b>প্লবতা</b> বলে। প্লবতা = অপসারিত পানির ওজন = জাহাজের ওজন।',
    rule_load: 'ঠিক যে পরিমাণ ডুবে থাকলে বস্তুর সমান ওজনের পানি অপসারণ করবে, <b>ততটুকুই ডুববে</b>।',
    rule_load_v: '<i>V</i> = <i>Ah</i> = {A}&nbsp;{u_cm2} × {h}&nbsp;{u_cm} = {v}&nbsp;{u_cm3}',

    // labels on the picture (short)
    lbl_reading: '{x}&nbsp;{u_g}',
    lbl_hidden: '?&nbsp;{u_g}',
    lbl_spill: 'উপচে পড়া পানি',
    lbl_V: '<i>V</i> = {v}&nbsp;{u_cm3}',
    lbl_W: 'ওজন <i>W</i> = {v}&nbsp;{u_N}',
    lbl_F: 'প্লবতা <i>F</i> = {v}&nbsp;{u_N}',
    lbl_h: '<i>h</i> = {v}&nbsp;{u_cm}',
    lbl_A: '<i>A</i> = {v}&nbsp;{u_cm2}',
    lbl_loadline: 'বোঝাই রেখা',
    box_label: '{m} g',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    qh_reading: 'চিহ্ন দেওয়া বিকারের নিক্তির পাঠ দেখো।',
    qh_carry: 'চিহ্ন দেওয়া ঝুলন্ত নিক্তি আর জাহাজের তলা দেখো।',
    qh_more: 'চিহ্ন দেওয়া বিকারের নিক্তি দেখো: এখন কত g পানি?',
    qh_force: 'বিকারের নিক্তিতে দেখো কত cm<sup>3</sup> পানি; m<sup>3</sup> করে হিসাব করো।',
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

    q_reading: 'জাহাজটি খানিক নামানো। বিকারের নিক্তি দেখো: ঝুলন্ত নিক্তি কত দেখাবে?',
    why_reading: '<b>{r}&nbsp;g</b>: জাহাজের ভর {ship}&nbsp;g থেকে অপসারিত পানির {w}&nbsp;g কমে যায়।',
    mis_rd_same: 'এটি বিকারের পানির ভর; নিক্তি দেখায় জাহাজের যতটা বাকি থাকে।',
    mis_rd_whole: 'পানিতে নামালে নিক্তির পাঠ কমে, একই থাকে না।',
    mis_rd_added: 'পানি জাহাজের ওজন বাড়ায় না, কমায়।',

    q_carry: 'ঝুলন্ত নিক্তির পাঠ দেখো। জাহাজটি ভেসে আছে; তার ওজন বইছে কে?',
    c_ca_right: 'পানি নিচ থেকে ঠেলে: প্লবতা',
    c_ca_cord: 'সুতা এখনো টানছে',
    c_ca_floor: 'তলা পাত্রের তলায় ঠেকেছে',
    c_ca_mass: 'প্লবতায় জাহাজের ভর কমে গেছে',
    why_carry: '<b>প্লবতা</b>: অপসারিত পানির ওজন জাহাজের ওজনের সমান।',
    mis_ca_cord: 'সুতায় টান নেই: নিক্তি {zero}&nbsp;g।',
    mis_ca_floor: 'ছবিতে দেখো: জাহাজের তলা পাত্রের তলা ছোঁয়নি।',
    mis_ca_mass: 'ভর একই আছে; প্লবতা ওজনের সমান বলে উপরে ঠেলে।',

    q_more: 'বিকারের পানি দেখো। আরও একটি কন্টেইনার ({box} g) তুললে বিকারে মোট কত হবে?',
    why_more: '<b>{r}&nbsp;g</b>: জাহাজ আরও ডোবে আর ঠিক {box}&nbsp;g পানি বেশি সরায়।',
    mis_mo_none: 'ভেসে থাকলেও ভার বাড়লে আরও পানি সরাতে হয়।',
    mis_mo_double: 'কন্টেইনার {box}&nbsp;g; পানিও উপচে পড়ে ঠিক {box}&nbsp;g।',
    mis_mo_only: 'আগের পানি বিকারেই থাকে; নতুন {box}&nbsp;g তার সাথে যোগ হয়।',

    q_force: 'বিকারের পানি দেখো। সেই পানির ওজন, অর্থাৎ প্লবতা, কত?',
    why_force: '<b>{r}&nbsp;N</b>: <i>F</i> = <i>V</i>ρ<i>g</i> = {m3}&nbsp;m<sup>3</sup> × {rho}&nbsp;kg/m<sup>3</sup> × {gv}&nbsp;m/s<sup>2</sup>।',
    mis_fo_mass: 'এটি ভর (kg); ওজন পেতে g দিয়ে গুণ করো।',
    mis_fo_grams: 'ভর গ্রামে রেখেই গুণ হয়েছে; আগে kg করো।',
    mis_fo_divided: 'g দিয়ে ভাগ নয়, গুণ।',
  },
  en: {
    panel_hide: 'Hide text',
    panel_show: 'Show text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Displaced water: the water a toy ship pushes aside weighs as much as the ship',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn the view',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage:
      'On a table, a glass tank filled to the brim; under its spout a beaker on a scale; a toy cargo ship hangs on cords from a digital hanging scale on a lab stand; six toy containers in front',
    u_g: 'g',
    u_cm: 'cm',
    u_cm2: 'cm<sup>2</sup>',
    u_cm3: 'cm<sup>3</sup>',
    u_m3: 'm<sup>3</sup>',
    u_kg: 'kg',
    u_N: 'N',
    u_gacc: 'm/s<sup>2</sup>',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_lower: 'Drag the ship up or down',
    howto_box: 'Tap any container',
    drag_me: 'Drag the ship up or down',
    aria_drag_arm: 'Lower or lift the ship: press the up or down arrow',

    ex_label: 'Steps',
    ex_weigh: 'Weigh',
    ex_lower: 'Lower',
    ex_buoy: 'Buoyancy',
    ex_load: 'Load',

    act_weigh: 'Turn the scales on',
    act_lower: 'Lower',
    act_buoy: 'Unhook',
    act_load: 'Load',
    act_more: 'Load one more ({n}/{max})',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Show again',
    cap_any: 'Tap any container',

    intro:
      'A glass tank full to the brim stands on the table. A toy ship hangs from a digital scale. Water that overflows will run through the spout into the beaker beside it. Let us measure how much water the ship pushes aside.',
    intro_short: 'Lower the toy ship into the water: how much will overflow? Let us measure it.',

    lead_weigh: 'Now we lower the ship. Watch both scales.',
    lead_lower: 'The scale reads {r}&nbsp;g. Now unhook the cords.',
    lead_lower_up: 'Scale: {r}&nbsp;g. Drag down to float it again.',
    lead_buoy: 'Now load containers: {n} / {max} ({box}&nbsp;g each)',
    lead_load: 'Load containers: <b>{n} / {max}</b>',

    out_weigh: 'The ship’s mass <b class="dw-m">{m}&nbsp;{u_g}</b>; the empty beaker <b class="dw-w">{w}&nbsp;{u_g}</b>',
    out_air: 'The ship is still above the water: the scale reads <b class="dw-m">{m}&nbsp;{u_g}</b>',
    out_part: 'The scale lost <b class="dw-m">{x}&nbsp;{u_g}</b>; exactly <b class="dw-w">{x}&nbsp;{u_g}</b> of water ran into the beaker',
    out_float: 'Scale <b class="dw-m">{zero}&nbsp;{u_g}</b>: the ship floats. The beaker holds <b class="dw-w">{x}&nbsp;{u_g}</b>, the ship’s mass',
    out_lifted: 'Lifted, the tank’s water fell; the <b class="dw-w">{x}&nbsp;{u_g}</b> in the beaker stays there',
    out_buoy_v: 'Water pushed aside <i>V</i> = <b class="dw-w">{v}&nbsp;{u_cm3}</b> = {m3}&nbsp;{u_m3}',
    out_buoy_f: '<i>F</i> = <i>V</i>ρ<i>g</i> = {m3} × {rho} × {g} = <b class="dw-f">{F}&nbsp;{u_N}</b>',
    bar_ship: 'Ship + cargo',
    bar_water: 'Water pushed aside',
    bar_aria: 'Two bars: the ship and cargo {m} g, the water pushed aside {w} g',

    rule_weigh:
      'The ship’s <b>weight</b> <i>W</i> = <i>mg</i> = {kg}&nbsp;{u_kg} × {g}&nbsp;{u_gacc} = {W}&nbsp;{u_N}. Water’s density ρ = {one}&nbsp;g/cm<sup>3</sup> = {rho}&nbsp;kg/m<sup>3</sup>.',
    rule_lower: 'A body put into a liquid <b>loses as much weight as the weight of the liquid it pushes aside</b>.',
    rule_buoy:
      'The water pushes the ship up. This upward force is called <b>buoyancy</b>. Buoyancy = the weight of the water pushed aside = the ship’s weight.',
    rule_load: 'A body sinks <b>just as far as it must</b> to push aside its own weight of water.',
    rule_load_v: '<i>V</i> = <i>Ah</i> = {A}&nbsp;{u_cm2} × {h}&nbsp;{u_cm} = {v}&nbsp;{u_cm3}',

    lbl_reading: '{x}&nbsp;{u_g}',
    lbl_hidden: '?&nbsp;{u_g}',
    lbl_spill: 'Overflowing water',
    lbl_V: '<i>V</i> = {v}&nbsp;{u_cm3}',
    lbl_W: 'Weight <i>W</i> = {v}&nbsp;{u_N}',
    lbl_F: 'Buoyancy <i>F</i> = {v}&nbsp;{u_N}',
    lbl_h: '<i>h</i> = {v}&nbsp;{u_cm}',
    lbl_A: '<i>A</i> = {v}&nbsp;{u_cm2}',
    lbl_loadline: 'Load line',
    box_label: '{m} g',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, then pick the right answer.',
    qh_reading: 'Read the beaker’s scale (marked).',
    qh_carry: 'Read the hanging scale (marked) and look at the hull’s bottom.',
    qh_more: 'Read the beaker’s scale (marked): how many g of water now?',
    qh_force: 'Read V in cm<sup>3</sup> on the beaker’s scale; turn it into m<sup>3</sup>.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Answer from what you see.',

    q_reading: 'The ship is part-way down. Read the beaker’s scale: what does the hanging scale show?',
    why_reading: '<b>{r}&nbsp;g</b>: the ship’s {ship}&nbsp;g loses the {w}&nbsp;g of water it pushes aside.',
    mis_rd_same: 'That is the water in the beaker; the scale shows what is left of the ship.',
    mis_rd_whole: 'In the water the reading drops; it does not stay the same.',
    mis_rd_added: 'The water does not add to the ship’s weight; it takes some away.',

    q_carry: 'Read the hanging scale. The ship floats: what carries its weight?',
    c_ca_right: 'The water pushes up: buoyancy',
    c_ca_cord: 'The cords still pull',
    c_ca_floor: 'It rests on the tank’s floor',
    c_ca_mass: 'Buoyancy took away its mass',
    why_carry: '<b>Buoyancy</b>: the water pushed aside weighs as much as the ship.',
    mis_ca_cord: 'The cords carry nothing: the scale reads {zero}&nbsp;g.',
    mis_ca_floor: 'Look: the hull does not touch the tank’s bottom.',
    mis_ca_mass: 'Its mass is the same; buoyancy pushes up as hard as it weighs.',

    q_more: 'Read the beaker. With one more container ({box} g), how much water will it hold in all?',
    why_more: '<b>{r}&nbsp;g</b>: it sinks deeper and {box}&nbsp;g more runs out.',
    mis_mo_none: 'Even afloat, more load means more water pushed aside.',
    mis_mo_double: 'One container, {box}&nbsp;g: exactly {box}&nbsp;g overflows.',
    mis_mo_only: 'The water already there stays; {box}&nbsp;g is added.',

    q_force: 'Read the beaker. What does that water weigh, that is, the buoyancy?',
    why_force: '<b>{r}&nbsp;N</b>: <i>F</i> = <i>V</i>ρ<i>g</i> = {m3}&nbsp;m<sup>3</sup> × {rho}&nbsp;kg/m<sup>3</sup> × {gv}&nbsp;m/s<sup>2</sup>.',
    mis_fo_mass: 'That is the mass in kg; × g gives the weight.',
    mis_fo_grams: 'Grams were used; turn them into kg first.',
    mis_fo_divided: 'Multiply by g, don’t divide.',
  },
};

/** Numbers the strings name without a variable of their own (the ship's mass, a container's, g). */
const BASE = { zero: 0, one: 1, box: 50, ship: 200, gv: 9.8 };

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
  function t(key, given) {
    const vars = { ...BASE, ...given };
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
