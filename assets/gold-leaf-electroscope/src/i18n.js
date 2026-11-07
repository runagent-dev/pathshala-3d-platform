// Every string the figure shows, in Bangla and English. The book's words on pages 278–279 (topic 10.3.1,
// তড়িৎবীক্ষণ যন্ত্র): ইলেকট্রোস্কোপ, "খুবই হালকা সোনা, অ্যালুমিনিয়াম বা অন্য কোনো ধাতুর দুটি পাত", সুপরিবাহী দণ্ড, ধাতব
// চাকতি, অপরিবাহী ছিপি, কাচের বোতল, "যেন ... বাতাস বা অন্য কিছু যেন পাতলা ধাতব পাত দুটোকে নাড়াচাড়া করতে না পারে";
// চার্জ আহিতকরণ ("কাচের টুকরোকে সিল্ক দিয়ে ঘষা হলে কাচ দন্ডটাতে পজিটিভ চার্জ জমা হবে", "খানিকটা চার্জ চাকতিতে চলে
// যাবে", "চার্জটুকু সব জায়গায় ছড়িয়ে পড়বে", "পাত দুটো বিকর্ষণ করে তাদের মাঝে একটা ফাঁক তৈরি হয়েছে", চিরুনি + ফ্লানেল →
// নেগেটিভ); চার্জের প্রকৃতি বের করা ("প্রথমে ইলেকট্রোস্কোপের চাকতিতে পরিচিত কোনো চার্জ দিতে হবে", "ফাঁক কমে যায় ...
// নেগেটিভ", "ফাঁকটি আরো বেড়ে যায় ... নিশ্চয়ই পজিটিভ"); চার্জের আবেশ ("চাকতির মাঝে নেগেটিভ চার্জের আবেশ হবে",
// "অন্যান্য অংশ থেকে নেগেটিভ চার্জকে চাকতির মাঝে চলে আসতে হবে", "সোনার পাত দুটিতেও পজিটিভ চার্জ তৈরি হবে"); the
// boxed question "বর্ষাকালে স্থির বিদ্যুতের পরীক্ষাগুলো ঠিক করে কাজ করে না কেন?" and 10.3's answer "বাতাসে জলীয় বাষ্প
// থাকলে জমা হওয়া চার্জ দ্রুত হারিয়ে যায়"; ইলেকট্রন (10.1, 10.2). The page writes পজিটিভ / নেগেটিভ, and দণ্ড (p.279).
// Use t('key', vars) in code and t.num() for numbers. intro / intro_short: the first screen's calm card; lead_*: the
// line before the action; out_*: the result; rule_*: the rule, the book's term in bold. Questions (q_*) are plain text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তড়িৎবীক্ষণ যন্ত্র: চার্জ এলে সোনার পাত দুটি ফাঁক হয়',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    aria_stage: 'টেবিলে একটি কাচের বোতলে ইলেকট্রোস্কোপ: উপরে ধাতব চাকতি, অপরিবাহী ছিপির ভেতর দিয়ে দণ্ড, নিচে দুটি সোনার পাত',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_tap: 'যন্ত্রে টোকা দাও',
    howto_drag: 'টেনে কাছে-দূরে সরাও',
    drag_me: 'টেনে সরাও',
    aria_drag: 'দণ্ড বা চিরুনিটি চাকতির কাছে বা দূরে সরাও',

    // the steps
    ex_label: 'ধাপ',
    ex_parts: 'যন্ত্রটি',
    ex_near: 'কাছে আনা',
    ex_touch: 'ছোঁয়ানো',
    ex_test: 'চার্জ চেনা',

    // the action and the quiet buttons
    act_parts: 'যন্ত্রটি চেনো',
    act_near: 'কাচ দণ্ড কাছে আনো',
    act_touch: 'চাকতিতে ছোঁয়াও',
    act_comb: 'চিরুনি কাছে আনো',
    act_glass: 'কাচ দণ্ড কাছে আনো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',

    // the first screen: a few calm words
    intro: 'টেবিলে একটা কাচের বোতল। ভেতরে খুব হালকা দুটি সোনার পাত পাশাপাশি ঝুলছে। এর নাম ইলেকট্রোস্কোপ। চার্জ এলে পাত দুটি কী করে, চলো দেখি।',
    intro_short: 'বোতলের ভেতরে দুটি হালকা সোনার পাত। চার্জ এলে এরা কী করে, চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_parts: 'এবার সিল্কে ঘষা একটা কাচ দণ্ড চাকতির কাছে আনি, ছোঁয়াব না।',
    lead_near: 'দণ্ডটি টেনে দূরে-কাছে সরিয়ে দেখো। তারপর চাকতিতে ছোঁয়াও।',
    lead_touch: 'যন্ত্রে এখন পরিচিত চার্জ, পজিটিভ। এবার ফ্লানেলে ঘষা চিরুনি কাছে আনি: এর চার্জ কী?',
    lead_testNeg: 'এবার সিল্কে আবার ঘষা কাচ দণ্ড কাছে আনি।',
    lead_testPos: 'সব ধাপ দেখা হলো। চাইলে দণ্ডটি টেনে দেখো, তারপর পরীক্ষা দাও।',

    // the result line
    out_parts: 'চাকতি থেকে পাত পর্যন্ত সবটাই ধাতু। + আর − সমান সমান, তাই চার্জ নেই: পাত দুটি <b>পাশাপাশি ঝুলে</b> আছে।',
    out_near: 'না ছুঁয়েই পাত দুটি <b>ফাঁক</b> হলো। ইলেকট্রন (−) উঠে গেল চাকতিতে, পাতে রইল পজিটিভ (+)।',
    out_near_far: 'দণ্ড দূরে, তাই ইলেকট্রন আবার নিচে নেমেছে: পাত দুটি <b>বুজে</b> এসেছে।',
    out_near_mid: 'দণ্ড একটু দূরে: কম ইলেকট্রন উঠেছে, <b>ফাঁক কম</b>।',
    out_touch: 'দণ্ড সরিয়ে নিলেও পাত দুটি <b>ফাঁক</b> হয়ে রইল। কিছু ইলেকট্রন কাচে চলে গেছে, তাই যন্ত্রটি এখন পজিটিভ।',
    out_testNeg: 'চিরুনির নেগেটিভ চার্জ ইলেকট্রনকে পাতে ঠেলে নামাল, ফাঁক <b>কমে গেল</b>। চিরুনির চার্জ তাই <b>নেগেটিভ</b>।',
    out_testNeg_far: 'চিরুনি দূরে: ফাঁক আগের মতো। টেনে কাছে আনলে ফাঁক কমে।',
    out_testPos: 'কাচের পজিটিভ চার্জ আরো ইলেকট্রন টেনে নিল, ফাঁক আরো <b>বেড়ে গেল</b>। কাচের চার্জ তাই <b>পজিটিভ</b>।',
    out_testPos_far: 'দণ্ড দূরে: ফাঁক আগের মতো। কাছে আনলে ফাঁক বাড়ে।',

    // the rule: the book's words, the book's term in bold
    rule_parts:
      'পাত দুটো একটা সুপরিবাহী দণ্ড দিয়ে ধাতব চাকতির সাথে লাগানো। পুরোটা একটা <b>অপরিবাহী ছিপি</b> দিয়ে কাচের বোতলের ভেতর রাখা, যেন বাতাস পাতলা পাত দুটোকে নাড়াচাড়া করতে না পারে।',
    rule_near:
      'পজিটিভ দণ্ড কাছে আনলে চাকতিতে নেগেটিভ চার্জের আবেশ হয়: অন্য অংশ থেকে নেগেটিভ চার্জ চাকতিতে চলে আসে, তাই পাত দুটিতে পজিটিভ চার্জ তৈরি হয়। এর নাম <b>চার্জের আবেশ</b>।',
    rule_touch:
      'চাকতিতে ছোঁয়ালে চার্জ চাকতি, দণ্ড আর সোনার পাত পর্যন্ত ছড়িয়ে পড়ে; দুটি পাতে একই চার্জ, তাই বিকর্ষণে ফাঁক থাকে। এটি <b>চার্জ আহিতকরণ</b>। ফ্লানেলে ঘষা চিরুনি ছোঁয়ালে চার্জ হয় নেগেটিভ।',
    rule_testNeg:
      'চার্জের প্রকৃতি বের করতে প্রথমে চাকতিতে পরিচিত চার্জ দিতে হয় (এখানে পজিটিভ)। তারপর কোনো বস্তু কাছে আনলে ফাঁক কমে গেলে বুঝতে হবে এর মাঝে <b>নেগেটিভ চার্জ</b>।',
    rule_testPos:
      'পজিটিভ চার্জের যন্ত্রে ফাঁক কমলে বস্তুটির চার্জ নেগেটিভ; ফাঁক আরো বাড়লে চার্জটি নিশ্চয়ই পজিটিভ। এভাবে ইলেকট্রোস্কোপ দিয়ে <b>চার্জের প্রকৃতি</b> বের করা যায়।',

    // labels on the picture (short)
    lbl_disc: 'ধাতব চাকতি',
    lbl_rod: 'সুপরিবাহী দণ্ড',
    lbl_leaf: 'সোনার পাত',
    lbl_stopper: 'অপরিবাহী ছিপি',
    lbl_glass: 'কাচ দণ্ড',
    lbl_silk: 'সিল্ক',
    lbl_comb: 'চিরুনি',
    lbl_flannel: 'ফ্লানেল',
    lbl_unknown: 'অজানা দণ্ড',
    lbl_before: 'আগের ফাঁক',
    legend_plus: 'পজিটিভ চার্জ',
    legend_minus: 'নেগেটিভ চার্জ (ইলেকট্রন)',
    legend_pair: 'জোড়া = চার্জহীন',
    note_few: 'কয়েকটি চার্জ আঁকা, আসলে অসংখ্য',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',

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

    c_pos: 'পজিটিভ',
    c_neg: 'নেগেটিভ',
    c_none: 'কোনো চার্জ নেই',
    c_mixed: 'একটিতে পজিটিভ, অন্যটিতে নেগেটিভ',
    c_cant: 'বলা যায় না',

    q_induce: 'সিল্কে ঘষা কাচ দণ্ডটি চাকতিকে না ছুঁয়ে কাছে আনা হলো। সোনার পাত দুটিতে এখন কোন চার্জ?',
    why_induce: '<b>পজিটিভ</b>। কাচের পজিটিভ চার্জ ইলেকট্রনকে চাকতিতে টেনে নেয়, পাতে থেকে যায় পজিটিভ চার্জ।',
    mis_induce_neg: 'নেগেটিভ চার্জ জমে চাকতিতে, দণ্ডের কাছে; পাতে নয়।',
    mis_induce_none: 'চার্জ না থাকলে পাত দুটি ফাঁক হতো না।',
    mis_mixed: 'বিপরীত চার্জ হলে পাত দুটি আকর্ষণ করে লেগে থাকত।',

    q_spread: 'কাচ দণ্ড ছুঁইয়ে সরিয়ে নেওয়ার পরেও পাত দুটি ফাঁক হয়ে আছে কেন?',
    c_sp_right: 'দুটি পাতে একই চার্জ, তাই বিকর্ষণ',
    c_sp_opp: 'দুটি পাতে বিপরীত চার্জ, তাই আকর্ষণ',
    c_sp_rod: 'দূরের দণ্ড এখনও পাত টানছে',
    c_sp_air: 'বোতলের বাতাস পাত দুটি ঠেলছে',
    why_spread: '<b>একই চার্জ বিকর্ষণ করে</b>। দুটি পাতেই পজিটিভ চার্জ, তাই তারা একে অন্যকে দূরে ঠেলে রাখে।',
    mis_sp_opp: 'বিপরীত চার্জ আকর্ষণ করে; তাহলে পাত লেগে থাকত।',
    mis_sp_rod: 'দণ্ড সরিয়ে নেওয়া হয়েছে; ফাঁক রয়ে গেছে পাতের নিজের চার্জে।',
    mis_sp_air: 'বোতলের ভেতরের বাতাস স্থির; বোতল তো বাতাস আটকাতেই।',

    q_unknown: 'যন্ত্রে আগে পজিটিভ চার্জ দেওয়া আছে। অজানা দণ্ডটি কাছে আনলে পাতের কী হলো দেখো। দণ্ডটির চার্জ কী?',
    why_unknown_neg: '<b>নেগেটিভ</b>। যন্ত্রের চার্জ পজিটিভ, আর দণ্ড আনতে ফাঁক কমে গেছে; তাই দণ্ডটির চার্জ নেগেটিভ।',
    why_unknown_pos: '<b>পজিটিভ</b>। যন্ত্রের চার্জ পজিটিভ, আর দণ্ড আনতে ফাঁক আরো বেড়েছে; তাই দণ্ডটির চার্জ পজিটিভ।',
    mis_un_flip: 'ফাঁক কমলে বস্তুর চার্জ যন্ত্রের বিপরীত, বাড়লে একই।',
    mis_un_none: 'চার্জ না থাকলে পাতের ফাঁক বদলাত না।',
    mis_un_cant: 'যন্ত্রের চার্জ জানা আছে (পজিটিভ), তাই ফাঁক দেখেই বলা যায়।',

    q_comb: 'ফ্লানেলে ঘষা চিরুনি চাকতিতে ছুঁইয়ে সরিয়ে নেওয়া হলো। সোনার পাত দুটিতে এখন কোন চার্জ?',
    why_comb: '<b>নেগেটিভ</b>। চিরুনির নেগেটিভ চার্জ চাকতি থেকে সোনার পাত পর্যন্ত ছড়িয়ে পড়ে, তাই পাত দুটি ফাঁক হয়।',
    mis_comb_pos: 'ছোঁয়ালে বস্তুর চার্জই আসে; চিরুনির চার্জ নেগেটিভ।',
    mis_comb_none: 'চার্জ না থাকলে পাত দুটি ঝুলে থাকত।',

    q_rain: 'বর্ষাকালে স্থির বিদ্যুতের পরীক্ষাগুলো ঠিক করে কাজ করে না কেন? (ছবিতে ভেজা দিনে আহিত যন্ত্রটি দেখো)',
    c_rain_right: 'বাতাসের জলীয় বাষ্পে চার্জ হারিয়ে যায়',
    c_rain_heavy: 'ভেজা বাতাসে সোনার পাত ভারী হয়ে যায়',
    c_rain_more: 'বর্ষায় চার্জ আরও বেড়ে যায়',
    c_rain_cold: 'ঠান্ডায় ইলেকট্রন চলতে পারে না',
    why_rain: '<b>জলীয় বাষ্প</b>। বাতাসে জলীয় বাষ্প থাকলে জমা হওয়া চার্জ দ্রুত হারিয়ে যায়, তাই পাত বুজে আসে।',
    mis_rain_heavy: 'পাত বোতলের ভেতরে; সে ভারী হয়নি, চার্জ চলে যাওয়াতেই বুজে আসে।',
    mis_rain_more: 'চার্জ বাড়লে পাত আরো ফাঁক হতো।',
    mis_rain_cold: 'ধাতুতে ইলেকট্রন সব সময়ই চলতে পারে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'The electroscope: with a charge, the two gold leaves spread apart',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    aria_stage: 'An electroscope in a glass bottle on a table: a metal disc on top, a rod through an insulating stopper, two gold leaves below',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_tap: 'Tap the instrument',
    howto_drag: 'Drag nearer or farther',
    drag_me: 'Drag',
    aria_drag: 'Move the rod or comb nearer to the disc or away',

    ex_label: 'Steps',
    ex_parts: 'The parts',
    ex_near: 'Bring near',
    ex_touch: 'Touch',
    ex_test: 'Find the sign',

    act_parts: 'See the parts',
    act_near: 'Bring the glass rod near',
    act_touch: 'Touch the disc',
    act_comb: 'Bring the comb near',
    act_glass: 'Bring the glass rod near',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Watch again',

    intro:
      'A glass bottle on the table. Inside, two very light gold leaves hang side by side. It is an electroscope. Let’s see what the leaves do when a charge comes.',
    intro_short: 'Two light gold leaves in a bottle. Let’s see what they do when a charge comes.',

    lead_parts: 'Now bring a glass rod rubbed with silk near the disc, without touching.',
    lead_near: 'Drag the rod nearer and farther. Then touch the disc with it.',
    lead_touch: 'Now it has a known charge: positive. Bring a rubbed comb near: what is its charge?',
    lead_testNeg: 'Now bring the glass rod near, rubbed with silk again.',
    lead_testPos: 'All the steps are done. Drag the rod if you like, then take the test.',

    out_parts: 'From the disc to the leaves it is all metal. As many + as −, so no charge: the leaves <b>hang together</b>.',
    out_near: 'No touch, yet the leaves <b>spread</b>. Electrons (−) went up to the disc; + is left on the leaves.',
    out_near_far: 'The rod is far, so the electrons came back down: the leaves <b>closed</b>.',
    out_near_mid: 'The rod is a little farther: fewer electrons went up, a <b>smaller gap</b>.',
    out_touch: 'Rod gone, the leaves <b>stay apart</b>. Some electrons went into the glass: it is now positive.',
    out_testNeg: 'The comb’s negative charge pushed electrons down: the gap <b>got smaller</b>, so it is <b>negative</b>.',
    out_testNeg_far: 'The comb is far: the gap as before. Bring it near and the gap shrinks.',
    out_testPos: 'The glass’s positive charge pulled electrons up: the gap <b>got wider</b>, so it is <b>positive</b>.',
    out_testPos_far: 'The rod is far: the gap as before. Bring it near and the gap widens.',

    rule_parts:
      'The leaves are joined to a metal disc by a conducting rod. An <b>insulating stopper</b> holds it all in a glass bottle, so the air cannot move the thin leaves.',
    rule_near:
      'A positive rod near the disc induces negative charge on it: it comes from the other parts, leaving positive on the leaves. This is <b>charging by induction</b>.',
    rule_touch:
      'On touching, charge spreads over the disc, rod and leaves; both leaves get the same charge and repel. This is <b>charging</b>. A comb rubbed with flannel gives negative.',
    rule_testNeg:
      'To find the kind of a charge, first give the disc a known charge (here positive). Then bring a body near: if the gap gets smaller, it carries a <b>negative charge</b>.',
    rule_testPos:
      'On a positive electroscope, a smaller gap means the body is negative; a wider gap means it is surely positive. This finds <b>the kind of a charge</b>.',

    lbl_disc: 'metal disc',
    lbl_rod: 'conducting rod',
    lbl_leaf: 'gold leaf',
    lbl_stopper: 'insulating stopper',
    lbl_glass: 'glass rod',
    lbl_silk: 'silk',
    lbl_comb: 'comb',
    lbl_flannel: 'flannel',
    lbl_unknown: 'unknown rod',
    lbl_before: 'gap before',
    legend_plus: 'positive charge',
    legend_minus: 'negative charge (electron)',
    legend_pair: 'pair = no charge',
    note_few: 'A few charges drawn; really a huge number',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at the picture and pick an answer.',

    c_pos: 'Positive',
    c_neg: 'Negative',
    c_none: 'No charge',
    c_mixed: 'One positive, one negative',
    c_cant: 'Can’t tell',

    q_induce: 'A glass rod rubbed with silk is brought near the disc without touching it. What charge do the leaves have now?',
    why_induce: '<b>Positive</b>. The glass pulls electrons up to the disc; positive is left on the leaves.',
    mis_induce_neg: 'The negative gathers on the disc, not on the leaves.',
    mis_induce_none: 'Without a charge the leaves would not spread.',
    mis_mixed: 'Opposite charges attract: the leaves would stick.',

    q_spread: 'The glass rod touched the disc and was taken away. Why do the leaves stay apart?',
    c_sp_right: 'Same charge on both: they repel',
    c_sp_opp: 'Opposite charges: they attract',
    c_sp_rod: 'The far rod still pulls them',
    c_sp_air: 'The air in the bottle pushes them',
    why_spread: '<b>Like charges repel</b>. Both leaves are positive, so they push each other apart.',
    mis_sp_opp: 'Opposite charges attract; the leaves would stick together.',
    mis_sp_rod: 'The rod is gone; the gap stays because of the leaves’ own charge.',
    mis_sp_air: 'The air in the bottle is still; that is what the bottle is for.',

    q_unknown: 'The electroscope already has a positive charge. Watch what the leaves do as the unknown rod comes near. What is the rod’s charge?',
    why_unknown_neg: '<b>Negative</b>. The instrument is positive and the gap shrank, so the rod is negative.',
    why_unknown_pos: '<b>Positive</b>. The instrument is positive and the gap widened, so the rod is positive.',
    mis_un_flip: 'A smaller gap means the opposite charge; a wider gap, the same.',
    mis_un_none: 'Without a charge the gap would not change.',
    mis_un_cant: 'The electroscope’s charge is known (positive), so the gap tells.',

    q_comb: 'A comb rubbed with flannel touched the disc and was taken away. What charge do the leaves have now?',
    why_comb: '<b>Negative</b>. The comb’s charge spreads from the disc to the leaves.',
    mis_comb_pos: 'A touch brings the body’s own charge; the comb’s is negative.',
    mis_comb_none: 'Without a charge the leaves would hang together.',

    q_rain: 'Why don’t static electricity experiments work well in the rainy season? (See the charged electroscope on a damp day.)',
    c_rain_right: 'Water vapour in the air takes the charge away',
    c_rain_heavy: 'Damp air makes the leaves heavy',
    c_rain_more: 'The charge grows in the rainy season',
    c_rain_cold: 'Electrons can’t move in the cold',
    why_rain: '<b>Water vapour</b>. With water vapour in the air, a charge is quickly lost, so the leaves close.',
    mis_rain_heavy: 'The leaves are inside the bottle; they close because the charge goes.',
    mis_rain_more: 'More charge would open the leaves wider.',
    mis_rain_cold: 'Electrons can always move in a metal.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language is put in.
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
