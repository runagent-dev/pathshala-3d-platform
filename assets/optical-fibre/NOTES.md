# Notes: Optical fibre (অপটিক্যাল ফাইবার)

Book: physics-9-10 › 9.3.1 › p253 (`reference/page-253.png`)

## What the page shows
The whole of page 253. The text: optical fibres replace electric wires for communication (আলোর সংকেত দিয়ে তথ্য); free
light goes straight, but in a fibre it is trapped, so the fibre can be turned any way ("ঘুরিয়ে পেঁচিয়ে যেকোনো দিকে");
a fibre is a very thin glass thread, the inner part কোর (core), the outer ক্ল্যাড (clad); both glass, the core's
refractive index higher, so total internal reflection keeps the light in the core over hundreds of kilometres; the glass
absorbs little; visible light is absorbed more, so infrared (ইনফ্রারেড বা অবলাল রশ্মি) is used.
চিত্র ৯.১১ (a): a wavy S-shaped fibre, white core between light-blue clad, zig-zag rays following the bends. (b): a straight
section, n₁ = 1.45 (clad), n₂ = 1.50 (core), one ray reflected at the upper wall, the dashed normal and θ₁ marked.
উদাহরণ: core 1.50, clad 1.45 → θc = sin⁻¹(n₁/n₂) = sin⁻¹(1.45/1.50) = sin⁻¹(0.97) = 75°; "কাজেই আলোকরশ্মিকে 75° কিংবা তার
চেয়ে বেশি কোণে আপতিত হতে হবে।"

## The one idea to teach
Light in the core meets the core–clad wall at more than the critical angle (75°), so it is totally reflected again and
again and follows the fibre even round bends; at less than 75° it leaves the core.

