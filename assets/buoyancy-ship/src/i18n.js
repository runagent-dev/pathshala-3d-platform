// Every string the figure shows, in Bangla and English. The book's words on page 137 (topic 5.3.1): আর্কিমিডিসের নীতি,
// প্লবতা (Buoyancy), তরল, নিমজ্জিত, অপসারণ / অপসারিত, "যে পরিমাণ তরল অপসারণ করে সেইটুকু তরলের সমান ওজন বস্তুটির ওজন
// থেকে কমে যায়", ঘনত্ব ρ, গভীরতা h₁ h₂, পৃষ্ঠ, ক্ষেত্রফল A, চাপ P = hρg, F = F₂ − F₁ = A(h₂ − h₁)ρg = Ahρg, আয়তন,
// মাধ্যাকর্ষণজনিত ত্বরণ g, কাটাকাটি, ঊর্ধ্বমুখী; p138 (5.3.2): ভেসে থাকা, ডুবে যাওয়া. The page writes উপর. The
// scene's own words: জাহাজ, কন্টেইনার, বোঝাই রেখা (প্লিমসল দাগ), নিক্তি (spring balance), নিরেট স্টিলের সিলিন্ডার.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_N}, {u_Pa}, {u_m}, {u_m2}, {u_m3} (written with <sup>:
// the bundled font has no ² ³ ⁻ ₁ ₂), always after a no-break space.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'আর্কিমিডিসের নীতি এবং প্লবতা',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'প্লবতা',
    u_N: 'N',
    u_Pa: 'Pa',
    u_m: 'm',
    u_m2: 'm<sup>2</sup>',
    u_m3: 'm<sup>3</sup>',

    // the row of words: the four steps
    steps: 'ধাপ',
    chip_pressure: 'চাপ',
    chip_weight: 'ওজন ও প্লবতা',
    chip_displaced: 'অপসারিত পানি',
    chip_load: 'মাল বোঝাই',

    // the action and the quiet button
    act_home: 'শুরুতে ফেরাও',
    act_show_p: 'পানির চাপ দেখাও',
    act_sum: 'বলগুলো যোগ করো',
    act_again_p: 'আবার দেখাও',
    act_lower: 'সিলিন্ডার পানিতে নামাও',
    act_drop: 'সিলিন্ডার ছেড়ে দাও',
    act_again_w: 'আবার ঝোলাও',
    act_ghost: 'সরানো পানি তুলে ওজন করো',
    act_again_d: 'আবার দেখাও',
    act_load: 'একটি কন্টেইনার তোলো',
    act_unload: 'সব কন্টেইনার নামাও',

    // the containers' stepper
    name_load: 'কন্টেইনার ({c} টন করে)',
    less_load: 'একটি কন্টেইনার নামাও',
    more_load: 'একটি কন্টেইনার তোলো',

    // the sums with the student's numbers
    eq_p2: 'তলায় চাপ P<sub>2</sub> = h<sub>2</sub>ρg = {h} × {rho} × {g} = <b>{P}&nbsp;{u_Pa}</b>',
    eq_sides: 'পাশে: একই গভীরতায় দুই দিকে চাপ সমান, দিক উল্টো',
    eq_f: 'প্লবতা F = AP<sub>2</sub> = {A}&nbsp;{u_m2} × {P}&nbsp;{u_Pa} = <b>{F}&nbsp;{u_N}</b>',
    eq_ship_w: 'জাহাজের ওজন W = mg = {m}&nbsp;kg × {g} = <b>{W}&nbsp;{u_N}</b>',
    eq_steel_air: 'নিরেট স্টিলের সিলিন্ডার: ভর একই, কিন্তু আয়তন মাত্র {V}&nbsp;{u_m3}',
    eq_steel_water: 'সিলিন্ডারের ওজন {W}&nbsp;{u_N}, প্লবতা মাত্র প্রায় {B}&nbsp;{u_N}',
    eq_v: 'অপসারিত পানির আয়তন V = Ah = {A}&nbsp;{u_m2} × {h}&nbsp;{u_m} = <b>{V}&nbsp;{u_m3}</b>',
    eq_vw: 'তার ওজন = Vρg = {V} × {rho} × {g} = <b>{F}&nbsp;{u_N}</b>',
    eq_load: 'ভর m = {m} টন, পানির নিচে h = <b>{h}&nbsp;{u_m}</b>',
    eq_balance: 'ওজন W = প্লবতা F = <b>{W}&nbsp;{u_N}</b>',

    // the result line
    out_p0: 'পানি জাহাজের গায়ে চারদিক থেকে চাপ দেয়',
    out_p1: 'যত গভীরে, তত বেশি চাপ: তলায় <b>{P}&nbsp;{u_Pa}</b>',
    out_p2: 'পাশের বল কাটাকাটি, নিচ থেকে মোট <b>{F}&nbsp;{u_N}</b>',
    out_w0: 'বাতাসে নিক্তির পাঠ <b>{R}&nbsp;{u_N}</b>: পুরো ওজন',
    out_w1: 'পানিতে নিক্তির পাঠ কমে প্রায় <b>{R}&nbsp;{u_N}</b>',
    out_w2: 'ওজন প্লবতার চেয়ে বেশি: সিলিন্ডার <b>ডুবে গেল</b>',
    out_d0: 'জাহাজের তলা পানির <b>{h}&nbsp;{u_m}</b> নিচে: সেখানকার পানি সরে গেছে',
    out_d1: 'অপসারিত পানির ওজন <b>{F}&nbsp;{u_N}</b> = প্লবতা',
    out_empty: 'খালি জাহাজ পানির <b>{h}&nbsp;{u_m}</b> নিচে ডুবে আছে',
    out_load: '{n}টি কন্টেইনার: জাহাজ <b>{h}&nbsp;{u_m}</b> ডুবে আছে',
    out_full: 'পানি বোঝাই রেখায় পৌঁছেছে: <b>আর মাল নয়</b>',

    // the rule: the book's words, one idea at a time
    rule_pressure: '<b>তরলের চাপ P = hρg:</b> গভীরতা h যত বেশি, চাপ তত বেশি। দুই পাশে একই গভীরতায় চাপ সমান, কিন্তু উল্টো দিকে, তাই সেই বল কাটাকাটি হয়।',
    rule_sum:
      '<b>F = F<sub>2</sub> − F<sub>1</sub> = A(h<sub>2</sub> − h<sub>1</sub>)ρg = Ahρg।</b> জাহাজের উপরের অংশ পানির বাইরে, তাই h<sub>1</sub> = {zero}। ঊর্ধ্বমুখী এই বলকে প্লবতা বলে।',
    rule_weight: '<b>ওজন নিচের দিকে, প্লবতা উপরের দিকে;</b> ভাসমান জাহাজে দুটো সমান। পাশে খালি জাহাজের সমান ভরের একটি নিরেট স্টিলের সিলিন্ডার নিক্তিতে ঝুলছে।',
    rule_lower: '<b>তরলে নিমজ্জিত বস্তুর ওজন কমে যায় বলে মনে হয়:</b> সে যতটুকু তরল অপসারণ করে, সেই তরলের ওজনের সমান। সিলিন্ডার সরায় অল্প পানি।',
    rule_drop:
      '<b>একই ভর, তবু সিলিন্ডার ডোবে, জাহাজ ভাসে।</b> স্টিলের ঘনত্ব {rs} kg m<sup>−3</sup>, পানির চেয়ে অনেক বেশি; ফাঁপা জাহাজ অনেক পানি সরায়, তার গড় ঘনত্ব পানির চেয়ে কম।',
    rule_archimedes:
      '<b>আর্কিমিডিসের নীতি:</b> কোনো বস্তু তরলে নিমজ্জিত করলে সেটি যে পরিমাণ তরল অপসারণ করে সেইটুকু তরলের সমান ওজন বস্তুটির ওজন থেকে কমে যায়। ভাসমান জাহাজের বেলায় তা পুরো ওজন।',
    rule_load: '<b>মাল বাড়লে ওজন বাড়ে:</b> জাহাজ আরও ডোবে, আরও পানি সরায়, প্লবতা বাড়ে, যতক্ষণ না আবার ওজনের সমান হয়।',
    rule_full: '<b>বোঝাই রেখা (প্লিমসল দাগ):</b> পানি এই দাগ ছুঁলে আর মাল তোলা নিরাপদ নয়। খালি থেকে পুরো বোঝাই: h বাড়ল, প্লবতাও ঠিক ততটা বাড়ল।',

    // notes on the stage
    note_data: 'পানির ঘনত্ব ρ = {rho} kg m<sup>−3</sup><br>g = {g} m s<sup>−2</sup>',
    note_imagine: 'কল্পনা: সরানো পানি তুলে নিক্তিতে ওজন',

    // labels on the picture
    lbl_P2: 'P<sub>2</sub> = {v}&nbsp;{u_Pa}',
    lbl_P2_sym: 'P<sub>2</sub>',
    lbl_h2: 'h<sub>2</sub> = {v}&nbsp;{u_m}',
    lbl_h2_sym: 'h<sub>2</sub>',
    lbl_cancel: 'কাটাকাটি',
    lbl_B: 'প্লবতা {v}&nbsp;{u_N}',
    lbl_B_sym: 'প্লবতা',
    lbl_W: 'ওজন {v}&nbsp;{u_N}',
    lbl_W_sym: 'ওজন',
    lbl_steel: 'নিরেট স্টিল',
    lbl_sB: 'প্লবতা প্রায় {v}&nbsp;{u_N}',
    lbl_reading: 'নিক্তি {v}&nbsp;{u_N}',
    lbl_reading_q: 'নিক্তি ?',
    lbl_reading_about: 'নিক্তি প্রায় {v}&nbsp;{u_N}',
    lbl_V: 'অপসারিত পানি V = {v}&nbsp;{u_m3}',
    lbl_V_sym: 'অপসারিত পানি',
    lbl_water_w: 'পানির ওজন',
    lbl_loadline: 'বোঝাই রেখা',
    lbl_h: 'h = {v}&nbsp;{u_m}',
    lbl_h_sym: 'h',

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

    q_sides: 'জাহাজের দুই পাশে পানির চাপ যে বল দেয়, তার কী হয়?',
    c_cancel: 'সমান ও উল্টো, কাটাকাটি হয়',
    c_lift: 'এই বলই জাহাজকে ভাসিয়ে রাখে',
    c_down: 'এই বল জাহাজকে নিচে ডোবায়',
    c_one_side: 'শুধু এক পাশের বল কাজ করে',
    why_sides: '<b>কাটাকাটি হয়</b>: একই গভীরতায় দুই পাশে চাপ সমান, দিক উল্টো। জাহাজকে উপরে ঠেলে তলার চাপ।',
    mis_lift: 'পাশের বল পাশ থেকে ঠেলে, উপরে নয়; উপরে ঠেলে তলার বল।',
    mis_down: 'পাশের বল নিচের দিকে নয়, পাশ থেকে ভেতরের দিকে।',
    mis_one_side: 'দুই পাশেই পানি সমান গভীর, তাই দুই পাশেই সমান বল।',

    q_pressure: 'জাহাজের তলা পানির কত নিচে, ছবিতে লেখা আছে। তলায় পানির চাপ কত?',
    why_pressure: '<b>{P}&nbsp;{u_Pa}</b>: P = hρg = {h} × {rho} × {g}।',
    mis_noG: 'এখানে g দিয়ে গুণ করা হয়নি; চাপ = hρg।',
    mis_deck: 'এটি জাহাজের পুরো উচ্চতা ({d}&nbsp;{u_m}) দিয়ে করা; লাগে পানির নিচের গভীরতা h।',
    mis_force: 'এটি চাপ × ক্ষেত্রফল, অর্থাৎ বল (N), চাপ নয়।',

    q_displaced: 'জাহাজটি যতটুকু পানি সরিয়েছে, তার আয়তন ছবিতে লেখা আছে। সেই পানির ওজন, অর্থাৎ প্লবতা কত?',
    why_displaced: '<b>{F}&nbsp;{u_N}</b>: ওজন = Vρg = {V} × {rho} × {g}।',
    mis_mass: 'Vρ হলো পানির ভর (kg); ওজন পেতে g দিয়েও গুণ করতে হয়।',
    mis_noRho: 'ঘনত্ব ρ বাদ পড়েছে; ওজন = Vρg।',
    mis_steel: 'এখানে স্টিলের ঘনত্ব নেওয়া হয়েছে; চাই পানির ওজন, তাই পানির ঘনত্ব।',

    q_more: 'এই জাহাজে আরও দুটি কন্টেইনার তুললে কী হবে?',
    c_deeper_more: 'আরও একটু ডুববে, প্লবতা বাড়বে',
    c_deeper_same: 'আরও একটু ডুববে, প্লবতা একই থাকবে',
    c_sink_all: 'জাহাজ পুরোপুরি ডুবে যাবে',
    c_rise: 'জাহাজ একটু উপরে উঠবে',
    why_more: '<b>আরও একটু ডুববে, প্লবতা বাড়বে</b>: ওজন বাড়ে, জাহাজ ডুবে বেশি পানি সরায়, যতক্ষণ না প্লবতা আবার ওজনের সমান হয়।',
    mis_deeper_same: 'বেশি ডুবলে বেশি পানি সরে, তাই প্লবতাও বাড়ে।',
    mis_sink_all: 'সামান্য বেশি পানি সরালেই প্লবতা আবার ওজনের সমান হয়; জাহাজ ভেসে থাকে।',
    mis_rise: 'ওজন বাড়লে জাহাজ ওঠে না, আরও ডোবে।',

    q_steel: 'খালি জাহাজ আর এই স্টিলের সিলিন্ডারের ভর সমান। জাহাজ ভাসে, সিলিন্ডার ডুবল কেন?',
    c_less_water: 'সিলিন্ডার কম পানি সরায়, প্লবতা কম',
    c_heavier: 'সিলিন্ডারের ওজন জাহাজের চেয়ে বেশি',
    c_no_push: 'পানি সিলিন্ডারকে একটুও উপরে ঠেলে না',
    c_pull_down: 'পানির চাপ সিলিন্ডারকে নিচে টেনে নেয়',
    why_steel:
      '<b>সিলিন্ডার কম পানি সরায়</b>: স্টিলের ঘনত্ব {rs} kg m<sup>−3</sup>, পানির {rw} kg m<sup>−3</sup>। একই ভরে ফাঁপা জাহাজ অনেক বেশি পানি সরায়, তাই তার প্লবতা ওজনের সমান হয়।',
    mis_heavier: 'দুটোর ভর সমান, তাই ওজনও সমান।',
    mis_no_push: 'পানি সিলিন্ডারকেও উপরে ঠেলে (প্লবতা), তবে তা ওজনের চেয়ে অনেক কম।',
    mis_pull_down: 'তলায় চাপ বেশি, তাই পানির মোট বল উপরের দিকে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: "Archimedes' principle and buoyancy",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Buoyancy',
    u_N: 'N',
    u_Pa: 'Pa',
    u_m: 'm',
    u_m2: 'm<sup>2</sup>',
    u_m3: 'm<sup>3</sup>',

    steps: 'Steps',
    chip_pressure: 'Pressure',
    chip_weight: 'Weight, buoyancy',
    chip_displaced: 'Water pushed aside',
    chip_load: 'Loading',

    act_home: 'Start again',
    act_show_p: "Show the water's pressure",
    act_sum: 'Add up the forces',
    act_again_p: 'Show again',
    act_lower: 'Lower the cylinder into the water',
    act_drop: 'Let go of the cylinder',
    act_again_w: 'Hang it up again',
    act_ghost: 'Lift out the water and weigh it',
    act_again_d: 'Show again',
    act_load: 'Load one container',
    act_unload: 'Unload all containers',

    name_load: 'Containers ({c} t each)',
    less_load: 'Unload one container',
    more_load: 'Load one container',

    eq_p2: 'Bottom: P<sub>2</sub> = h<sub>2</sub>ρg = {h} × {rho} × {g} = <b>{P}&nbsp;{u_Pa}</b>',
    eq_sides: 'Sides: at the same depth, equal pressure, opposite ways',
    eq_f: 'Buoyancy F = AP<sub>2</sub> = {A}&nbsp;{u_m2} × {P}&nbsp;{u_Pa} = <b>{F}&nbsp;{u_N}</b>',
    eq_ship_w: "Ship's weight W = mg = {m}&nbsp;kg × {g} = <b>{W}&nbsp;{u_N}</b>",
    eq_steel_air: 'Solid steel cylinder: the same mass, but only {V}&nbsp;{u_m3}',
    eq_steel_water: 'Cylinder: weight {W}&nbsp;{u_N}, buoyancy only about {B}&nbsp;{u_N}',
    eq_v: 'Volume pushed aside V = Ah = {A}&nbsp;{u_m2} × {h}&nbsp;{u_m} = <b>{V}&nbsp;{u_m3}</b>',
    eq_vw: 'Its weight = Vρg = {V} × {rho} × {g} = <b>{F}&nbsp;{u_N}</b>',
    eq_load: 'Mass m = {m} t, under water h = <b>{h}&nbsp;{u_m}</b>',
    eq_balance: 'Weight W = buoyancy F = <b>{W}&nbsp;{u_N}</b>',

    out_p0: 'The water presses on the hull from every side',
    out_p1: 'The deeper, the more pressure: <b>{P}&nbsp;{u_Pa}</b> at the bottom',
    out_p2: 'The sides cancel; from below, in all <b>{F}&nbsp;{u_N}</b>',
    out_w0: 'In air the balance reads <b>{R}&nbsp;{u_N}</b>: its whole weight',
    out_w1: 'In water the reading drops to about <b>{R}&nbsp;{u_N}</b>',
    out_w2: 'Weight more than buoyancy: the cylinder <b>sank</b>',
    out_d0: 'The bottom is <b>{h}&nbsp;{u_m}</b> under water: that water was pushed aside',
    out_d1: 'The water pushed aside weighs <b>{F}&nbsp;{u_N}</b> = buoyancy',
    out_empty: 'Empty, the ship floats <b>{h}&nbsp;{u_m}</b> deep',
    out_load: '{n} containers: the ship floats <b>{h}&nbsp;{u_m}</b> deep',
    out_full: 'The water is at the load line: <b>no more cargo</b>',

    rule_pressure:
      '<b>A liquid’s pressure P = hρg:</b> the greater the depth h, the more pressure. On the two sides the pressure at the same depth is equal but opposite, so those forces cancel.',
    rule_sum:
      '<b>F = F<sub>2</sub> − F<sub>1</sub> = A(h<sub>2</sub> − h<sub>1</sub>)ρg = Ahρg.</b> The top of the ship is out of the water, so h<sub>1</sub> = {zero}. This upward force is called buoyancy.',
    rule_weight:
      '<b>Weight acts down, buoyancy up;</b> for a floating ship they are equal. Beside it a solid steel cylinder with the empty ship’s mass hangs on a balance.',
    rule_lower:
      '<b>A body sunk in a liquid seems to lose weight:</b> as much as the weight of the liquid it pushes aside. The cylinder pushes aside little water.',
    rule_drop:
      '<b>The same mass, yet the cylinder sinks and the ship floats.</b> Steel’s density, {rs} kg m<sup>−3</sup>, is far more than water’s; the hollow ship pushes aside a lot of water, so its average density is less than water’s.',
    rule_archimedes:
      '<b>Archimedes’ principle:</b> a body immersed in a liquid loses as much weight as the weight of the liquid it pushes aside. For a floating ship that is its whole weight.',
    rule_load:
      '<b>More cargo, more weight:</b> the ship sinks deeper and pushes aside more water, and the buoyancy grows until it equals the weight again.',
    rule_full:
      '<b>The load line (Plimsoll mark):</b> once the water reaches it, loading more is unsafe. From empty to full: h grew, and the buoyancy grew just as much.',

    note_data: 'Water density ρ = {rho} kg m<sup>−3</sup><br>g = {g} m s<sup>−2</sup>',
    note_imagine: 'Imagine: the water pushed aside, lifted and weighed',

    lbl_P2: 'P<sub>2</sub> = {v}&nbsp;{u_Pa}',
    lbl_P2_sym: 'P<sub>2</sub>',
    lbl_h2: 'h<sub>2</sub> = {v}&nbsp;{u_m}',
    lbl_h2_sym: 'h<sub>2</sub>',
    lbl_cancel: 'cancel',
    lbl_B: 'Buoyancy {v}&nbsp;{u_N}',
    lbl_B_sym: 'Buoyancy',
    lbl_W: 'Weight {v}&nbsp;{u_N}',
    lbl_W_sym: 'Weight',
    lbl_steel: 'Solid steel',
    lbl_sB: 'Buoyancy about {v}&nbsp;{u_N}',
    lbl_reading: 'Balance {v}&nbsp;{u_N}',
    lbl_reading_q: 'Balance ?',
    lbl_reading_about: 'Balance about {v}&nbsp;{u_N}',
    lbl_V: 'Water pushed aside V = {v}&nbsp;{u_m3}',
    lbl_V_sym: 'Water pushed aside',
    lbl_water_w: 'Its weight',
    lbl_loadline: 'Load line',
    lbl_h: 'h = {v}&nbsp;{u_m}',
    lbl_h_sym: 'h',

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

    q_sides: 'What happens to the forces the water’s pressure puts on the two sides of the ship?',
    c_cancel: 'Equal and opposite: they cancel',
    c_lift: 'They are what keeps the ship up',
    c_down: 'They push the ship down',
    c_one_side: 'Only one side’s force acts',
    why_sides:
      '<b>They cancel</b>: at the same depth the pressure on the two sides is equal and opposite. What pushes the ship up is the pressure on its bottom.',
    mis_lift: 'The side forces push sideways, not up; the bottom’s force pushes up.',
    mis_down: 'The side forces do not point down; they push in from the sides.',
    mis_one_side: 'The water is equally deep on both sides, so both sides get the same force.',

    q_pressure: 'How deep the ship’s bottom is, is written on the picture. What is the water’s pressure on the bottom?',
    why_pressure: '<b>{P}&nbsp;{u_Pa}</b>: P = hρg = {h} × {rho} × {g}.',
    mis_noG: 'This leaves out g; pressure = hρg.',
    mis_deck: 'This uses the ship’s whole height ({d}&nbsp;{u_m}); it takes the depth under water, h.',
    mis_force: 'This is pressure × area, a force (N), not a pressure.',

    q_displaced: 'The volume of water the ship pushed aside is written on the picture. What does that water weigh, that is, what is the buoyancy?',
    why_displaced: '<b>{F}&nbsp;{u_N}</b>: weight = Vρg = {V} × {rho} × {g}.',
    mis_mass: 'Vρ is the water’s mass (kg); for its weight multiply by g too.',
    mis_noRho: 'The density ρ is missing; weight = Vρg.',
    mis_steel: 'This uses steel’s density; we want the water’s weight, so water’s density.',

    q_more: 'What happens if two more containers are loaded onto this ship?',
    c_deeper_more: 'It sinks a little deeper; buoyancy grows',
    c_deeper_same: 'It sinks a little deeper; buoyancy stays the same',
    c_sink_all: 'The ship sinks completely',
    c_rise: 'The ship rises a little',
    why_more:
      '<b>It sinks a little deeper and the buoyancy grows</b>: the weight grows, the ship sinks and pushes aside more water, until the buoyancy equals the weight again.',
    mis_deeper_same: 'Deeper means more water pushed aside, so more buoyancy.',
    mis_sink_all: 'Pushing aside a little more water makes the buoyancy equal the weight again; the ship stays afloat.',
    mis_rise: 'More weight does not lift the ship; it sinks deeper.',

    q_steel: 'The empty ship and this steel cylinder have the same mass. The ship floats; why did the cylinder sink?',
    c_less_water: 'It pushes aside less water: less buoyancy',
    c_heavier: 'The cylinder weighs more than the ship',
    c_no_push: 'The water does not push the cylinder up at all',
    c_pull_down: 'The water’s pressure pulls the cylinder down',
    why_steel:
      '<b>It pushes aside less water</b>: steel’s density is {rs} kg m<sup>−3</sup>, water’s {rw} kg m<sup>−3</sup>. With the same mass the hollow ship pushes aside far more water, so its buoyancy can equal its weight.',
    mis_heavier: 'Their masses are equal, so their weights are equal too.',
    mis_no_push: 'The water pushes the cylinder up too (buoyancy), but far less than its weight.',
    mis_pull_down: 'The pressure is greater at the bottom, so the water’s total force points up.',
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
