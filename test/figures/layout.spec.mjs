// Every figure at every required viewport: nothing scrolls, every visible control is inside the screen and big
// enough to tap, the text is in Noto Sans Bengali, and the page is white. DOM checks only (cheap).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../scripts/lib/export/driver.mjs';
import { figuresUnderTest, VIEWPORTS } from './figures.mjs';

const MIN_TAP = 24; // px, WCAG 2.5.8 (target size, minimum)

for (const { id, manifest } of figuresUnderTest()) {
  if (!/\.html?$/.test(manifest.entry || 'index.html')) continue; // a bare GLB has no page to test
  for (const vp of VIEWPORTS) {
    test(`${id}: layout ${vp.width}×${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      const log = await preparePage(page);
      const fig = await openFigure(page, id, { harness: false });
      await fig.advance(1000);

      const report = await page.evaluate((minTap) => {
        const vw = innerWidth;
        const vh = innerHeight;
        const root = document.scrollingElement;
        const visible = (el) => {
          if (el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const label = (el) =>
          `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}${el.dataset.act ? `[data-act=${el.dataset.act}]` : ''}`;
        // A control inside a container that scrolls (like a strip of stops) is reached by scrolling it.
        const inScroller = (el) => {
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (
              (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) ||
              (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight)
            )
              return true;
          }
          return false;
        };
        const controls = [...document.querySelectorAll('button, [role="button"], a[href], input, select, [role="tab"]')].filter(visible);
        const clipped = [];
        const small = [];
        for (const el of controls) {
          const r = el.getBoundingClientRect();
          const outside = r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1;
          if (outside && !inScroller(el))
            clipped.push(`${label(el)} at ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`);
          if (r.width < minTap - 0.5 || r.height < minTap - 0.5) small.push(`${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        const bg = getComputedStyle(document.body).backgroundColor;
        const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
        // Every element that shows text uses the book font.
        const wrongFont = [];
        for (const el of document.querySelectorAll('body *')) {
          if (!visible(el) || el.closest('svg') || !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          const family = getComputedStyle(el).fontFamily;
          if (!family.includes('Noto Sans Bengali')) wrongFont.push(`${label(el)} "${el.textContent.trim().slice(0, 20)}": ${family}`);
        }
        return {
          overflowX: root.scrollWidth - vw,
          overflowY: root.scrollHeight - vh,
          clipped,
          small,
          wrongFont: wrongFont.slice(0, 8),
          fontLoaded: document.fonts.check('16px "Noto Sans Bengali"', 'অ০১'),
          background: [bg, htmlBg],
        };
      }, MIN_TAP);

      expect(report.overflowX, 'scrolls sideways').toBeLessThanOrEqual(1);
      expect(report.overflowY, 'scrolls down').toBeLessThanOrEqual(1);
      expect(report.clipped, 'controls outside the screen').toEqual([]);
      expect(report.small, `controls smaller than ${MIN_TAP}px`).toEqual([]);
      expect(report.wrongFont, 'text not in Noto Sans Bengali').toEqual([]);
      expect(report.fontLoaded, 'Noto Sans Bengali loaded').toBe(true);
      expect(
        report.background.some((c) => c === 'rgb(255, 255, 255)'),
        `white page (${report.background.join(', ')})`,
      ).toBe(true);
      expect(log.errors).toEqual([]);
      expect(log.external).toEqual([]);
    });
  }
}