## Terms (as in the book)
অপটিক্যাল ফাইবার, কাচের তন্তু, কোর, ক্ল্যাড, প্রতিসরণাঙ্ক, পূর্ণ অভ্যন্তরীণ প্রতিফলন, সংকট কোণ θc, আপতন কোণ θ₁ (the page's
figure marks θ₁), n₁ (clad) and n₂ (core) as the example writes them, শোষণ, দৃশ্যমান আলো, ইনফ্রারেড বা অবলাল রশ্মি, আলোর সংকেত,
তথ্য. From 9.1/9.2: লম্ব (chapter 9's word for the normal; never অভিলম্ব), ঘন / হালকা মাধ্যম.
Added by the figure (not on the page): আলোর উৎস, পর্দা, আবরণ (a real fibre's plastic coating; see below).

## How the figure works
- A magnified fibre (core radius 0.6 cm, clad 1.0 cm, coating 1.15 cm, 74 cm long) on a light-sand table in the calm deep-blue
  setting, held level at both ends by black ring clamps on steel posts; the far clamp slides up and down its rod so the fibre
  bends into an S (two equal circular arcs between straight ends: every wall is an exact line or circle). A light source on a
  swing arm turning about the near end face's centre; a white screen on the far clamp. The coating is cut away on the near
  side so the inside shows; corner note "আসলের চেয়ে অনেক গুণ বড়".
- The light is traced exactly in the fibre's plane (`src/reading.js`, unit tested): Snell's law into the near face, the
  core–clad wall (TIR when θ₁ ≥ θc, otherwise Fresnel: most of it refracts into the clad, where the coating takes it up, a
  little is reflected on), Snell's law out of the far face onto the screen. Rays are painted on a 2D canvas over the view
  in the chapter's style (amber, dark edge, chevrons; width = share of the light; the leak fades into a warm glow at the coating).
- Five steps, one tap each: ① the camera flies to the near end face: কোর n₂ = 1.50, ক্ল্যাড n₁ = 1.45, আবরণ; ② the light is
  sent: the camera follows its front along the fibre (7 s), then pulls back; "৭ বার প্রতিফলিত"; ③ one reflection close up
  (চিত্র ৯.১১b): লম্ব, θ₁ = 83°, the θc = 75° direction (violet, dashed), and sin θc = n₁/n₂ = 1.45/1.50 = 0.967, θc = 75°;
  ④ the fibre bends into an S (চিত্র ৯.১১a); a drag handle on the far clamp (or ↑/↓): the smallest θ₁ (79° at the default
  bend) is labelled, every θ₁ stays above 75°; ⑤ the source is tilted to 35° (a drag handle, or ←/→): θ₁ = 68°, the light
  leaves into the clad at every wall and the screen is dark; turned back under 22.8° it all arrives again.
- The panel: a calm intro card, then per step a lead-in line, the result, the book's rule (term in bold); the kit's how-to
  row; a graph (landscape panels with room) of θ₁ at each wall in turn against the 75° line (dots come in as the light
  reaches each wall; a leaking wall is a hollow dot with a cross); "আবার দেখো" replays a step.
- Test (5): what happens at the wall shown (θ₁ = 80° or 70° on the picture, chosen at random); the critical angle from the
  indices shown on the picture; why the light leaves (θ₁ = 69° on the picture); why the bent fibre works; which rays real
  fibres carry and why. Each wrong choice is a real mistake with its own note.

## Decisions
- **θc = 75° exactly.** 1.45/1.50 = 0.9667 → 75.2°; the book prints 0.97 and 75° (sin⁻¹ 0.97 would be 75.9°). The physics uses
  the book's 75° (the clad's index is then 1.50 × sin 75° = 1.4489, which is 1.45 to the book's two places), and readings are
  rounded so that no leaking wall ever shows "৭৫°" and no reflecting wall shows less. The panel writes 0.967 (true) rather
  than the book's 0.97, and θc = 75°: one number everywhere.
- **The coating (আবরণ)** is not in the book. It is needed for honesty: with only core and clad in air, light that leaves the
  core between 41.8° and 75° would be trapped again by the clad's outer surface (clad–air TIR). Real fibres have a plastic
  coating that takes up that light; the figure shows it (cut away) and the leak fades into it.
- **The model's proportions.** Bending loss is real physics and depends on the bend radius over the core radius. In this
  magnified model (R/a ≥ 108) the starting light (θ₁ = 83°) and any tilt up to 16° never leak at any bend of the range
  (unit-tested over the whole range); the leak is shown with the tilt, which is exactly the book's question. A real fibre's
  core is about 0.05 mm, so real bends are far gentler still.
- **The light's colour.** Amber, the chapter's ray colour; the step-2 rule says real fibres carry invisible infrared.
- Only meridional rays (in the plane of the bend) are traced, as the book draws them.

## Performance (2026-11-07, `scripts/.perf-tmp.mjs`, 844 × 390, shadows on, software WebGL)
| state | draw calls (az 0° / 90° / 180° / 270°) | triangles (max, incl. the shadow pass) |
|---|---|---|
| bend (S) | 34 / 82 / 82 / 82 | 158,016 |
| tilt | 26 / 79 / 58 / 58 | 158,010 |
- Idle: 0 draws once the orbit's damping settles. Main-thread task time per animated frame under 6× CPU throttling:
  1.2 ms (the light running, follow camera) and 2.3 ms (the bend). Ready in about 3.5 s under the harness.
- One small texture (the spot's 64² glow) and a 4×256 backdrop. The fibre is three swept surfaces (core and clad drawn back
  then front) re-written in place when it bends (no new buffers); holders merged per material; parts of later steps (the
  spot) exist at load and are warmed up with `stage.warmUp({ show })`. Label anchors come from a small ring of vectors.

## Open questions for the book team
- The example prints sin⁻¹(0.97) = 75°; 1.45/1.50 = 0.967 (sin⁻¹ 0.97 = 75.9°). The figure shows 0.967 and 75°.
- The page uses n₁ for the clad and n₂ for the core (as in 9.2: n₂ the dense side); the figure follows the page.
- Is the coating (আবরণ) acceptable as an addition? Without it, a model of core and clad in air would not lose its light.
