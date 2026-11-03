# Notes: Heat units, calorie and joule (তাপের একক)

Book: physics-9-10 › 6.1 › p161 (the last two paragraphs). Page image: `reference/page-161.png` (dev only, never packaged).
Sister figure for the rest of the page (molecules of a solid, a liquid and a gas): `heat-molecules`.

## What the page shows
The page has no picture. Its last paragraphs give the units of heat: "যেহেতু এটা শক্তি তাই স্বাভাবিকভাবে অন্য শক্তির মতোই তার
একক হচ্ছে **জুল (J)**। তাপের আরো একটি একক আছে, তার নাম **ক্যালরি (cal)**। 1 gm পানির তাপমাত্রা 1°C বাড়াতে হলে যে পরিমাণ
তাপের দরকার সেটা হচ্ছে 1 ক্যালরি। **1 ক্যালরি হচ্ছে 4.2 J এর সমান**।" Then: "ফুড ক্যালরি বলতে আসলে বোঝানো হয় মানুষ নির্দিষ্ট
খাবার থেকে কী পরিমাণ শক্তি পায় এবং এটার জন্য একক আসলে **k cal বা 1000 ক্যালরি**। তবে সেটা নিয়ে আমরা মাথা ঘামাব না। এখানে আমরা
খাবার থেকে পাওয়া শক্তি নয় তাপশক্তি নিয়েই আলোচনা করব।"

## The one idea to teach
1 gm of water needs 1 calorie for each °C it rises, and 1 calorie is 4.2 joules: n cal = n × 4.2 J.

## Terms (as in the book)
তাপ, তাপশক্তি, একক, জুল (J), ক্যালরি (cal), তাপমাত্রা, ফুড ক্যালরি, k cal, 1000 ক্যালরি. The page writes "gm" for the gram; the
figure writes "গ্রাম" in sentences.

## Design
- Same setting as `heat-molecules` (a lab bench with a slate top, a warm beige wall) so the two read as one chapter. On a steel
  stand a small glass beaker with water, three burner flames under it, and a big thermometer beside it. Its enamel scale counts
  the **rise** in °C, 0 to 5, in Bangla digits: the book gives no starting temperature, so none is invented. The red column
  starts at 0.
- One button, **১ ক্যালরি তাপ দাও**: the flames flare for a moment, the column rises exactly 1°C and a "+১ cal" label shows. After
  five calories the button reads "আবার প্রথম থেকে". A ↺ icon goes back to the start.
- The panel: the action, one result line (`৩ cal = ১২.৬ J`, calories orange, joules violet, and the rise), the book's
  equation (১ ক্যালরি (cal) = ৪.২ জুল (J)), and the rule, which grows with what the student has done: the calorie's definition;
  after three calories the joule and "another unit"; after five the food calorie (k cal = 1000 cal).
- The beaker holds far more water than 1 gm (a real 1 gm drop would be invisible); the note under the formula says so.
- Test (5): 1 cal in J; the heat for 1 gm of water by 1°C; calories and joules for the rise read off the thermometer (the picture
  carries n, never the text); the food calorie. The flames are not shown in the test. Every wrong choice has its own note
  (the factor upside down, ten times, J given for cal, ÷ 4.2 instead of × 4.2, 1000 for the food calorie).

## Open questions
- Whether "ফুড ক্যালরি" belongs in the figure at all (the book says it will not be discussed); it is one line of the rule.
- The page writes "1 gm"; the figure says "১ গ্রাম". Every Bangla line needs a person's check against the page.

## Polish pass 0.2.0 (chapter 6 detail pass)
- Page 161 has no picture; every Bangla string re-checked against it (unchanged).
- More realistic apparatus: ribbon burner with brass port rings, gas pipe and knob (as `heat-molecules`); a wire gauze
  under the beaker; graduation marks and a pouring spout on the beaker.
