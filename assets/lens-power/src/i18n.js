// Every string the figure shows, in Bangla and English. The book's words on pages 264–266 (topic 9.4.3, লেন্সের ক্ষমতা): চশমা,
// "অমুকের চশমার পাওয়ার অনেক বেশি", "পাওয়ার কথাটি দিয়ে আমরা কী বোঝানোর চেষ্টা করি?", উত্তল লেন্স, অবতল লেন্স, "একই দূরত্বে",
// "যে লেন্সটিতে বড় দেখায় আমরা বলি সেই লেন্সের ক্ষমতা বেশি", "যে লেন্সের ফোকাস দূরত্ব যত কম সেই লেন্সে জিনিসটিকে তত বড় দেখায়"
// (চিত্র ৯.২৭), "লেন্সের ক্ষমতা P হচ্ছে ফোকাস দূরত্বের ব্যস্তানুপাতিক", "ফোকাস দূরত্ব f মিটারে দেওয়া হয় তাহলে ক্ষমতা P এর একক
// ডায়াপটার", "চশমার ক্ষমতা যদি হয় 2.5 ... f = 1/P = 1/2.5 m = 0.4 m", "যে অবতল লেন্সে বস্তুকে (সমান দূরত্বে) যত ছোট দেখা যাবে
// বুঝতে হবে তার পাওয়ার তত বেশি বা ফোকাস দূরত্ব তত ছোট", "উত্তল লেন্সের বেলায় ক্ষমতা ধনাত্মক বা পজিটিভ, অবতল লেন্সের বেলায়
// পাওয়ার ঋণাত্মক বা নেগেটিভ"; নিজে করো: চিত্র ৯.২৮, ৯.২৯ (a), (b). From 9.4.1–9.4.2: ফোকাস বিন্দু F, ফোকাস দূরত্ব, প্রধান অক্ষ,
// সমান্তরাল, প্রতিবিম্ব, বাস্তব / অবাস্তব, সোজা / উল্টো. The book spells ডায়াপটার (not ডায়অপ্টার) and writes the formula with f and P.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not a var is another
// string of the same language (the units {u_cm}, {u_m}, {u_d}). intro / intro_short: the first screen's calm card; lead_*: the line
// before the action; out_*: the result; rule_*: the rule, the book's term last and in bold. Questions (q_*) are plain text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'লেন্সের ক্ষমতা: P = 1/f, একক ডায়াপটার',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ফলাফল',
    aria_stage: 'আলোক বেঞ্চে একটি আলোর বাক্স, মাঝখানে খাঁজে বসানো একটি লেন্স; বেঞ্চের গায়ে সেন্টিমিটারের স্কেল',
    u_cm: 'cm',
    u_m: 'm',
    u_d: 'ডায়াপটার',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_tap: 'লেন্সে টোকা দাও',

    // the steps
    ex_label: 'ধাপ',
    ex_focus: 'ফোকাস',
    ex_pencil: 'পেনসিল',
    ex_compare: 'দুই লেন্স',
    ex_power: 'ক্ষমতা',
    ex_concave: 'অবতল',

    // the action and the quiet buttons
    act_light: 'আলো জ্বালাও',
    act_pencil: 'পেনসিল রেখে দেখো',
    act_compare: 'বাঁকা লেন্স বসাও',
    act_power: 'ক্ষমতা মাপো',
    act_power10: 'আরও বাঁকা লেন্স',
    act_concave: 'অবতল লেন্স বসাও',
    act_concave20: 'বাঁকা অবতল বসাও',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',

    // the first screen: a few calm words
    intro:
      'তোমরা নিশ্চয়ই বলতে শুনেছ, “অমুকের চশমার পাওয়ার অনেক বেশি।” চশমার কাচ আসলে লেন্স। টেবিলে একটি আলোর বাক্স আর একটি উত্তল লেন্স আছে। পাওয়ার কথাটি দিয়ে কী বোঝায়, চলো দেখি।',
    intro_short: 'চশমার “পাওয়ার” কথাটি দিয়ে কী বোঝায়? একটি উত্তল লেন্স দিয়ে চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_focus: 'এবার আলোর বদলে একটি পেনসিল রেখে দেখি।',
    lead_pencil: 'পেনসিল একই জায়গায় থাকুক; এবার বেশি বাঁকা একটি লেন্স বসাই।',
    lead_compare: 'ক্ষমতা কীভাবে মাপা হয়? আবার আলো ফেলে দেখি।',
    lead_power: 'আরও বাঁকা লেন্সে আলো কোথায় মেলে?',
    lead_power10: 'অবতল লেন্সের ক্ষমতা কেমন?',
    lead_concave: 'আরও বাঁকা অবতল লেন্সে কী হয়?',
    lead_concave20: 'এবার নিজে যাচাই করো।',

    // the result line
    out_focus: 'সমান্তরাল আলো লেন্স থেকে <b>{f}&nbsp;{u_cm}</b> দূরে এক বিন্দুতে মিলল।',
    out_pencil: 'পেনসিলটিকে <b>{m} গুণ</b> বড় দেখায়।<br><span class="lp-read">u = {u} cm · একই পাশে {v} cm · m = {mm}</span>',
    out_compare: '<b>{m} গুণ</b> বড় দেখায় (আগের লেন্সে {m0} গুণ)।<br><span class="lp-read">u = {u} cm · একই পাশে {v} cm · m = {mm}</span>',
    out_power:
      '<span class="lp-eq"><i>P</i> = <span class="pvc-frac"><span>১</span><span><i>f</i></span></span> = <span class="pvc-frac"><span>১</span><span>{fm}&nbsp;{u_m}</span></span> = <b>{p}&nbsp;{u_d}</b></span>',
    out_concave:
      '<span class="lp-eq"><i>P</i> = −<span class="pvc-frac"><span>১</span><span><i>f</i></span></span> = −<span class="pvc-frac"><span>১</span><span>{fm}&nbsp;{u_m}</span></span> = <b>{p}&nbsp;{u_d}</b></span>',

    // the rule: the book's words, the book's term last and in bold
    rule_focus: 'সমান্তরাল আলো যে বিন্দুতে মেলে, সেটি ফোকাস বিন্দু F′; লেন্সের কেন্দ্র থেকে তার দূরত্ব <b>ফোকাস দূরত্ব</b> f।',
    rule_pencil: 'পেনসিল ফোকাস দূরত্বের ভেতরে: রশ্মি ছড়িয়ে যায়, পেছনে বাড়ালে মেলে। তাই সোজা, বড় <b>অবাস্তব প্রতিবিম্ব</b>।',
    rule_compare: 'যে লেন্সের ফোকাস দূরত্ব যত কম, সেই লেন্সে জিনিসটিকে তত বড় দেখায়: তার <b>ক্ষমতা</b> তত বেশি।',
    rule_power: 'ক্ষমতা P ফোকাস দূরত্বের ব্যস্তানুপাতিক; f মিটারে দিলে P-এর একক <b>ডায়াপটার</b>। প্রথম লেন্সে P = ১/০.৪ = ২.৫: বইয়ের চশমা।',
    rule_power10: 'ফোকাস দূরত্ব অর্ধেক, ক্ষমতা দ্বিগুণ। উত্তল লেন্সের বেলায় ক্ষমতা <b>ধনাত্মক</b> বা পজিটিভ।',
    rule_concave: 'আলো ছড়িয়ে পড়ে, যেন F থেকে আসছে। অবতল লেন্সের বেলায় পাওয়ার <b>ঋণাত্মক</b> বা নেগেটিভ।',
    rule_concave20: 'যে অবতল লেন্সে বস্তুকে যত ছোট দেখা যায়, তার পাওয়ার তত বেশি বা <b>ফোকাস দূরত্ব</b> তত ছোট।',

    // labels on the picture (short)
    lbl_f: 'f = {f} {u_cm}',
    lbl_fbar: 'ফোকাস দূরত্ব f = {f} {u_cm}',
    lbl_focus: 'ফোকাস বিন্দু',
    lbl_o: 'আলোকীয় কেন্দ্র',
    lbl_P: 'P = {p} {u_d}',
    lbl_old: 'আগের লেন্সের',
    lbl_box: 'আলোর বাক্স',
    lbl_convex: 'উত্তল লেন্স',
    lbl_concave: 'অবতল লেন্স',
    lbl_virtual: 'প্রতিবিম্ব (অবাস্তব)',
    lbl_real: 'প্রতিবিম্ব (বাস্তব)',
    lbl_pencil: 'পেনসিল XY',

    // the graph
    graph_p: 'ক্ষমতা P (ডায়াপটার)',
    graph_f: 'ফোকাস দূরত্ব f (m)',
    graph_f_short: 'f (m)',
    graph_convex: 'উত্তল',
    graph_concave: 'অবতল',
    graph_tag: '{p}',
    graph_hint: 'ক্ষমতা মাপলে এখানে বিন্দু বসবে',
    graph_aria: 'ক্ষমতা আর ফোকাস দূরত্বের লেখচিত্র: এখন f = {f} m, P = {p} ডায়াপটার',
    graph_aria_none: 'ক্ষমতা আর ফোকাস দূরত্বের লেখচিত্র, এখনো ফাঁকা',

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

    c_power: '{p} ডায়াপটার',

    q_read: 'নতুন একটি উত্তল লেন্স। আলো কোথায় মিলেছে, স্কেলে দেখো। এর ক্ষমতা কত?',
    why_read: '<b>{p} ডায়াপটার</b>: আলো মিলেছে {f} cm = {fm} m দূরে; P = ১/{fm} = {p}।',
    q_read_neg: 'নতুন একটি অবতল লেন্স। আলো যেন কোথা থেকে ছড়াচ্ছে, স্কেলে দেখো। এর ক্ষমতা কত?',
    why_read_neg: '<b>{p} ডায়াপটার</b>: আলো যেন আসছে {f} cm = {fm} m দূরের F থেকে; P = −১/{fm} = {p}।',
    mis_cm: 'f সেন্টিমিটারে রয়ে গেছে; আগে মিটারে নাও।',
    mis_f: 'এটি f, ক্ষমতা নয় (ক্ষমতা ১/f)।',
    mis_sign_pos: 'উত্তল লেন্সের ক্ষমতা ধনাত্মক।',
    mis_sign_neg: 'অবতল লেন্সের ক্ষমতা ঋণাত্মক।',

    q_compare: 'পেনসিল একই জায়গায় থাকুক। এই লেন্সের বদলে কম ক্ষমতার একটি লেন্স বসালে পেনসিলটিকে কেমন দেখাবে?',
    c_cmp_small: 'আগের চেয়ে ছোট দেখাবে',
    c_cmp_big: 'আরও বড় দেখাবে',
    c_cmp_same: 'একই রকম দেখাবে',
    c_cmp_flip: 'উল্টো দেখাবে',
    why_compare: '<b>আগের চেয়ে ছোট দেখাবে</b>: কম ক্ষমতা মানে বেশি ফোকাস দূরত্ব, তাতে জিনিস কম বড় দেখায় (+২.৫ ডায়াপটারে {m0} গুণ)।',
    mis_cmp_big: 'ক্ষমতা কম হলে ফোকাস দূরত্ব বেশি হয়।',
    mis_cmp_same: 'ক্ষমতা বদলালে দেখার আকারও বদলায়।',
    mis_cmp_flip: 'পেনসিল ফোকাস দূরত্বের ভেতরেই থাকে, তাই সোজা।',

    q_glasses: 'বইয়ের উদাহরণের চশমার লেন্স; এর ক্ষমতা লেন্সের ওপরে লেখা। লেন্সটির ফোকাস দূরত্ব কত?',
    c_gl_right: '০.৪ m',
    c_gl_p: '২.৫ m',
    c_gl_cm: '০.৪ cm',
    c_gl_ten: '৪ m',
    why_glasses: '<b>০.৪ m</b>: f = ১/P = ১/২.৫ m = ০.৪ m, মানে ৪০ cm।',
    mis_gl_p: 'ক্ষমতা আর ফোকাস দূরত্ব এক নয়; f = ১/P।',
    mis_gl_cm: 'P ডায়াপটারে থাকলে ১/P মিটারে আসে, সেন্টিমিটারে নয়।',
    mis_gl_ten: '১/২.৫ = ০.৪, ৪ নয়।',

    q_diy_a: 'নিজে করো (চিত্র ৯.২৯ a): পেনসিল XY ফোকাস দূরত্বের ভেতরে। প্রতিবিম্ব কেমন হবে?',
    q_diy_b: 'নিজে করো (চিত্র ৯.২৯ b): পেনসিল XY ফোকাস দূরত্বের অনেক বাইরে। প্রতিবিম্ব কেমন হবে?',
    q_diy_c: 'নিজে করো (চিত্র ৯.২৮): পেনসিল XY অবতল লেন্সের ফোকাস দূরত্বের বাইরে। প্রতিবিম্ব কেমন হবে?',
    c_im_up_big: 'সোজা, অবাস্তব, বড়',
    c_im_down_big: 'উল্টো, বাস্তব, বড়',
    c_im_up_small: 'সোজা, অবাস্তব, ছোট',
    c_im_down_small: 'উল্টো, বাস্তব, ছোট',
    why_diy_a: '<b>সোজা, অবাস্তব, বড়</b>: রশ্মি দুটি লেন্স থেকে বের হয়ে ছড়িয়ে যায়; পেছনে বাড়ালে পেনসিলের দিকেই X′-এ মেলে ({m} গুণ বড়)।',
    why_diy_b: '<b>উল্টো, বাস্তব, ছোট</b>: রশ্মি দুটি লেন্সের ওপাশে সত্যিই X′-এ মেলে, অক্ষের নিচে ({m} গুণ)।',
    why_diy_c: '<b>সোজা, অবাস্তব, ছোট</b>: অবতল লেন্সে রশ্মি ছড়িয়ে যায়; পেছনে বাড়ালে লেন্স আর F-এর মাঝে মেলে ({m} গুণ)।',
    mis_im_real: 'রশ্মিগুলো সত্যিই মেলে না, শুধু পেছনে বাড়ালে মেলে: তাই অবাস্তব আর সোজা।',
    mis_im_virtual: 'এখানে রশ্মিগুলো লেন্সের ওপাশে সত্যিই মেলে: তাই বাস্তব আর উল্টো।',
    mis_im_size: 'আকারটি দেখো: প্রতিবিম্ব পেনসিলের চেয়ে {which}।',
    w_big: 'বড়',
    w_small: 'ছোট',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'The power of a lens: P = 1/f, in dioptres',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn to look',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Result',
    aria_stage: 'An optical bench with a ray box and a lens sitting in a cradle in the middle; a centimetre scale along the bench',
    u_cm: 'cm',
    u_m: 'm',
    u_d: 'D',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_tap: 'Tap the lens',

    ex_label: 'Steps',
    ex_focus: 'Focus',
    ex_pencil: 'Pencil',
    ex_compare: 'Two lenses',
    ex_power: 'Power',
    ex_concave: 'Concave',

    act_light: 'Switch on the light',
    act_pencil: 'Look at a pencil',
    act_compare: 'A more curved lens',
    act_power: 'Measure the power',
    act_power10: 'Even more curved',
    act_concave: 'Put in a concave lens',
    act_concave20: 'A more curved concave',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Show again',

    intro:
      'You have surely heard people say, “So-and-so’s glasses have a lot of power.” The glass in spectacles is a lens. On the table there is a ray box and a convex lens. Let’s find out what “power” means.',
    intro_short: 'What does the “power” of glasses mean? Let’s find out with a convex lens.',

    lead_focus: 'Now put a pencil in place of the light.',
    lead_pencil: 'The pencil stays put; now a more curved lens.',
    lead_compare: 'How is power measured? Shine the light again.',
    lead_power: 'Where does the light meet with an even more curved lens?',
    lead_power10: 'What about the power of a concave lens?',
    lead_concave: 'And a more curved concave lens?',
    lead_concave20: 'Now test yourself.',

    out_focus: 'Parallel light met at one point, <b>{f}&nbsp;{u_cm}</b> from the lens.',
    out_pencil: 'The pencil looks <b>{m} times</b> as big.<br><span class="lp-read">u = {u} cm · same side {v} cm · m = {mm}</span>',
    out_compare: '<b>{m} times</b> as big (the first lens: {m0}).<br><span class="lp-read">u = {u} cm · same side {v} cm · m = {mm}</span>',
    out_power:
      '<span class="lp-eq"><i>P</i> = <span class="pvc-frac"><span>1</span><span><i>f</i></span></span> = <span class="pvc-frac"><span>1</span><span>{fm}&nbsp;{u_m}</span></span> = <b>{p}&nbsp;{u_d}</b></span>',
    out_concave:
      '<span class="lp-eq"><i>P</i> = −<span class="pvc-frac"><span>1</span><span><i>f</i></span></span> = −<span class="pvc-frac"><span>1</span><span>{fm}&nbsp;{u_m}</span></span> = <b>{p}&nbsp;{u_d}</b></span>',

    rule_focus: 'The point where parallel light meets is the focal point F′; its distance from the lens’s centre is the <b>focal length</b> f.',
    rule_pencil:
      'The pencil is inside the focal length: the rays spread, and meet only when traced back. So: an upright, bigger <b>virtual image</b>.',
    rule_compare: 'The shorter a lens’s focal length, the bigger it shows a thing: the more <b>power</b> it has.',
    rule_power:
      'Power is inversely proportional to the focal length; with f in metres P is in <b>dioptres</b>. First lens: P = 1/0.4 = 2.5, the book’s glasses.',
    rule_power10: 'Half the focal length, twice the power. For a convex lens the power is <b>positive</b>.',
    rule_concave: 'The light spreads as if from F. For a concave lens the power is <b>negative</b>.',
    rule_concave20: 'The smaller a concave lens shows a thing, the greater its power, or the shorter its <b>focal length</b>.',

    lbl_f: 'f = {f} {u_cm}',
    lbl_fbar: 'Focal length f = {f} {u_cm}',
    lbl_focus: 'Focal point',
    lbl_o: 'Optical centre',
    lbl_P: 'P = {p} {u_d}',
    lbl_old: 'Last lens',
    lbl_box: 'Ray box',
    lbl_convex: 'Convex lens',
    lbl_concave: 'Concave lens',
    lbl_virtual: 'Image (virtual)',
    lbl_real: 'Image (real)',
    lbl_pencil: 'Pencil XY',

    graph_p: 'Power P (D)',
    graph_f: 'Focal length f (m)',
    graph_f_short: 'f (m)',
    graph_convex: 'Convex',
    graph_concave: 'Concave',
    graph_tag: '{p}',
    graph_hint: 'Measure a power to put a dot here',
    graph_aria: 'Graph of power against focal length: now f = {f} m, P = {p} D',
    graph_aria_none: 'Graph of power against focal length, still empty',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
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

    c_power: '{p} D',

    q_read: 'A new convex lens. Find on the scale where the light meets. What is its power?',
    why_read: '<b>{p} D</b>: the light meets {f} cm = {fm} m away: P = 1/{fm} = {p}.',
    q_read_neg: 'A new concave lens. Find on the scale where the light seems to spread from. Its power?',
    why_read_neg: '<b>{p} D</b>: it seems to come from F, {f} cm = {fm} m away: P = −1/{fm} = {p}.',
    mis_cm: 'f was left in cm; use metres.',
    mis_f: 'That is f, not the power (1/f).',
    mis_sign_pos: 'A convex lens has a positive power.',
    mis_sign_neg: 'A concave lens has a negative power.',

    q_compare: 'The pencil stays put. If a lens of less power replaces this one, how will the pencil look?',
    c_cmp_small: 'Smaller than now',
    c_cmp_big: 'Even bigger',
    c_cmp_same: 'The same',
    c_cmp_flip: 'Upside down',
    why_compare: '<b>Smaller than now</b>: less power, longer focal length, less enlarged (+2.5 D: {m0} times).',
    mis_cmp_big: 'Less power means a longer focal length.',
    mis_cmp_same: 'A different power shows a different size.',
    mis_cmp_flip: 'The pencil stays inside the focal length: upright.',

    q_glasses: 'The glasses lens of the book’s example; its power is written above it. What is its focal length?',
    c_gl_right: '0.4 m',
    c_gl_p: '2.5 m',
    c_gl_cm: '0.4 cm',
    c_gl_ten: '4 m',
    why_glasses: '<b>0.4 m</b>: f = 1/P = 1/2.5 m = 0.4 m, that is 40 cm.',
    mis_gl_p: 'Power and focal length are not the same; f = 1/P.',
    mis_gl_cm: 'With P in dioptres, 1/P comes out in metres, not centimetres.',
    mis_gl_ten: '1/2.5 = 0.4, not 4.',

    q_diy_a: 'Do it yourself (fig. 9.29 a): the pencil XY is inside the focal length. What is the image like?',
    q_diy_b: 'Do it yourself (fig. 9.29 b): the pencil XY is far outside the focal length. What is the image like?',
    q_diy_c: 'Do it yourself (fig. 9.28): the pencil XY is outside a concave lens’s focal length. The image?',
    c_im_up_big: 'Upright, virtual, bigger',
    c_im_down_big: 'Inverted, real, bigger',
    c_im_up_small: 'Upright, virtual, smaller',
    c_im_down_small: 'Inverted, real, smaller',
    why_diy_a: '<b>Upright, virtual, bigger</b>: the rays spread; traced back they meet at X′ on the pencil’s side ({m} times).',
    why_diy_b: '<b>Inverted, real, smaller</b>: the rays really meet at X′ beyond the lens ({m} times).',
    why_diy_c: '<b>Upright, virtual, smaller</b>: the rays spread; traced back they meet between O and F ({m} times).',
    mis_im_real: 'The rays only meet when traced back: virtual and upright.',
    mis_im_virtual: 'Here the rays really meet: real and inverted.',
    mis_im_size: 'Look at the size: the image is {which}.',
    w_big: 'bigger',
    w_small: 'smaller',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);
export const toLatinDigits = (s) => String(s).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/**
 * t(key, vars) and t.num(x). Every digit t() gives back follows the figure's numerals (a Bangla string's own ১ and ০.৪ too, so that
 * ?numerals=latin is honoured everywhere); the strings carry no digits in attributes.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : toLatinDigits(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : k in dict ? dict[k] : m));
    return num(s);
  }
  t.num = num;
  t.lang = code;
  return t;
}
