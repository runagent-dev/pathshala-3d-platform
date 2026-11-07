// Every string the figure shows, in Bangla and English. The book's words on pages 279–281 (topic 10.4, বৈদ্যুতিক বল):
// "বিপরীত চার্জ একে অন্যকে আকর্ষণ করে কিন্তু এক ধরনের চার্জ একে অন্যকে বিকর্ষণ করে", কুলম্বের সূত্র, বিন্দু চার্জ,
// F = k q₁q₂/r², k = 9 × 10⁹ Nm²/C², কুলম্ব (C), "q₁ এবং q₂ দুটিই যদি পজিটিভ বা নেগেটিভ হয় তাহলে F এর মান হবে পজিটিভ
// এবং তখন একটি অন্যটিকে বিকর্ষণ করে ... F এর মান হবে নেগেটিভ ... আকর্ষণ করবে", the examples (চিত্র ১০.১০ a, b):
// +1 C and −1 C 10 cm দূরে, F = −9 × 10¹¹ N; +9C and +16C 1 m দূরে, "তৃতীয় একটি চার্জ +q ... যেন সেটি কোনো বল অনুভব না
// করে", 9(1 − x)² = 16x², 7x² + 18x − 9 = 0, x = 0.43. From 10.3: ধাতব গোলক, বিদ্যুৎ অপরিবাহী স্ট্যান্ড.
// Strings are written with the digits 0–9; t() turns every digit into the chosen digits (Bangla on a Bangla page).
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars} (formulas and symbols
// with digits are put together in app.js). intro / intro_short: the first screen's calm card; lead_*: the line before
// the action; out_*: the result; rule_*: the rule, the book's term in bold. Questions (q_*) are plain text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'কুলম্বের সূত্র: দুটি চার্জের মধ্যে বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage: 'টেবিলে মিটার স্কেলের পাশে বিদ্যুৎ অপরিবাহী স্ট্যান্ডে দুটি ধাতব গোলক; চার্জ দিলে গোলকের ওপর বলের তীর',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘোরাও',
    howto_front: 'শুরুর দৃশ্য',
    howto_two: 'টেনে গোলক সরাও',
    howto_third: 'টেনে +q সরাও',
    drag_two: 'টেনে সরাও',
    drag_third: 'টেনে সরাও',
    aria_two: 'ডানের গোলকটি সরাও (তীর-কী দিয়েও)',
    aria_third: 'মাঝের +q চার্জটি সরাও (তীর-কী দিয়েও)',

    // the steps
    ex_label: 'ধাপ',
    ex_attract: 'আকর্ষণ',
    ex_repel: 'বিকর্ষণ',
    ex_distance: 'দূরত্ব',
    ex_law: 'সূত্র',
    ex_balance: 'তিন চার্জ',

    // the action and the quiet buttons
    act_charge: 'চার্জ দাও',
    act_flip: 'ডানেরটিও পজিটিভ করো',
    act_far: 'দূরত্ব দ্বিগুণ করো',
    act_law: 'সূত্রে বল মাপো',
    act_third: 'তৃতীয় চার্জ আনো',
    act_find: 'বল শূন্য কোথায়?',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro: 'টেবিলে দুটি ধাতব গোলক, বিদ্যুৎ অপরিবাহী স্ট্যান্ডে বসানো। চার্জ দিলে এরা একে অন্যকে টানে বা ঠেলে। কিন্তু ঠিক কতখানি জোরে? চলো দেখি।',
    intro_short: 'দুটি ধাতব গোলকে চার্জ দিলে এরা টানে বা ঠেলে। কতখানি জোরে? চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_attract: 'এবার ডানের গোলকেও পজিটিভ চার্জ দিই।',
    lead_repel: 'দূরত্ব বাড়ালে বল কি বদলায়?',
    lead_distance: 'গোলকটি টেনেও দেখো। এবার সূত্রে মাপি।',
    lead_law: 'চার্জ বদলাও, গোলক টানো। তারপর তিনটি চার্জ।',
    lead_balance: '+q টেনে রাখো যেখানে সেটি কোনো বল অনুভব করে না।',
    lead_found: 'পেয়েছ! এবার নিজে যাচাই করো।',

    // the result line
    out_attract: '{q1} আর {q2}: <b>বিপরীত চার্জ</b>। গোলক দুটি একে অন্যকে কাছে টেনে আনতে চায়।',
    out_repel: 'দুটিই {q}: <b>এক ধরনের চার্জ</b>। এবার গোলক দুটি একে অন্যকে দূরে ঠেলে সরাতে চায়।',
    out_quarter: 'দূরত্ব {r0} → {r1}&nbsp;cm (দ্বিগুণ): বল <b>চার ভাগের এক ভাগ</b>।',
    out_live: 'r = {r}&nbsp;cm হলে বল <b>{F}</b>',
    out_zero: 'একটি গোলকে চার্জ নেই: বল <b>শূন্য</b>',
    out_far: '+q এখন {x}&nbsp;m-এ: <b>{side}</b>',
    out_side_r: '+9 C-এর ঠেলা বড়, লব্ধি বল ডানে',
    out_side_l: '+16 C-এর ঠেলা বড়, লব্ধি বল বামে',
    out_found: 'x = <b>{x}&nbsp;m</b>: দুই দিকের ঠেলা সমান, +q <b>কোনো বল অনুভব করে না</b>।',

    // the rule: the book's words, the book's term in bold
    rule_attract: 'বিপরীত চার্জ একে অন্যকে <b>আকর্ষণ</b> করে। দুটি তীর সমান, দিক উল্টো: দুটি গোলকের ওপর সমান বল।',
    rule_repel: 'এক ধরনের চার্জ একে অন্যকে <b>বিকর্ষণ</b> করে। তীরের দিক উল্টে গেছে, দৈর্ঘ্য একই আছে।',
    rule_distance: 'r দ্বিগুণ হলে r² হয় চার গুণ, তাই বল হয় চার ভাগের এক ভাগ। বল দূরত্বের <b>বর্গের ব্যস্তানুপাতিক</b>।',
    rule_law: '<b>কুলম্বের সূত্র</b>: F = k{q1q2}/r², k = {k}। F নেগেটিভ মানে আকর্ষণ।',
    rule_balance: '+9 C ডানে ঠেলে, +16 C বামে। যেখানে দুটি ঠেলা সমান, সেখানে +q <b>কোনো বল অনুভব করবে না</b>।',
    rule_found: 'বইয়ে: 9(1 − x)² = 16x², 7x² + 18x − 9 = 0, তাই <b>x = 0.43 m</b>। q যত বড়ই হোক, জায়গা একই।',

    // the graph and the values over it
    g_F: 'বল F',
    g_net: 'লব্ধি বল',
    g_r: 'দূরত্ব r (cm)',
    g_x: 'x (m)',
    g_right: 'ডানে ঠেলা',
    g_left: 'বামে ঠেলা',
    g_qone: '+q = +1 C ধরে',
    t_head: 'চার্জের চিহ্ন',
    t_F: 'F-এর মান',
    t_force: 'বল',
    t_pos: 'পজিটিভ',
    t_neg: 'নেগেটিভ',
    t_repel: 'বিকর্ষণ',
    t_attract: 'আকর্ষণ',
    t_aria: 'চার্জের চিহ্ন ও বল: দুটিই পজিটিভ বা দুটিই নেগেটিভ হলে F পজিটিভ, বিকর্ষণ; একটি পজিটিভ আর অন্যটি নেগেটিভ হলে F নেগেটিভ, আকর্ষণ',
    g_quarter: '1/4 গুণ',
    g_aria_r: 'বল–দূরত্ব গ্রাফ: r = {r} cm-এ বল {F}',
    g_aria_x: 'লব্ধি বল–x গ্রাফ: x = {x} m',
    g_aria_empty: 'বল–দূরত্ব গ্রাফ, এখনো ফাঁকা',
    vals_q: 'চার্জ বদলাও',
    q_minus: '{q} কমাও',
    q_plus: '{q} বাড়াও',

    // labels on the picture (short)
    lbl_r: 'r = {r} cm',
    lbl_x: 'x = {x} m',
    lbl_rest: '1 − x = {v} m',
    lbl_d: '{d} m',
    lbl_F: 'F',
    lbl_before: '10 cm-এ ছিল',
    lbl_q3: '+q',
    note_scale: 'তীর: 1 cm = {v} N',
    note_cut: 'বেশি লম্বা হলে ছোট করে আঁকা',

    note_book: 'চার্জ বইয়ের হিসাবের, বাস্তবে অনেক কম',
    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',
    hint_drag: 'ডানের গোলকটি টেনে সরাও',

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

    q_dir: 'ছবির দুটি গোলকের চার্জ দেখো। গোলক দুটির ওপর বল কোন দিকে?',
    c_dir_right: 'দুটিই দূরে সরতে চায়',
    c_dir_attract: 'দুটিই কাছে আসতে চায়',
    c_dir_none: 'কোনো বল নেই',
    c_dir_one: 'শুধু একটির ওপর বল',
    why_dir: '<b>দুটিই দূরে সরতে চায়</b>: এক ধরনের চার্জ একে অন্যকে বিকর্ষণ করে, দুটির ওপর সমান বল, দিক উল্টো।',
    why_dir_unlike: '<b>দুটিই কাছে আসতে চায়</b>: বিপরীত চার্জ একে অন্যকে আকর্ষণ করে, দুটির ওপর সমান বল, দিক উল্টো।',
    mis_dir_attract: 'আকর্ষণ হয় বিপরীত চার্জে; এখানে দুটির চিহ্ন একই।',
    mis_dir_apart: 'দূরে ঠেলে এক ধরনের চার্জ; এখানে চিহ্ন দুটি উল্টো।',
    mis_dir_none: 'দুটিতেই চার্জ আছে, তাই বল আছে: q₁q₂ শূন্য নয়।',
    mis_dir_one: 'বল সবসময় জোড়ায়: দুটি গোলকের ওপর সমান বল।',

    q_far: 'ছবিতে দূরত্ব আর বল দেখো। ডানের গোলকটি সরিয়ে দূরত্ব দ্বিগুণ করলে বল কত হবে?',
    why_far: '<b>{v}</b>: দূরত্ব দ্বিগুণ হলে r² চার গুণ, তাই বল চার ভাগের এক ভাগ।',
    mis_far_half: 'বল দূরত্বের বর্গের সাথে কমে, শুধু দূরত্বের সাথে নয়।',
    mis_far_same: 'দূরত্ব বাড়লে বল কমে।',
    mis_far_double: 'দূরত্ব বাড়লে বল বাড়ে না, কমে।',

    q_charge: 'ছবিতে বল দেখো। বাম গোলকের চার্জ তিন গুণ করলে (দূরত্ব একই) বল কত হবে?',
    why_charge: '<b>{v}</b>: F = kq₁q₂/r², তাই q₁ তিন গুণ হলে বলও তিন গুণ।',
    mis_charge_nine: 'বর্গ হয় দূরত্বের, চার্জের নয়।',
    mis_charge_third: 'চার্জ বাড়লে বল বাড়ে, কমে না।',
    mis_charge_same: 'চার্জ বাড়লে বল বাড়ে: F-এ q₁ গুণ হয়ে আছে।',

    q_sign: 'ছবির দুটি গোলকের চার্জের চিহ্ন জানা নেই। সূত্রে F-এর মান এল {F}। এই নেগেটিভ মানের মানে কী?',
    c_sign_right: 'গোলক দুটি একে অন্যকে আকর্ষণ করে',
    c_sign_repel: 'গোলক দুটি একে অন্যকে বিকর্ষণ করে',
    c_sign_weak: 'বলটি শূন্যের চেয়েও দুর্বল',
    c_sign_one: 'বল শুধু নেগেটিভ গোলকের ওপর',
    why_sign: '<b>আকর্ষণ</b>: একটি পজিটিভ আর অন্যটি নেগেটিভ হলে F নেগেটিভ, মানে বলের দিক উল্টো: চার্জ দুটি একে অন্যকে আকর্ষণ করে।',
    mis_sign_repel: 'বিকর্ষণে F পজিটিভ হয়: দুটিই পজিটিভ বা দুটিই নেগেটিভ হলে।',
    mis_sign_weak: 'চিহ্ন বলের দিক বলে; বলের মান {m}।',
    mis_sign_one: 'দুটি গোলকের ওপরই সমান বল।',

    q_point: 'ছবির চার্জ দুটি আর তাদের দূরত্ব দেখো। মাঝের কোথায় একটি +q চার্জ কোনো বল অনুভব করবে না? (বাম চার্জ থেকে)',
    why_point: '<b>+4 C থেকে {v}</b>: 4/x² = 1/(0.9 − x)², তাই x = 2(0.9 − x), x = 0.6 m। জায়গাটি ছোট চার্জের কাছে।',
    mis_point_middle: 'মাঝখানে বড় চার্জের ঠেলা বেশি।',
    mis_point_near: 'বড় চার্জের কাছে তার ঠেলা আরও বেশি।',
    mis_point_ratio: 'দূরত্বের অনুপাত √4 : √1 = 2 : 1, 4 : 1 নয়।',
    u_m: 'm',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: "Coulomb's law: the force between two charges",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage: 'Two metal spheres on insulating stands beside a metre rule on a bench; when charged, force arrows on the spheres',

    howto_label: 'How to move it',
    howto_orbit: 'Turn',
    howto_front: 'Start view',
    howto_two: 'Drag the sphere',
    howto_third: 'Drag +q',
    drag_two: 'Drag',
    drag_third: 'Drag',
    aria_two: 'Move the right sphere (arrow keys too)',
    aria_third: 'Move the middle charge +q (arrow keys too)',

    ex_label: 'Steps',
    ex_attract: 'Attract',
    ex_repel: 'Repel',
    ex_distance: 'Distance',
    ex_law: 'The law',
    ex_balance: 'Three charges',

    act_charge: 'Charge them',
    act_flip: 'Make the right one positive',
    act_far: 'Double the distance',
    act_law: 'Work out the force',
    act_third: 'Bring a third charge',
    act_find: 'Where is the force zero?',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro: 'Two metal spheres on insulating stands on a bench. Charged, they pull or push each other. But how hard, exactly? Let us find out.',
    intro_short: 'Charged metal spheres pull or push each other. How hard? Let us find out.',

    lead_attract: 'Now the right sphere gets a positive charge too.',
    lead_repel: 'Does the force change with distance?',
    lead_distance: 'Drag the sphere too. Next, the law.',
    lead_law: 'Change the charges, drag the sphere. Then three charges.',
    lead_balance: 'Drag +q to where it feels no force.',
    lead_found: 'Found it! Now test yourself.',

    out_attract: '{q1} and {q2}: <b>unlike charges</b>. The spheres try to pull each other in.',
    out_repel: 'Both {q}: <b>like charges</b>. Now the spheres try to push each other away.',
    out_quarter: 'Distance {r0} → {r1}&nbsp;cm (doubled): the force is <b>a quarter</b>.',
    out_live: 'At r = {r}&nbsp;cm the force is <b>{F}</b>',
    out_zero: 'One sphere has no charge: the force is <b>zero</b>',
    out_far: '+q at {x}&nbsp;m: <b>{side}</b>',
    out_side_r: '+9 C pushes harder, the net force is to the right',
    out_side_l: '+16 C pushes harder, the net force is to the left',
    out_found: 'x = <b>{x}&nbsp;m</b>: the two pushes are equal, +q <b>feels no force</b>.',

    rule_attract: 'Unlike charges <b>attract</b> each other. Two equal arrows, opposite: the same force on both spheres.',
    rule_repel: 'Like charges <b>repel</b> each other. The arrows turned round; their length stayed the same.',
    rule_distance: 'Twice r makes r² four times as big, so the force is a quarter. The force goes as <b>one over the distance squared</b>.',
    rule_law: "<b>Coulomb's law</b>: F = k{q1q2}/r², k = {k}. A negative F means attraction.",
    rule_balance: '+9 C pushes right, +16 C pushes left. Where the two pushes are equal, +q <b>feels no force</b>.',
    rule_found: 'The book: 9(1 − x)² = 16x², 7x² + 18x − 9 = 0, so <b>x = 0.43 m</b>. Whatever q is, the place is the same.',

    g_F: 'Force F',
    g_net: 'Net force',
    g_r: 'distance r (cm)',
    g_x: 'x (m)',
    g_right: 'pushed right',
    g_left: 'pushed left',
    g_qone: 'taking +q = +1 C',
    t_head: 'Signs',
    t_F: 'F is',
    t_force: 'Force',
    t_pos: 'positive',
    t_neg: 'negative',
    t_repel: 'repel',
    t_attract: 'attract',
    t_aria: 'Signs and force: both positive or both negative gives a positive F, repulsion; one of each gives a negative F, attraction',
    g_quarter: '1/4 as much',
    g_aria_r: 'Force–distance graph: at r = {r} cm the force is {F}',
    g_aria_x: 'Net force–x graph: x = {x} m',
    g_aria_empty: 'Force–distance graph, empty so far',
    vals_q: 'Change the charges',
    q_minus: 'Less {q}',
    q_plus: 'More {q}',

    lbl_r: 'r = {r} cm',
    lbl_x: 'x = {x} m',
    lbl_rest: '1 − x = {v} m',
    lbl_d: '{d} m',
    lbl_F: 'F',
    lbl_before: 'at 10 cm',
    lbl_q3: '+q',
    note_scale: 'Arrows: 1 cm = {v} N',
    note_cut: 'very long ones drawn shorter',

    note_book: 'the book’s charges; real ones are far smaller',
    hint_wait: 'Wait a moment and watch.',
    hint_drag: 'Drag the right sphere',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'During the test the scene is fixed. Answer from the picture.',

    q_dir: 'Look at the charges of the two spheres. Which way are the forces on them?',
    c_dir_right: 'Both want to move apart',
    c_dir_attract: 'Both want to come closer',
    c_dir_none: 'No force',
    c_dir_one: 'Only one feels a force',
    why_dir: '<b>Both want to move apart</b>: like charges repel; equal forces on both, opposite in direction.',
    why_dir_unlike: '<b>Both want to come closer</b>: unlike charges attract; equal forces on both, opposite in direction.',
    mis_dir_attract: 'Unlike charges attract; here both have the same sign.',
    mis_dir_apart: 'Like charges push apart; here the signs are opposite.',
    mis_dir_none: 'Both are charged, so there is a force: q₁q₂ is not zero.',
    mis_dir_one: 'Forces come in pairs: equal forces on both spheres.',

    q_far: 'Read the distance and the force in the picture. If the right sphere is moved to twice the distance, what is the force?',
    why_far: '<b>{v}</b>: twice the distance makes r² four times as big, so the force is a quarter.',
    mis_far_half: 'The force falls with the square of the distance, not the distance.',
    mis_far_same: 'A bigger distance makes the force smaller.',
    mis_far_double: 'A bigger distance does not make the force bigger.',

    q_charge: 'Read the force in the picture. If the left sphere’s charge is tripled (same distance), what is the force?',
    why_charge: '<b>{v}</b>: F = kq₁q₂/r², so three times q₁ gives three times the force.',
    mis_charge_nine: 'The distance is squared, not the charge.',
    mis_charge_third: 'More charge gives more force, not less.',
    mis_charge_same: 'More charge gives more force: q₁ multiplies in F.',

    q_sign: 'The signs of these two charges are not known. The law gives F = {F}. What does the negative value mean?',
    c_sign_right: 'The spheres attract each other',
    c_sign_repel: 'The spheres repel each other',
    c_sign_weak: 'The force is weaker than zero',
    c_sign_one: 'Only the negative sphere feels it',
    why_sign: '<b>Attraction</b>: one positive and one negative gives a negative F, the force turned round: the charges attract.',
    mis_sign_repel: 'Repulsion gives a positive F: both positive or both negative.',
    mis_sign_weak: 'The sign gives the direction; the size is {m}.',
    mis_sign_one: 'Both spheres feel the same force.',

    q_point: 'Look at the two charges and their distance. Where between them does a charge +q feel no force? (from the left one)',
    why_point: '<b>{v} from +4 C</b>: 4/x² = 1/(0.9 − x)², so x = 2(0.9 − x), x = 0.6 m. The place is nearer the small charge.',
    mis_point_middle: 'In the middle the big charge pushes harder.',
    mis_point_near: 'Near the big charge its push is even bigger.',
    mis_point_ratio: 'The distances are in the ratio √4 : √1 = 2 : 1, not 4 : 1.',
    u_m: 'm',
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
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : k in dict ? dict[k] : m));
    // every digit in the figure's words follows the digits chosen (strings are written with 0–9)
    return num(s);
  }
  t.num = num;
  t.lang = code;
  return t;
}
