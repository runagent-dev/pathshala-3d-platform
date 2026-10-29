# Notes: Work (কাজ)

Book: physics-9-10 › 4.1 › p100 (`reference/page-100.png`)

## What the page shows
No picture: text, the formula and a unit box. Transcribed from the page:

> **৪.১ কাজ (Work)**
>
> আমরা দৈনন্দিন জীবনে কাজ শব্দটা অনেকভাবে ব্যবহার করি। একজন দারোয়ান গেটের সামনে একটি টুলে বসে সারা দিন বাসা
> পাহারা দিয়ে দাবি করতে পারেন তিনি অনেক কাজ করেছেন কিন্তু পদার্থবিজ্ঞানের ভাষায় সেটি কোনো কাজ নয়। পদার্থবিজ্ঞানের
> ভাষায় কাজ কথাটার সুনির্দিষ্ট অর্থ আছে। কোনো বস্তুর উপর যদি F বল প্রয়োগ করা হয় এবং বল প্রয়োগ করার সময়টুকুতে যদি
> বস্তুটি বলের দিকে s দূরত্ব অতিক্রম করে (অর্থাৎ সরণ হয়), তাহলে ঐ বল দিয়ে করা কাজের পরিমাণ W হচ্ছে:
>
> W = Fs
>
> [box] কাজের একক J (জুল) · কাজের মাত্রা [W] = ML²T⁻²
>
> বল একটি ভেক্টর এবং অতিক্রান্ত দূরত্ব বা সরণও একটি ভেক্টর; কিন্তু কাজের বেলায় এই দুটো ভেক্টরের গুণফল একটি
> স্কেলার। আলাদা ভেক্টর হিসেবে বল এবং অতিক্রান্ত দূরত্বের দিক একই দিকে হতে হবে এমন কোনো কথা নেই। তোমাদের এই বইয়ে
> আমরা শুধু একই দিকে প্রয়োগ করা বল এবং অতিক্রান্ত দূরত্বের বিষয়টি আলোচনা করব।
>
> তোমরা কি লক্ষ করেছ, কাজ করার কথা বলার সময় আমরা বলেছি 'বল'টি কাজ করেছে। একজন মানুষ বা একটি যন্ত্র হয়তো বল
> প্রয়োগ করে কোনো বস্তুকে ঠেলে খানিকটা দূরত্বে নিয়ে যায়। দৈনন্দিন জীবনের ভাষায় আমরা বলি মানুষটি বা যন্ত্রটি কাজ
> করেছে। পদার্থবিজ্ঞানের ভাষায় সব সময়েই বল কাজ করে, মানুষ বা যন্ত্র নয়। এই বলটি হয়তো একটি মানুষ বা যন্ত্র প্রয়োগ
> করেছে।
>
> ধরা যাক, তুমি F বল প্রয়োগ করে একটা বস্তুকে s দূরত্বে ঠেলে নিয়ে বস্তুটিকে গতিশীল করে ছেড়ে দিয়েছ, বস্তুটি তখন আরো
> d দূরত্ব অতিক্রম করে শেষ পর্যন্ত থেমে গিয়েছে। কতটুকু কাজ হয়েছে?
>
> কাজের পরিমাণ W = Fs, পরের d দূরত্ব অতিক্রম করার সময় F বল প্রয়োগ করা হয়নি বলে F বল দ্বারা কোনো কাজ হয়নি।

Symbols: **F** (বল), **s** (দূরত্ব / সরণ, along the force), **W** (কাজ), **d** (the slide after letting go). Unit
**J (জুল)**; dimension **[W] = ML²T⁻²**. No worked numbers on the page.

## The one idea to teach
Work is done only while the force acts **and** the object moves along it: **W = Fs**. The push over s counts; the
slide d after letting go does not (no force), and a push that moves nothing (s = 0) does no work, however tiring.

## Terms (as in the book)
কাজ, বল, দূরত্ব, সরণ, অতিক্রম করা, বল প্রয়োগ, বলের দিকে, কাজের পরিমাণ, কাজের একক, জুল, ঠেলে নেওয়া, ছেড়ে
দেওয়া, গতিশীল, থেমে যাওয়া, পদার্থবিজ্ঞানের ভাষায়, দৈনন্দিন জীবনের ভাষায়, দারোয়ান, পাহারা, স্কেলার, ভেক্টর.
Page 100 writes **উপর** (not ওপর). Units as Latin symbols per `docs/book-notes.md`: N, m, J (জুল glossed once).

## How the figure works
- A person (the realistic pusher from `types-of-friction`, copied in `src/person.js`) leans on a wooden crate on a
  tiled floor with a metre tape along its front edge (0 at the crate's front face).
- শেখো: two example words, **ঠেলে ছেড়ে দাও** (the book's push-then-let-go example) and **দেয়ালে ঠেলা** (force but
  no displacement: the crate stands against a wall), a calculator row with tap steppers for **F** (10–100 N, steps of
  10) and **s** (1–4 m), one action (push), one result line `W = Fs = F N × s m = W J`, one rule in the book's words.
- The push: F's orange arrow over the crate while the hands are on it; the blue s arrow on the floor grows with the
  crate and W counts up live (from the same 0.1 m number the panel shows). At s the hands let go: F's arrow goes, a
  grey d arrow grows while the crate slides on, and W stays put. The rule ends with the book's sentence.
- The wall: however hard the push (the person leans more for bigger F), the crate does not move: s = 0, W = 0; the
  rule links it to the book's দারোয়ান.
- Default F = 50 N, s = 2 m (W = 100 J): the page has no numbers, so these are chosen to be round and realistic.
- Test (5): W from F and s read off the tape (with the slide d to ignore), which part of the trip F did work in, the
  wall pushed for 10 minutes, F from W and s read off the tape, the unit of W. Wrong choices are real mistakes
  (counting d, adding, using d, F × time, the newton or kg m/s as the unit), each with its own note.

## Look
Vivid on purpose (the owner asked for it, 2026-10-29): a deep-blue-to-turquoise backdrop, saffron floor tiles, a white
metre tape, a red brick wall, colour-tinted steppers on a warm panel. The front view is turned 20° toward the person
(when the view is not much wider than the trip), so the person and crate come out bigger on phones.

## Stylised on purpose (stated honestly)
- After the release the crate always slides d = s / 2, and every push takes the same time for the same s (the
  crate's mass and the floor's friction are never shown, so nothing on screen claims otherwise). Speeding up evenly
  while pushed, slowing evenly after: the release is the fastest moment, as it should be.
- The F arrow's length grows with F but is not to a stated scale.
- The angle case (force and displacement in different directions) is left out on purpose: the page says
  "তোমাদের এই বইয়ে আমরা শুধু একই দিকে প্রয়োগ করা বল এবং অতিক্রান্ত দূরত্বের বিষয়টি আলোচনা করব।"
- The dimension [W] = ML²T⁻² is in the rule after the first push, not in the test (one idea).

## Open questions
- Colours for chapter 4 (none yet in `docs/book-notes.md`): F orange #ff6a13 (the chapter-3 push, brightened for the
  blue backdrop), s blue #1c6fd9, d grey #5f6b7a (no force), W green #237a35. `distance-displacement` uses orange for displacement;
  here orange stays the force, as in the force figures.
- The book uses s both as "দূরত্ব" and "সরণ"; the figure says সরণ s for the stepper and দূরত্ব in sentences, as the page.
- The wall example is not on the page; it stands for the দারোয়ান (effort, but nothing moved along the force).
- Whether the book wants the dimension ML²T⁻² shown on screen.
