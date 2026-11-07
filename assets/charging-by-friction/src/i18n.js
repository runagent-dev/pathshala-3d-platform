// Every string the figure shows, in Bangla and English. The book's words on pages 274–275 (topic 10.2, ঘর্ষণে স্থির
// বিদ্যুৎ তৈরি): "এক টুকরো কাচকে যদি এক টুকরো সিল্ক দিয়ে ঘষা হয় … কাচ থেকে ইলেকট্রনগুলো সিল্কে আসতে শুরু করবে অর্থাৎ
// কাচটি হবে পজিটিভ বা ধনাত্মক চার্জযুক্ত আর সিল্কটি হবে নেগেটিভ চার্জযুক্ত। কারণ ইলেকট্রনের জন্য কাচের যত আসক্তি
// সিল্কের আসক্তি তার থেকে বেশি।", "প্লাস্টিককে ফ্লানেল (বা পশমি কাপড়) দিয়ে ঘষা হয় তাহলে ফ্লানেল থেকে ইলেকট্রন চলে আসবে
// প্লাস্টিকের টুকরোতে। কারণ ইলেকট্রনের জন্য প্লাস্টিকের আকর্ষণ ফ্লানেল থেকে বেশি।", বিদ্যুৎ অপরিবাহী সিল্কের সুতা,
// ঝুলন্ত, বিকর্ষিত হয়ে সরে যাচ্ছে, আহিত, দণ্ড, "একই ধরনের চার্জ একে অন্যকে বিকর্ষণ করে এবং ভিন্ন ভিন্ন চার্জ একে
// অন্যকে আকর্ষণ করে", মহাকর্ষ বল, "ঋণাত্মক ভর বলে কিছু নাই", "দুই রকম চার্জ এবং বলটিও দুই রকম". From 10.1 (p.272–273):
// প্রোটন (ধনাত্মক), ইলেকট্রন (ঋণাত্মক), চার্জ নিরপেক্ষ ("প্রত্যেক পরমাণুতে সমান সংখ্যক প্রোটন আর ইলেকট্রন"),
// "ইলেকট্রন আলাদা করার একটা উপায় হচ্ছে ঘর্ষণ", বিদ্যুৎ অপরিবাহী (কাঠ, প্লাস্টিক, কাচ, রাবার).
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. intro / intro_short
// are the first screen's calm card; lead_* the line before the action; out_* the result; rule_* the rule (the book's
// term in bold). Questions (q_*) are plain text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'ঘর্ষণে স্থির বিদ্যুৎ: ঘষলে ইলেকট্রন সরে যায়',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    rotate_me: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ফল',
    aria_stage: 'টেবিলে একটি কাচের দণ্ড ও এক টুকরো সিল্ক, একটি প্লাস্টিকের দণ্ড ও এক টুকরো ফ্লানেল; পেছনে দুটি স্ট্যান্ডে সিল্কের সুতায় ঝোলানো দুটি দণ্ড',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_rub: 'কাপড় টেনে ঘষো',
    howto_bring: 'দণ্ড টেনে কাছে আনো',
    drag_rub: 'টেনে ঘষো',
    drag_bring: 'টেনে আনো',
    aria_drag_cloth: 'কাপড়টি দণ্ড বরাবর এদিক-ওদিক টেনে ঘষো',
    aria_drag_rod: 'হাতের দণ্ডটি ঝুলন্ত দণ্ডের কাছে বা দূরে টেনে নাও',

    // the items of the book, as one row of words
    ex_label: 'পরীক্ষা',
    ex_glass: 'কাচ',
    ex_plastic: 'প্লাস্টিক',
    ex_pp: '+ +',
    ex_nn: '− −',
    ex_pn: '+ −',

    // the action and the quiet buttons
    act_glass0: 'কাচ ও সিল্ক কাছে দেখো',
    act_glass: 'সিল্ক দিয়ে কাচ ঘষো',
    act_plastic0: 'এবার প্লাস্টিক দেখো',
    act_plastic: 'ফ্লানেলে প্লাস্টিক ঘষো',
    act_pp0: 'কাচ দণ্ড হাতে নাও',
    act_pp: 'কাচ দণ্ড কাছে আনো',
    act_nn0: 'প্লাস্টিক হাতে নাও',
    act_nn: 'প্লাস্টিক কাছে আনো',
    act_pn0: 'এবার কাচ হাতে নাও',
    act_pn: 'কাচ কাছে আনো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_replay: 'আবার দেখো',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro:
      'টেবিলে একটি কাচের দণ্ড ও এক টুকরো সিল্ক, একটি প্লাস্টিকের দণ্ড ও এক টুকরো ফ্লানেল (পশমি কাপড়)। শুকনো চুলে চিরুনি চালালে চিরুনি কাগজ টানে। এদের ঘষলেও তেমন হয়। কেন? চলো দেখি।',
    intro_short: 'কাচ, প্লাস্টিক, সিল্ক আর ফ্লানেল: ঘষলে কী হয়? চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_glass0: 'এবার সিল্ক দিয়ে কাচটি ঘষি। কাপড়টি টেনেও ঘষতে পারো।',
    lead_glass: 'প্লাস্টিককে ফ্লানেল দিয়ে ঘষলে কী হয়?',
    lead_plastic0: 'এবার ফ্লানেল দিয়ে প্লাস্টিকটি ঘষি।',
    lead_plastic: 'ধরো, একইভাবে আরেকটি কাচ ঘষে সিল্কের সুতায় ঝুলিয়েছি।',
    lead_pp0: 'হাতের কাচটি ঝুলন্ত কাচের কাছে আনি। দণ্ডটি টেনেও আনতে পারো।',
    lead_pp: 'ধরো, দুটি প্লাস্টিকও ঘষে আহিত করেছি; একটি ঝুলছে।',
    lead_nn0: 'হাতের প্লাস্টিকটি ঝুলন্ত প্লাস্টিকের কাছে আনি।',
    lead_nn: 'ঝুলন্ত প্লাস্টিকের কাছে এবার ধনাত্মক কাচ আনলে কী হবে?',
    lead_pn0: 'কাচটি ঝুলন্ত প্লাস্টিকের কাছে আনি।',
    lead_pn: 'এবার নিজে যাচাই করো।',

    // the result line
    out_glass0: 'লাল <b>+</b> প্রোটন, নীল <b>−</b> ইলেকট্রন। কাচে আর সিল্কে দুটোই <b>সমান সমান</b>।',
    out_glass: 'কাচ থেকে <b>{n}টি ইলেকট্রন</b> সিল্কে গেল। কাচে এখন + বেশি, সিল্কে − বেশি।',
    out_plastic0: 'প্লাস্টিক আর ফ্লানেলেও + আর − <b>সমান সমান</b>।',
    out_plastic: 'ফ্লানেল থেকে <b>{n}টি ইলেকট্রন</b> প্লাস্টিকে এল। প্লাস্টিকে এখন − বেশি, ফ্লানেলে + বেশি।',
    out_pp0: 'দুটো কাচই <b>ধনাত্মক</b>। ঝুলন্ত কাচটি সুতার চারদিকে ঘুরতে পারে।',
    out_pp: 'ঝুলন্ত কাচটি <b>দূরে সরে গেল</b>।',
    out_nn0: 'দুটো প্লাস্টিকই <b>ঋণাত্মক</b>। এবারও কি সরে যাবে?',
    out_nn: 'ঝুলন্ত প্লাস্টিকও <b>দূরে সরে গেল</b>।',
    out_pn0: 'হাতে <b>ধনাত্মক</b> কাচ, ঝুলছে <b>ঋণাত্মক</b> প্লাস্টিক। আগে ভেবে দেখো।',
    out_pn: 'ঝুলন্ত প্লাস্টিকটি কাচের <b>দিকে ঘুরে এল</b>।',
    out_rub_more: 'ঘষা <span class="cf-prog">{n}/{m}</span>। কাপড়টি দণ্ড বরাবর এদিক-ওদিক টানো।',
    out_bring_more: 'দণ্ডটি আরও কাছে টেনে আনো।',

    // the rule: the book's words, the term in bold
    rule_glass0:
      'এমনিতে সব বস্তু <b>চার্জ নিরপেক্ষ</b>: যত প্রোটন, তত ইলেকট্রন। ইলেকট্রন আলাদা করার একটা উপায় হচ্ছে <b>ঘর্ষণ</b>। (একেকটি চিহ্ন আসলে অনেক কোটি চার্জ।)',
    rule_glass: 'ইলেকট্রনের জন্য কাচের যত আসক্তি সিল্কের আসক্তি তার থেকে বেশি। তাই কাচ হয় <b>পজিটিভ বা ধনাত্মক চার্জযুক্ত</b>, সিল্ক <b>নেগেটিভ চার্জযুক্ত</b>।',
    rule_plastic0: 'ঘষলে শুধু ইলেকট্রন সরে; প্রোটন নিজের জায়গা ছাড়ে না। কোন দিকে সরবে, তা নির্ভর করে <b>ইলেকট্রনের জন্য আসক্তির</b> ওপর।',
    rule_plastic: 'ইলেকট্রনের জন্য প্লাস্টিকের আকর্ষণ ফ্লানেল থেকে বেশি। তাই প্লাস্টিক হয় <b>নেগেটিভ বা ঋণাত্মক</b>, ফ্লানেল <b>পজিটিভ</b>।',
    rule_pp0: 'সুতাটি সিল্কের, <b>বিদ্যুৎ অপরিবাহী</b>: চার্জ দণ্ডেই থাকে। (এখন দণ্ডে শুধু বাড়তি চার্জের চিহ্ন।)',
    rule_pp: 'দুটোই ধনাত্মক। তারা একে অন্যকে <b>বিকর্ষণ</b> করে।',
    rule_nn0: 'তীর দুটি দেখাবে কোন দিকে বল।',
    rule_nn: 'দুটোই ঋণাত্মক। এরাও একে অন্যকে <b>বিকর্ষণ</b> করে।',
    rule_pn0: 'একটি ধনাত্মক, অন্যটি ঋণাত্মক: ভিন্ন চার্জ।',
    rule_pn:
      'একই ধরনের চার্জ একে অন্যকে <b>বিকর্ষণ</b> করে এবং ভিন্ন ভিন্ন চার্জ একে অন্যকে <b>আকর্ষণ</b> করে। মহাকর্ষে বল শুধু আকর্ষণ, কারণ ভর এক রকম; চার্জ দুই রকম, তাই বলও দুই রকম।',

    // labels on the picture (short)
    lbl_glass: 'কাচ',
    lbl_silk: 'সিল্ক',
    lbl_plastic: 'প্লাস্টিক',
    lbl_flannel: 'ফ্লানেল',
    lbl_glass_pos: 'কাচ: ধনাত্মক',
    lbl_silk_neg: 'সিল্ক: ঋণাত্মক',
    lbl_plastic_neg: 'প্লাস্টিক: ঋণাত্মক',
    lbl_flannel_pos: 'ফ্লানেল: ধনাত্মক',
    lbl_electron: 'ইলেকট্রন',
    lbl_rubs: 'ঘষা {n}/{m}',
    lbl_thread: 'সিল্কের সুতা',
    lbl_hang_glass: 'ঝুলন্ত কাচ',
    lbl_hang_plastic: 'ঝুলন্ত প্লাস্টিক',
    lbl_hang_unknown: 'ঝুলন্ত দণ্ড: ?',
    lbl_held_glass: 'হাতের কাচ',
    lbl_held_plastic: 'হাতের প্লাস্টিক',
    lbl_repel: 'বিকর্ষণ',
    lbl_attract: 'আকর্ষণ',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ভেবে সঠিক উত্তরটি বেছে নাও।',
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

    q_move: 'কাচটি সিল্ক দিয়ে ঘষা হয়েছে। চিহ্নগুলো দেখো: কী সরে গেছে?',
    c_mv_right: 'কাচ থেকে ইলেকট্রন সিল্কে',
    c_mv_back: 'সিল্ক থেকে ইলেকট্রন কাচে',
    c_mv_proton: 'কাচ থেকে প্রোটন সিল্কে',
    c_mv_new: 'কিছু সরে না, নতুন চার্জ তৈরি হয়',
    why_move: '<b>কাচ থেকে ইলেকট্রন সিল্কে।</b> সিল্কের আসক্তি বেশি, তাই কাচ ধনাত্মক, সিল্ক ঋণাত্মক।',
    mis_mv_back: 'উল্টো: সিল্কই ইলেকট্রন বেশি টানে।',
    mis_mv_proton: 'প্রোটন নিজের জায়গা ছাড়ে না; সরে শুধু ইলেকট্রন।',
    mis_mv_new: 'চার্জ নতুন তৈরি হয় না; কিছু ইলেকট্রন অন্য বস্তুতে যায়।',

    q_flannel: 'ছবিতে ফ্লানেল দিয়ে ঘষা প্লাস্টিক। চিহ্ন গুনে দেখো: ফ্লানেল এখন কেমন চার্জযুক্ত?',
    c_fl_right: 'ধনাত্মক',
    c_fl_neg: 'ঋণাত্মক',
    c_fl_zero: 'চার্জ নিরপেক্ষ',
    c_fl_both: 'যতটা ধনাত্মক, ততটাই ঋণাত্মক',
    why_flannel: '<b>ধনাত্মক।</b> ফ্লানেল থেকে ইলেকট্রন প্লাস্টিকে গেছে; ফ্লানেলে + বেশি রয়ে গেছে।',
    mis_fl_neg: 'ঋণাত্মক হয়েছে প্লাস্টিক, যে ইলেকট্রন পেয়েছে।',
    mis_fl_zero: 'ইলেকট্রন হারালে + আর − সমান থাকে না।',
    mis_fl_both: 'ফ্লানেলে + চিহ্ন বেশি, − কম।',

    q_predict: 'হাতের কাচটি কাছে আনা হলো। চিহ্ন দেখে বলো: ঝুলন্ত প্লাস্টিকটি কী করবে?',
    c_pr_right: 'কাচের দিকে ঘুরে আসবে',
    c_pr_away: 'কাচ থেকে দূরে সরে যাবে',
    c_pr_still: 'একটুও নড়বে না',
    c_pr_spin: 'কাচকে ঠেলে ধনাত্মক হয়ে যাবে',
    why_predict: '<b>কাচের দিকে ঘুরে আসবে।</b> ভিন্ন চার্জ একে অন্যকে আকর্ষণ করে।',
    mis_pr_away: 'দূরে সরে যায় একই ধরনের চার্জ হলে।',
    mis_pr_still: 'চার্জ দণ্ডেই আছে, তাই বল কাজ করে।',
    mis_pr_spin: 'কাছে আনলেই চার্জ বদলায় না; ইলেকট্রন সরতে ঘষা লাগে।',

    q_unknown: 'হাতের দণ্ড কাছে আনতেই ঝুলন্ত দণ্ডটি সরে গেল। চিহ্ন দেখে বলো: ঝুলন্ত দণ্ডে কোন চার্জ?',
    c_un_pos: 'ধনাত্মক',
    c_un_neg: 'ঋণাত্মক',
    c_un_zero: 'চার্জ নিরপেক্ষ',
    c_un_any: 'যেকোনো চার্জ হতে পারে',
    why_un_pos: '<b>ধনাত্মক।</b> হাতের কাচ ধনাত্মক; সরে গেছে মানে বিকর্ষণ, তাই একই ধরনের চার্জ।',
    why_un_neg: '<b>ঋণাত্মক।</b> হাতের প্লাস্টিক ঋণাত্মক; সরে গেছে মানে বিকর্ষণ, তাই একই ধরনের চার্জ।',
    mis_un_pos: 'ধনাত্মক হলে হাতের দণ্ডের দিকে ঘুরে আসত (আকর্ষণ)।',
    mis_un_neg: 'ঋণাত্মক হলে হাতের দণ্ডের দিকে ঘুরে আসত (আকর্ষণ)।',
    mis_un_zero: 'চার্জ নিরপেক্ষ দণ্ড এভাবে বিকর্ষিত হয় না।',
    mis_un_any: 'বিকর্ষণ হয় শুধু একই ধরনের চার্জে।',

    q_mass: 'মহাকর্ষ বল শুধু আকর্ষণ করে, কিন্তু চার্জের বল কখনো আকর্ষণ, কখনো বিকর্ষণ। কেন?',
    c_ms_right: 'চার্জ দুই রকম, ভর এক রকম',
    c_ms_strong: 'চার্জের বল মহাকর্ষের চেয়ে শক্তিশালী',
    c_ms_near: 'চার্জের বল শুধু কাছে কাজ করে',
    c_ms_negmass: 'ভরও কখনো কখনো ঋণাত্মক হয়',
    why_mass: '<b>চার্জ দুই রকম, ভর এক রকম।</b> ঋণাত্মক ভর বলে কিছু নাই, তাই মহাকর্ষ শুধু আকর্ষণ।',
    mis_ms_strong: 'বল কত বড়, তা দিয়ে আকর্ষণ না বিকর্ষণ ঠিক হয় না।',
    mis_ms_near: 'দূরত্ব দিয়ে বলের ধরন বদলায় না।',
    mis_ms_negmass: 'বই বলছে, ঋণাত্মক ভর বলে কিছু নাই।',
  },
  en: {
    panel_hide: 'Hide text',
    panel_show: 'Show text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Keep it like this',
    title: 'Static electricity by rubbing: rubbing moves electrons',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn the view',
    rotate_me: 'Turn the view',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Result',
    aria_stage:
      'On a table: a glass rod and a piece of silk, a plastic rod and a piece of flannel; behind them two stands, each with a rod hanging from a silk thread',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_rub: 'Drag the cloth to rub',
    howto_bring: 'Drag the rod closer',
    drag_rub: 'Drag to rub',
    drag_bring: 'Drag it',
    aria_drag_cloth: 'Drag the cloth to and fro along the rod to rub it',
    aria_drag_rod: 'Drag the rod in your hand toward or away from the hanging rod',

    ex_label: 'Experiment',
    ex_glass: 'Glass',
    ex_plastic: 'Plastic',
    ex_pp: '+ +',
    ex_nn: '− −',
    ex_pn: '+ −',

    act_glass0: 'See the glass closely',
    act_glass: 'Rub it with silk',
    act_plastic0: 'Now the plastic',
    act_plastic: 'Rub it with flannel',
    act_pp0: 'Pick up the glass rod',
    act_pp: 'Bring the glass near',
    act_nn0: 'Pick up the plastic rod',
    act_nn: 'Bring the plastic near',
    act_pn0: 'Pick up the glass rod',
    act_pn: 'Bring the glass near',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_replay: 'See it again',
    act_home: 'Start again',

    intro:
      'On the table: a glass rod and a piece of silk, a plastic rod and a piece of flannel (woollen cloth). A comb run through dry hair pulls bits of paper. Rubbing these does the same. Why? Let’s see.',
    intro_short: 'Glass, plastic, silk and flannel: what happens when we rub them? Let’s see.',

    lead_glass0: 'Now let’s rub the glass with the silk. You can also drag the cloth.',
    lead_glass: 'What happens when plastic is rubbed with flannel?',
    lead_plastic0: 'Now let’s rub the plastic with the flannel.',
    lead_plastic: 'Say we rubbed another glass rod the same way and hung it on a silk thread.',
    lead_pp0: 'Let’s bring the glass in our hand near the hanging glass. You can also drag the rod.',
    lead_pp: 'Say we charged two plastic rods too; one is hanging.',
    lead_nn0: 'Let’s bring the plastic in our hand near the hanging plastic.',
    lead_nn: 'What if we bring the positive glass near the hanging plastic?',
    lead_pn0: 'Let’s bring the glass near the hanging plastic.',
    lead_pn: 'Now test yourself.',

    out_glass0: 'Red <b>+</b> are protons, blue <b>−</b> electrons. The glass and the silk have <b>equal numbers</b> of each.',
    out_glass: '<b>{n} electrons</b> went from the glass to the silk. The glass now has more +, the silk more −.',
    out_plastic0: 'The plastic and the flannel too have <b>equal</b> + and −.',
    out_plastic: '<b>{n} electrons</b> came from the flannel to the plastic. The plastic now has more −, the flannel more +.',
    out_pp0: 'Both glass rods are <b>positive</b>. The hanging glass can turn about its thread.',
    out_pp: 'The hanging glass <b>moved away</b>.',
    out_nn0: 'Both plastic rods are <b>negative</b>. Will it move away again?',
    out_nn: 'The hanging plastic <b>moved away</b> too.',
    out_pn0: 'In the hand a <b>positive</b> glass; hanging, a <b>negative</b> plastic. Think first.',
    out_pn: 'The hanging plastic <b>turned toward</b> the glass.',
    out_rub_more: 'Rubbed <span class="cf-prog">{n}/{m}</span>. Drag the cloth to and fro along the rod.',
    out_bring_more: 'Drag the rod closer still.',

    rule_glass0:
      'Things are normally <b>neutral</b>: as many protons as electrons. One way to separate electrons is <b>friction</b>. (Each sign stands for many millions of charges.)',
    rule_glass:
      'The silk’s affinity for electrons is greater than the glass’s. So the glass becomes <b>positively charged</b> and the silk <b>negatively charged</b>.',
    rule_plastic0: 'Rubbing moves only electrons; the protons stay put. Which way they go depends on each material’s <b>affinity for electrons</b>.',
    rule_plastic: 'The plastic pulls electrons harder than the flannel. So the plastic becomes <b>negative</b> and the flannel <b>positive</b>.',
    rule_pp0: 'The thread is silk, an <b>insulator</b>: the charge stays on the rod. (The signs now show only the extra charge.)',
    rule_pp: 'Both are positive. They <b>repel</b> each other.',
    rule_nn0: 'The two arrows will show which way the forces act.',
    rule_nn: 'Both are negative. They <b>repel</b> each other too.',
    rule_pn0: 'One positive, the other negative: unlike charges.',
    rule_pn:
      'Like charges <b>repel</b> each other and unlike charges <b>attract</b>. Gravity only attracts, because there is one kind of mass; there are two kinds of charge, so two kinds of force.',

    lbl_glass: 'Glass',
    lbl_silk: 'Silk',
    lbl_plastic: 'Plastic',
    lbl_flannel: 'Flannel',
    lbl_glass_pos: 'Glass: positive',
    lbl_silk_neg: 'Silk: negative',
    lbl_plastic_neg: 'Plastic: negative',
    lbl_flannel_pos: 'Flannel: positive',
    lbl_electron: 'Electron',
    lbl_rubs: 'Rubbed {n}/{m}',
    lbl_thread: 'Silk thread',
    lbl_hang_glass: 'Hanging glass',
    lbl_hang_plastic: 'Hanging plastic',
    lbl_hang_unknown: 'Hanging rod: ?',
    lbl_held_glass: 'Glass in hand',
    lbl_held_plastic: 'Plastic in hand',
    lbl_repel: 'Repulsion',
    lbl_attract: 'Attraction',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Think, and pick the right answer.',
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

    q_move: 'The glass has been rubbed with silk. Look at the signs: what has moved?',
    c_mv_right: 'Electrons, glass to silk',
    c_mv_back: 'Electrons, silk to glass',
    c_mv_proton: 'Protons, glass to silk',
    c_mv_new: 'Nothing moves; new charge is made',
    why_move: '<b>Electrons, glass to silk.</b> The silk’s affinity is greater, so the glass turns positive, the silk negative.',
    mis_mv_back: 'The other way round: the silk pulls electrons harder.',
    mis_mv_proton: 'Protons stay put; only electrons move.',
    mis_mv_new: 'No charge is made; some electrons change bodies.',

    q_flannel: 'The picture shows plastic rubbed with flannel. Count the signs: how is the flannel charged now?',
    c_fl_right: 'Positive',
    c_fl_neg: 'Negative',
    c_fl_zero: 'Neutral',
    c_fl_both: 'As positive as negative',
    why_flannel: '<b>Positive.</b> Electrons went from the flannel to the plastic; the flannel is left with more +.',
    mis_fl_neg: 'The plastic gained electrons: it is the negative one.',
    mis_fl_zero: 'After losing electrons, + and − are no longer equal.',
    mis_fl_both: 'The flannel has more + signs than −.',

    q_predict: 'The glass in the hand is brought near. Read the signs: what will the hanging plastic do?',
    c_pr_right: 'Turn toward the glass',
    c_pr_away: 'Move away from the glass',
    c_pr_still: 'Not move at all',
    c_pr_spin: 'Push the glass and turn positive',
    why_predict: '<b>It turns toward the glass.</b> Unlike charges attract each other.',
    mis_pr_away: 'It moves away when the charges are alike.',
    mis_pr_still: 'The rod keeps its charge, so the force acts.',
    mis_pr_spin: 'Coming near does not change a charge; electrons move by rubbing.',

    q_unknown: 'As the rod in the hand comes near, the hanging rod moves away. Read the signs: what is its charge?',
    c_un_pos: 'Positive',
    c_un_neg: 'Negative',
    c_un_zero: 'Neutral',
    c_un_any: 'It could be either',
    why_un_pos: '<b>Positive.</b> The glass in the hand is positive; moving away means repulsion, so the charges are alike.',
    why_un_neg: '<b>Negative.</b> The plastic in the hand is negative; moving away means repulsion, so the charges are alike.',
    mis_un_pos: 'A positive rod would have turned toward it (attraction).',
    mis_un_neg: 'A negative rod would have turned toward it (attraction).',
    mis_un_zero: 'A neutral rod is not repelled like this.',
    mis_un_any: 'Only like charges repel.',

    q_mass: 'Gravity only attracts, but the force between charges sometimes attracts and sometimes repels. Why?',
    c_ms_right: 'Two kinds of charge, one kind of mass',
    c_ms_strong: 'The electric force is stronger',
    c_ms_near: 'The electric force acts only up close',
    c_ms_negmass: 'Mass is sometimes negative too',
    why_mass: '<b>Two kinds of charge, one kind of mass.</b> There is no negative mass, so gravity only attracts.',
    mis_ms_strong: 'How big a force is does not decide its kind.',
    mis_ms_near: 'Distance does not change the kind of force.',
    mis_ms_negmass: 'The book says there is no negative mass.',
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
