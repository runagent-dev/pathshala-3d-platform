# Notes: Electrical induction (বৈদ্যুতিক আবেশ)

Book: physics-9-10 › 10.3 › p275 (pp. 275–277; পাতার ছবি `reference/page-275.png` … `page-277.png`).

## What the page shows
The book opens with its own puzzle: a comb that has been through hair pulls bits of paper, yet the paper has no charge.
The answer is বৈদ্যুতিক আবেশ. চিত্র ১০.০৪: a metal sphere on an insulating stand with a "+" over a "−" at each spot, and
the same sphere with a positive glass rod near it, "−" crowded on the near side, "+" at the back. চিত্র ১০.০৫: the comb over
paper; the near part of the paper turns positive, the far part negative, the pull beats the push, the bits jump, touch,
fill with negative charge and fly off. চিত্র ১০.০৬ (the উদাহরণ on p. 277): two touching spheres, the rod near one, pulled
apart, the rod gone: one negative, one positive. চিত্র ১০.০৭ (lightning, p. 278) belongs to the lightning-conductor figure.

## The one idea to teach
A charged body brought near a neutral conductor, without touching, pulls its free electrons to the near side (opposite
charge near, like charge far); split the conductor while the rod is near and it keeps the charge.

## How the figure works
- **Calm first screen**, wide enough to show the stand; then the camera comes in close on the sphere.
- **Step ১ (এক গোলক)**: tap or drag the rod. Only "−" chips move. Every chip sits on the sphere's surface and glides along it.
  `induced(gap)` gives the drawn electrons moved: 1/d² from the sphere's centre, rescaled so none move at the far end of the
  drag (11 cm) and eight at the nearest gap (1 cm), rounded down. So the sphere reads as neutral at the start, and take the
  rod away and they go back. The teal arrow shows the pull on the sphere.
- **Step ২ (দুই গোলক)**: the rod backs off, sphere ২ slides in to touch, the rod returns; eight electrons cross through the
  point of contact, one by one, and the chips never leave the metal.
- **Step ৩ (আলাদা)**: spheres part with the rod near, rod leaves, charges spread over each sphere. −8 and +8 in drawn charges.
- **Step ৪ (চিরুনি)**: comb, paper, the book's whole story on one timeline (`combPhase`), slowed down and labelled so.
- **Test**: five questions; the signs are hidden where they would give the answer and come back with the worked answer.

## Stylisation (honest notes on the view)
- "কয়েকটি চার্জ আঁকা, আসলে অসংখ্য" shows in the corner; in the comb scene it reads "সময় ধীর করে দেখানো".
- The "−" stand for free electrons. The book says the charges "সরে যায়" and that positive goes to the back; 10.1/10.2 say electrons
  are what move, and common.md asks for that: every "+" stays put, the "+" that appear at the back are left bare.
- The rod's law is drawn qualitatively (the book gives no formula here). The panel's numbers are counts of drawn electrons, not
  physical charges, and never a measurement.
- Paper is an insulator, so in reality its charges shift inside each molecule; the book treats it as "near part +, far part −" and
  so does the figure.
- Earthing is not in 10.3, so it is not in this figure.

## Terms (as in the book)
বৈদ্যুতিক আবেশ, আবেশিত, চার্জহীন / চার্জবিহীন বস্তু, ধাতব গোলক, বিদ্যুৎ অপরিবাহী স্ট্যান্ড, কাচ দণ্ড, সিল্ক, পজিটিভ / নেগেটিভ চার্জ,
ইলেকট্রন, প্রোটন, আকর্ষণ, বিকর্ষণ, চিরুনি, কাগজের টুকরো. The page's spellings: ওপর, পেছন, দণ্ড.

## Performance (measured, shadows on, 844×390)
Near 24 draws / 20.6k triangles, pair 22 / 26.1k, apart 18 / 23.9k, comb 14 / 13.8k. All "+" are one instanced mesh, all "−"
another. Renders on demand: idle is 0 draws. Later parts exist at load and are warmed.

## Open questions
- The book draws wooden stands; the figure uses a clear acrylic post on a turned wooden base so the sphere reads as insulated. Fine?
