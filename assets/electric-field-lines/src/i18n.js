// Every string the figure shows, in Bangla and English. The book's words on pages 283–286 (topic 10.5, তড়িৎ ক্ষেত্র):
// তড়িৎ ক্ষেত্র, ক্ষেত্র প্রাবল্য, "E = kq/r²", "F = Eq", "তার একক হচ্ছে N/C", তড়িৎ বলরেখা, "পুরোপুরি কাল্পনিক এক ধরনের
// রেখা", মাইকেল ফ্যারাডে, "আমাদের পরিচিত জগৎ ত্রিমাত্রিক কাজেই বলরেখাগুলো চারদিকেই ছড়িয়ে পড়বে। তোমাদের দেখানোর জন্য
// সেগুলো একটা সমতলে এঁকে দেখানো হয়েছে", the four rules (a)–(d): "পজিটিভ চার্জের বেলায় বলরেখা পজিটিভ চার্জ থেকে বের হবে
// এবং নেগেটিভ চার্জের বেলায় বলরেখা নেগেটিভ চার্জে এসে কেন্দ্রীভূত হবে। একটা নির্দিষ্ট বিন্দুতে বলরেখার স্পর্শকের দিক
// হচ্ছে তড়িৎ ক্ষেত্রের দিক", "চার্জের পরিমাণ যত বেশি হবে প্রতি একক আয়তন বা ক্ষেত্রফলে বলরেখার সংখ্যা তত বেশি হবে",
// "বলরেখাগুলো যত কাছাকাছি থাকবে তড়িৎ ক্ষেত্রের মান তত বেশি হবে", "একটি চার্জের বলরেখা কখনো অন্য চার্জের বলরেখার ওপর দিয়ে
// যাবে না"; চিত্র ১০.১২: বিপরীত / সমচার্জ, "এক চার্জের বলরেখা অন্য চার্জে গিয়ে সমাপ্ত হয়েছে", "দুটো চার্জ একটা আরেকটাকে
// টানছে", "একটি আরেকটিকে ঠেলে দিচ্ছে", "কাটাকাটি করে ফেলে", "একটি বিন্দু রয়েছে যেখানে তড়িৎ ক্ষেত্রের মান শূন্য", "যদি
// দুটোই নেগেটিভ চার্জ হতো তাহলে শুধু বলরেখার দিক পরিবর্তন হতো"; চিত্র ১০.১৩: "চার্জ এবং দ্বিগুণ পরিমাণ বিপরীত চার্জ",
// −2q, +q. The test charge q₀ ("টেস্ট চার্জ") is the book's word on the next page (p.287, ১০.৬). The page writes ওপর.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars} (already grouped
// with commas). intro / intro_short are the first screen's calm card; lead_* the line before the action; out_* the
// result; rule_* the rule in the book's words. Questions (q_*) are plain text (the quiz writes them as text): no HTML,
// and no q₀ (the font has no subscript digits): they say "টেস্ট চার্জ".

const Q0 = 'q<sub>0</sub>';

