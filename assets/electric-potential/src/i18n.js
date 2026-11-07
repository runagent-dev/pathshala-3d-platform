// Every string the figure shows, in Bangla and English. The book's words on pages 287–289 (topics 10.6 তড়িৎ বিভব and
// 10.6.1 বিভব পার্থক্য): তড়িৎ বিভব, টেস্ট চার্জ q₀, ক্ষুদ্র ধনাত্মক আধান, বিকর্ষণ বল, "বিকর্ষণ বলের বিপরীতে কাজ করতে হয়",
// "q চার্জের যত কাছে q₀ চার্জকে আনা হবে তত বেশি বিকর্ষণ বল অনুভব করবে এবং তত বেশি কাজ করতে হবে", অসীম দূরত্ব,
// সমবেগে, "প্রতি একক টেস্ট চার্জের জন্য কৃত কাজ", V = W/q₀ (the book prints W/q), V(r) = kq/r, স্কেলার রাশি, ভোল্ট
// (1 V = 1 J/1 C = JC⁻¹); বিভব পার্থক্য, "চার্জ প্রবাহিত হয় বিভব পার্থক্যের জন্য, বিভবের মানের জন্য নয়", কাক,
// হাইভোল্টেজ ইলেকট্রিক তার, ইলেকট্রন, শূন্য বিভব (the earth), "ভূমির সাথে লাগানো (Earthing)". The page writes ওপর.
// Words the figure adds: প্রযুক্ত বল (the push that does the work), গোলক A / B, তার দিয়ে জোড়া, পৃথিবী. The water comparison is the brief's, not the book's: a plain picture of the book's rule.
// Use t('key', vars) in code and t.num() for numbers; numbers in sentences come in as {vars} (never Bangla digits in a
// string). A {key} that is not a var is another string of the same language (a unit). The questions (q_*) are plain
// text: the quiz writes them as text, so they avoid q₀ (the font has no ₀; HTML elsewhere writes q<sub>0</sub>).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তড়িৎ বিভব: অসীম থেকে প্রতি একক টেস্ট চার্জ আনতে কৃত কাজ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage: 'টেবিলে অন্তরক স্ট্যান্ডের ওপর ধনাত্মক চার্জ q সহ একটি ধাতব গোলক, আর একটি রেলে ছোট টেস্ট চার্জ q0',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_drag: 'টেনে টেস্ট চার্জ সরাও',
    drag_me: 'টেনে সরাও',
    aria_drag: 'টেস্ট চার্জ সরাও (বাম ও ডান তীর কী)',

    // the steps
    ex_label: 'ধাপ',
    ex_bring: 'আনা',
    ex_potential: 'বিভব',
    ex_join: 'তার',
    ex_crow: 'কাক',
    ex_earth: 'মাটি',

    intro:
      'টেবিলের বাম দিকে একটি ধাতব গোলকে ধনাত্মক চার্জ q। ডানে রেলের ওপর ছোট একটি ধনাত্মক টেস্ট চার্জ q<sub>0</sub>। একই রকম চার্জ একে অন্যকে ঠেলে সরায়। q<sub>0</sub> কে q এর কাছে আনতে কতটা কাজ লাগে, চলো দেখি।',
    intro_short: 'ধনাত্মক চার্জ q এর কাছে ছোট টেস্ট চার্জ q<sub>0</sub> আনতে কতটা কাজ লাগে? চলো দেখি।',
    lead_bring: 'এবার এই কাজকে টেস্ট চার্জ দিয়ে ভাগ করি: প্রতি একক চার্জে কত কাজ?',
    lead_potential: 'এবার চার্জ ছাড়া একই রকম আরেকটি গোলক B আনি, আর তার দিয়ে A এর সাথে জুড়ে দিই।',
    lead_join: 'এবার তারের ওপর একটি কাক বসুক। এত উচ্চ বিভবে সে কি শক খাবে?',
    lead_crow: 'এবার গোলক দুটিকে মাটির সাথে জুড়ে দিই।',
    lead_earth: 'সব ধাপ দেখা হলো। ধাপের নাম ছুঁয়ে আবার দেখতে পারো।',

    act_wait: 'দেখো…',
    act_bring: 'টেস্ট চার্জ কাছে আনো',
    act_potential: 'বিভব বের করো',
    act_join: 'তার দিয়ে জোড়ো',
    act_crow: 'তারে কাক বসাও',
    act_earth: 'মাটির সাথে জোড়ো',
    act_quiz: 'পরীক্ষা দাও',
    act_home: 'শুরুতে ফেরো',
    hint_wait: 'একটু দাঁড়াও, দেখানো চলছে।',

    doing_bring: 'q<sub>0</sub> সমবেগে q এর দিকে আসছে, কাজ বাড়ছে…',
    doing_potential: 'কাজকে q<sub>0</sub> দিয়ে ভাগ করছি…',
    doing_join: 'বিভব আলাদা, তাই ইলেকট্রন B থেকে A তে যাচ্ছে…',
    doing_crow: 'একটি কাক তারে এসে বসছে…',
    doing_earth: 'ইলেকট্রন পৃথিবী থেকে উঠে আসছে…',
    out_bring: 'অসীম থেকে r = {r} cm এ আনতে কাজ <b>W = {w} nJ</b>',
    out_potential: 'V = W/q<sub>0</sub> = {w} nJ ÷ {q0} nC = <b>{v} V</b>',
    out_join: 'A ও B দুটিই <b>{v} V</b>: পার্থক্য নেই, প্রবাহ থামল',
    out_crow: 'কাক {v} V, তার {v} V: পার্থক্য <b>{zero} V</b>, শক নেই',
    out_earth: 'A ও B দুটিই <b>{v} V</b>: পৃথিবীর সমান',
    rule_bring: 'q এর যত কাছে আনা হয়, <b>বিকর্ষণ বল</b> তত বেশি, তাই তত বেশি কাজ করতে হয়। সমবেগে আনতে প্রযুক্ত বল বিকর্ষণ বলের সমান।',
    rule_potential:
      'প্রতি একক টেস্ট চার্জের জন্য কৃত কাজই ঐ বিন্দুর <b>তড়িৎ বিভব</b>: V = kq/r। এটি <b>স্কেলার রাশি</b>, একক <b>ভোল্ট</b> ({one} V = {one} J/{one} C)।',
    rule_join: 'চার্জ প্রবাহিত হয় <b>বিভব পার্থক্যের</b> জন্য, বিভবের মানের জন্য নয়: পানি যেমন উঁচু থেকে নিচে নামে আর সমান হলেই থামে।',
    rule_crow: 'হাইভোল্টেজ তারে বসা কাক শক খায় না: তারের বিভব এবং তার নিজের বিভব সমান, কোনো পার্থক্য নেই। <b>ভোল্টেজের পার্থক্যটা</b> গুরুত্বপূর্ণ, মান নয়।',
    rule_earth: 'আমরা পৃথিবীকে <b>শূন্য বিভব</b> ধরি: এত বিশাল যে খানিকটা চার্জে তার বিভব বদলায় না। তাই ভারী যন্ত্রপাতি <b>ভূমির সাথে লাগানো (Earthing)</b> হয়।',

    // labels on the picture (short)
    lbl_q: 'চার্জ q',
    lbl_q0: 'টেস্ট চার্জ q<sub>0</sub>',
    lbl_q0_w: 'q<sub>0</sub>: W = {w} nJ',
    lbl_here: 'এখানে V = {v} V',
    lbl_rep: 'বিকর্ষণ বল',
    lbl_push: 'প্রযুক্ত বল',
    lbl_r: 'r = {r} cm',
    lbl_inf: 'অসীমের দিকে',
    lbl_shell: '{v} V',
    lbl_a: 'A: {v} V',
    lbl_b: 'B: {v} V',
    lbl_earth: 'পৃথিবী: {v} V',
    lbl_e: 'ইলেকট্রন',
    lbl_crow: 'কাক: {v} V',
    note_slow: 'ধীর করে দেখানো; আসলে মুহূর্তে ঘটে',
    note_crow: 'কাকের আকার প্রকৃত অনুপাতে নয়',

    // the graph
    graph_w: 'কাজ W (nJ)',
    graph_v: 'বিভব V (V)',
    graph_r: 'r (cm)',
    graph_hint: 'টেস্ট চার্জ আনলে কাজের রেখা এখানে',
    graph_div: 'V = W ÷ {q0} nC',
    graph_diff: 'পার্থক্য {d} V',
    bar_a: 'গোলক A',
    bar_b: 'গোলক B',
    bar_earth: 'পৃথিবী',
    graph_aria_empty: 'কাজ ও দূরত্বের গ্রাফ, এখনো ফাঁকা',
    graph_aria_w: 'কাজ ও দূরত্বের গ্রাফ: r = {r} cm এ W = {w} nJ',
    graph_aria_v: 'বিভব ও দূরত্বের গ্রাফ: r = {r} cm এ V = {v} V',
    graph_aria_bars: 'বিভব: গোলক A {a} V, গোলক B {b} V, পৃথিবী {zero} V',

    // the test (questions are plain text)
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
    q_locked: 'পরীক্ষার সময় ছবিটি স্থির থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_read: '{q0} nC টেস্ট চার্জটিকে অসীম থেকে ছবির জায়গায় আনতে কাজ লেগেছে ছবিতে লেখা W। ঐ বিন্দুর বিভব কত?',
    why_read: '<b>{v} V</b>: V = W/q<sub>0</sub> = {w} nJ ÷ {q0} nC = {v} V।',
    mis_read_w: 'এটা কাজ W; বিভব পেতে টেস্ট চার্জ দিয়ে ভাগ করতে হয়।',
    mis_read_times: 'গুণ নয়, ভাগ: V = W/q<sub>0</sub>।',
    mis_read_twice: 'একবার ভাগ করলেই হয়; এখানে দুবার ভাগ হয়েছে।',
    q_closer: 'ছবিতে টেস্ট চার্জের জায়গার বিভব লেখা। দূরত্ব অর্ধেক করলে (r = {r2} cm) বিভব কত হবে?',
    why_closer: '<b>{v} V</b>: V = kq/r, তাই r অর্ধেক হলে বিভব দ্বিগুণ।',
    mis_closer_half: 'কাছে এলে বিভব বাড়ে, কমে না।',
    mis_closer_square: 'দূরত্বের বর্গের বিপরীতে বদলায় বল; বিভব V = kq/r।',
    mis_closer_same: 'দূরত্ব বদলালে বিভবও বদলায়: V = kq/r।',
    q_double: 'ছবির বিন্দুর বিভব লেখা আছে। {q1} nC টেস্ট চার্জ সেখানে আনলে ঐ বিন্দুর বিভব কত হবে?',
    why_double: '<b>{v} V</b>: কাজ দ্বিগুণ হয়, কিন্তু প্রতি একক চার্জে কাজ একই। বিভব বিন্দুর, টেস্ট চার্জের নয়।',
    mis_double_doubled: 'দ্বিগুণ হয় কাজ W, বিভব নয়।',
    mis_double_other: 'বিভব টেস্ট চার্জের ওপর নির্ভর করে না।',
    q_equal: 'A ও B তারে জোড়া, দুটির বিভব ছবিতে লেখা। তারে এখন চার্জ প্রবাহ কেমন?',
    c_eq_stop: 'প্রবাহ থেমে গেছে',
    c_eq_big: 'বিভব অনেক বেশি, তাই প্রবাহ খুব বেশি',
    c_eq_ab: 'A থেকে B তে প্রবাহ চলছে',
    c_eq_ba: 'B থেকে A তে প্রবাহ চলছে',
    why_equal: '<b>প্রবাহ থেমে গেছে</b>: দুটির বিভব সমান, পার্থক্য শূন্য।',
    mis_eq_big: 'বিভব বেশি হলেও পার্থক্য না থাকলে প্রবাহ নেই।',
    mis_eq_flow: 'প্রবাহ চলে শুধু বিভব আলাদা থাকলে।',
    q_earth: 'এবার B কে মাটির সাথে জোড়া হলো (A তারে B এর সাথে জোড়া)। প্রবাহ থামলে A এর বিভব কত?',
    why_earth: '<b>{zero} V</b>: A, B আর পৃথিবীর বিভব সমান হলেই প্রবাহ থামে।',
    mis_earth_same: 'মাটির সাথে জুড়লে বিভব পার্থক্য হয়, তাই চার্জ প্রবাহিত হয়।',
    mis_earth_half: 'প্রবাহ চলে শূন্য না হওয়া পর্যন্ত।',
    mis_earth_start: 'এটা শুরুতে A এর বিভব ছিল।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Electric potential: the work per unit test charge brought from infinity',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn the view',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage: 'On a bench, a metal sphere with a positive charge q on an insulating stand, and a small test charge q0 on a rail',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_drag: 'Drag the test charge',
    drag_me: 'Drag me',
    aria_drag: 'Move the test charge (left and right arrow keys)',

    ex_label: 'Step',
    ex_bring: 'Bring',
    ex_potential: 'Potential',
    ex_join: 'Wire',
    ex_crow: 'Crow',
    ex_earth: 'Earth',

    intro:
      'On the left of the bench, a metal sphere carries a positive charge q. On the rail, a small positive test charge q<sub>0</sub>. Like charges push each other away. How much work does it take to bring q<sub>0</sub> close to q? Let’s see.',
    intro_short: 'How much work does it take to bring a small test charge q<sub>0</sub> close to a positive charge q? Let’s see.',
    lead_bring: 'Now divide this work by the test charge: how much work per unit charge?',
    lead_potential: 'Now bring a second sphere B, the same but with no charge, and join it to A with a wire.',
    lead_join: 'Now a crow lands on the wire. At such a high potential, will it get a shock?',
    lead_crow: 'Now join the two spheres to the ground.',
    lead_earth: 'That’s every step. Tap a step’s name to see it again.',

    act_wait: 'Watch…',
    act_bring: 'Bring the test charge closer',
    act_potential: 'Find the potential',
    act_join: 'Join with a wire',
    act_crow: 'Let a crow land on the wire',
    act_earth: 'Join to the ground',
    act_quiz: 'Take the test',
    act_home: 'Back to the start',
    hint_wait: 'Wait a moment, it’s still showing.',

    doing_bring: 'q<sub>0</sub> comes toward q at constant speed; the work grows…',
    doing_potential: 'Dividing the work by q<sub>0</sub>…',
    doing_join: 'The potentials differ, so electrons go from B to A…',
    doing_crow: 'A crow lands on the wire…',
    doing_earth: 'Electrons come up from the earth…',
    out_bring: 'Work to bring it from infinity to r = {r} cm: <b>W = {w} nJ</b>',
    out_potential: 'V = W/q<sub>0</sub> = {w} nJ ÷ {q0} nC = <b>{v} V</b>',
    out_join: 'A and B are both at <b>{v} V</b>: no difference, the flow stopped',
    out_crow: 'Crow {v} V, wire {v} V: difference <b>{zero} V</b>, no shock',
    out_earth: 'A and B are both at <b>{v} V</b>: the same as the earth',
    rule_bring:
      'The closer to q, the stronger the <b>repulsive force</b>, so the more work it takes. At constant speed the applied force equals the repulsion.',
    rule_potential:
      'The work done per unit test charge is the <b>electric potential</b> at that point: V = kq/r. It is a <b>scalar</b>; its unit is the <b>volt</b> ({one} V = {one} J/{one} C).',
    rule_join:
      'Charge flows because of a <b>potential difference</b>, not the potential’s value: as water runs from high to low and stops when level.',
    rule_crow:
      'A crow on a high-voltage wire gets no shock: wire and crow are at the same potential. The <b>difference in voltage</b> matters, not its value.',
    rule_earth:
      'We take the earth as <b>zero potential</b>: it is so big that a little charge doesn’t change it. So heavy machines are <b>earthed</b>.',

    lbl_q: 'Charge q',
    lbl_q0: 'Test charge q<sub>0</sub>',
    lbl_q0_w: 'q<sub>0</sub>: W = {w} nJ',
    lbl_here: 'Here V = {v} V',
    lbl_rep: 'Repulsion',
    lbl_push: 'Applied force',
    lbl_r: 'r = {r} cm',
    lbl_inf: 'Toward infinity',
    lbl_shell: '{v} V',
    lbl_a: 'A: {v} V',
    lbl_b: 'B: {v} V',
    lbl_earth: 'Earth: {v} V',
    lbl_e: 'Electrons',
    lbl_crow: 'Crow: {v} V',
    note_slow: 'Slowed down; really it takes an instant',
    note_crow: 'The crow is not to scale',

    graph_w: 'Work W (nJ)',
    graph_v: 'Potential V (V)',
    graph_r: 'r (cm)',
    graph_hint: 'Bring the test charge: the work is drawn here',
    graph_div: 'V = W ÷ {q0} nC',
    graph_diff: 'Difference {d} V',
    bar_a: 'Sphere A',
    bar_b: 'Sphere B',
    bar_earth: 'Earth',
    graph_aria_empty: 'Graph of work against distance, still empty',
    graph_aria_w: 'Graph of work against distance: at r = {r} cm, W = {w} nJ',
    graph_aria_v: 'Graph of potential against distance: at r = {r} cm, V = {v} V',
    graph_aria_bars: 'Potentials: sphere A {a} V, sphere B {b} V, the earth {zero} V',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The picture stays still during the test. Look at it and pick an answer.',

    q_read: 'Bringing the {q0} nC test charge from infinity took the work W in the picture. What is the potential at that point?',
    why_read: '<b>{v} V</b>: V = W/q<sub>0</sub> = {w} nJ ÷ {q0} nC = {v} V.',
    mis_read_w: 'That is the work W; divide by the test charge to get the potential.',
    mis_read_times: 'Divide, don’t multiply: V = W/q<sub>0</sub>.',
    mis_read_twice: 'Divide once; this divides twice.',
    q_closer: 'The picture shows the potential at the test charge. If the distance is halved (r = {r2} cm), what is the potential?',
    why_closer: '<b>{v} V</b>: V = kq/r, so half the distance gives twice the potential.',
    mis_closer_half: 'Closer means a higher potential, not a lower one.',
    mis_closer_square: 'That is the force’s 1/r²; the potential is V = kq/r.',
    mis_closer_same: 'A different distance gives a different potential: V = kq/r.',
    q_double: 'The picture shows the potential at this point. If a {q1} nC test charge is brought there, what is the potential at that point?',
    why_double: '<b>{v} V</b>: W doubles, but the work per unit charge is the same. Potential belongs to the point.',
    mis_double_doubled: 'The work W doubles, not the potential.',
    mis_double_other: 'It does not depend on the test charge.',
    q_equal: 'A and B are joined by a wire; the picture shows their potentials. How does charge flow in the wire now?',
    c_eq_stop: 'The flow has stopped',
    c_eq_big: 'The potential is high, so a lot flows',
    c_eq_ab: 'It flows from A to B',
    c_eq_ba: 'It flows from B to A',
    why_equal: '<b>The flow has stopped</b>: same potential, no difference.',
    mis_eq_big: 'A high potential with no difference makes no flow.',
    mis_eq_flow: 'Charge flows only while the potentials differ.',
    q_earth: 'Now B is joined to the ground (A is wired to B). When the flow stops, what is A’s potential?',
    why_earth: '<b>{zero} V</b>: the flow stops when A and B match the earth.',
    mis_earth_same: 'Joining to the ground makes a difference, so charge flows.',
    mis_earth_half: 'The flow goes on until A is at zero.',
    mis_earth_start: 'That was A’s potential at the start.',
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
