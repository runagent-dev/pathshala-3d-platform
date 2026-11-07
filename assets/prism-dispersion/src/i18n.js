// Every string the figure shows, in Bangla and English. The book's words on page 254 (topic 9.3.2 প্রিজম, চিত্র ৯.১২):
// "আলোক বিজ্ঞানের ভাষায় দুইটি অসমান্তরাল সমতল পৃষ্ঠ দ্বারা আবদ্ধ একটি স্বচ্ছ মাধ্যমকে বলে প্রিজম", "প্রথম পৃষ্ঠ দিয়ে আলোক
// রশ্মিটি প্রবেশ করার সময় লম্বের দিকে বেঁকে যায়", "যেহেতু দ্বিতীয় পৃষ্ঠটি সমান্তরাল নয় তাই সেই পৃষ্ঠ দিয়ে আলো বের হওয়ার
// সময় লম্ব থেকে সরে গেলেও সেটি আর মূল দিকে ঘুরে যেতে পারে না", the caption "প্রিজমের আলোক রশ্মির দিক প্রিজমের ভূমির দিকে
// বেঁকে যায়", the figure's labels "আলোর মূল দিক" and "প্রতিসরিত আলোর দিক", "প্রতিসরণাঙ্ক আসলে আলোর তরঙ্গ দৈর্ঘ্য বা রঙের
// ওপর নির্ভর করে", "ভিন্ন ভিন্ন রঙের জন্য প্রতিসরণাঙ্ক ভিন্ন", "প্রিজম থেকে আলো বের হবার সময় তার রংগুলো আলাদা হয়ে গেছে,
// নিউটন প্রথম দেখিয়েছিলেন". The page writes ওপর, লম্ব (the chapter's অভিলম্ব), রং / রঙের. Colour names as the sister
// figure light-spectrum (বেগুনি নীল সবুজ হলুদ কমলা লাল). Added by the figure, not on the page: বাতি, লাল কাচ, পর্দা, সাদা আলো.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not a
// var is another string of the same language. The questions (q_*) are plain text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'প্রিজম: আলো ভূমির দিকে বাঁকে, রংগুলো আলাদা হয়',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ফল',
    aria_stage: 'টেবিলে একটি কাচের প্রিজম, বাঁ পাশে একটি বাতি, ডান পাশে একটি সাদা পর্দা',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_lamp: 'টেনে বাতি ঘোরাও',
    aria_howto_lamp: 'টেনে বাতি ঘোরাও: ছবিতে বাতির সাদা চাকতিটি দেখাও',
    drag_me: 'বাতি ঘোরাও',
    aria_drag_lamp: 'বাতিটি ঘোরাও (আপতন কোণ বদলাও); তীর চিহ্নের বোতাম দিয়েও বদলানো যায়',

    // the steps
    ex_label: 'ধাপ',
    ex_enter: 'ঢোকা',
    ex_exit: 'বের হওয়া',
    ex_base: 'ভূমির দিকে',
    ex_white: 'সাদা আলো',
    ex_colours: 'রং',

    // the action and the quiet button
    act_on: 'বাতি জ্বালাও',
    act_exit: 'আলো বের হতে দাও',
    act_base: 'মূল দিকের সাথে মেলাও',
    act_white: 'লাল কাচ সরাও',
    act_colours: 'রংগুলো দেখো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen
    intro:
      'টেবিলে একটি কাচের প্রিজম, বাঁ পাশে একটি বাতি আর ডান পাশে সাদা পর্দা। বাতির সামনে লাল কাচ, তাই প্রথমে শুধু লাল আলো যাবে। চলো দেখি, প্রিজমের ভেতর দিয়ে আলো কোন দিকে যায়।',
    intro_short: 'কাচের প্রিজম, বাতি আর সাদা পর্দা। চলো দেখি, প্রিজমে আলো কোন দিকে যায়।',

    // the line before the action: what the next tap will show
    lead_enter: 'এবার আলো দ্বিতীয় পৃষ্ঠ দিয়ে বের হবে।',
    lead_exit: 'আলো কি তার মূল দিকে ফিরে গেল?',
    lead_base: 'এবার লাল কাচ সরিয়ে সাদা আলো পাঠাই।',
    lead_white: 'কোন রং কতটা বাঁকল, আর কেন?',
    lead_colours: 'এবার নিজে যাচাই করো।',

    // the result line
    out_enter: 'ঢোকার সময় আলো <b>লম্বের দিকে</b> বেঁকে গেল: লম্বের সাথে {i}° থেকে {r}°।',
    out_exit: 'বের হওয়ার সময় আলো <b>লম্ব থেকে সরে</b> গেল: লম্বের সাথে {r2}° থেকে {e}°।',
    out_base: 'আলো তার মূল দিক থেকে <b>{d}°</b> বেঁকেছে, প্রিজমের ভূমির দিকে।',
    out_white: 'সাদা আলো রঙে রঙে আলাদা হয়ে গেছে: <b>বেগুনি</b> সবচেয়ে বেশি বেঁকেছে, <b>লাল</b> সবচেয়ে কম।',
    out_colour_violet: '{c} আলোয় কাচের প্রতিসরণাঙ্ক <b>{n}</b>, সবচেয়ে বেশি; তাই বেগুনি সবচেয়ে বেশি বাঁকে।',
    out_colour_red: '{c} আলোয় কাচের প্রতিসরণাঙ্ক <b>{n}</b>, সবচেয়ে কম; তাই লাল সবচেয়ে কম বাঁকে।',
    out_colour_mid: '{c} আলোয় কাচের প্রতিসরণাঙ্ক <b>{n}</b>: বেগুনির চেয়ে কম, লালের চেয়ে বেশি।',

    // the rule: the book's words, the book's term in bold
    rule_enter: 'আলো বাতাস থেকে কাচে ঢুকছে। প্রথম পৃষ্ঠ দিয়ে আলোক রশ্মিটি প্রবেশ করার সময় <b>লম্বের দিকে</b> বেঁকে যায়।',
    rule_exit:
      'কাচ থেকে বাতাসে বের হওয়ার সময় আলো লম্ব থেকে সরে যায়। কিন্তু দ্বিতীয় পৃষ্ঠটি প্রথমটির সমান্তরাল নয়: দুইটি <b>অসমান্তরাল সমতল পৃষ্ঠ</b> দিয়ে ঘেরা স্বচ্ছ মাধ্যমই প্রিজম।',
    rule_base: 'দ্বিতীয় পৃষ্ঠটি সমান্তরাল নয়, তাই আলো আর মূল দিকে ঘুরে যেতে পারে না। প্রিজমের আলোক রশ্মির দিক প্রিজমের <b>ভূমির দিকে</b> বেঁকে যায়। বাতি ঘুরিয়ে দেখো।',
    rule_white:
      'প্রতিসরণাঙ্ক আলোর তরঙ্গ দৈর্ঘ্য বা রঙের ওপর নির্ভর করে। তাই ভিন্ন ভিন্ন রং ভিন্ন ভিন্ন কোণে দিক পরিবর্তন করে, আর প্রিজম থেকে বের হবার সময় <b>রংগুলো আলাদা হয়ে যায়</b>।',
    rule_colours: 'যে রঙের জন্য প্রতিসরণাঙ্ক বেশি, সে বেশি বাঁকে। সাদা আলোর রংগুলো প্রিজমে এভাবে আলাদা হয়, <b>নিউটন</b> প্রথম দেখিয়েছিলেন। গ্রাফে রং বেছে নাও।',

    // the colours (as light-spectrum)
    c_violet: 'বেগুনি',
    c_blue: 'নীল',
    c_green: 'সবুজ',
    c_yellow: 'হলুদ',
    c_orange: 'কমলা',
    c_red: 'লাল',

    // labels on the picture (short)
    lbl_prism: 'প্রিজম',
    lbl_filter: 'লাল কাচ',
    lbl_screen: 'পর্দা',
    lbl_lamp: 'বাতি',
    lbl_normal: 'লম্ব',
    lbl_deg: '{a}°',
    lbl_orig: 'আলোর মূল দিক',
    lbl_out: 'প্রতিসরিত আলোর দিক',
    lbl_base: 'ভূমি',
    lbl_white: 'সাদা আলো',

    // the graph in the panel
    g_title: 'কাচের প্রতিসরণাঙ্ক, রং অনুযায়ী',
    g_axis_n: 'n',
    g_axis_nm: 'তরঙ্গ দৈর্ঘ্য (nm)',
    g_book: 'বইয়ের সারণি: কাচ {n}',
    g_aria: 'গ্রাফ: সাধারণ কাচের প্রতিসরণাঙ্ক বেগুনি আলোয় সবচেয়ে বেশি, লাল আলোয় সবচেয়ে কম',
    g_pick: '{c}: প্রতিসরণাঙ্ক {n}',
    g_note: 'সাধারণ কাচ (আনুমানিক মান)',

    // the notes in the corner
    note_drawn: 'আলোর পথ এঁকে দেখানো',
    note_spread: 'রঙের ছড়ানো {k} গুণ বাড়িয়ে দেখানো',

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
    letters: 'কখগঘ',

    q_path: 'লাল আলো প্রিজমের দ্বিতীয় পৃষ্ঠ দিয়ে বের হবে। ছবির কোন পথে যাবে?',
    a_path: '<b>{x} পথে</b>: বের হওয়ার সময় লম্ব থেকে সরে, প্রিজমের ভূমির দিকে।',
    n_path_straight: 'পৃষ্ঠ পার হওয়ার সময় আলো বাঁকে; সোজা যায় না।',
    n_path_orig: 'দ্বিতীয় পৃষ্ঠ সমান্তরাল নয়, তাই আলো মূল দিকে ফেরে না।',
    n_path_apex: 'আলো শীর্ষের দিকে নয়, ভূমির দিকে বাঁকে।',

    q_why: 'দ্বিতীয় পৃষ্ঠে আলো লম্ব থেকে সরে গেল, তবু মূল দিকে ফিরল না। কেন?',
    c_why_right: 'দুই পৃষ্ঠ সমান্তরাল নয়',
    c_why_absorb: 'কাচ আলো শুষে নেয়',
    c_why_toward: 'বের হতে আলো লম্বের দিকে বাঁকে',
    c_why_reflect: 'আলো ভেতরে প্রতিফলিত হয়',
    a_why: '<b>দুই পৃষ্ঠ সমান্তরাল নয়</b>। কাচের ফলকে দুই পৃষ্ঠ সমান্তরাল বলে আলো মূল দিকে ফেরে; প্রিজমে ফেরে না।',
    n_why_absorb: 'শোষণে আলো কমে, দিক বদলায় না।',
    n_why_toward: 'বের হওয়ার সময় আলো লম্ব থেকে সরে যায়।',
    n_why_reflect: 'আলো দ্বিতীয় পৃষ্ঠ দিয়ে বের হয়ে গেছে।',

    q_red: 'সাদা আলো পাঠালে পর্দার কোন দাগে লাল আলো পড়বে?',
    a_red: '<b>দাগ {x}</b>: লালের প্রতিসরণাঙ্ক সবচেয়ে কম, তাই সে সবচেয়ে কম বাঁকে।',
    n_red_violet: 'সবচেয়ে বেশি বাঁকে বেগুনি; সেটি এখানে পড়ে।',
    n_red_green: 'এখানে পড়ে সবুজ, লাল আর বেগুনির মাঝে।',
    n_red_straight: 'দ্বিতীয় পৃষ্ঠেও আলো বাঁকে; সোজা গেলে এখানে পড়ত।',

    q_cause: 'প্রিজমে সাদা আলোর রংগুলো আলাদা হয়ে গেল কেন?',
    c_cause_right: 'রং ভেদে কাচের প্রতিসরণাঙ্ক ভিন্ন',
    c_cause_paint: 'প্রিজমের কাচ আলোকে রং করে',
    c_cause_screen: 'পর্দা নিজেই রং তৈরি করে',
    c_cause_reflect: 'কাচের পৃষ্ঠে আলো প্রতিফলিত হয়',
    a_cause: '<b>রং ভেদে প্রতিসরণাঙ্ক ভিন্ন</b>, তাই প্রতিটি রং ভিন্ন কোণে দিক বদলায়। রংগুলো সাদা আলোতেই ছিল।',
    n_cause_paint: 'কাচ রং যোগ করে না; লাল কাচ সরানোর পরই রং দেখা গেল।',
    n_cause_screen: 'পর্দা সাদা; লাল কাচ থাকলে তাতে শুধু লাল পড়ে।',
    n_cause_reflect: 'প্রতিফলনে রং আলাদা হয় না; প্রতিসরণে হয়।',

    q_define: 'আলোক বিজ্ঞানের ভাষায় প্রিজম কী?',
    c_def_right: 'দুইটি অসমান্তরাল সমতল পৃষ্ঠে ঘেরা স্বচ্ছ মাধ্যম',
    c_def_slab: 'দুইটি সমান্তরাল সমতল পৃষ্ঠে ঘেরা স্বচ্ছ মাধ্যম',
    c_def_lens: 'দুইটি বাঁকা পৃষ্ঠে ঘেরা স্বচ্ছ মাধ্যম',
    c_def_mirror: 'আলো ফিরিয়ে দেয় এমন মসৃণ সমতল পৃষ্ঠ',
    a_def: '<b>দুইটি অসমান্তরাল সমতল পৃষ্ঠে ঘেরা স্বচ্ছ মাধ্যম</b>। ছবির প্রিজমের দুই পৃষ্ঠ ঢালু হয়ে শীর্ষে মিলেছে।',
    n_def_slab: 'এটি কাচের ফলক; তাতে আলো মূল দিকে ফেরে।',
    n_def_lens: 'বাঁকা পৃষ্ঠের স্বচ্ছ মাধ্যম হলো লেন্স।',
    n_def_mirror: 'এটি দর্পণ; প্রিজম আলো প্রতিসরিত করে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A prism: light bends toward the base, and the colours separate',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Result',
    aria_stage: 'A glass prism on a table, a lamp on the left and a white screen on the right',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_lamp: 'Drag to turn the lamp',
    aria_howto_lamp: 'Drag to turn the lamp: show the white disc on the lamp',
    drag_me: 'Turn the lamp',
    aria_drag_lamp: 'Turn the lamp (change the angle of incidence); the arrow keys work too',

    ex_label: 'Steps',
    ex_enter: 'In',
    ex_exit: 'Out',
    ex_base: 'To the base',
    ex_white: 'White light',
    ex_colours: 'Colours',

    act_on: 'Switch on the lamp',
    act_exit: 'Let the light out',
    act_base: 'Compare directions',
    act_white: 'Take off the red glass',
    act_colours: 'Look at the colours',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro:
      'A glass prism, a lamp and a white screen. A red glass on the lamp lets only red light out. Let us see which way light goes through a prism.',
    intro_short: 'A glass prism, a lamp and a screen. Which way does light go through a prism?',

    lead_enter: 'Now the light leaves by the second face.',
    lead_exit: 'Did it turn back to its first direction?',
    lead_base: 'Now take off the red glass: white light.',
    lead_white: 'Which colour bent how much, and why?',
    lead_colours: 'Now test yourself.',

    out_enter: 'Going in, the light bent <b>toward the normal</b>: from {i}° to {r}°.',
    out_exit: 'Coming out, it bent <b>away from the normal</b>: from {r2}° to {e}°.',
    out_base: 'The light turned <b>{d}°</b> from its original direction, toward the base.',
    out_white: 'White light split into colours: <b>violet</b> bent most, <b>red</b> least.',
    out_colour_violet: 'For {c} light, glass has index <b>{n}</b>, the highest: violet bends most.',
    out_colour_red: 'For {c} light, glass has index <b>{n}</b>, the lowest: red bends least.',
    out_colour_mid: 'For {c} light, glass has index <b>{n}</b>: less than violet, more than red.',

    rule_enter: 'Light goes from air into glass. Entering by the first face, the ray bends <b>toward the normal</b>.',
    rule_exit:
      'Leaving glass, light bends away from the normal. But the faces are not parallel: a transparent medium bounded by two <b>non-parallel plane faces</b> is a prism.',
    rule_base:
      'The second face is not parallel, so the light cannot turn back to its original direction: it bends <b>toward the base</b>. Turn the lamp and see.',
    rule_white:
      'The refractive index depends on the colour (wavelength) of light, so each colour turns by a different angle and <b>the colours separate</b>.',
    rule_colours:
      'The colour with the higher index bends more. <b>Newton</b> first showed white light splitting like this. Pick a colour on the graph.',

    c_violet: 'violet',
    c_blue: 'blue',
    c_green: 'green',
    c_yellow: 'yellow',
    c_orange: 'orange',
    c_red: 'red',

    lbl_prism: 'Prism',
    lbl_filter: 'Red glass',
    lbl_screen: 'Screen',
    lbl_lamp: 'Lamp',
    lbl_normal: 'Normal',
    lbl_deg: '{a}°',
    lbl_orig: 'Original direction',
    lbl_out: 'Refracted direction',
    lbl_base: 'Base',
    lbl_white: 'White light',

    g_title: 'Refractive index of glass, by colour',
    g_axis_n: 'n',
    g_axis_nm: 'Wavelength (nm)',
    g_book: "Book's table: glass {n}",
    g_aria: 'Graph: the refractive index of common glass is highest for violet light and lowest for red',
    g_pick: '{c}: index {n}',
    g_note: 'Common glass (typical values)',

    note_drawn: 'The light’s path is drawn',
    note_spread: 'Colours spread {k} times wider than real',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, and pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Look at the picture and pick an answer.',
    letters: 'ABCD',

    q_path: 'The red light leaves by the second face. Which path does it take?',
    a_path: '<b>Path {x}</b>: away from the normal, toward the base.',
    n_path_straight: 'Light bends as it crosses a face.',
    n_path_orig: 'The faces are not parallel, so it does not return to its first direction.',
    n_path_apex: 'It bends toward the base, not the apex.',

    q_why: 'Why did the light not turn back to its original direction?',
    c_why_right: 'The two faces are not parallel',
    c_why_absorb: 'Glass absorbs the light',
    c_why_toward: 'Leaving, light bends toward the normal',
    c_why_reflect: 'The light reflects inside',
    a_why: '<b>The faces are not parallel.</b> In a slab they are, so light returns to its direction.',
    n_why_absorb: 'Absorption dims light; it does not turn it.',
    n_why_toward: 'Leaving glass, light bends away from the normal.',
    n_why_reflect: 'The light has gone out through the second face.',

    q_red: 'If white light is sent, on which mark does the red light land?',
    a_red: '<b>Mark {x}</b>: red has the lowest index, so it bends the least.',
    n_red_violet: 'Violet bends the most; it lands here.',
    n_red_green: 'Green lands here, between red and violet.',
    n_red_straight: 'Light bends at the second face too; going straight it would land here.',

    q_cause: 'Why did the colours of white light separate in the prism?',
    c_cause_right: 'The index of glass differs by colour',
    c_cause_paint: 'The prism’s glass colours the light',
    c_cause_screen: 'The screen makes the colours',
    c_cause_reflect: 'Light reflects at the glass faces',
    a_cause: '<b>The index differs by colour</b>, so each colour turns by its own angle. The colours were in the white light.',
    n_cause_paint: 'Glass adds no colour.',
    n_cause_screen: 'The screen is white.',
    n_cause_reflect: 'Refraction splits colours, not reflection.',

    q_define: 'In optics, what is a prism?',
    c_def_right: 'A transparent medium bounded by two non-parallel plane faces',
    c_def_slab: 'A transparent medium bounded by two parallel plane faces',
    c_def_lens: 'A transparent medium bounded by two curved faces',
    c_def_mirror: 'A smooth plane surface that sends light back',
    a_def: '<b>A transparent medium bounded by two non-parallel plane faces.</b>',
    n_def_slab: 'That is a glass slab.',
    n_def_lens: 'That is a lens.',
    n_def_mirror: 'That is a mirror.',
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
    const s = dict[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
  }
  t.num = num;
  t.lang = code;
  return t;
}
