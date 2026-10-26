// Safe journey through the bridge (book pages 74–75, topic 3.5.2): at 20, 40 and 60 km/h the car's kinetic energy is
// 1, 4 and 9 cubes (twice the speed, four times the energy); the head-on crash leaves the truck at u and flings the car
// back at 3u (m₂ ≈ 0), a change of 4u; the car's front is crushed more at a higher speed; the action offers the next
// speed; with real masses the numbers come close to the book's; the test starts and an answer is marked; reset.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('safe-journey: twice the speed, four times the energy; the car’s velocity changes by 4u', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'safe-journey');
  const frame = page.frames().find((f) => f.url().includes('/assets/safe-journey/'));
  if (!frame) throw new Error('no figure frame');
  const outcome = () => frame.locator('.pvc-outcome').innerText();

  const start = await fig.call('get');
  expect(start).toMatchObject({ speed: 20, phase: 'ready', cubes: 1, truck: 20, car: -20, change: null, crumple: 0, tried: [] });
  expect(start.next).toEqual({ speed: 20, step: 1 });
  expect(await outcome()).toMatch(/১টি\s+ঘনক/);

  // the energy grows with the square of the speed
  await fig.call('set', { speed: 40 });
  expect(await fig.call('get')).toMatchObject({ speed: 40, cubes: 4, phase: 'ready' });
  await fig.call('set', { speed: 60, animate: false });
  expect(await fig.call('get')).toMatchObject({ speed: 60, cubes: 9 });

  // the crash at 40 km/h, played through: the car's velocity goes from −40 through zero to 120, the truck's stays 40
  await fig.call('set', { speed: 40, animate: false });
  await fig.call('set', { play: true });
  let sawContact = false;
  let lastCar = -40;
  for (let ms = 0; ms < 7000; ms += 200) {
    await fig.advance(200);
    const s = await fig.call('get');
    expect(s.truck).toBeCloseTo(40, 6);
    expect(s.car).toBeGreaterThanOrEqual(lastCar - 1e-6); // it only grows: −40 → 0 → 120
    lastCar = s.car;
    if (s.phase === 'contact') {
      sawContact = true;
      expect(s.car).toBeGreaterThan(-40 - 1e-6);
      expect(s.car).toBeLessThan(120 + 1e-6);
    }
    if (s.phase === 'end') break;
  }
  expect(sawContact).toBe(true);
  const end40 = await fig.call('get');
  expect(end40).toMatchObject({ phase: 'end', truck: 40, car: 120, change: 160, crumple: 0.6, tried: [40] });
  expect(await outcome()).toContain('১৬০');
  // the action now offers the next speed not tried (20 km/h), as step 2
  expect(end40.next).toEqual({ speed: 20, step: 2 });
  // a third of the way through the contact (2.16 s of approach, then 1.2 s of contact) the car stands still for an instant
  const still = await fig.call('set', { at: 2.16 + 0.4 });
  expect(still.phase).toBe('contact');
  expect(Math.abs(still.car)).toBeLessThan(1);
  expect(still.tried).toEqual([40]); // a jump into the run is not a crash seen

  // at 60 km/h the car is crushed more
  await fig.call('set', { speed: 60, play: true, animate: false });
  const end60 = await fig.call('get');
  expect(end60).toMatchObject({ phase: 'end', car: 180, change: 240, crumple: 1.35 });

  // the big button plays the crash too (at the next speed not tried)
  await frame.locator('.pvc-act').first().click();
  await fig.advance(2000);
  const viaButton = await fig.call('get');
  expect(viaButton.speed).toBe(20);
  expect(['approach', 'contact', 'after', 'end']).toContain(viaButton.phase);

  // with real masses (20,000 kg and 1,000 kg) the car leaves at about 2.81u, the truck at about 0.81u
  await fig.call('set', { masses: 'real', speed: 40, play: true, animate: false });
  const real = await fig.call('get');
  expect(real.masses).toBe('real');
  expect(real.car).toBeCloseTo((59 / 21) * 40, 2);
  expect(real.truck).toBeCloseTo((17 / 21) * 40, 2);
  await fig.call('set', { masses: 'book' });

  // the test: five questions; tapping an answer marks it
  await fig.call('practice');
  await fig.advance(1500);
  expect((await fig.call('get')).mode).toBe('quiz');
  await frame.locator('.pvc-opt').first().click();
  await fig.advance(600);
  expect(await frame.locator('.pvc-q-feedback').innerText()).not.toBe('');

  // reset: back to 20 km/h, nothing tried, learn mode
  await fig.call('reset');
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ speed: 20, phase: 'ready', tried: [], mode: 'explore', masses: 'book' });
  expect(log.errors).toEqual([]);
});
