// Every string the figure shows, in Bangla and English. The book's words on pages 275–277 (topic 10.3, বৈদ্যুতিক
// আবেশ): চার্জহীন / চার্জবিহীন বস্তু, ধাতব গোলক, বিদ্যুৎ অপরিবাহী স্ট্যান্ড, কাচ দণ্ড, সিল্ক দিয়ে ঘষে, পজিটিভ /
// নেগেটিভ চার্জ, আবেশিত, আকর্ষণ / বিকর্ষণ, চিরুনি, কাগজের টুকরো, "লাফিয়ে চিরুনির কাছে চলে আসে", "ছিটকে নিচে চলে
// আসে", "নেগেটিভ চার্জে ভরে যায়", শীতকাল, জলীয় বাষ্প; চিত্র ১০.০৪: "চার্জবিহীন বস্তুর কাছে চার্জসহ বস্তু আনা হলে
// বিপরীত চার্জ আবেশিত হয়"; চিত্র ১০.০৬: "দুটি ধাতব গোলককে একসাথে রেখে তাদের ভেতরে ভিন্ন চার্জ আবেশিত করা সম্ভব"।
// The page writes ওপর, পেছন, দণ্ড. ইলেকট্রন is the book's word from 10.1.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language (the unit {u_cm}). intro / intro_short are the first screen's calm card
// (the short one for small frames); lead_* the line before the action; out_* the result; rule_* the rule, the book's
// term last and in bold. The questions (q_*) are plain text, no HTML: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বৈদ্যুতিক আবেশ: চার্জ কাছে আনলে চার্জহীন বস্তুতে বিপরীত চার্জ জন্মায়',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ফল',
    aria_stage: 'অপরিবাহী স্ট্যান্ডের ওপর ধাতব গোলক, পাশে সিল্কে ঘষা কাচ দণ্ড; গোলকের গায়ে পজিটিভ (+) ও নেগেটিভ (−) চার্জের চিহ্ন',
    u_cm: 'cm',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_rod: 'টেনে দণ্ড সরাও',
    aria_howto_rod: 'কাচ দণ্ডের গায়ের সাদা চাকতি টেনে দণ্ড কাছে বা দূরে সরাও',
    drag_me: 'টেনে সরাও',
    aria_drag_rod: 'কাচ দণ্ড: বাঁ বা ডান তীর চেপে কাছে বা দূরে সরাও',

    // the chips' legend
    legend_plus: 'পজিটিভ চার্জ',
    legend_minus: 'নেগেটিভ চার্জ (ইলেকট্রন)',
    legend_pair: 'জোড়া = চার্জহীন',

    // the steps
    ex_label: 'ধাপ',
    ex_near: 'এক গোলক',
    ex_pair: 'দুই গোলক',
    ex_apart: 'আলাদা',
    ex_comb: 'চিরুনি',

    // the action and the quiet buttons
    act_near: 'দণ্ডটি কাছে আনো',
    act_pair: 'গোলক দুটি ছুঁইয়ে দাও',
    act_apart: 'গোলক আলাদা করো',
    act_comb: 'চিরুনি কাছে আনো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',

    // the first screen: a few calm words
    intro:
      'টেবিলে অপরিবাহী স্ট্যান্ডের ওপর একটি ধাতব গোলক। এর প্রতিটি জোড়ায় একটি পজিটিভ আর একটি নেগেটিভ চার্জ, তাই গোলকটি চার্জহীন। পাশে সিল্ক দিয়ে ঘষা একটি কাচ দণ্ড, তাতে পজিটিভ চার্জ। দণ্ডটি ছুঁইয়ে না দিয়ে কাছে আনলে কী হয়? চলো দেখি।',
    intro_short: 'চার্জহীন একটি ধাতব গোলক, পাশে পজিটিভ চার্জের কাচ দণ্ড। দণ্ড কাছে আনলে কী হয়?',

    // the line before the action: what the next tap will show
    lead_near: 'এবার দুটি ধাতব গোলক ছুঁইয়ে রেখে দণ্ডটি কাছে আনি।',
    lead_pair: 'দণ্ড না সরিয়েই গোলক দুটি আলাদা করি, তারপর দণ্ড সরাই।',
    lead_apart: 'এবার বইয়ের প্রথম প্রশ্ন: চুল আঁচড়ানো চিরুনি চার্জহীন কাগজ টানে কেন?',
    lead_comb: 'এবার নিজে যাচাই করো।',

    // the result line
    out_near: 'দণ্ড {d}&nbsp;{u_cm} দূরে: <b>{n}টি ইলেকট্রন</b> কাছের দিকে সরে এসেছে। গোলকের মোট চার্জ এখনো শূন্য।',
    out_near_none: 'দণ্ড {d}&nbsp;{u_cm} দূরে: আবেশ খুব কম, চার্জ <b>ছড়িয়ে আছে</b>। দণ্ডটি টেনে কাছে আনো।',
    out_pair: 'গোলক {s2} থেকে <b>{n}টি ইলেকট্রন</b> গোলক {s1}-এ চলে এসেছে।',
    out_apart: 'গোলক {s1}-এ <b>নেগেটিভ</b>, গোলক {s2}-এ <b>পজিটিভ</b> চার্জ রয়ে গেল ({n}টি করে)।',
    out_comb: 'কাগজের টুকরো লাফিয়ে চিরুনিতে উঠল, তারপর <b>নেগেটিভ</b> হয়ে ছিটকে পড়ল।',

    // the rule: the book's words, the book's term last and in bold
    rule_near:
      'অপরিবাহী স্ট্যান্ডের ওপর গোলকের চার্জ বেরিয়ে যেতে পারে না। কাচ দণ্ড পজিটিভ চার্জযুক্ত, তাই নেগেটিভ চার্জ আকর্ষিত হয়ে কাছে চলে আসে, পেছন দিকে পজিটিভ চার্জ থাকে। সরে শুধু ইলেকট্রন। একে বলে <b>বৈদ্যুতিক আবেশ</b>।',
    rule_near_none: 'দণ্ড সরিয়ে নিলে ইলেকট্রনগুলো আবার জোড়ায় ফিরে যায়, গোলক আগের মতোই <b>চার্জহীন</b>।',
    rule_pair: 'ছুঁয়ে থাকা দুটি গোলক মিলে একটাই ধাতব বস্তু: কাছের গোলকে নেগেটিভ, দূরের গোলকে পজিটিভ চার্জ <b>আবেশিত</b> হয়।',
    rule_apart: 'দণ্ড থাকতেই আলাদা করায় ইলেকট্রন আর ফিরতে পারেনি। দুটি ধাতব গোলককে একসাথে রেখে তাদের ভেতরে <b>ভিন্ন চার্জ আবেশিত</b> করা সম্ভব।',
    rule_comb:
      'কাগজের কাছের অংশে পজিটিভ, দূরের অংশে নেগেটিভ চার্জ আবেশিত হয়। কাছের অংশের আকর্ষণ বিকর্ষণের চেয়ে বেশি। চিরুনিতে লেগে কাগজ নেগেটিভ চার্জে ভরে যায়, তাই <b>বিকর্ষিত</b> হয়।',

    // labels on the picture (short)
    lbl_sphere: 'ধাতব গোলক',
    lbl_rod: 'কাচ দণ্ড (+)',
    lbl_stand: 'অপরিবাহী স্ট্যান্ড',
    lbl_neg: 'নেগেটিভ চার্জ',
    lbl_pos: 'পজিটিভ চার্জ',
    lbl_pull: 'আকর্ষণ',
    lbl_s1: 'গোলক {s1}',
    lbl_s2: 'গোলক {s2}',
    lbl_s1_neg: 'গোলক {s1}: নেগেটিভ',
    lbl_s2_pos: 'গোলক {s2}: পজিটিভ',
    lbl_comb: 'চিরুনি (−)',
    lbl_paper: 'কাগজের টুকরো',

    note_few: 'কয়েকটি চার্জ আঁকা, আসলে অসংখ্য',
    note_slow: 'সময় ধীর; চার্জ বাড়িয়ে আঁকা',
    next_comb: 'চিরুনি ›',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',
    hint_drag_later: 'এই ধাপে দণ্ড নিজে নিজে সরে।',

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

    q_sign: 'পজিটিভ কাচ দণ্ডটি চার্জহীন গোলকের কাছে আনা হলো (চার্জের চিহ্ন লুকানো)। গোলকের যে পাশ দণ্ডের কাছে, সেখানে কোন চার্জ জমবে?',
    c_sg_right: 'নেগেটিভ চার্জ',
    c_sg_plus: 'পজিটিভ চার্জ',
    c_sg_none: 'কোনো চার্জ জমবে না',
    c_sg_far: 'সব চার্জ দূরের পাশে যাবে',
    why_sign: '<b>নেগেটিভ চার্জ</b>। বিপরীত চার্জ আকর্ষণ করে, তাই পজিটিভ দণ্ড ইলেকট্রনকে কাছে টানে।',
    mis_sg_plus: 'পজিটিভ দণ্ড পজিটিভ চার্জকে বিকর্ষণ করে; কাছে আসে নেগেটিভ।',
    mis_sg_none: 'ছুঁয়ে না দিলেও চার্জ আলাদা হয়: এটাই আবেশ।',
    mis_sg_far: 'শুধু পজিটিভ চার্জ দূরের পাশে থাকে; কাছের পাশে নেগেটিভ জমে।',

    q_moves: 'গোলকের চার্জ আলাদা হয়েছে। আসলে কোন চার্জ সরে এসেছে?',
    c_mv_right: 'ইলেকট্রন (নেগেটিভ)',
    c_mv_proton: 'প্রোটন (পজিটিভ)',
    c_mv_both: 'দুটোই সমান সমান',
    c_mv_rod: 'দণ্ড থেকে চার্জ এসেছে',
    why_moves: '<b>ইলেকট্রন</b>। ধাতুর ইলেকট্রন সরতে পারে, প্রোটন নিউক্লিয়াসে আটকে থাকে।',
    mis_mv_proton: 'প্রোটন নিউক্লিয়াসে আটকে থাকে, সরে না।',
    mis_mv_both: 'একটি পজিটিভ চার্জও সরেনি; সরেছে কেবল ইলেকট্রন।',
    mis_mv_rod: 'দণ্ড গোলককে ছুঁয়ে যায়নি, তাই কোনো চার্জ দণ্ড থেকে আসেনি।',

    q_apart: 'দণ্ড রেখেই গোলক দুটি আলাদা করা হলো, তারপর দণ্ড সরানো হলো। গোলক {s2}-এ কী থাকবে?',
    c_ap_right: 'পজিটিভ চার্জ',
    c_ap_minus: 'নেগেটিভ চার্জ',
    c_ap_none: 'কোনো চার্জ থাকবে না',
    c_ap_same: 'গোলক {s1}-এর মতো একই চার্জ',
    why_apart: '<b>পজিটিভ চার্জ</b>। গোলক {s2}-এর কিছু ইলেকট্রন গোলক {s1}-এ চলে গেছে, আলাদা করায় আর ফিরতে পারে না।',
    mis_ap_minus: 'নেগেটিভ চার্জ (বাড়তি ইলেকট্রন) পেয়েছে গোলক {s1}, দণ্ডের কাছেরটি।',
    mis_ap_none: 'আলাদা করার পর ইলেকট্রন আর এক গোলক থেকে অন্যটিতে যেতে পারে না।',
    mis_ap_same: 'একটিতে ইলেকট্রন বেশি, অন্যটিতে কম: দুটির চার্জ বিপরীত।',

    q_paper: 'নেগেটিভ চার্জের চিরুনি কাগজের টুকরোর কাছে (চিহ্ন লুকানো)। কাগজের যে অংশ চিরুনির কাছে, সেখানে কোন চার্জ আবেশিত হয়?',
    c_pp_right: 'পজিটিভ চার্জ',
    c_pp_minus: 'নেগেটিভ চার্জ',
    c_pp_none: 'কোনো চার্জ না',
    c_pp_both: 'দুই রকমই সমান',
    why_paper: '<b>পজিটিভ চার্জ</b>। চিরুনি নেগেটিভ, তাই কাছের অংশে বিপরীত (পজিটিভ) চার্জ আবেশিত হয়, দূরের অংশে নেগেটিভ।',
    mis_pp_minus: 'নেগেটিভ চার্জ চিরুনি থেকে বিকর্ষিত হয়ে দূরের অংশে যায়।',
    mis_pp_none: 'চার্জ না থাকলে কাগজ লাফিয়ে উঠত না।',
    mis_pp_both: 'মোট চার্জ শূন্য, কিন্তু কাছের অংশে পজিটিভ বেশি।',

    q_fly: 'কাগজের টুকরো চিরুনির গায়ে লেগে গেছে। একটু পরেই ছিটকে নিচে পড়ে কেন?',
    c_fl_right: 'চিরুনি থেকে নেগেটিভ চার্জ পেয়ে',
    c_fl_heavy: 'ওজন আকর্ষণের চেয়ে বেশি হয়ে',
    c_fl_plus: 'চিরুনি থেকে পজিটিভ চার্জ পেয়ে',
    c_fl_air: 'চিরুনির বাতাসের ধাক্কা পেয়ে',
    why_fly: '<b>চিরুনি থেকে নেগেটিভ চার্জ পেয়ে</b>। কাগজ নেগেটিভ চার্জে ভরে যায়; একই চার্জ বিকর্ষণ করে।',
    mis_fl_heavy: 'ওজন বেশি হলে কাগজ শুরুতেই লাফিয়ে উঠত না।',
    mis_fl_plus: 'চিরুনি থেকে কাগজ পায় নেগেটিভ চার্জ, পজিটিভ নয়।',
    mis_fl_air: 'বাতাস নয়, চার্জের বিকর্ষণে কাগজ ছিটকে পড়ে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Electrical induction: a charge brought near makes the opposite charge in an uncharged body',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Result',
    aria_stage:
      'A metal sphere on an insulating stand, a glass rod rubbed with silk beside it; positive (+) and negative (−) charge signs on the sphere',
    u_cm: 'cm',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_rod: 'Drag the rod',
    aria_howto_rod: 'Drag the white disc on the glass rod to move it nearer or farther',
    drag_me: 'Drag',
    aria_drag_rod: 'Glass rod: press the left or right arrow to move it nearer or farther',

    legend_plus: 'positive charge',
    legend_minus: 'negative charge (electron)',
    legend_pair: 'pair = no charge',

    ex_label: 'Step',
    ex_near: 'One sphere',
    ex_pair: 'Two spheres',
    ex_apart: 'Separate',
    ex_comb: 'Comb',

    act_near: 'Bring the rod near',
    act_pair: 'Touch two spheres',
    act_apart: 'Separate the spheres',
    act_comb: 'Bring the comb near',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Watch again',

    intro:
      'A metal sphere on an insulating stand. Each pair on it is one positive and one negative charge, so the sphere has no charge. Beside it, a glass rod rubbed with silk: it carries positive charge. What happens when the rod comes near, without touching? Let’s see.',
    intro_short: 'An uncharged metal sphere and a positive glass rod. What happens when the rod comes near?',

    lead_near: 'Now two metal spheres touching, and the rod brought near.',
    lead_pair: 'Keep the rod there and separate the spheres, then take the rod away.',
    lead_apart: 'Now the book’s first question: why does a comb used on hair pull uncharged paper?',
    lead_comb: 'Now test yourself.',

    out_near: 'Rod {d}&nbsp;{u_cm} away: <b>{n} electrons</b> have moved to the near side. The sphere’s total charge is still zero.',
    out_near_none: 'Rod {d}&nbsp;{u_cm} away: very little induction, the charges <b>stay spread</b>. Drag the rod nearer.',
    out_pair: '<b>{n} electrons</b> have moved from sphere {s2} into sphere {s1}.',
    out_apart: 'Sphere {s1} keeps a <b>negative</b> charge, sphere {s2} a <b>positive</b> one ({n} each).',
    out_comb: 'The bits of paper jumped up to the comb, then turned <b>negative</b> and flew off.',

    rule_near:
      'On its insulating stand the sphere keeps its charge. The positive rod pulls negative charge near; positive stays at the back. Only electrons move. This is <b>electrical induction</b>.',
    rule_near_none: 'Take the rod away and the electrons go back to their pairs: the sphere has <b>no charge</b> again.',
    rule_pair: 'Two touching spheres are one metal body: negative charge is <b>induced</b> on the near sphere, positive on the far one.',
    rule_apart:
      'Separated while the rod is near, the electrons can’t go back. Two metal spheres placed together can have <b>opposite charges induced</b> in them.',
    rule_comb:
      'Positive charge is induced on the paper’s near part, negative on its far part. The near part’s pull beats the far part’s push. Touching the comb, the paper fills with negative charge, so it is <b>repelled</b>.',

    lbl_sphere: 'Metal sphere',
    lbl_rod: 'Glass rod (+)',
    lbl_stand: 'Insulating stand',
    lbl_neg: 'Negative (−)',
    lbl_pos: 'Positive (+)',
    lbl_pull: 'Attraction',
    lbl_s1: 'Sphere {s1}',
    lbl_s2: 'Sphere {s2}',
    lbl_s1_neg: 'Sphere {s1} (−)',
    lbl_s2_pos: 'Sphere {s2} (+)',
    lbl_comb: 'Comb (−)',
    lbl_paper: 'Bits of paper',

    note_few: 'A few charges drawn; really a huge number',
    note_slow: 'Time slowed; charges drawn large',
    next_comb: 'Comb ›',

    hint_wait: 'Wait a moment and watch.',
    hint_drag_later: 'In this step the rod moves by itself.',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture and choose the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at the picture and choose.',

    q_sign: 'The positive glass rod is brought near the uncharged sphere (charge signs hidden). Which charge gathers on the side near the rod?',
    c_sg_right: 'Negative charge',
    c_sg_plus: 'Positive charge',
    c_sg_none: 'No charge gathers',
    c_sg_far: 'All charge goes to the far side',
    why_sign: '<b>Negative charge</b>. Opposite charges attract, so the positive rod pulls electrons near.',
    mis_sg_plus: 'The positive rod repels positive charge; negative comes near.',
    mis_sg_none: 'Even without touching the charges separate: that is induction.',
    mis_sg_far: 'Only positive charge stays on the far side; negative gathers near.',

    q_moves: 'The sphere’s charges have separated. Which charge actually moved?',
    c_mv_right: 'Electrons (negative)',
    c_mv_proton: 'Protons (positive)',
    c_mv_both: 'Both, equally',
    c_mv_rod: 'Charge came from the rod',
    why_moves: '<b>Electrons</b>. A metal’s electrons can move; protons are held in the atoms’ nuclei.',
    mis_mv_proton: 'Protons are held in the nucleus and do not move.',
    mis_mv_both: 'Not one positive charge moved; only electrons did.',
    mis_mv_rod: 'The rod never touched the sphere, so no charge came from it.',

    q_apart: 'The spheres are separated with the rod still near, then the rod is taken away. What does sphere {s2} have?',
    c_ap_right: 'Positive charge',
    c_ap_minus: 'Negative charge',
    c_ap_none: 'No charge',
    c_ap_same: 'The same charge as sphere {s1}',
    why_apart: '<b>Positive charge</b>. Some of its electrons went into sphere {s1} and cannot come back.',
    mis_ap_minus: 'The extra electrons went to sphere {s1}, near the rod.',
    mis_ap_none: 'Once apart, electrons cannot pass between the spheres.',
    mis_ap_same: 'One has extra electrons, the other too few: opposite charges.',

    q_paper: 'A negatively charged comb is near a bit of paper (signs hidden). Which charge is induced on the part of the paper near the comb?',
    c_pp_right: 'Positive charge',
    c_pp_minus: 'Negative charge',
    c_pp_none: 'No charge',
    c_pp_both: 'Both, equally',
    why_paper: '<b>Positive charge</b>. The comb is negative, so the opposite charge is induced near it.',
    mis_pp_minus: 'Negative charge is repelled by the comb, to the far part.',
    mis_pp_none: 'With no charge the paper would not jump up.',
    mis_pp_both: 'The total is zero, but the near part has more positive.',

    q_fly: 'A bit of paper has stuck to the comb. Why does it soon fly off and fall?',
    c_fl_right: 'It gets negative charge from the comb',
    c_fl_heavy: 'It gets heavier than the pull',
    c_fl_plus: 'It gets positive charge from the comb',
    c_fl_air: 'It gets a puff of air from the comb',
    why_fly: '<b>It gets negative charge from the comb</b>: like charges repel.',
    mis_fl_heavy: 'If it were too heavy it would not have jumped up at all.',
    mis_fl_plus: 'From the comb the paper gets negative charge, not positive.',
    mis_fl_air: 'Not the air: the repulsion of like charges throws it off.',
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
  function t(key, given) {
    const vars = { s1: 1, s2: 2, ...given }; // the spheres' names: গোলক ১, গোলক ২
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
