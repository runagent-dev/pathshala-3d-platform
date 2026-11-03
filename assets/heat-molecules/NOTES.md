# Notes: Heat and temperature (তাপ ও তাপমাত্রা)

Book: physics-9-10 › 6.1 › p161. Page image: `reference/page-161.png` (dev only, never packaged).

## What the page shows
Topic ৬.১ তাপ ও তাপমাত্রা (Heat and Temperature). **The page has no picture and no worked example**; it is a story the
student is asked to imagine. "তাপ এক ধরনের শক্তি" (like a train's fuel burning to push it, hence "তাপশক্তি", beside আলো,
বিদ্যুৎ and গতিশক্তি). Then: "আমরা যদি আণবিক পর্যায়ে দেখতে পেতাম…" the molecules of a solid, once heated, "নিজের নির্দিষ্ট
অবস্থানে থেকে কাঁপতে থাকে"; the hotter, the more they shake; heated a lot they let go of the **আন্তঃআণবিক বল** and "আমরা
সেটাকে বলি **তরল**" (the molecules "এলোমেলোভাবে একে অন্যের ভেতর দিয়ে ছোটাছুটি করতে থাকে… যত উত্তপ্ত করা হয় অণুগুলো তত
জোরে ছোটাছুটি করে"); heated more they are "আণবিক বন্ধন থেকে পুরোপুরি মুক্ত" and we call it **গ্যাস** (hotter, faster).
"তাপশক্তি… আসলে পদার্থের অণুগুলোর সম্মিলিত গতিশক্তি ছাড়া কিছু নয়"; temperature (তাপমাত্রা) "পদার্থের তাপীয় অবস্থা
ব্যাখ্যা" করার চেষ্টা. Units: তাপের একক জুল (J); another, ক্যালরি (cal): 1 gm পানির তাপমাত্রা 1°C বাড়াতে 1 ক্যালরি, **1 cal =
4.2 J**; ফুড ক্যালরি = k cal = 1000 cal. This second part (the units) is a different setup (a gram of water, a thermometer),
so it is its own figure, `calorie-joule`.

## The one idea to teach
Heat is the energy of the molecules' motion: a solid's molecules shake in place, a liquid's roam among each other, a
gas's are free, and the hotter it is, the faster they move (and the more kinetic energy they have).

## Terms (as in the book)
তাপ, তাপশক্তি, গতিশক্তি, সম্মিলিত গতিশক্তি, অণু, আন্তঃআণবিক বল, আণবিক বন্ধন, কঠিন, তরল, গ্যাস, উত্তপ্ত, কাঁপুনি / কাঁপতে
থাকে, ছোটাছুটি, তাপমাত্রা, তাপীয় অবস্থা. The page writes "কাঁপুনি", "ছোটাছুটি", "উত্তপ্ত"; the figure uses those.

## Design
- One scene, one idea. A lab bench (slate top) and a warm beige wall; on a steel stand a glass container with 60 molecules
  (glossy spheres, one InstancedMesh), a row of five flames on a burner under it, a thermometer beside it (white enamel
  plate, red column, no numbers). Nothing else.
- One button, **তাপ দাও**, six steps (levels 0, 0.2, 0.46, 0.62, 0.78, 1): cold solid, hotter solid (shakes more), liquid
  (just free), hotter liquid, gas, hotter gas. After the last the button reads "আবার প্রথম থেকে". The row কঠিন / তরল / গ্যাস
  jumps to a state; the dotted word is the one the button reaches next. A ↺ icon cools back to the start.
- Molecules go cobalt blue → dusty plum → vermilion as they warm; also a bar "অণুর গতি" in the panel and the thermometer
  (never colour alone). The three labels on the 3D: the state, তাপমাত্রা, তাপ.
- The simulation: each molecule has a home in a 6 × 5 × 2 lattice. A spring to the home (stiff in a solid, gone in a
  liquid or gas), a random jostle, and the speed kept near `speedOf(h)`; walls reflect; free molecules do not overlap
  (elastic collisions). The container's ceiling rises from the liquid's level to the full height as the gas forms, so a
  liquid stays in the lower part and a gas fills it all. The temperature numbers are not real: the book gives no melting
  or boiling points, so none are shown, and the panel says "ধাপগুলো মাপা তাপমাত্রা নয়" on wide panels.
- Panel order: tabs → word row → action → result line → speed bar → formula (তাপশক্তি = অণুগুলোর সম্মিলিত গতিশক্তি) → rule
  (it grows: after all three states have been seen it gives the book's definition of তাপ and তাপমাত্রা).
- Test (5): what the molecules do in a solid, a liquid and a gas shown in the picture (three questions, one per state, in
  random order, each with a "perfectly still" mistake); what more heat does to the speed and kinetic energy; the name of
  the energy from the molecules' motion. Every wrong choice has its own note.

## Open questions
- The book's "পরোক্ষভাবে… তাপমাত্রা বলে পদার্থের তাপীয় অবস্থা" is shown as the book words it; whether the edition wants a
  thermometer in the picture at all is the book team's call (it is here to show "hotter" at a glance).
- The molecules are drawn many times too big and few; the book has no picture to match, so this is the figure's own.
- Every Bangla line needs a person's check against the page.

## Polish pass 0.2.0 (chapter 6 detail pass)
- The page has no picture, so fidelity is in the words: checked every string against p161 (terms, sentences unchanged).
- More realistic apparatus: a ribbon burner (base, body, brass cap with five port rings, gas pipe and knob) instead of a
  plain black box; the glass container has thick glass base and lid slabs and a rubber stopper; camera framed tighter.
