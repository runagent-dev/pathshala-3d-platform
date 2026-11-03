// Every string the figure shows, in Bangla (the NCTB words of book p203: ত্রিমাত্রিক সিসমিক সার্ভে, বিস্ফোরণ, স্তর,
// প্রতিফলিত, জিওফোন, ধারণ (Detect), গ্যাস, তেল, উৎস, সময়; the page writes "উপরে") and English. Use t('key') in code
// and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'ত্রিমাত্রিক সিসমিক সার্ভে (3D Seismic Survey)',
    view: 'দেখার ধরন',
    view_front_short: 'শুরুর দৃশ্য',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'গভীরতা',
    aria_stage:
      'মাটির একটি খণ্ড কেটে দেখানো: নিচে শিলার কয়েকটি স্তর। উপরে জিওফোনের সারি আর সামনের কিনারে বিস্ফোরণের গর্ত। বিস্ফোরণের শব্দ নিচে যায়, স্তরে স্তরে প্রতিফলিত হয়ে উপরে জিওফোনে ফিরে আসে।',

    act_blast: 'বিস্ফোরণ ঘটাও',
    act_wait: 'শব্দ ফিরে আসছে…',
    act_image: 'ত্রিমাত্রিক ছবি বানাও',
    act_again: 'আবার বিস্ফোরণ ঘটাও',
    act_home: 'নতুন করে',

    ex_label: 'প্রতিফলন',
    ex: 'স্তর {n}',
    ex_res: '{d} m',

    seis_aria: 'সিসমোগ্রাম: সামনের সারির ছয়টি জিওফোনে ধারণ করা শব্দ, সময়ের সঙ্গে। প্রতিটি স্তরের প্রতিফলন একেকটি রঙিন দাগ।',
    seis_time: 'সময় (s)',
    seis_head: 'জিওফোনে ধারণ করা শব্দ',

    out_ready: 'জিওফোনগুলো শুনছে, এখনো কোনো শব্দ আসেনি।',
    out_run: 'বিস্ফোরণের পর সময় <b class="ss-t">{t}&nbsp;s</b>',
    out_pick: 'রঙিন দাগে বা স্তরের নামে চাপো: কোন স্তর কত গভীরে?',
    out_depth:
      'স্তর {n}: <span class="ss-nb"><i>t</i> = {t}&nbsp;s</span>, <span class="ss-nb">গভীরতা = <i>vt</i>&nbsp;÷&nbsp;{two}</span> = <span class="ss-nb">{v} × {t} ÷ {two}</span> = <b>{d}&nbsp;m</b>',
    out_image: 'গম্বুজের চূড়া মাত্র <b>{d}&nbsp;m</b> গভীরে: চূড়ায় গ্যাস, তার নিচে তেল।',
    out_mapping: '{n}টি জিওফোনের প্রতিটির নিচে তিন স্তরের গভীরতা…',

    rule_start: '<b>মাটির খানিকটা নিচে ছোট বিস্ফোরণ ঘটানো হয়।</b> তার শব্দ নিচের বিভিন্ন স্তরে প্রতিফলিত হয়ে উপরে ফিরে আসে।',
    rule_run: '<b>জিওফোন প্রতিফলিত তরঙ্গকে ধারণ (Detect) করে।</b> যে স্তর যত গভীরে, তার প্রতিফলন তত দেরিতে আসে।',
    rule_depth:
      '<b>শব্দ নিচে গিয়ে আবার ফেরে, তাই গভীরতা = বেগ × সময় ÷ {two}।</b> শিলায় শব্দের বেগ এখানে ধরে নেওয়া <span class="ss-nb">v = {v}&nbsp;m/s</span>।',
    rule_image: '<b>সমস্ত তথ্য বিশ্লেষণ করে মাটির নিচের ত্রিমাত্রিক ছবি:</b> এক সারি জিওফোনে শুধু একটি কাটা অংশ, পুরো গ্রিডে গোটা গম্বুজ দেখা যায়।',

    note: 'সময় {k} গুণ ধীর · যন্ত্র বড় করে আঁকা',

    l_source: 'উৎস (বিস্ফোরণ)',
    l_geophone: 'জিওফোন',
    l_layer: 'স্তর {n}',
    l_depth: 'গভীরতা {d} m',
    l_depth_q: 'গভীরতা = ?',
    l_t: '<i>t</i> = {t} s',
    l_gas: 'গ্যাস',
    l_oil: 'তেল',
    l_truck: 'রেকর্ডিং গাড়ি',
    l_this: 'এই যন্ত্রটি',
    l_letter: 'স্তর {x}',
    letters: 'ক,খ,গ',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবি থেমে থাকে। ছবি দেখে উত্তর বেছে নাও।',
    q_first: 'আগে বিস্ফোরণ ঘটাও: তারপর প্রতিফলন আসবে।',

    q_phone: 'ছবিতে চিহ্নিত যন্ত্রটি (জিওফোন) সার্ভেতে কী কাজ করে?',
    c_phone_ok: 'ফিরে আসা প্রতিফলিত তরঙ্গ ধারণ করে',
    c_phone_blast: 'মাটির নিচে ছোট বিস্ফোরণ ঘটায়',
    c_phone_pump: 'মাটির নিচ থেকে তেল টেনে তোলে',
    c_phone_loud: 'শব্দকে জোরালো করে নিচে পাঠায়',
    n_phone_blast: 'বিস্ফোরণ হয় উৎসে (গর্তের ভেতরের চার্জে), জিওফোনে নয়।',
    n_phone_pump: 'সার্ভে শুধু খোঁজে কোথায় তেল আছে; তোলা হয় পরে, কূপ খুঁড়ে।',
    n_phone_loud: 'জিওফোন শব্দ পাঠায় না, শুধু ধরে (রিসিভার)।',
    a_phone: '<b>প্রতিফলিত তরঙ্গ ধারণ (Detect) করে।</b> জিওফোন এক ধরনের রিসিভার: মাটির কাঁপুনি ধরে তার থেকে সংকেত তারে করে রেকর্ডিং গাড়িতে যায়।',

    q_why: 'ছবিতে বিস্ফোরণের শব্দ নিচে যাচ্ছে। কিছু শব্দ আবার উপরে ফিরে আসছে কেন?',
    c_why_ok: 'দুই স্তরের সীমানায় প্রতিফলিত হয়ে',
    c_why_up: 'শব্দ সবসময় উপরের দিকেই যায় বলে',
    c_why_absorb: 'মাটি শব্দ শুষে নিয়ে আবার ছাড়ে বলে',
    c_why_gas: 'শুধু গ্যাস থাকলেই শব্দ ফেরে বলে',
    n_why_up: 'বিস্ফোরণের শব্দ চারদিকে ছড়ায়, নিচেও যায় (সাদা বৃত্ত)।',
    n_why_absorb: 'শোষিত শব্দ দুর্বল হয়ে হারিয়ে যায়, ফেরে না।',
    n_why_gas: 'যেকোনো দুই ভিন্ন শিলার সীমানা থেকেই শব্দ প্রতিফলিত হয়; ছবিতে গ্যাস ছাড়াই তিনটি প্রতিফলন।',
    a_why: '<b>সীমানায় প্রতিফলিত হয়ে।</b> এক শিলা থেকে আরেক শিলায় ঢোকার মুখে শব্দের কিছু অংশ প্রতিফলিত হয়ে উপরে ফেরে (রঙিন বৃত্ত), বাকিটা আরও নিচে যায়।',

    q_later: 'ক, খ, গ: কোন স্তর থেকে প্রতিফলিত শব্দ জিওফোনে সবার শেষে পৌঁছায়?',
    c_later: 'স্তর {x}',
    c_later_same: 'তিনটিই একসঙ্গে',
    n_later_shallow: 'এই স্তর বেশি গভীরে নয়; কম পথ, তাই শব্দ আগে ফেরে।',
    n_later_same: 'বেগ একই হলেও পথ আলাদা: গভীর স্তরে যেতে-আসতে বেশি পথ।',
    a_later: '<b>স্তর {x}</b>, কারণ এটিই সবচেয়ে গভীরে: শব্দকে বেশি পথ নিচে যেতে আর ফিরতে হয়, তাই সময় বেশি লাগে।',

    q_depth: 'ছবিতে জিওফোন {one}-এ এই স্তরের প্রতিফলন পৌঁছাল t সময়ে। শিলায় শব্দের বেগ {v} m/s হলে স্তরটি কত গভীরে?',
    n_depth_2: 'v × t হলো যাওয়া-আসার পুরো পথ; গভীরতা তার অর্ধেক।',
    n_depth_4: 'দুবার {two} দিয়ে ভাগ করা হয়েছে: v × t ÷ {two} যথেষ্ট।',
    n_depth_div: 'দূরত্ব = বেগ × সময়, বেগ ÷ সময় নয়।',
    a_depth: '<b>{d} m</b>: গভীরতা = <i>vt</i> ÷ {two} = {v} × {t} ÷ {two} = {d} m (শব্দ নিচে যায়, আবার ফেরে)।',

    q_grid: 'এক সারির বদলে পুরো মাঠ জুড়ে জিওফোনের গ্রিড বসানো হয় কেন?',
    c_grid_ok: 'মাটির নিচের স্তরের ত্রিমাত্রিক ছবি পেতে',
    c_grid_loud: 'বিস্ফোরণের শব্দ আরও জোরালো করতে',
    c_grid_fast: 'শিলায় শব্দের বেগ বাড়িয়ে দিতে',
    c_grid_spare: 'একটি জিওফোন নষ্ট হলে অন্যটি চালাতে',
    n_grid_loud: 'জিওফোন শব্দ তৈরি করে না, শুধু ধরে।',
    n_grid_fast: 'শিলায় শব্দের বেগ শিলার ওপর নির্ভর করে, জিওফোনের সংখ্যার ওপর নয়।',
    n_grid_spare: 'এটা আসল কারণ নয়: প্রতিটি জিওফোন নিজের নিচের আলাদা জায়গার খবর দেয়।',
    a_grid: '<b>ত্রিমাত্রিক ছবি পেতে।</b> প্রতিটি জিওফোন তার নিচের গভীরতা দেয়; গ্রিডের সব তথ্য মিলিয়ে স্তরগুলোর আকার, গম্বুজ, কোথায় গ্যাস বা তেল তা বোঝা যায়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: '3D Seismic Survey (ত্রিমাত্রিক সিসমিক সার্ভে)',
    view: 'View',
    view_front_short: 'Starting view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Depth',
    aria_stage:
      'A block of ground cut open: layers of rock below, a grid of geophones on top and a shot hole on the front edge. The blast’s sound goes down, reflects at each layer and comes back up to the geophones.',

    act_blast: 'Set off the blast',
    act_wait: 'The echoes are coming back…',
    act_image: 'Make the 3D picture',
    act_again: 'Set off another blast',
    act_home: 'Start again',

    ex_label: 'Echoes',
    ex: 'Layer {n}',
    ex_res: '{d} m',

    seis_aria: 'Seismogram: the sound detected by the six geophones of the front row, against time. Each layer’s echo is a coloured blip.',
    seis_time: 'time (s)',
    seis_head: 'Sound detected by the geophones',

    out_ready: 'The geophones are listening; no sound has arrived yet.',
    out_run: 'Time since the blast <b class="ss-t">{t}&nbsp;s</b>',
    out_pick: 'Tap a coloured blip or a layer’s name: how deep is each layer?',
    out_depth:
      'Layer {n}: <span class="ss-nb"><i>t</i> = {t}&nbsp;s</span>, <span class="ss-nb">depth = <i>vt</i>&nbsp;÷&nbsp;{two}</span> = <span class="ss-nb">{v} × {t} ÷ {two}</span> = <b>{d}&nbsp;m</b>',
    out_image: 'The top of the dome is only <b>{d}&nbsp;m</b> deep: gas at the top, oil below it.',
    out_mapping: 'Under each of the {n} geophones, the depth of three layers…',

    rule_start: '<b>A small blast is set off a little below the ground.</b> Its sound reflects at the layers underground and comes back up.',
    rule_run: '<b>Geophones detect the reflected waves.</b> The deeper the layer, the later its echo arrives.',
    rule_depth:
      '<b>The sound goes down and comes back, so depth = speed × time ÷ {two}.</b> The speed of sound in the rock is taken here as <span class="ss-nb">v = {v}&nbsp;m/s</span>.',
    rule_image:
      '<b>All the data together give a 3D picture of the ground:</b> one line of geophones shows a single slice; the whole grid shows the whole dome.',

    note: 'Time slowed {k}× · equipment drawn larger',

    l_source: 'Source (blast)',
    l_geophone: 'Geophone',
    l_layer: 'Layer {n}',
    l_depth: 'depth {d} m',
    l_depth_q: 'depth = ?',
    l_t: '<i>t</i> = {t} s',
    l_gas: 'Gas',
    l_oil: 'Oil',
    l_truck: 'Recording truck',
    l_this: 'This device',
    l_letter: 'Layer {x}',
    letters: 'A,B,C',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture and pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The picture stays still during the test. Look at it and pick an answer.',
    q_first: 'Set off the blast first: then the echoes come.',

    q_phone: 'What does the marked device (a geophone) do in the survey?',
    c_phone_ok: 'It detects the reflected waves coming back',
    c_phone_blast: 'It sets off a small blast underground',
    c_phone_pump: 'It pulls oil up from underground',
    c_phone_loud: 'It makes the sound louder and sends it down',
    n_phone_blast: 'The blast is at the source (the charge in the hole), not at a geophone.',
    n_phone_pump: 'The survey only finds where the oil is; it is pumped later, from a well.',
    n_phone_loud: 'A geophone sends nothing; it only receives.',
    a_phone:
      '<b>It detects the reflected waves.</b> A geophone is a receiver: it picks up the shaking of the ground and sends the signal along the cable to the recording truck.',

    q_why: 'In the picture the blast’s sound goes down. Why does some of it come back up?',
    c_why_ok: 'It reflects at the boundary between two layers',
    c_why_up: 'Sound always travels upward',
    c_why_absorb: 'The ground absorbs the sound and lets it out again',
    c_why_gas: 'Sound comes back only where there is gas',
    n_why_up: 'The blast’s sound spreads in all directions, down too (the white circle).',
    n_why_absorb: 'Absorbed sound dies away; it does not come back.',
    n_why_gas: 'Any boundary between two different rocks reflects; the picture shows three echoes without gas.',
    a_why:
      '<b>It reflects at the boundaries.</b> Where sound passes from one rock into another, part of it reflects back up (the coloured circles) and the rest goes on down.',

    q_later: 'A, B, C: from which layer does the reflected sound reach the geophones last?',
    c_later: 'Layer {x}',
    c_later_same: 'All three together',
    n_later_shallow: 'This layer is not the deepest: a shorter path, so its echo comes earlier.',
    n_later_same: 'Same speed, different paths: going down to a deeper layer and back is longer.',
    a_later: '<b>Layer {x}</b>, because it is the deepest: the sound has further to go down and back, so it takes longer.',

    q_depth: 'In the picture, this layer’s echo reached geophone {one} after time t. If sound travels at {v} m/s in the rock, how deep is the layer?',
    n_depth_2: 'v × t is the whole path, down and back; the depth is half of it.',
    n_depth_4: 'Halved twice: v × t ÷ {two} is enough.',
    n_depth_div: 'Distance = speed × time, not speed ÷ time.',
    a_depth: '<b>{d} m</b>: depth = <i>vt</i> ÷ {two} = {v} × {t} ÷ {two} = {d} m (the sound goes down and comes back).',

    q_grid: 'Why is a grid of geophones laid over the whole field instead of one line?',
    c_grid_ok: 'To get a 3D picture of the layers underground',
    c_grid_loud: 'To make the blast’s sound louder',
    c_grid_fast: 'To make sound travel faster in the rock',
    c_grid_spare: 'So that one can work if another breaks',
    n_grid_loud: 'Geophones make no sound; they only receive.',
    n_grid_fast: 'The speed of sound depends on the rock, not on the number of geophones.',
    n_grid_spare: 'Not the real reason: each geophone reports on a different place under it.',
    a_grid:
      '<b>To get a 3D picture.</b> Each geophone gives the depth under it; together the grid shows the shape of the layers, the dome, and where gas or oil is.',
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
