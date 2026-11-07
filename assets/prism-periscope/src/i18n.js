// Every string the figure shows, in Bangla and English. The book's words on page 254 (topic 9.3.3, পেরিস্কোপ ও
// বাইনোকুলার): "আমরা সবাই জানি সাবমেরিনে পেরিস্কোপ থাকে এবং সেই পেরিস্কোপ দিয়ে পানির নিচ থেকে পানির উপরের দৃশ্য দেখা
// সম্ভব", "সাধারণ আয়না দিয়ে যে ধরনের পেরিস্কোপ তৈরি করা যায় তার থেকে অনেক বেশি কার্যকর পেরিস্কোপ তৈরি করা হয় প্রিজম
// এবং তার পূর্ণ অভ্যন্তরীণ প্রতিফলন দিয়ে", "বাইনোকুলারের দৈর্ঘ্য কমানোর জন্যও এর ভেতরে প্রিজম দিয়ে পূর্ণ অভ্যন্তরীণ
// প্রতিফলন ঘটানো হয়ে থাকে", চিত্র ৯.১৩ "আধুনিক পেরিস্কোপে আয়নার পরিবর্তে প্রিজম ব্যবহার হয়"; and from 9.2 (pages
// 248–250): ঘন মাধ্যম, হালকা মাধ্যম, আপতন কোণ, সংকট কোণ (ক্রান্তি কোণ) 41.8°, কাচ-বাতাস বিভেদতল, "সবচেয়ে পরিপূর্ণ
// প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ প্রতিফলনে" (চিত্র ৯.০৭). The page writes উপর / উপরের.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not a
// var is another string of the same language (the unit {u_cm}). intro / intro_short are the first screen's calm card;
// lead_* the line before the action; out_* the result; rule_* the rule, the book's term in bold. The questions (q_*)
// are plain text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'পেরিস্কোপ ও বাইনোকুলার: প্রিজমে পূর্ণ অভ্যন্তরীণ প্রতিফলন',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'যা দেখা যাচ্ছে',
    aria_stage:
      'টেবিলে একটি ইটের নিচু দেয়াল, তার পেছনে টবে একটি ফুল। দেয়ালের এপাশে একটি পেরিস্কোপ, ভেতরে দুটি কাচের প্রিজম; নিচের জানালায় চোখ। শেষ ধাপে একটি বাইনোকুলার, একটি নল কেটে ভেতর দেখানো।',
    u_cm: 'cm',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_head: 'টেনে পেরিস্কোপ তোলো',
    aria_howto_head: 'পেরিস্কোপের মাথা টেনে উপরে-নিচে সরানো যায়',
    drag_me: 'টেনে তোলো',
    aria_drag_head: 'পেরিস্কোপের মাথা উপরে-নিচে সরাও (উপর ও নিচের তীর কী)',

    // the steps
    ex_label: 'ধাপ',
    ex_wall: 'দেয়াল',
    ex_peri: 'পেরিস্কোপ',
    ex_prism: 'প্রিজম',
    ex_bino: 'বাইনোকুলার',

    // the action and the quiet buttons
    act_look: 'ফুলের দিকে তাকাও',
    act_raise: 'পেরিস্কোপ উপরে তোলো',
    act_prism: 'প্রিজমের কাছে যাও',
    act_bino: 'বাইনোকুলারে যাও',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_replay: 'আবার দেখো',
    act_home: 'শুরু থেকে দেখো',

    // the first screen: a few calm words
    intro:
      'টেবিলে একটি ইটের দেয়াল, তার পেছনে টবে একটি ফুল। দেয়ালের এপাশে একটি পেরিস্কোপ, তার ভেতরে দুটি কাচের প্রিজম। সাবমেরিন এমন পেরিস্কোপ দিয়েই পানির নিচ থেকে উপরের দৃশ্য দেখে। চলো দেখি কীভাবে।',
    intro_short: 'দেয়ালের পেছনে একটি ফুল, এপাশে একটি পেরিস্কোপ। চলো দেখি, এটি দিয়ে কীভাবে দেয়ালের ওপারে দেখা যায়।',

    // the line before the action: what the next tap will show
    intro_lead: 'দেয়ালের পেছনের ফুলটি কি চোখে পড়ে?',
    lead_wall: 'পেরিস্কোপের মাথা দেয়ালের চেয়ে উঁচুতে তুলে দেখি।',
    lead_peri: 'প্রিজমের ভেতরে আলো কীভাবে ঘুরে যায়? কাছে গিয়ে দেখি।',
    lead_prism: 'বাইনোকুলারের ভেতরেও প্রিজম থাকে। কেটে ভেতরটা দেখি।',
    lead_bino: 'এবার নিজে যাচাই করো।',

    // the result line
    out_wall: 'ফুল থেকে চোখের দিকে সোজা আসা আলো <b>দেয়ালে আটকে যায়</b>। ফুলটি চোখে পড়ে না।',
    out_peri: 'ফুলের আলো দুটি প্রিজমে দুইবার ঘুরে চোখে আসে। চোখ এখন <b>ফুলটি দেখছে</b>।',
    out_peri_low: 'মাথা এখনো দেয়ালের চেয়ে নিচে: পেরিস্কোপে চোখ <b>দেয়ালটি দেখছে</b>।',
    out_prism: 'অতিভুজ তলে আপতন কোণ <b>{i}°</b>, কাচের সংকট কোণ {c}°-এর চেয়ে বড়। তাই আলো পুরোটা ফিরে আসে, <b>{turn}° ঘুরে</b> নিচে যায়।',
    out_bino: 'আলো {n} বার প্রতিফলিত হয়ে ভাঁজ হয়ে চলে: পথ প্রায় <b>{path}&nbsp;{u_cm}</b>, অথচ বাইনোকুলারটি প্রায় <b>{body}&nbsp;{u_cm}</b> লম্বা।',

    // the rule: the book's words, the book's term in bold
    rule_wall: 'কোনো কিছু দেখতে হলে তার আলো আমাদের চোখে আসতে হয়। ফুলের আলো সোজা পথে আসতে গিয়ে দেয়ালে আটকে যায়।',
    rule_peri: 'সাবমেরিনে <b>পেরিস্কোপ</b> থাকে; তা দিয়ে পানির নিচ থেকে পানির উপরের দৃশ্য দেখা যায়। আধুনিক পেরিস্কোপে আয়নার পরিবর্তে <b>প্রিজম</b> ব্যবহার হয়।',
    rule_prism:
      'ঘন মাধ্যম (কাচ) থেকে হালকা মাধ্যমে (বাতাস) যেতে আপতন কোণ সংকট কোণের চেয়ে বড় হলে আলো একটুও বের হয় না: <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>। নিচের প্রিজমেও তাই। এমন প্রতিফলন আয়নার চেয়েও পরিপূর্ণ।',
    rule_bino:
      'প্রতিটি প্রিজম আলোকে দুইবার প্রতিফলিত করে উল্টো দিকে ফেরায়। <b>বাইনোকুলারের দৈর্ঘ্য কমানোর জন্য</b> এর ভেতরে প্রিজম দিয়ে পূর্ণ অভ্যন্তরীণ প্রতিফলন ঘটানো হয়।',

    // labels on the picture (short)
    lbl_flower: 'ফুল',
    lbl_wall: 'দেয়াল',
    lbl_peri: 'পেরিস্কোপ',
    lbl_eye: 'চোখ',
    lbl_prism: 'প্রিজম',
    lbl_normal: 'লম্ব',
    lbl_angle: 'আপতন কোণ {a}°',
    lbl_hyp: 'অতিভুজ তল',
    lbl_prism_1: 'প্রথম প্রিজম',
    lbl_prism_2: 'দ্বিতীয় প্রিজম',
    howto_prisms: 'প্রিজমে টোকা দাও',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',
    hint_raise: 'মাথাটি দেয়ালের চেয়ে উঁচুতে তোলো।',

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

    q_see: 'পেরিস্কোপের মাথা এখন দেয়ালের চেয়ে নিচে। চোখ পেরিস্কোপ দিয়ে কী দেখবে?',
    c_see_right: 'দেয়ালের ইট',
    c_see_flower: 'দেয়ালের পেছনের ফুল',
    c_see_upside: 'উল্টো হয়ে থাকা ফুল',
    c_see_dark: 'কিছুই না, অন্ধকার',
    why_see: '<b>দেয়ালের ইট</b>। উপরের জানালা যেদিকে মুখ করে আছে, সেদিকের আলোই চোখে আসে; এই উচ্চতায় সামনে দেয়াল।',
    mis_see_flower: 'ফুলের আলো দেয়ালে আটকে যায়; মাথা দেয়ালের চেয়ে উঁচুতে তুললে তবেই ফুল দেখা যায়।',
    mis_see_upside: 'দুইবার প্রতিফলনে দৃশ্য উল্টায় না; আর মাথা দেয়ালের নিচে থাকলে ফুলের আলো দেয়ালেই আটকে যায়।',
    mis_see_dark: 'জানালায় দেয়াল থেকে আলো আসে, তাই দেয়ালটিই দেখা যায়।',

    q_angle: 'উপরের প্রিজমের অতিভুজ তলে আলো কত আপতন কোণে পড়ে?',
    why_angle: '<b>{i}°</b>। আলো আসে আড়াআড়ি, আর অতিভুজ তলটি {i}° হেলানো; লম্ব থেকে মাপলে আপতন কোণ {i}°।',
    mis_angle_90: '{turn}° হলো আলো কতটা ঘুরে যায়, আপতন কোণ নয়।',
    mis_angle_0: '{zero}° হয় যেখানে আলো লম্ব বরাবর পড়ে, যেমন প্রিজমে ঢোকার সময়; অতিভুজ তলটি হেলানো।',
    mis_angle_c: '{c}° হলো কাচের সংকট কোণ, আপতন কোণ নয়।',

    q_why: 'প্রিজমের অতিভুজ তলে আলো একটুও বের না হয়ে পুরোটা ফিরে আসে কেন?',
    c_why_right: 'আপতন কোণ সংকট কোণের চেয়ে বড়',
    c_why_small: 'আপতন কোণ সংকট কোণের চেয়ে ছোট',
    c_why_silver: 'তলটির পেছনে আয়নার প্রলেপ আছে',
    c_why_into: 'আলো বাতাস থেকে কাচে ঢুকছে',
    why_why: '<b>{i}° &gt; {c}°</b>। কাচ থেকে বাতাসে যেতে আপতন কোণ সংকট কোণের চেয়ে বড় হলে পূর্ণ অভ্যন্তরীণ প্রতিফলন হয়।',
    mis_why_small: 'ছোট হলে আলোর বেশির ভাগ প্রতিসরিত হয়ে বাতাসে বেরিয়ে যেত।',
    mis_why_silver: 'প্রিজমে কোনো প্রলেপ নেই; কাচ আর বাতাসের বিভেদতলেই আলো ফিরে আসে।',
    mis_why_into: 'আলো এখানে কাচ (ঘন) থেকে বাতাসে (হালকা) যাচ্ছে; উল্টো দিকে পূর্ণ অভ্যন্তরীণ প্রতিফলন হয় না।',

    q_times: 'ছবির বাইনোকুলারের একটি নলে আলো মোট কতবার পূর্ণ অভ্যন্তরীণ প্রতিফলিত হয়?',
    c_times: '{n} বার',
    why_times: '<b>{n} বার</b>। প্রিজম দুটি, আর প্রতিটির ভেতরে আলো দুইবার প্রতিফলিত হয়।',
    mis_times_2: 'তুমি প্রতিটি প্রিজমে একবার করে গুনেছ।',
    mis_times_1: 'তুমি শুধু একটি মোড় গুনেছ; ছবিতে আলোর পথের সব মোড় গুনে দেখো।',
    mis_times_8: '{n} বার হয় দুটি নল মিলিয়ে; প্রশ্নটি একটি নলের।',

    q_bino: 'বাইনোকুলারের ভেতরে প্রিজম রাখা হয় কেন?',
    c_b_right: 'ছোট নলে লম্বা পথ আঁটাতে',
    c_b_big: 'দূরের জিনিস বড় দেখাতে',
    c_b_colour: 'আলোকে নানা রঙে ভাগ করতে',
    c_b_more: 'দৃশ্যটি আরও উজ্জ্বল করতে',
    why_b: '<b>ছোট নলে লম্বা পথ আঁটাতে</b>। আলো সামনে-পেছনে ভাঁজ হয়ে চলে, তাই বাইনোকুলারের দৈর্ঘ্য কমে।',
    mis_b_big: 'বড় করে দেখায় লেন্স; প্রিজম শুধু আলোর পথ ঘোরায়।',
    mis_b_colour: 'এখানে আলো প্রিজমে লম্ব বরাবর ঢোকে ও বের হয়, তাই রং আলাদা হয় না।',
    mis_b_more: 'প্রিজম আলো তৈরি করে না; পূর্ণ অভ্যন্তরীণ প্রতিফলনে শুধু আলো প্রায় হারায় না।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Periscope and binoculars: total internal reflection in prisms',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it round',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'What you see',
    aria_stage:
      'A low brick wall on a table with a flower in a pot behind it. On this side, a periscope with two glass prisms inside and an eye at its bottom window. In the last step, binoculars with one barrel cut away.',
    u_cm: 'cm',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_head: 'Drag the periscope up',
    aria_howto_head: "The periscope's head can be dragged up and down",
    drag_me: 'Drag up',
    aria_drag_head: "Move the periscope's head up or down (up and down arrow keys)",

    ex_label: 'Steps',
    ex_wall: 'Wall',
    ex_peri: 'Periscope',
    ex_prism: 'Prism',
    ex_bino: 'Binoculars',

    act_look: 'Look at the flower',
    act_raise: 'Raise the periscope',
    act_prism: 'Go close to a prism',
    act_bino: 'On to the binoculars',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_replay: 'See it again',
    act_home: 'From the start',

    intro:
      'A brick wall on the table, a flower in a pot behind it. On this side, a periscope with two glass prisms inside. A submarine sees above the water with one like it. Let us see how.',
    intro_short: 'A flower behind a wall, a periscope on this side. Let us see how it lets you see over the wall.',

    intro_lead: 'Can the eye see the flower behind the wall?',
    lead_wall: "Let's raise the periscope's head above the wall.",
    lead_peri: 'How does the light turn inside a prism? Let us go close.',
    lead_prism: 'Binoculars have prisms inside too. Let us look inside.',
    lead_bino: 'Now test yourself.',

    out_wall: "The flower's light, coming straight toward the eye, <b>is stopped by the wall</b>: the eye cannot see the flower.",
    out_peri: "The flower's light turns twice, in the two prisms, and reaches the eye: it <b>sees the flower</b>.",
    out_peri_low: 'The head is still below the wall: through the periscope the eye <b>sees the wall</b>.',
    out_prism:
      'On the hypotenuse face the angle of incidence is <b>{i}°</b>, above the critical angle of glass, {c}°: all the light comes back and <b>turns {turn}°</b>.',
    out_bino: 'Four reflections fold the light: a path of about <b>{path}&nbsp;{u_cm}</b> inside binoculars about <b>{body}&nbsp;{u_cm}</b> long.',

    rule_wall: "To see a thing, its light must reach the eye. The wall stops the flower's light.",
    rule_peri: 'Submarines see above the water with a <b>periscope</b>. Modern periscopes use <b>prisms</b> instead of mirrors.',
    rule_prism:
      'From a dense medium (glass) to a lighter one (air), above the critical angle no light gets out: <b>total internal reflection</b>. The lower prism does the same; it reflects more fully than a mirror.',
    rule_bino:
      'Each prism reflects the light twice, back the other way. <b>To make binoculars shorter</b>, total internal reflection in prisms is used.',

    lbl_flower: 'Flower',
    lbl_wall: 'Wall',
    lbl_peri: 'Periscope',
    lbl_eye: 'Eye',
    lbl_prism: 'Prism',
    lbl_normal: 'Normal',
    lbl_angle: 'Incidence {a}°',
    lbl_hyp: 'Hypotenuse face',
    lbl_prism_1: 'First prism',
    lbl_prism_2: 'Second prism',
    howto_prisms: 'Tap a prism',

    hint_wait: 'Wait a moment and watch.',
    hint_raise: 'Raise the head above the wall.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and choose.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Choose from what you see.',

    q_see: "The head is below the wall's top. What does the eye see?",
    c_see_right: 'The bricks of the wall',
    c_see_flower: 'The flower',
    c_see_upside: 'The flower, upside down',
    c_see_dark: 'Nothing, darkness',
    why_see: '<b>The bricks of the wall</b>. The eye sees what the top window faces: here, the wall.',
    mis_see_flower: "The wall stops the flower's light; raise the head above the wall.",
    mis_see_upside: "Two reflections don't turn the view over; and below the wall the flower's light is stopped.",
    mis_see_dark: 'Light from the wall comes in, so the wall is seen.',

    q_angle: "The angle of incidence on the top prism's hypotenuse face?",
    why_angle: '<b>{i}°</b>. The light comes in level and the face is tilted {i}°: from the normal, {i}°.',
    mis_angle_90: '{turn}° is how far the light turns.',
    mis_angle_0: '{zero}° is for light along the normal, as on entering.',
    mis_angle_c: '{c}° is the critical angle of glass.',

    q_why: 'Why does all the light come back at the hypotenuse face?',
    c_why_right: 'Incidence above the critical angle',
    c_why_small: 'Incidence below the critical angle',
    c_why_silver: 'A mirror coating on the face',
    c_why_into: 'Light going from air into glass',
    why_why: '<b>{i}° &gt; {c}°</b>. Glass to air, above the critical angle: total internal reflection.',
    mis_why_small: 'Below it, most light would leave into the air.',
    mis_why_silver: 'There is no coating; the glass–air boundary reflects it.',
    mis_why_into: 'Here it goes from glass to air; the other way there is none.',

    q_times: 'How many total internal reflections in one barrel?',
    c_times: '{n} times',
    why_times: '<b>{n} times</b>. Two prisms, and the light is reflected twice inside each.',
    mis_times_2: 'You counted one reflection per prism.',
    mis_times_1: 'You counted one turn only; count every turn of the path in the picture.',
    mis_times_8: '{n} times is for both barrels together.',

    q_bino: 'Why are prisms put inside binoculars?',
    c_b_right: 'To fit a long path in a short body',
    c_b_big: 'To make far things look bigger',
    c_b_colour: 'To split the light into colours',
    c_b_more: 'To make the view much brighter',
    why_b: '<b>To fit a long path in a short body</b>. The light folds back and forth, so binoculars are shorter.',
    mis_b_big: 'Lenses magnify; prisms only turn the path.',
    mis_b_colour: 'Light enters and leaves square-on: no colours split.',
    mis_b_more: 'Prisms make no light; they just lose almost none.',
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
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
