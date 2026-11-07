# Notes: Electroscope (তড়িৎবীক্ষণ যন্ত্র)

Book: physics-9-10 › 10.3.1 › p278 (pp. 278–279; পাতার ছবি `reference/page-278.png`, `page-279.png`).

## What the page shows
চিত্র ১০.০৮: a clear glass bottle with a reddish stopper in its neck, a metal rod through it, a flat round copper-coloured
disc on top with "−" near its edge, and inside two thin leaves spread apart, each marked "+". A blue glass piece with "+ + +"
is held near the disc, not touching. The text has three sub-headings: **চার্জ আহিতকরণ** (glass rubbed with silk touches the disc,
"খানিকটা চার্জ" goes on it and spreads to the leaves, which repel; a comb rubbed with flannel does the same with negative),
**চার্জের প্রকৃতি বের করা** (give the disc a known charge, then a smaller gap means negative, a wider gap positive), **চার্জের আবেশ**
(a positive rod near the disc: negative charge comes to the disc from the other parts, positive stays on the leaves, they spread),
and the boxed question on the rainy season.

## The one idea to teach
An electroscope shows charge: charge reaching the leaves gives both the same charge, so they spread; it can be charged without
touching (আবেশ) or by touching (আহিতকরণ), and with a known charge on it, it tells the kind of an unknown charge.

## How the figure works
- **Calm first screen**: the bottle on the table, no signs yet.
- **১ যন্ত্রটি**: the metal path glows from the disc to the leaves, four labels one by one, then the charges appear: "+ over −" pairs
  (as `electrostatic-induction` and `charging-by-friction`), so no charge and the leaves hang together.
- **২ কাছে আনা**: glass rubbed with silk, then brought near. Only electrons move: up the rod to the near side of the disc, bare + stay
  on the leaves. The rod can be dragged (`createDragHandle`, ← → keys): the electrons follow, three states of the sentence.
- **৩ ছোঁয়ানো**: the rod touches the disc's rim: five electrons go into the glass and pair up with its +; the rod goes; the leaves stay apart.
- **৪, ৫ চার্জ চেনা**: the book's test: the comb near a positive instrument makes the gap smaller, the glass rubbed again makes it
  wider. A faint copy of the leaves stays at the known gap, labelled "আগের ফাঁক". Both bodies can be dragged.
- **Test**: five questions (leaves' charge by induction, why they stay apart, the unknown rod, charge from a comb's touch, the rainy
  day). Signs on the instrument are hidden where they would give the answer and come back with the worked answer.

## Physics (src/reading.js, test/unit/gold-leaf-electroscope.test.mjs)
- A chip is a packet of many electrons. Metal: three + on the disc, three down each leaf (nine pairs when neutral). The numbers are
  counts of drawn chips, never a measurement. Total charge is always kept (`parts`).
- **Leaf balance**: each leaf hangs from its top edge. Taking the push between the lower parts of the leaves and the weight at the
  middle of the leaf gives sin²θ · tan θ = C q²; C is chosen so three chips on a leaf open it about 38°. So 1, 2, 3 chips give gaps of
  about 37°, 58° and 76°: more charge, wider, but not in proportion. The shape is right; the scale is chosen.
- **Induction**: chips moved per leaf κ q / (1 + (d/d₀)²), rounded. Qualitative: the book gives no formula.
- **The comb does not shut the gap**: the leaves keep one chip each, because the disc has only three bare + to give. The book says "ফাঁক কমে
  যায়", and a gap that visibly shrinks reads better than one that disappears. A real electroscope would close, then reopen, with a
  stronger or nearer body; that is left out.

## Decisions and stylisation
- **The book's missing step**: the sentence on p. 279 starts with "আমরা সেটাকে চাকতিতে স্পর্শ করলে" and reads as if the known charge came from
  the body under test. Step ৩ gives the known positive charge first, step ৪ tests a body, as `pages/10.3.1.md` asks. The test bodies come
  near; the book says "স্পর্শ"; bringing near is the safe way (a touch would change the instrument's charge), and the brief asks for it.
- **Order**: the book teaches touching, then the test, then induction; the figure goes near → touch → test, because the known charge
  of the test comes from the touch, and the rod's approach naturally comes before its touch.
- **Electrons move, the book's "চার্জ" stays in the words**: the book says "খানিকটা চার্জ চাকতিতে চলে যাবে" (positive charge moves to the
  disc). Chapter 10 says only electrons move (10.2, 10.3, and the chapter's shared decision), so the picture shows electrons leaving for the glass, and
  the rule keeps the book's sentence that the charge spreads over the disc, rod and leaves.
- **Leaves on a plate**: the book's picture has two tilted sheets. A real instrument has flat leaves on the faces of a small plate, opening
  away from it; it is built that way, turned about 40° from the first view, so both the opening and the faces show. Orbit to see it edge on.
- Glass is an insulator: only charge at the touching spot leaves it, so the rod keeps some + after the touch.
- "কয়েকটি চার্জ আঁকা, আসলে অসংখ্য" in a corner, as in `electrostatic-induction`.
- The unknown rod in the test is a grey rod; its charge is chosen at random each time (never shown; the gap tells).
- Added by the figure: বুজে এসেছে for leaves closing, "আগের ফাঁক", "অজানা দণ্ড", "পরিচিত চার্জ" (the book's words).

## Terms (as in the book)
তড়িৎবীক্ষণ যন্ত্র, ইলেকট্রোস্কোপ, সোনার পাত, সুপরিবাহী দণ্ড, ধাতব চাকতি, অপরিবাহী ছিপি, কাচের বোতল, চার্জ আহিতকরণ, চার্জের প্রকৃতি বের করা, চার্জের আবেশ,
পজিটিভ / নেগেটিভ চার্জ, ফাঁক, বিকর্ষণ, সিল্ক, ফ্লানেল, চিরুনি, বর্ষাকাল. p. 278 prints দন্ড, p. 279 দণ্ড; the figure uses দণ্ড, as its sisters.

## Performance (measured, shadows on, 844×390)
Near 19 draws / 17.0k triangles, testPos 23 / 17.5k (the heaviest). Under 150 draws and 300k triangles from any side: nothing is added
by turning the view. About 1.6 ms of script per animated frame under 6× CPU throttling (real clock, step ২). Renders on demand: 0 draws
idle; later parts exist at load and are warmed. Charges are two `Points` draws.

## Open questions
- The book says the known charge's test is by "স্পর্শ"; the figure brings bodies near. OK for the book team?
- p. 278 "দন্ড" against p. 279 "দণ্ড".
- The reddish stopper is drawn as cork; the book only says অপরিবাহী ছিপি.
