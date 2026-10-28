# Notes: Vernier Caliper

Feedback and change requests. Newest at the top. (Written from the dashboard's Notes tab; stays out of the handoff zip.)

## 2026-10-28
- v0.3.5: Rich teal background behind the instrument for clearer contrast on classroom boards and embedded pages. The magnifier and default PNG captures use the same colour. Explicit capture backgrounds and transparent embeds remain supported.

## 2026-10-24
- v0.3.2: no visible change. Its student view, quiz screen, pointers, magnifier, materials and sounds moved to shared/lib/student so the screw gauge (and later figures) use the same code; checked pixel for pixel against the previous version.
- Book location: page 20, topic 1.6 (in asset.json `page`/`topic`/`placement`, top of README, PACKAGE.json in the zip).
- v0.3.1: students didn't notice the jaw slides or that the magnifier moves. Added a hand pointer on the jaw (slides it a little), then on the magnifier handle (moves it a little); pinned to grabbable spots and verified by dragging from the fingertip on phone portrait/landscape, book, desktop and 3D view. Mobile fixes: magnifier drag was being cancelled by the browser's scroll gesture (touch-action), bigger handle grab area, touches just off the jaw still grab it. `?coach=0` turns pointers off.
- v0.3.0: too much UI for students who only had a picture before. New default "student view": 3D caliper + "সামনে / ঘুরিয়ে দেখো" + fullscreen, then two tabs: শেখো (reading as M + V × VC with each part named, one "measure an object" button) and পরীক্ষা (5 multiple-choice questions on a clamped, locked object; coloured scales + worked sum after each answer; score at the end). Phone first; panel moves beside the caliper in landscape. Old tool-heavy UI kept as `?ui=full`.
- Font switched to Noto Sans Bengali (v0.2.1): Hind Siliguri's digits, especially ১, were unrecognizable. Applies to the whole project (UI, scale engravings, dashboard, template).
- White background, Bangla UI, plain textbook-style UI instead of dark glass. Done in v0.2.0.
- Terms follow NCTB (স্লাইড ক্যালিপার্স, M / V / VC, যান্ত্রিক ত্রুটি). Check these match the book's wording.
- Scale numbers are engraved in Bangla digits. Use `?numerals=latin` if real-instrument digits are preferred.
