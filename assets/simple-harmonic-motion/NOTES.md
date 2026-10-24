# Notes: Simple harmonic motion (সরল স্পন্দন গতি)

Book: physics-9-10 › 2.2 › p37 (second figure on the page; the first is পর্যায়বৃত্ত গতি)

## What the page shows
Topic ২.২, the part সরল স্পন্দন গতি (Simple Harmonic Motion). Picture চিত্র ২.০২: a girl on a swing, "দোলনা সরল
স্পন্দন গতির একটি উদাহরণ". The paragraph: simple harmonic motion is a special kind of periodic motion
(পর্যায়বৃত্তগতি); the body oscillates (স্পন্দিত হয়) on both sides of a fixed point, the equilibrium point
(সাম্যবিন্দু, equilibrium point); at both ends (প্রান্ত) of the path the speed (দ্রুতি) is zero; going from an end
toward the equilibrium point the speed rises step by step (ক্রমান্বয়ে বাড়তে থাকে), is greatest (সর্বোচ্চ দ্রুতি)
at the equilibrium point, then falls to zero at the other end; it turns, comes back the same way and stops for an
instant at the first end: that whole journey takes one period (এক পর্যায়কাল), and the pattern repeats. Examples:
a body hung from a spring (স্প্রিং), a child on a swing, a clock pendulum (ঘড়ির পেন্ডুলাম), air molecules carrying
sound. Screenshot: `reference/page-37.png`.

## The one idea to teach
The body swings to and fro about the সাম্যবিন্দু: its speed is zero at each end, grows toward the সাম্যবিন্দু where it
is greatest, then falls to zero at the other end; one full back-and-forth takes one পর্যায়কাল.

## Terms (as in the book)
সরল স্পন্দন গতি, পর্যায়বৃত্ত গতি, স্পন্দিত, সাম্যবিন্দু, প্রান্ত, দ্রুতি, শূন্য, সর্বোচ্চ দ্রুতি, ক্রমান্বয়ে বাড়ে/কমে,
পর্যায়কাল, দোলনা, স্প্রিং, ঘড়ির পেন্ডুলাম. Units in the panel: মি/সে (m/s) and সেকেন্ড.

## How it works
- 3D: a girl on a swing hung from a bamboo frame (two crossed pairs of poles tied with rope, the way village swings
  are often built), seen from the side as in চিত্র ২.০২. Second example (chips দোলনা | স্প্রিং): a 2 kg slotted
  mass on a spring on a laboratory stand, moving up and down.
- What makes the idea visible: an orange speed arrow on the moving body (its length is the speed; it vanishes at
  the ends), blue dots on the path where the body is every T/16 (a "strobe photo": close together near the ends,
  far apart in the middle; the dot it passes lights up), and labels pinned to the path: "প্রান্ত / দ্রুতি শূন্য" at
  both ends, "সাম্যবিন্দু / দ্রুতি সর্বোচ্চ" in the middle.
- Panel: the speed now (মি/সে) and the period; a small graph of the speed over one period with the stops প্রান্ত,
  সাম্যবিন্দু, প্রান্ত, সাম্যবিন্দু, প্রান্ত and a dot that runs along it in step with the swing; the idea in the book's
  words; buttons থামাও/চালাও, ধীরে (time 4× slower, said on the 3D view), and the example chips.
- The student pulls the seat (or the mass) to one side and lets go: that becomes an end, and it oscillates from
  there (amplitude 8°–25° for the swing, 4.5–9 cm for the spring; let go nearer the middle and it is carried out to
  the smallest). The first-use hand points at the seat ("টেনে ছেড়ে দাও").
- Keys: space play/pause, ← → one dot (T/16) back/forward (pauses), ↑ ↓ bigger/smaller swing, s slow, 1/2 example,
  f/v views.
- Test (5 questions, tap answers, each one sets up the 3D and the moving body is shown slowed down, without the
  arrow, dots and labels until the answer): which of ক/খ/গ is fastest or at rest (wrong: the other points, "all
  the same"); how the speed changes on a marked part toward or away from the সাম্যবিন্দু (wrong: the opposite, "the
  same", "rises then falls"); which journey takes one পর্যায়কাল, ক → গ → ক (wrong: ক → গ, ক → খ, খ → গ → খ); the
  period from the time for one end to the other, 2h (wrong: h, h/2, 4h); which everyday motion is simple harmonic
  (pendulum / child on a swing / mass on a spring; wrong: clock hand and fan blade, which are periodic but go
  round, and a falling ball).

## Physics
- x = x0 cos ωt from rest at an end, v = −x0 ω sin ωt, period T = 2π/ω.
- Swing: L = 1.5 m from the top pole to the seat, ω = √(g/L), T = 2.46 s. This is the small-swing formula: up to
  25° the real pendulum period is at most 1.3 % longer (checked in `test/unit/simple-harmonic-motion.test.mjs`),
  so the figure keeps the swing within 25°. Greatest speed at 20°: 1.34 m/s.
- Spring: m = 2 kg, k = 50 N/m, ω = 5 rad/s, T = 1.26 s (exact); it hangs 0.392 m stretched (mg/k) at the
  সাম্যবিন্দু. Greatest speed at 8 cm: 0.40 m/s.
- The figure does not claim that the period is independent of the amplitude (the book does not say it here).

## Open questions
- The child figure is simple and stylised (rounded shapes, no face detail beyond the eyes). Replace it, or remove
  it, if the owner finds it crude.
- Bamboo frame instead of the book's (unseen) support: chosen to look like a Bangladeshi swing and to keep the
  legs out of the way of the swinging seat.
- "মি/সে" for m/s: the book writes m/s in formulas; the Bangla abbreviation reads better in a Bangla panel.
