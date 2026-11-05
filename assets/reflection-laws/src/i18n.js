// Every string the figure shows, in Bangla and English. The Bangla is the book's: page 215 of the physics book for classes
// 9–10 (8.2.1 প্রতিফলনের সূত্র, চিত্র ৮.০৩) and page 218 (8.2.2 মসৃণ এবং অমসৃণ পৃষ্ঠে প্রতিফলন, চিত্র ৮.০৭). The two laws are word
// for word (আপতন as chapter 8's shared decision; the page prints আপাতন, see NOTES.md). Use t('key') in code, t.num() for numbers.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'প্রতিফলনের সূত্র',
    view: 'দেখার ধরন',
    view_front_short: 'শুরুর দৃশ্য',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'আপতন কোণ',
    aria_stage:
      'পাহাড়ের কোলে শান্ত একটি হ্রদ, পানিতে পাহাড়ের প্রতিবিম্ব। পানির ওপর O বিন্দুতে X থেকে একটি আলোক রশ্মি এসে পড়েছে। X বিন্দু টেনে আপতন কোণ বদলাও, পানির কিনারের বোতাম টেনে সমতল ঘোরাও।',
    ex_laws: 'প্রতিফলনের সূত্র',
    ex_surface: 'মসৃণ ও অমসৃণ পৃষ্ঠ',
    out_wavy: 'অমসৃণ পানিতে রশ্মিগুলো <span class="rl-w">চারদিকে ছড়িয়ে পড়ল</span>।',
    l_facets: 'একেকটির অভিলম্ব একেক দিকে',
    l_surface_angle: 'পানির তলের সাথে {a}°',
    c_arc: 'কোণ {x}',
    q_names_i: 'ছবিতে ক, খ, গ তিনটি কোণ। এর কোনটি আপতন কোণ?',
    q_names_r: 'ছবিতে ক, খ, গ তিনটি কোণ। এর কোনটি প্রতিফলন কোণ?',
    n_names_i: 'আপতন কোণ হলো আপতিত রশ্মি XO আর অভিলম্বের মাঝের কোণ।',
    n_names_r: 'প্রতিফলন কোণ হলো প্রতিফলিত রশ্মি OX′ আর অভিলম্বের মাঝের কোণ।',
    n_names_surface: 'এটি রশ্মি আর পানির তলের মাঝের কোণ; কোণ মাপতে হয় অভিলম্ব থেকে।',
    n_names_none: 'ছবিতেই কোণটি আছে। অভিলম্বের সঙ্গে রশ্মির কোণ খোঁজো।',
    a_names_i: '<b>কোণ {x}</b>: আপতিত রশ্মি অভিলম্বের সাথে যে কোণ করে সেটাই আপতন কোণ (θ<sub>i</sub>)।',
    a_names_r: '<b>কোণ {x}</b>: প্রতিফলিত রশ্মি অভিলম্বের সাথে যে কোণ করে সেটাই প্রতিফলন কোণ (θ<sub>r</sub>)।',
    q_widen: 'X সরিয়ে আপতন কোণ {d}° বাড়ানো হলো। XO আর OX′ রশ্মির মাঝের কোণ কত বাড়বে?',
    n_widen_one: 'আপতন কোণের সঙ্গে প্রতিফলন কোণও সমান বাড়ে, দুটো মিলিয়ে ধরতে হবে।',
    n_widen_none: 'θ<sub>r</sub> বাঁধা নয়: θ<sub>i</sub> বাড়লে θ<sub>r</sub>ও বাড়ে।',
    n_widen_four: 'দুটি কোণের প্রতিটি একবারই বাড়ে; দ্বিগুণের বেশি হয় না।',
    a_widen: '<b>{e}°</b>: দ্বিতীয় সূত্রে θ<sub>r</sub> = θ<sub>i</sub>, তাই দুটিই {d}° করে বাড়ে: {two} × {d}° = {e}°।',

    ex_label: 'বইয়ের ধাপ',

    act_home: 'এই ধাপ আবার শুরু করো',
    act_wait: 'দেখো…',
    act_next: 'পরের ধাপে যাও',
    act_normal: 'লম্ব কল্পনা করো',
    act_plane: 'সমতল কল্পনা করো',
    act_reflect: 'প্রতিফলিত রশ্মি দেখো',
    act_swing: 'বোতাম টেনে সমতল ঘোরাও',
    act_tilt: 'X টেনে কোণ বদলাও',
    act_waves: 'পানিতে ঢেউ তোলো',
    act_calm: 'পানি শান্ত করো',

    out_l0: 'একটি <span class="rl-w">আলোক রশ্মি</span> পানির ওপর O বিন্দুতে এসে পড়েছে।',
    out_l1: 'O বিন্দুতে পানির ওপর খাড়া লম্বটিই <span class="rl-w">অভিলম্ব</span>।',
    out_l2: 'XO রশ্মি আর লম্ব মিলে একটি সমতল হলো।',
    out_angles: '<span class="rl-a rl-ti">θ<sub>i</sub> = {a}°</span><span class="rl-a rl-tr">θ<sub>r</sub> = {b}°</span>',
    out_smooth: 'মসৃণ পানিতে রশ্মিগুলো <span class="rl-w">সমান্তরাল</span>ই রইল।',

    rule_l0: 'যখন একটা আলোক রশ্মি এক মাধ্যম থেকে অন্য মাধ্যমের ওপর একটা বিন্দুতে এসে পড়ে প্রথমেই সেই বিন্দু থেকে একটা <b>লম্ব</b> কল্পনা করে নিতে হবে।',
    rule_l1: 'যে আলোক রশ্মিটি এসে সেই বিন্দুটিতে পড়েছে এবং যে লম্বটি কল্পনা করেছ সেই দুটি রেখাকে নিয়ে একটি <b>সমতল</b> কল্পনা করে নাও।',
    rule_l2: 'XO হলো <b>আপতিত রশ্মি</b>, আর O হলো আপতন বিন্দু। এবার দেখো, আলো কোন পথে ফিরে আসে।',
    rule_l3:
      'OX′ হলো <b>প্রতিফলিত রশ্মি</b>। আপতিত রশ্মি অভিলম্বের সাথে যে কোণ করে সেটা <b>আপতন কোণ (θ<sub>i</sub>)</b>, প্রতিফলিত রশ্মি যে কোণ করে সেটা <b>প্রতিফলন কোণ (θ<sub>r</sub>)</b>।',
    rule_l4: '<b>প্রথম সূত্র:</b> আপতন রশ্মি এবং লম্ব দিয়ে আমরা যে সমতলটি কল্পনা করে নিয়েছিলাম প্রতিফলিত রশ্মিটি সেই সমতলেই থাকবে।',
    rule_l5:
      '<b>প্রথম সূত্র:</b> আপতন রশ্মি এবং লম্ব দিয়ে আমরা যে সমতলটি কল্পনা করে নিয়েছিলাম প্রতিফলিত রশ্মিটি সেই সমতলেই থাকবে।<br><b>দ্বিতীয় সূত্র:</b> প্রতিফলন কোণটি হবে আপতন কোণের সমান।',
    rule_s0: 'আয়না কিংবা আয়নার মতো <b>মসৃণ পৃষ্ঠে</b> আলোর সমান্তরাল রশ্মিগুলো প্রতিফলনের পরেও সমান্তরাল থাকে। তাই পানিতে পাহাড়ের স্পষ্ট প্রতিবিম্ব।',
    rule_s1:
      'প্রত্যেকটা রশ্মিই প্রতিফলনের সূত্র মেনে চলে, কিন্তু একেক অংশের পৃষ্ঠ একেক কোণে থাকে। তাই রশ্মিগুলো চারদিকে ছড়িয়ে পড়ে: <b>ব্যাপ্ত প্রতিফলন</b>। পাহাড়ের প্রতিবিম্বও তাই ভেঙে যায়।',

    note_rays: 'রশ্মি বোঝার জন্য আঁকা',

    l_ray: 'আলোক রশ্মি',
    l_m1: 'প্রথম মাধ্যম (বাতাস)',
    l_m2: 'দ্বিতীয় মাধ্যম (পানি)',
    l_x: 'X',
    l_o: 'O',
    l_op: 'আপতন বিন্দু O',
    l_xp: 'X′',
    l_normal: 'অভিলম্ব',
    l_lamba: 'লম্ব (অভিলম্ব)',
    l_plane: 'সমতল',
    l_inc: 'আপতিত রশ্মি',
    l_ref: 'প্রতিফলিত রশ্মি',
    l_ti: 'θ<sub>i</sub> = {a}°',
    l_tr: 'θ<sub>r</sub> = {a}°',
    l_tr_q: 'θ<sub>r</sub> = ?',
    l_smooth: 'মসৃণ পৃষ্ঠ',
    l_rough: 'অমসৃণ পৃষ্ঠ',
    l_parallel: 'সমান্তরাল',
    l_scatter: 'ব্যাপ্ত প্রতিফলন',
    letters: 'ক,খ,গ,ঘ',
    l_letter: '{x}',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'উত্তরে চাপ দাও।',
    q_right: 'ঠিক!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_again: 'আবার পরীক্ষা দাও',
    q_great: 'দারুণ! প্রতিফলনের সূত্র তোমার জানা।',
    q_good: 'ভালো! আরেকবার শেখো দেখে নাও।',
    q_try: 'শেখো ধাপগুলো আবার দেখে নাও।',
    q_locked: 'পরীক্ষা চলছে। শেষে শেখোতে ফিরলে আবার টানতে পারবে।',

    c_none: 'কোনোটিই নয়',

    q_angle: 'ছবিতে আলোক রশ্মিটি পানির তলের সাথে কোণ করেছে {a}°। প্রতিফলন কোণ কত?',
    n_angle_surface: 'পানির তল থেকে নয়, কোণ মাপতে হয় অভিলম্ব থেকে।',
    n_angle_double: 'দুই রশ্মির মাঝের পুরো কোণ এটি; θ<sub>r</sub> তার অর্ধেক।',
    n_angle_right: 'অভিলম্ব পানির তলের সাথে লম্ব, কিন্তু রশ্মি অভিলম্বের সাথে লম্ব নয়।',
    a_angle: '<b>{b}°</b>: কোণ মাপা হয় অভিলম্ব থেকে, তাই θ<sub>i</sub> = {r}° − {a}° = {b}°, আর θ<sub>r</sub> = θ<sub>i</sub>।',

    q_plane: 'X থেকে আলো O বিন্দুতে পড়েছে। ক, খ, গ, ঘ রশ্মির কোনটি প্রকৃত প্রতিফলিত রশ্মি?',
    c_ray: 'রশ্মি {x}',
    n_plane_off: 'এই রশ্মি সমান কোণে গেছে, কিন্তু পানিতে এর পা সমতলের রেখার বাইরে: প্রথম সূত্র ভাঙে।',
    n_plane_angle: 'এই রশ্মি সমতলে আছে, কিন্তু কোণ সমান নয়: দ্বিতীয় সূত্র ভাঙে।',
    n_plane_back: 'এই রশ্মি অভিলম্বের যে পাশে X আছে সেই পাশেই ফিরেছে; প্রতিফলিত রশ্মি যায় অন্য পাশে।',
    a_plane: '<b>রশ্মি {x}</b>: এটি X, O আর লম্বের সমতলেই আছে, আর অভিলম্বের অন্য পাশে সমান কোণে গেছে।',

    q_rough: 'ঢেউয়ের পানিতে সমান্তরাল রশ্মিগুলো ছড়িয়ে গেল কেন?',
    c_rough_ok: 'পৃষ্ঠ একেক অংশে একেক কোণে',
    c_rough_law: 'ঢেউয়ে সূত্র কাজ করে না',
    c_rough_absorb: 'ঢেউ আলো শোষণ করে নেয়',
    c_rough_light: 'রশ্মি সমান্তরাল আসে না',
    n_rough_law: 'বই বলছে: প্রত্যেকটা রশ্মিই প্রতিফলনের সূত্র মেনে চলে।',
    n_rough_absorb: 'শোষণে আলো কমে, কিন্তু রশ্মির দিক বদলায় না।',
    n_rough_light: 'আসার পথে রশ্মিগুলো সমান্তরালই; বদলেছে পৃষ্ঠের ঢাল।',
    a_rough: '<b>একেক অংশের পৃষ্ঠ একেক কোণে থাকে।</b> প্রতিটি রশ্মি নিজের জায়গায় সূত্র মানে, কিন্তু অভিলম্ব একেকদিকে: এটাই ব্যাপ্ত প্রতিফলন।',
  },
  en: {
    panel_hide: 'Hide text',
    panel_show: 'Show text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'The picture gets bigger, with the words beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Laws of reflection',
    view: 'View',
    view_front_short: 'Start view',
    view_rotate: 'Turn to look',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Angle of incidence',
    aria_stage:
      'A calm lake below a mountain, the mountain mirrored in the water. A ray of light from X falls on the water at O. Drag X to change the angle of incidence; drag the button at the water’s edge to turn the plane.',
    ex_laws: 'Laws of reflection',
    ex_surface: 'Smooth and rough',
    out_wavy: 'On rough water the rays <span class="rl-w">spread all around</span>.',
    l_facets: 'Each normal points its own way',
    l_surface_angle: '{a}° with the water',
    c_arc: 'Angle {x}',
    q_names_i: 'The picture marks angles A, B, C. Which is the angle of incidence?',
    q_names_r: 'The picture marks angles A, B, C. Which is the angle of reflection?',
    n_names_i: 'The angle of incidence is between the incident ray XO and the normal.',
    n_names_r: 'The angle of reflection is between the reflected ray OX′ and the normal.',
    n_names_surface: 'This is between the ray and the water’s surface; angles are measured from the normal.',
    n_names_none: 'It is in the picture. Look for the ray’s angle with the normal.',
    a_names_i: '<b>Angle {x}</b>: the angle the incident ray makes with the normal is the angle of incidence (θ<sub>i</sub>).',
    a_names_r: '<b>Angle {x}</b>: the angle the reflected ray makes with the normal is the angle of reflection (θ<sub>r</sub>).',
    q_widen: 'X is moved so the angle of incidence grows by {d}°. By how much does the angle between XO and OX′ grow?',
    n_widen_one: 'The angle of reflection grows just as much: count both.',
    n_widen_none: 'θ<sub>r</sub> is not fixed: when θ<sub>i</sub> grows, θ<sub>r</sub> grows too.',
    n_widen_four: 'Each of the two angles grows once; it cannot be more than double.',
    a_widen: '<b>{e}°</b>: by the second law θ<sub>r</sub> = θ<sub>i</sub>, so both grow by {d}°: {two} × {d}° = {e}°.',

    ex_label: 'Steps of the book',

    act_home: 'Start this step again',
    act_wait: 'Watch…',
    act_next: 'On to the next step',
    act_normal: 'Imagine the perpendicular',
    act_plane: 'Imagine the plane',
    act_reflect: 'See the reflected ray',
    act_swing: 'Drag the button to turn the plane',
    act_tilt: 'Drag X to change the angle',
    act_waves: 'Raise waves',
    act_calm: 'Calm the water',

    out_l0: 'A <span class="rl-w">ray of light</span> has fallen on the water at the point O.',
    out_l1: 'The perpendicular to the water at O is the <span class="rl-w">normal</span>.',
    out_l2: 'The ray XO and the perpendicular make a plane.',
    out_angles: '<span class="rl-a rl-ti">θ<sub>i</sub> = {a}°</span><span class="rl-a rl-tr">θ<sub>r</sub> = {b}°</span>',
    out_smooth: 'On smooth water the rays stayed <span class="rl-w">parallel</span>.',

    rule_l0: 'When a ray of light falls on one point of another medium, first imagine a <b>perpendicular</b> at that point.',
    rule_l1: 'Take the ray that fell on the point and the perpendicular you imagined, and imagine a <b>plane</b> through the two lines.',
    rule_l2: 'XO is the <b>incident ray</b> and O the point of incidence. Now see which way the light comes back.',
    rule_l3:
      'OX′ is the <b>reflected ray</b>. The incident ray’s angle with the normal is the <b>angle of incidence (θ<sub>i</sub>)</b>; the reflected ray’s is the <b>angle of reflection (θ<sub>r</sub>)</b>.',
    rule_l4: '<b>First law:</b> the reflected ray lies in the plane we imagined through the incident ray and the perpendicular.',
    rule_l5:
      '<b>First law:</b> the reflected ray lies in the plane we imagined through the incident ray and the perpendicular.<br><b>Second law:</b> the angle of reflection equals the angle of incidence.',
    rule_s0:
      'On a mirror or a <b>smooth surface</b> like a mirror, parallel rays stay parallel after reflection. So the mountain’s image in the water is clear.',
    rule_s1:
      'Every ray still obeys the laws of reflection, but each part of the surface lies at its own angle. So the rays spread all around: <b>diffuse reflection</b>. That is why the mountain’s image breaks up.',

    note_rays: 'Rays drawn to explain',

    l_ray: 'Ray of light',
    l_m1: 'First medium (air)',
    l_m2: 'Second medium (water)',
    l_x: 'X',
    l_o: 'O',
    l_op: 'Point of incidence O',
    l_xp: 'X′',
    l_normal: 'Normal',
    l_lamba: 'Perpendicular (normal)',
    l_plane: 'Plane',
    l_inc: 'Incident ray',
    l_ref: 'Reflected ray',
    l_ti: 'θ<sub>i</sub> = {a}°',
    l_tr: 'θ<sub>r</sub> = {a}°',
    l_tr_q: 'θ<sub>r</sub> = ?',
    l_smooth: 'Smooth surface',
    l_rough: 'Rough surface',
    l_parallel: 'Parallel',
    l_scatter: 'Diffuse reflection',
    letters: 'A,B,C,D',
    l_letter: '{x}',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Tap an answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} correct',
    q_again: 'Take the test again',
    q_great: 'Great! You know the laws of reflection.',
    q_good: 'Good! Look through Learn once more.',
    q_try: 'Go through the Learn steps again.',
    q_locked: 'The test is on. You can drag again when you return to Learn.',

    c_none: 'None of them',

    q_angle: 'In the picture the ray makes {a}° with the water’s surface. What is the angle of reflection?',
    n_angle_surface: 'Angles are measured from the normal, not from the water’s surface.',
    n_angle_double: 'That is the whole angle between the two rays; θ<sub>r</sub> is half of it.',
    n_angle_right: 'The normal is perpendicular to the water, but the ray is not perpendicular to the normal.',
    a_angle: '<b>{b}°</b>: angles are measured from the normal, so θ<sub>i</sub> = {r}° − {a}° = {b}°, and θ<sub>r</sub> = θ<sub>i</sub>.',

    q_plane: 'Light from X falls at O. Which of A, B, C, D is the real reflected ray?',
    c_ray: 'Ray {x}',
    n_plane_off: 'This ray has the equal angle, but its foot on the water is off the plane’s line: it breaks the first law.',
    n_plane_angle: 'This ray is in the plane but the angle is not equal: it breaks the second law.',
    n_plane_back: 'This ray came back on X’s side of the normal; the reflected ray goes to the other side.',
    a_plane: '<b>Ray {x}</b>: it is in the plane of X, O and the perpendicular, at an equal angle on the other side of the normal.',

    q_rough: 'On wavy water why did the parallel rays spread?',
    c_rough_ok: 'Each part lies at its own angle',
    c_rough_law: 'The laws fail on waves',
    c_rough_absorb: 'Waves absorb the light',
    c_rough_light: 'Rays arrive not parallel',
    n_rough_law: 'The book says every ray still obeys the laws of reflection.',
    n_rough_absorb: 'Absorption takes light away, but does not turn a ray.',
    n_rough_light: 'They arrive parallel; it is the slope of the surface that changes.',
    a_rough:
      '<b>Each part of the surface lies at its own angle.</b> Each ray obeys the laws where it lands, but the normals point different ways: this is diffuse reflection.',
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
    let s = dict[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? num(vars[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
