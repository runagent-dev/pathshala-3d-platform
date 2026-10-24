# Notes: SI prefixes, how big is it?

Feedback and change requests. Newest at the top. (Written from the dashboard's Notes tab; stays out of the handoff zip.)

## 2026-10-24
- v0.3.0: every row of Table 1.05 now has an object, so nothing in the table is greyed out: হেক্টো ফুটবল মাঠ (≈১০৫ মি), ডেকা বাস (≈১২ মি), ডেসি আম (≈১০ সেমি), এটো কোয়ার্ক ("১ এটোমিটারের চেয়েও ছোট", no measured size). Tour ≈98 s. Neighbours are spaced so the next bigger object stays out of frame while looking at the smaller one. Fixed: student/bus were off-centre (offset applied in model units); scale bar below 1 am now reads "০.২ এটোমিটার".
- v0.2.1: removed the "পদ্মা সেতু এতটুকু" dot from the Earth view (user request); the globe shows only বাংলাদেশ. The bridge stop and the other "এতটুকু" comparisons stay.
- v0.2.0: students can choose: tap a Table 1.05 row (rows without an object are greyed), a button in the strip (phones / short frames), an object or a "… এতটুকু" dot; it flies there and holds; ▶ continues from there. ←/→ keys step smaller/bigger. Event `choose` for the book.
- v0.1.1: galaxy now matches the book's text: "গ্যালাক্সি", দৈর্ঘ্য ≈ ৬০ লক্ষ এক্সামিটার (6 × 10²⁴ m), with a note that it is far past exa. Not called the Milky Way (that would be ~10²¹ m), and the "সূর্য এখানে" pin is gone. The star → galaxy zoom (8 powers of ten) is paced so the empty middle passes quickly and the galaxy forms around the view.
- v0.1.0: first version. Book page 17, topic 1.5.2 (with Table 1.05). Non-interactive: plays by itself, loops, only play/pause.
- Stops: student → ball → ant → red blood cell → DNA → atom → nucleus → back → Padma Bridge → Earth → Sun → solar system → nearest star → Milky Way → back.
- Decided (user): use the book's 6 × 10²⁴ m for the galaxy.