export const STRINGS = {
  bn: {
    two: '2',
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তড়িৎ ক্ষেত্র ও বলরেখা',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    aria_stage: 'টেবিলে অন্তরক দণ্ডের ওপর ধাতব গোলক, তার চারপাশে সোনালি তড়িৎ বলরেখা, পাশে ছোট টেস্ট চার্জ',
    u_ncs: 'N/C',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_drag: 'টেনে টেস্ট চার্জ সরাও',
    drag_me: 'টেনে সরাও',
    aria_drag: 'টেস্ট চার্জ টেনে সরাও (ডান-বাম তীর চাপো)',

    // the steps
    ex_label: 'ধাপ',
    ex_pos: '+q',
    ex_near: 'দূরত্ব',
    ex_neg: '−q',
    ex_unlike: 'বিপরীত',
    ex_like: 'সমচার্জ',
    ex_double: '−{two}q',
    act_pos: 'গোলকে চার্জ দাও',
    act_near: 'টেস্ট চার্জ কাছে আনো',
    act_neg: 'চার্জ নেগেটিভ করো',
    act_unlike: 'আরেকটি চার্জ আনো',
    act_like: 'দুটোই পজিটিভ করো',
    act_double: 'বামে −{two}q দাও',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'শুরুতে ফেরো',
    act_flat: 'সমতলে দেখো',
    act_round: 'চারদিকে দেখো',
    act_flat_short: 'সমতলে',
    act_round_short: 'চারদিকে',
    hint_wait: 'একটু দাঁড়াও, দেখা শেষ হোক।',
    hint_flat: 'বইয়ের ছবির মতো: শুধু একটি সমতলের বলরেখা',
    hint_round: 'আসলে বলরেখা চারদিকেই ছড়িয়ে থাকে',
    q_locked: 'পরীক্ষার সময় ছবিটি আটকানো থাকে। দেখে উত্তর বেছে নাও।',

    intro:
      'টেবিলে অন্তরক দণ্ডের ওপর একটি ধাতব গোলক, পাশে একটি ছোট টেস্ট চার্জ <b>q<sub>0</sub></b>। গোলকে চার্জ দিলে চারপাশে <b>তড়িৎ ক্ষেত্র</b> তৈরি হয়, যা চোখে দেখা যায় না। চলো কাল্পনিক রেখা, <b>বলরেখা</b> এঁকে দেখি।',
    intro_short: 'গোলকে চার্জ দিলে চারপাশে <b>তড়িৎ ক্ষেত্র</b> তৈরি হয়, চোখে দেখা যায় না। চলো কাল্পনিক <b>বলরেখা</b> এঁকে দেখি।',
    lead_pos: `এবার টেস্ট চার্জ ${Q0} কে অর্ধেক দূরত্বে আনি। ক্ষেত্র কতটা বাড়বে?`,
    lead_near: 'এবার গোলকের চার্জ নেগেটিভ করি। বলরেখার কী হবে?',
    lead_neg: 'এবার ডানে আরেকটি গোলক আনি: বামে +q, ডানে −q।',
    lead_unlike: 'এবার ডানের গোলকটিও পজিটিভ করি: দুটো সমচার্জ।',
    lead_like: 'এবার বামের গোলকে দ্বিগুণ পরিমাণ বিপরীত চার্জ, −{two}q দিই।',
    lead_double: 'সব দেখা হলো। ঘুরিয়ে দেখো, সমতলেও দেখো, তারপর পরীক্ষা দাও।',
    out_pos: `বলরেখা গোলক থেকে <b>চারদিকে বের হয়ে</b> ছড়িয়ে পড়েছে। ${Q0} বাইরের দিকে বল F পায়।`,
    out_near: 'দূরত্ব অর্ধেক ({r1} → {r2} cm), E <b>{k} গুণ</b>: {e1} → {e2} N/C।',
    out_neg: `বলরেখা এখন চারদিক থেকে <b>গোলকে ঢুকছে</b>। ${Q0} গোলকের দিকে টান পায়।`,
    out_unlike: `+q এর বলরেখা গিয়ে <b>−q তে শেষ</b> হয়েছে। মাঝে ${Q0} বল পায় −q এর দিকে।`,
    out_like: `মাঝে বলরেখা নেই, দুই দিকে বেঁকে গেছে। ঠিক মাঝখানে <b>E = {z}</b>: ${Q0} কোনো বল পায় না।`,
    out_double: '−{two}q তে বলরেখা <b>দ্বিগুণ</b>। +q এর বলরেখা গিয়ে −{two}q তে শেষ, বাকিগুলো আসে দূর থেকে।',
    rule_pos: 'পজিটিভ চার্জের বেলায় বলরেখা <b>পজিটিভ চার্জ থেকে বের হবে</b>। কোনো বিন্দুতে বলরেখার <b>স্পর্শকের দিক</b> হচ্ছে তড়িৎ ক্ষেত্রের দিক।',
    rule_near: 'E = kq/r²: দূরত্ব অর্ধেক হলে E চার গুণ। <b>বলরেখাগুলো যত কাছাকাছি, তড়িৎ ক্ষেত্রের মান তত বেশি।</b>',
    rule_neg: 'নেগেটিভ চার্জের বেলায় বলরেখা <b>নেগেটিভ চার্জে এসে কেন্দ্রীভূত</b> হবে। বল F = Eq এখন উল্টো দিকে।',
    rule_unlike: 'দেখে মনে হয় দুটো চার্জ <b>একটা আরেকটাকে টানছে</b>। একটি চার্জের বলরেখা <b>কখনো অন্য চার্জের বলরেখার ওপর দিয়ে যাবে না।</b>',
    rule_like:
      'দুটো চার্জ <b>একটি আরেকটিকে ঠেলে দিচ্ছে</b> এমন মনে হয়। মাঝে দুই ক্ষেত্র কাটাকাটি করে, তাই সেখানে <b>তড়িৎ ক্ষেত্রের মান শূন্য</b>। দুটোই নেগেটিভ হলে শুধু দিক বদলাত।',
    rule_double: '<b>চার্জের পরিমাণ যত বেশি, বলরেখার সংখ্যা তত বেশি।</b> −{two}q এর বলরেখা +q এর দ্বিগুণ।',

    // the live reading over the graph
    read_single: `r = {r} cm-এ E = <b>{e} N/C</b>`,
    read_pair: `${Q0}-তে E = <b>{e} N/C</b>`,
    read_pair_none: 'দুই চার্জের মাঝের রেখায় E',
    read_none: 'চার্জ নেই, তাই E = {z}',
    book_example: 'বইয়ের উদাহরণ: q = {q} C, r = {r} m হলে E = {e}<sup>{p}</sup> N/C। এত বড় চার্জ বাস্তবে পাওয়া যায় না, তাই এখানে q অনেক ছোট ধরা।',
    read_note: 'q = {q} × {ten}<sup>−{p}</sup> C<span class="efl-w"> ধরে</span>',
    dir_right: 'ডানে',
    dir_left: 'বামে',
    graph_r: 'r (cm)',
    graph_x: 'দূরত্ব (cm)',
    graph_sphere: 'গোলক',
    graph_e: 'E (হাজার N/C)',
    graph_zero: 'E = {z}',
    graph_aria: 'তড়িৎ ক্ষেত্র E এর লেখচিত্র',

    // labels on the picture
    lbl_q0: Q0,
    lbl_F: 'F',
    lbl_zero: 'E = {z}',
    lbl_pos: '+q',
    lbl_neg: '−q',
    lbl_neg2: '−{two}q',
    lbl_hidden: '?',
    lbl_at: '{r} cm',
    lbl_at_e: '{r} cm: {e} N/C',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',

    q_sign: 'গোলকের চার্জ ঢেকে রাখা হয়েছে। পজিটিভ টেস্ট চার্জটি গোলকের দিকে বল পাচ্ছে। গোলকের চার্জ কী?',
    c_sign_neg: 'নেগেটিভ',
    c_sign_pos: 'পজিটিভ',
    c_sign_none: 'কোনো চার্জ নেই',
    c_sign_any: 'যেকোনোটি হতে পারে',
    why_sign: '<b>নেগেটিভ</b>: বলরেখা নেগেটিভ চার্জে এসে শেষ হয়, তাই পজিটিভ টেস্ট চার্জ গোলকের দিকে টান পায়।',
    mis_sign_pos: 'পজিটিভ গোলক পজিটিভ টেস্ট চার্জকে দূরে ঠেলে দিত।',
    mis_sign_none: 'চার্জ না থাকলে ক্ষেত্র নেই, তাই কোনো বলও নেই।',
    mis_sign_any: 'বলের দিক দেখেই চার্জ চেনা যায়: টান মানে বিপরীত চার্জ।',

    q_ratio: 'টেস্ট চার্জের পাশে তার দূরত্ব ও E লেখা আছে। এটিকে হালকা দাগের জায়গায় সরালে E কত হবে?',
    why_ratio: '<b>{e2} N/C</b>: E = kq/r², দূরত্ব দ্বিগুণ হলে E চার ভাগের এক ভাগ: {e1} ÷ {k} = {e2}।',
    mis_ratio_half: 'অর্ধেক হতো যদি E = kq/r হতো; এখানে r²: চার ভাগের এক ভাগ।',
    mis_ratio_same: 'দূরে গেলে ক্ষেত্র দুর্বল হয়: বলরেখা সেখানে ছাড়া ছাড়া।',
    mis_ratio_more: 'দূরে গেলে E কমে, বাড়ে না।',

    q_zero: 'দুটি সমান পজিটিভ চার্জ। তাদের মাঝের রেখায় কোথায় টেস্ট চার্জ রাখলে কোনো বল পাবে না?',
    c_zero_mid: 'ঠিক মাঝখানে',
    c_zero_ball: 'যেকোনো গোলকের গা ঘেঁষে',
    c_zero_quarter: 'বাম গোলক থেকে এক-চতুর্থাংশ পথে',
    c_zero_none: 'কোথাও না, বল থাকবেই',
    why_zero: '<b>ঠিক মাঝখানে</b>: সেখানে দুই চার্জের ক্ষেত্র সমান ও বিপরীত, কাটাকাটি করে E = {z}। তাই সেখানে বলরেখা নেই।',
    mis_zero_ball: 'গোলকের কাছে ক্ষেত্র সবচেয়ে বেশি: বলরেখা সেখানে ঘন।',
    mis_zero_quarter: 'সেখানে বাম চার্জের ক্ষেত্র বেশি; সমান হয় শুধু মাঝখানে।',
    mis_zero_none: 'সমচার্জের মাঝে একটি বিন্দু আছে যেখানে E = {z} (বই, চিত্র {fig} b)।',

    q_more: 'দুটি গোলকের চার্জের পরিমাণ ঢেকে রাখা হয়েছে। বলরেখা দেখে বলো, কোনটির চার্জ বেশি?',
    c_more_left: 'বাম গোলকের (নেগেটিভ)',
    c_more_right: 'ডান গোলকের (পজিটিভ)',
    c_more_same: 'দুটোর সমান',
    c_more_cant: 'বলরেখা দেখে বলা যায় না',
    why_more: '<b>বাম গোলকের</b>: তাতে বলরেখা প্রায় দ্বিগুণ। চার্জের পরিমাণ যত বেশি, বলরেখার সংখ্যা তত বেশি। এটি −{two}q, ডানেরটি +q।',
    mis_more_right: 'ডানের প্রতিটি বলরেখা বামে গিয়ে শেষ, বামে আরও বলরেখা আসে দূর থেকে: বামে বেশি।',
    mis_more_same: 'সমান হলে দুটোতে সমান সংখ্যক বলরেখা থাকত।',
    mis_more_cant: 'বলা যায়: বলরেখার সংখ্যা চার্জের পরিমাণ বলে দেয় (নিয়ম b)।',

    q_cross: 'দুটি বিপরীত চার্জের বলরেখা। কোনো বিন্দুতে দুটি বলরেখা কি একে অন্যকে কাটতে পারে?',
    c_cross_no: 'না, এক বিন্দুতে ক্ষেত্রের দিক একটাই',
    c_cross_mid: 'হ্যাঁ, দুই চার্জের মাঝখানে কাটে',
    c_cross_big: 'হ্যাঁ, চার্জ বেশি হলে কাটে',
    c_cross_like: 'শুধু সমচার্জের বেলায় কাটে',
    why_cross: '<b>না</b>: বলরেখার স্পর্শকই ক্ষেত্রের দিক; দুটি রেখা কাটলে এক বিন্দুতে দুটি দিক হতো। তাই একটির বলরেখা অন্যটির ওপর দিয়ে যায় না।',
    mis_cross_mid: 'মাঝখানে রেখাগুলো ঘন, কিন্তু পাশাপাশি চলে; কাটে না।',
    mis_cross_big: 'চার্জ বেশি হলে রেখা বেশি হয়, তবু কাটে না।',
    mis_cross_like: 'সমচার্জে রেখাগুলো বেঁকে সরে যায়; কাটে না।',
  },
  en: {
    two: '2',
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'The electric field and its lines',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn the view',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    aria_stage: 'A metal sphere on an insulating rod on a table, gold electric field lines round it, a small test charge beside it',
    u_ncs: 'N/C',

    howto_label: 'How to use',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_drag: 'Drag the test charge',
    drag_me: 'Drag',
    aria_drag: 'Drag the test charge (left and right arrow keys)',

    ex_label: 'Steps',
    ex_pos: '+q',
    ex_near: 'Distance',
    ex_neg: '−q',
    ex_unlike: 'Unlike',
    ex_like: 'Like',
    ex_double: '−{two}q',
    act_pos: 'Charge the sphere',
    act_near: 'Bring the test charge closer',
    act_neg: 'Make it negative',
    act_unlike: 'Bring a second charge',
    act_like: 'Make both positive',
    act_double: 'Put −{two}q on the left',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_flat: 'In a plane',
    act_round: 'All round',
    act_flat_short: 'Plane',
    act_round_short: 'Round',
    hint_wait: 'Wait a moment, let it finish.',
    hint_flat: "As in the book's picture: the lines in one plane only",
    hint_round: 'Really the lines spread out in every direction',
    q_locked: 'The picture is locked during the test. Look and choose an answer.',

    intro:
      'On the table, a metal sphere on an insulating rod, and beside it a small test charge <b>q<sub>0</sub></b>. A charged sphere makes an <b>electric field</b> all round it, which can’t be seen. Let’s draw imaginary lines, the <b>lines of force</b>.',
    intro_short: 'A charged sphere makes an <b>electric field</b> all round it, which can’t be seen. Let’s draw the imaginary <b>lines of force</b>.',
    lead_pos: `Now bring the test charge ${Q0} to half the distance. How much stronger is the field?`,
    lead_near: 'Now make the sphere negative. What happens to the lines?',
    lead_neg: 'Now bring a second sphere on the right: +q on the left, −q on the right.',
    lead_unlike: 'Now make the right sphere positive too: two like charges.',
    lead_like: 'Now give the left sphere twice as much opposite charge, −{two}q.',
    lead_double: 'That’s everything. Turn the view, look at the plane too, then take the test.',
    out_pos: `The lines <b>leave the sphere</b> and spread out in every direction. ${Q0} is pushed outward by a force F.`,
    out_near: 'Half the distance ({r1} → {r2} cm), E <b>{k} times</b>: {e1} → {e2} N/C.',
    out_neg: `The lines now <b>go into the sphere</b> from every side. ${Q0} is pulled toward it.`,
    out_unlike: `The lines from +q <b>end on −q</b>. ${Q0} in the middle is pushed toward −q.`,
    out_like: `No lines in the middle: they bend away. Right in the middle <b>E = {z}</b>: ${Q0} feels no force.`,
    out_double: '−{two}q has <b>twice</b> the lines. Those from +q end on −{two}q; the rest come from far away.',
    rule_pos:
      'For a positive charge the lines <b>leave the positive charge</b>. At any point the <b>tangent</b> to the line is the direction of the field.',
    rule_near: 'E = kq/r²: half the distance, four times E. <b>The closer the lines, the stronger the field.</b>',
    rule_neg: 'For a negative charge the lines <b>converge on the negative charge</b>. The force F = Eq is now reversed.',
    rule_unlike: 'It looks as if the two charges <b>pull each other</b>. A line of one charge <b>never runs across a line of another.</b>',
    rule_like:
      'It looks as if the two charges <b>push each other away</b>. In the middle the two fields cancel: there <b>the field is zero</b>. Two negatives: only the directions would change.',
    rule_double: '<b>The more charge, the more lines.</b> −{two}q has twice the lines of +q.',

    read_single: 'r = {r} cm: E = <b>{e} N/C</b>',
    read_pair: `At ${Q0}, E = <b>{e} N/C</b>`,
    read_pair_none: 'E between the charges',
    read_none: 'No charge, so E = {z}',
    book_example:
      'The book’s example: q = {q} C, r = {r} m gives E = {e}<sup>{p}</sup> N/C. A charge that big doesn’t exist in a lab, so q here is much smaller.',
    read_note: 'q = {q} × {ten}<sup>−{p}</sup> C',
    dir_right: 'right',
    dir_left: 'left',
    graph_r: 'r (cm)',
    graph_x: 'x (cm)',
    graph_sphere: 'sphere',
    graph_e: 'E (thousand N/C)',
    graph_zero: 'E = {z}',
    graph_aria: 'Graph of the electric field E',

    lbl_q0: Q0,
    lbl_F: 'F',
    lbl_zero: 'E = 0',
    lbl_pos: '+q',
    lbl_neg: '−q',
    lbl_neg2: '−{two}q',
    lbl_hidden: '?',
    lbl_at: '{r} cm',
    lbl_at_e: '{r} cm: {e} N/C',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture and choose an answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try again.',
    q_again: 'Take the test again',

    q_sign: "The sphere's charge is hidden. The positive test charge is pulled toward the sphere. What is the sphere's charge?",
    c_sign_neg: 'Negative',
    c_sign_pos: 'Positive',
    c_sign_none: 'No charge',
    c_sign_any: 'Could be either',
    why_sign: '<b>Negative</b>: lines end on a negative charge, so a positive test charge is pulled toward it.',
    mis_sign_pos: 'A positive sphere would push the positive test charge away.',
    mis_sign_none: 'No charge, no field, so no force.',
    mis_sign_any: 'The direction of the force tells: a pull means an opposite charge.',

    q_ratio: 'The label gives the test charge’s distance and E. Moved to the faint mark, what is E?',
    why_ratio: '<b>{e2} N/C</b>: E = kq/r², twice the distance gives a quarter: {e1} ÷ {k} = {e2}.',
    mis_ratio_half: 'Half would be for E = kq/r; with r², a quarter.',
    mis_ratio_same: 'Farther away the field is weaker: the lines are sparse there.',
    mis_ratio_more: 'Farther away E falls, it does not grow.',

    q_zero: 'Two equal positive charges. Where on the line between them does a test charge feel no force?',
    c_zero_mid: 'Right in the middle',
    c_zero_ball: 'Touching either sphere',
    c_zero_quarter: 'A quarter of the way from the left',
    c_zero_none: 'Nowhere, there is always a force',
    why_zero: '<b>Right in the middle</b>: the two fields are equal and opposite and cancel, E = {z}.',
    mis_zero_ball: 'Next to a sphere the field is strongest: the lines are dense there.',
    mis_zero_quarter: "There the left charge's field is bigger.",
    mis_zero_none: 'Like charges have a point where E = {z} (fig. {fig} b).',

    q_more: "The two spheres' amounts of charge are hidden. From the lines, which has more charge?",
    c_more_left: 'The left sphere (negative)',
    c_more_right: 'The right sphere (positive)',
    c_more_same: 'Both the same',
    c_more_cant: "The lines can't tell",
    why_more: '<b>The left sphere</b>: it has about twice the lines. The more charge, the more lines. It is −{two}q, the right one +q.',
    mis_more_right: 'Every line of the right one ends on the left one, and more come in from far away: the left has more.',
    mis_more_same: 'Equal charges would have equal numbers of lines.',
    mis_more_cant: 'They can: the number of lines gives the amount of charge (rule b).',

    q_cross: 'The lines of two unlike charges. Can two lines ever cross at a point?',
    c_cross_no: 'No, the field has one direction at a point',
    c_cross_mid: 'Yes, in the middle between the charges',
    c_cross_big: 'Yes, when the charges are big',
    c_cross_like: 'Only for like charges',
    why_cross: '<b>No</b>: the tangent to a line is the field’s direction; crossing lines would give one point two directions.',
    mis_cross_mid: 'In the middle the lines are dense, but they run side by side.',
    mis_cross_big: 'More charge means more lines, but they still never cross.',
    mis_cross_like: 'For like charges the lines bend away; they never cross.',
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
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? num(dict[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
