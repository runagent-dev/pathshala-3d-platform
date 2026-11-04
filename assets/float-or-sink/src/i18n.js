// Every string the figure shows, in Bangla and English. The book's words on pages 138–139 (topic 5.3.2): বস্তুর ভেসে
// থাকা বা ডুবে যাওয়া, প্লবতা, "যতটুকু পানি সরিয়েছে উপরের দিকে সেই পানির ওজনের সমপরিমাণ বল অনুভব করে", অপসারিত পানি,
// "ঠিক যে পরিমাণ পানিতে ডুবে থাকলে বস্তুর সমান ওজনের পানি অপসারণ করবে, ততটুকুই ডুববে", "ওজন অপসারিত পানির ওজন থেকে
// বেশি হয়, তাহলে সেটি পানিতে ডুবে যাবে", "ওজন কিন্তু সত্যিকার ওজন থেকে কম মনে হবে", "যেখানেই রাখা হবে সেটা
// সেখানেই থাকবে, উপরেও ভেসে উঠবে না নিচেও ডুবে যাবে না", সাবমেরিন; the উদাহরণ: ঘনত্ব, ভর, আয়তন, "ডুবন্ত অংশের
// সমপরিমাণ পানির ভর কাঠের ভরের সমান", Vρ = V₁ρw, V₁/V = ρ/ρw, শতাংশ. The page writes উপর. The scene's own words:
// ট্যাংক, কৌটা, মাপমতো বালু, তলার ঠেলা, কর্ক, বরফ, ইট.
// Use t('key', vars) in code and t.num() for numbers; numbers come in as {vars} (their digits become Bangla). A {key}
// that is not a var is another string of the same language: units {u_N}, {u_rho}, {u_cm}, {u_kg} (Latin symbols, as
// the book; <sup>: the bundled font has no ³), always after a no-break space.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বস্তুর ভেসে থাকা বা ডুবে যাওয়া',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'প্লবতা',
    u_N: 'N',
    u_rho: 'kg/m<sup>3</sup>',
    u_cm: 'cm',
    u_kg: 'kg',

    steps: 'কী দেখবে',
    step_cases: 'তিন অবস্থা',
    step_wood: 'উদাহরণ: কাঠ',
    step_sub: 'সাবমেরিন',
    act_home: 'আবার শুরু',
    materials: 'কী দিয়ে তৈরি',

    name_wood: 'কাঠ',
    name_brick: 'ইট',
    name_tin: 'কৌটা',
    name_cork: 'কর্ক',
    name_ice: 'বরফ',
    name_stone: 'পাথর',
    name_painted: 'বস্তু',
    name_sub: 'সাবমেরিন',

    act_drop_wood: 'কাঠটি পানিতে ছাড়ো',
    act_drop_brick: 'ইটটি পানিতে ছাড়ো',
    act_put_tin: 'কৌটাটি পানির ভেতরে রেখে ছাড়ো',
    act_move_tin: 'কৌটাটি অন্য গভীরতায় রাখো',
    act_drop_block: 'টুকরোটি পানিতে ছাড়ো',
    act_try_cork: 'কর্ক দিয়ে দেখো',
    act_try_wood: 'কাঠ দিয়ে দেখো',
    act_try_ice: 'বরফ দিয়ে দেখো',
    act_try_brick: 'ইট দিয়ে দেখো',
    act_sub_fill: 'ট্যাংকে পানি নাও',
    act_sub_hover: 'ওজন প্লবতার সমান করো',
    act_sub_blow: 'ট্যাংকের পানি বের করে দাও',

    legend_W: 'ওজন: নিচের দিকে',
    legend_B: 'প্লবতা: উপরের দিকে',
    legend_len: 'তীর যত লম্বা, বল তত বেশি',
    gauge: 'ট্যাংকে পানি',
    gauge_val: '{v}&nbsp;{u_kg}',
    note_arrows: 'তীরের দৈর্ঘ্য বলের সমানুপাতিক',

    lbl_W: 'ওজন {v}&nbsp;{u_N}',
    lbl_B: 'প্লবতা {v}&nbsp;{u_N}',
    lbl_N: 'তলার ঠেলা {v}&nbsp;{u_N}',
    lbl_Wq: 'ওজন ?',
    lbl_v: '{v}&nbsp;{u_N}',
    lbl_V: 'V',
    lbl_V1: 'V<sub>1</sub>',
    lbl_cm: '{v}&nbsp;{u_cm}',
    lbl_letter: '{x}',

    out_start: 'তিনটি বস্তু সমান আকারের। পুরো ডুবলে প্রতিটির প্লবতা <b>{B}&nbsp;{u_N}</b>',
    out_falling: '{name} নামছে: ওজন <b>{W}&nbsp;{u_N}</b> &gt; প্লবতা {B}&nbsp;{u_N}',
    out_rising: '{name} উঠছে: প্লবতা <b>{B}&nbsp;{u_N}</b> &gt; ওজন {W}&nbsp;{u_N}',
    out_settling: '{name} ওঠানামা করছে: প্লবতা আর ওজন সমান হওয়ার জায়গা খুঁজছে',
    out_held: '{name} হাতে ধরা: ছেড়ে দাও, দেখো কী হয়',
    out_placing: '{name}টি পানির ভেতরে রাখা হচ্ছে…',
    letter_0: 'ক',
    letter_1: 'খ',
    letter_2: 'গ',
    out_floats: '{name} <b>ভাসছে</b>: প্লবতা = ওজন = {W}&nbsp;{u_N}',
    out_sinks: '{name} <b>ডুবে গেল</b>: ওজন {W}&nbsp;{u_N} &gt; প্লবতা {B}&nbsp;{u_N}',
    out_stays: '{name} <b>যেখানে রাখা, সেখানেই</b>: ওজন = প্লবতা = {W}&nbsp;{u_N}',

    rule_start:
      'পানিতে ডোবানো বস্তু যতটুকু পানি সরায় (অপসারিত পানি), সেই পানির ওজনের সমান একটি বল উপরের দিকে অনুভব করে। এই বলই <b>প্লবতা</b>। কোনটি ভাসবে, কোনটি ডুববে?',
    rule_wood: 'বস্তু <b>ঠিক ততটুকুই</b> ডোবে, যতটুকু ডুবলে তার সমান ওজনের পানি অপসারণ করে। বাকি অংশ পানিতে ডোবে না।',
    rule_brick:
      'ওজন অপসারিত পানির ওজনের চেয়ে বেশি হলে বস্তুটি <b>ডুবে যায়</b>। তবে পানিতে তার ওজন কম মনে হয়:<span class="pvc-formula">{W} − {B} = {A}&nbsp;{u_N}</span>তলা এটুকুই ঠেলে ধরে।',
    rule_tin: 'ওজন অপসারিত পানির ওজনের ঠিক সমান হলে বস্তু পানির ভেতরে <b>যেখানে রাখা, সেখানেই</b> থাকে। ভেসেও ওঠে না, ডোবেও না। (কৌটার ভেতরে মাপমতো বালু।)',
    rule_drag: 'যেকোনোটি টেনে পানির ভেতরে অন্য জায়গায় নিয়ে ছেড়ে দাও: কাঠ ভেসে ওঠে, ইট ডুবে যায়, কৌটা সেখানেই থাকে।',

    out_block_held: '{name}: ঘনত্ব ρ = <b>{rho}&nbsp;{u_rho}</b>। পানিতে ছাড়লে কত শতাংশ ডুববে?',
    out_block_moving: '{name} ভেসে থাকার জায়গা খুঁজছে…',
    out_block_floats: 'V<sub>1</sub>/V = ρ/ρ<sub>w</sub> = {rho} ÷ {w} → <b>{p}%</b> ডুবে আছে',
    out_block_sinks: '{name}: ρ = {rho}&nbsp;{u_rho}, পানির চেয়ে বেশি: <b>পুরোটাই ডুবে গেল</b>',
    rule_example:
      'ভেসে থাকতে হলে ডুবন্ত অংশের সমপরিমাণ পানির ভর বস্তুর <b>ভরের সমান</b> হতে হবে।<span class="pvc-formula">Vρ = V<sub>1</sub>ρ<sub>w</sub>, তাই V<sub>1</sub>/V = ρ/ρ<sub>w</sub></span>এখানে ρ<sub>w</sub> = {w}&nbsp;{u_rho}।',
    rule_example_sunk:
      '<span class="pvc-formula">V<sub>1</sub>/V = ρ/ρ<sub>w</sub></span>এই সম্পর্ক <b>শুধু ভেসে থাকলেই</b> খাটে। ρ পানির ঘনত্বের চেয়ে বেশি হলে পুরোটা ডুবেও প্লবতা ওজনের চেয়ে কম, তাই বস্তুটি ডুবে যায়।',

    out_sub_float: 'সাবমেরিন <b>ভাসছে</b>: ট্যাংক খালি, প্লবতা = ওজন = {W}&nbsp;{u_N}',
    out_sub_filling: 'ট্যাংকে পানি ঢুকছে: ওজন বাড়ছে, <b>{W}&nbsp;{u_N}</b>',
    out_sub_falling: 'ওজন {W}&nbsp;{u_N} &gt; প্লবতা {B}&nbsp;{u_N}: <b>নিচে নামবে</b>',
    out_sub_slowing: 'ওজন = প্লবতা = <b>{W}&nbsp;{u_N}</b>: পানির বাধায় থেমে যাচ্ছে',
    out_sub_bottom: 'তলায় বসে আছে: ওজন <b>{W}&nbsp;{u_N}</b> &gt; প্লবতা {B}&nbsp;{u_N}',
    out_sub_hover: 'ওজন = প্লবতা = {W}&nbsp;{u_N}: <b>যেখানে আছে, সেখানেই থেমে আছে</b>',
    out_sub_rising: 'ওজন {W}&nbsp;{u_N} &lt; প্লবতা {B}&nbsp;{u_N}: <b>উপরে উঠবে</b>',
    rule_sub: 'পানির নিচে চলার জন্য সাবমেরিন ট্যাংকে পানি নেয় বা বের করে দেয়। ওজন প্লবতার ঠিক সমান হলে সে <b>যে গভীরতায় আছে</b>, সেখানেই থাকে।',

    hint_wait: 'একটু অপেক্ষা করো, এখনো নড়ছে।',

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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_sinks: 'তিনটি একই রকম বন্ধ কৌটা, ভেতরে ভিন্ন পরিমাণ বালু। পুরো ডুবলে প্রতিটির প্লবতা {B}&nbsp;{u_N}। কোনটি ডুবে যাবে?',
    c_none: 'কোনোটিই না',
    why_sinks: '<b>{x}</b>: ওজন {W}&nbsp;{u_N} &gt; প্লবতা {B}&nbsp;{u_N}, তাই ডুবে যায়।',
    mis_light: '{x}-এর ওজন প্লবতার চেয়ে কম: এটি ভাসবে।',
    mis_equal: '{x}-এর ওজন প্লবতার ঠিক সমান: যেখানে রাখা হবে, সেখানেই থাকবে।',
    mis_none: 'যার ওজন প্লবতার চেয়ে বেশি, সেটি ডুবে যায়।',

    q_percent: '{name}টির ঘনত্ব ρ = {rho}&nbsp;{u_rho}। পানিতে ছাড়লে এর কত শতাংশ পানিতে ডুবে থাকবে?',
    why_percent: '<b>{p}%</b><span class="pvc-formula">V<sub>1</sub>/V = ρ/ρ<sub>w</sub> = {rho} ÷ {w} = {f}</span>আর {f} × {h} = {p}%।',
    mis_above: 'এটি পানির উপরের অংশ, ডুবে থাকা অংশ নয়।',
    mis_all: 'ρ পানির ঘনত্বের চেয়ে কম, তাই এটি ভাসবে; পুরোটা ডোবে না।',
    mis_noHundred: 'ভগ্নাংশকে শতাংশ করতে {h} দিয়ে গুণ করতে হয়।',

    q_density: 'মাপকাঠিতে দেখো, {s}&nbsp;{u_cm} উঁচু বস্তুটির কতটুকু পানিতে ডুবে আছে। বস্তুটির ঘনত্ব কত?',
    why_density: '<b>{rho}&nbsp;{u_rho}</b><span class="pvc-formula">V<sub>1</sub>/V = {d} ÷ {s} = {f}</span>তাই ρ = {f} × ρ<sub>w</sub>।',
    mis_d_above: 'উপরে থাকা অংশ দিয়ে হিসাব করা হয়েছে; ডুবে থাকা অংশ নিতে হবে।',
    mis_d_inverse: 'ρ<sub>w</sub> ÷ (V<sub>1</sub>/V) নয়: ρ = (V<sub>1</sub>/V) × ρ<sub>w</sub>। এক-এর বেশি হলে তো ডুবে যেত।',
    mis_d_whole: 'ডুবে থাকা উচ্চতাকে পুরো উচ্চতা ({s}&nbsp;{u_cm}) দিয়ে ভাগ করতে হবে।',

    q_apparent: 'পাথরটি পুরো ডুবে আছে (তীরের মান ছবিতে)। পানির নিচে এর ওজন কত মনে হবে?',
    why_apparent: '<b>{A}&nbsp;{u_N}</b><span class="pvc-formula">ওজন − প্লবতা = {W} − {B} = {A}&nbsp;{u_N}</span>তলা এটুকুই ঠেলে ধরে।',
    mis_same: 'পানিতে ডুবে থাকলে ওজন সত্যিকার ওজন থেকে কম মনে হয়।',
    mis_added: 'প্লবতা উপরের দিকে, তাই যোগ নয়, বিয়োগ হবে।',
    mis_buoyancy: 'এটি তো প্লবতা; মনে হওয়া ওজন হলো ওজন − প্লবতা।',

    q_sub_up: 'সাবমেরিনটি পানির নিচে থেমে আছে। একে ভেসে উঠতে হলে কী করতে হবে?',
    q_sub_down: 'সাবমেরিনটি পানিতে ভাসছে। একে ডুব দিতে হলে কী করতে হবে?',
    c_blow: 'ট্যাংক থেকে পানি বের করে দেবে',
    c_fill: 'ট্যাংকে আরও পানি নেবে',
    c_wait_up: 'কিছু না, এমনিতেই উঠবে',
    c_wait_down: 'কিছু না, এমনিতেই ডুববে',
    c_keep: 'ওজন প্লবতার সমান রাখবে',
    why_sub_up: '<b>পানি বের করে দেবে</b>: ওজন কমে প্লবতার চেয়ে কম হলে সাবমেরিন উপরে ওঠে।',
    why_sub_down: '<b>ট্যাংকে পানি নেবে</b>: ওজন বেড়ে প্লবতার চেয়ে বেশি হলে সাবমেরিন নামে।',
    mis_sub_fill: 'পানি নিলে ওজন বাড়ে: তখন আরও নামবে।',
    mis_sub_blow: 'পানি বের করলে ওজন কমে: তখন আরও উঠবে।',
    mis_sub_wait: 'ওজন আর প্লবতা এখন সমান: কিছু না করলে যেখানে আছে, সেখানেই থাকবে।',
    mis_sub_wait_down: 'ভাসন্ত অবস্থায় ওজন = প্লবতা: কিছু না করলে ভাসতেই থাকবে।',
    mis_sub_keep: 'ওজন প্লবতার সমান থাকলে যেখানে আছে, সেখানেই থাকবে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Floating or sinking',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Buoyancy',
    u_N: 'N',
    u_rho: 'kg/m<sup>3</sup>',
    u_cm: 'cm',
    u_kg: 'kg',

    steps: 'What to see',
    step_cases: 'Three cases',
    step_wood: 'Example: wood',
    step_sub: 'Submarine',
    act_home: 'Start again',
    materials: 'Made of',

    name_wood: 'Wood',
    name_brick: 'Brick',
    name_tin: 'Tin',
    name_cork: 'Cork',
    name_ice: 'Ice',
    name_stone: 'Stone',
    name_painted: 'block',
    name_sub: 'Submarine',

    act_drop_wood: 'Drop the wood in the water',
    act_drop_brick: 'Drop the brick in the water',
    act_put_tin: 'Put the tin under water and let go',
    act_move_tin: 'Put the tin at another depth',
    act_drop_block: 'Drop the block in the water',
    act_try_cork: 'Try cork',
    act_try_wood: 'Try wood',
    act_try_ice: 'Try ice',
    act_try_brick: 'Try brick',
    act_sub_fill: 'Take water into the tanks',
    act_sub_hover: 'Make the weight equal the buoyancy',
    act_sub_blow: 'Blow the water out of the tanks',

    legend_W: 'Weight: down',
    legend_B: 'Buoyancy: up',
    legend_len: 'The longer the arrow, the bigger the force',
    gauge: 'Water in the tanks',
    gauge_val: '{v}&nbsp;{u_kg}',
    note_arrows: 'Arrow lengths are in proportion to the forces',

    lbl_W: 'Weight {v}&nbsp;{u_N}',
    lbl_B: 'Buoyancy {v}&nbsp;{u_N}',
    lbl_N: 'Floor {v}&nbsp;{u_N}',
    lbl_Wq: 'Weight ?',
    lbl_v: '{v}&nbsp;{u_N}',
    lbl_V: 'V',
    lbl_V1: 'V<sub>1</sub>',
    lbl_cm: '{v}&nbsp;{u_cm}',
    lbl_letter: '{x}',

    out_start: 'The three bodies are the same size. Wholly under water, each gets <b>{B}&nbsp;{u_N}</b> of buoyancy',
    out_falling: '{name} is going down: weight <b>{W}&nbsp;{u_N}</b> &gt; buoyancy {B}&nbsp;{u_N}',
    out_rising: '{name} is coming up: buoyancy <b>{B}&nbsp;{u_N}</b> &gt; weight {W}&nbsp;{u_N}',
    out_settling: '{name} bobs: finding where buoyancy and weight are equal',
    out_held: '{name} held: let go and see what happens',
    out_placing: 'Putting the {name} under water…',
    letter_0: 'A',
    letter_1: 'B',
    letter_2: 'C',
    out_floats: '{name} <b>floats</b>: buoyancy = weight = {W}&nbsp;{u_N}',
    out_sinks: '{name} <b>sank</b>: weight {W}&nbsp;{u_N} &gt; buoyancy {B}&nbsp;{u_N}',
    out_stays: '{name} <b>stays where it was put</b>: weight = buoyancy = {W}&nbsp;{u_N}',

    rule_start:
      'A body in water feels an upward force equal to the weight of the water it pushes aside (the displaced water). This force is <b>buoyancy</b>. Which will float, which will sink?',
    rule_wood: 'A body sinks <b>just so far</b> that the water it pushes aside weighs as much as it does. The rest stays out of the water.',
    rule_brick:
      'If its weight is more than the weight of the water it pushes aside, it <b>sinks</b>. But under water it seems lighter:<span class="pvc-formula">{W} − {B} = {A}&nbsp;{u_N}</span>That is all the floor has to hold up.',
    rule_tin:
      'If its weight equals the weight of the water it pushes aside, it <b>stays where it is put</b>. It neither rises nor sinks. (The tin has just enough sand inside.)',
    rule_drag: 'Drag any of them somewhere else under water and let go: the wood comes up, the brick sinks, the tin stays.',

    out_block_held: '{name}: density ρ = <b>{rho}&nbsp;{u_rho}</b>. What per cent will be under water?',
    out_block_moving: '{name} is finding where it floats…',
    out_block_floats: 'V<sub>1</sub>/V = ρ/ρ<sub>w</sub> = {rho} ÷ {w} → <b>{p}%</b> under water',
    out_block_sinks: '{name}: ρ = {rho}&nbsp;{u_rho}, more than water: <b>it sank completely</b>',
    rule_example:
      'To float, the water as big as its sunken part must have the <b>same mass</b> as the body.<span class="pvc-formula">Vρ = V<sub>1</sub>ρ<sub>w</sub>, so V<sub>1</sub>/V = ρ/ρ<sub>w</sub></span>Here ρ<sub>w</sub> = {w}&nbsp;{u_rho}.',
    rule_example_sunk:
      '<span class="pvc-formula">V<sub>1</sub>/V = ρ/ρ<sub>w</sub></span>This holds <b>only while it floats</b>. Denser than water, even wholly under water the buoyancy is less than the weight, so it sinks.',

    out_sub_float: 'The submarine <b>floats</b>: tanks empty, buoyancy = weight = {W}&nbsp;{u_N}',
    out_sub_filling: 'Water coming into the tanks: the weight grows, <b>{W}&nbsp;{u_N}</b>',
    out_sub_falling: 'Weight {W}&nbsp;{u_N} &gt; buoyancy {B}&nbsp;{u_N}: <b>it goes down</b>',
    out_sub_slowing: 'Weight = buoyancy = <b>{W}&nbsp;{u_N}</b>: the water slows it to a stop',
    out_sub_bottom: 'Resting on the bottom: weight <b>{W}&nbsp;{u_N}</b> &gt; buoyancy {B}&nbsp;{u_N}',
    out_sub_hover: 'Weight = buoyancy = {W}&nbsp;{u_N}: <b>it stays where it is</b>',
    out_sub_rising: 'Weight {W}&nbsp;{u_N} &lt; buoyancy {B}&nbsp;{u_N}: <b>it comes up</b>',
    rule_sub:
      'To travel under water, a submarine takes water into its tanks or blows it out. When its weight exactly equals the buoyancy, it stays <b>at the depth it is</b>.',

    hint_wait: 'Wait a moment, it is still moving.',

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
    q_locked: 'The scene stays put during the test. Look at the picture and pick an answer.',

    q_sinks:
      'Three identical sealed tins with different amounts of sand inside. Wholly under water, each gets {B}&nbsp;{u_N} of buoyancy. Which one sinks?',
    c_none: 'None of them',
    why_sinks: '<b>{x}</b>: weight {W}&nbsp;{u_N} &gt; buoyancy {B}&nbsp;{u_N}, so it sinks.',
    mis_light: '{x} weighs less than the buoyancy: it floats.',
    mis_equal: '{x} weighs exactly as much as the buoyancy: it stays wherever it is put.',
    mis_none: 'The one heavier than the buoyancy sinks.',

    q_percent: 'The {name}’s density is ρ = {rho}&nbsp;{u_rho}. Dropped in water, what per cent of it will be under water?',
    why_percent: '<b>{p}%</b><span class="pvc-formula">V<sub>1</sub>/V = ρ/ρ<sub>w</sub> = {rho} ÷ {w} = {f}</span>And {f} × {h} = {p}%.',
    mis_above: 'That is the part above the water, not the part under it.',
    mis_all: 'ρ is less than water’s, so it floats; it is not all under.',
    mis_noHundred: 'To turn a fraction into a percentage, multiply by {h}.',

    q_density: 'Read the scale: how much of this {s}&nbsp;{u_cm} tall block is under water? What is its density?',
    why_density: '<b>{rho}&nbsp;{u_rho}</b><span class="pvc-formula">V<sub>1</sub>/V = {d} ÷ {s} = {f}</span>So ρ = {f} × ρ<sub>w</sub>.',
    mis_d_above: 'That uses the part above the water; take the part under it.',
    mis_d_inverse: 'Not ρ<sub>w</sub> ÷ (V<sub>1</sub>/V): ρ = (V<sub>1</sub>/V) × ρ<sub>w</sub>. More than water’s, it would have sunk.',
    mis_d_whole: 'Divide the height under water by the whole height ({s}&nbsp;{u_cm}).',

    q_apparent: 'The stone is wholly under water (the forces are on the picture). How heavy does it seem under water?',
    why_apparent:
      '<b>{A}&nbsp;{u_N}</b><span class="pvc-formula">weight − buoyancy = {W} − {B} = {A}&nbsp;{u_N}</span>That is all the floor holds up.',
    mis_same: 'Under water a body seems lighter than its real weight.',
    mis_added: 'The buoyancy pushes up, so subtract it, don’t add it.',
    mis_buoyancy: 'That is the buoyancy itself; the weight it seems to have is weight − buoyancy.',

    q_sub_up: 'The submarine is staying still under water. What must it do to come up?',
    q_sub_down: 'The submarine is floating. What must it do to dive?',
    c_blow: 'Blow water out of its tanks',
    c_fill: 'Take more water into its tanks',
    c_wait_up: 'Nothing, it will rise anyway',
    c_wait_down: 'Nothing, it will sink anyway',
    c_keep: 'Keep its weight equal to the buoyancy',
    why_sub_up: '<b>Blow water out</b>: its weight drops below the buoyancy, and it rises.',
    why_sub_down: '<b>Take water in</b>: its weight grows above the buoyancy, and it goes down.',
    mis_sub_fill: 'Taking water in makes it heavier: it would go down.',
    mis_sub_blow: 'Blowing water out makes it lighter: it would go up.',
    mis_sub_wait: 'Its weight and the buoyancy are equal now: left alone, it stays where it is.',
    mis_sub_wait_down: 'Floating, its weight equals the buoyancy: left alone, it keeps floating.',
    mis_sub_keep: 'With the weight equal to the buoyancy it stays where it is.',
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
