// The result line: where the energy goes, as a flow (a Sankey diagram). One band of প্রদত্ত শক্তি comes in on the
// left and splits: the top branch is the কাজের পরিমাণ (the work on the load), the lower branch the শক্তির অপচয়, which
// fans out into heat in the motor, heat by friction and sound. Each band is as thick as its share, the numbers grow
// while the motor runs, and the bands flow (moving stripes) while it runs. Before the first run the shares are not
// shown (grey bands, equal, "? J"), so the picture never gives the answer away.

// drawn at the panel's own width (one unit = one pixel, so the words keep their size in a narrow side panel)
const IN = { x0: 0, y0: 4, h: 60 }; // the input band on the left (and the outputs with their gaps)
const GAP = 6; // px between the work and the waste at the end
const SUB = 2.5; // px between the three wasted parts
const MIN = 1.6; // px: the thinnest band (sound is tiny)

/** A band from (x0, a0…a1) to (x1, b0…b1), with smooth S-curves top and bottom. */
function band(x0, a0, a1, x1, b0, b1) {
  const m = (x0 + x1) / 2;
  return `M${x0},${a0} C${m},${a0} ${m},${b0} ${x1},${b0} L${x1},${b1} C${m},${b1} ${m},${a1} ${x0},${a1} Z`;
}

/**
 * @param {HTMLElement} host the result line
 * @param {(key: string, vars?: object) => string} t
 */
export function createFlow(host, t) {
  const C = { input: 'in', work: 'wk', waste: 'ws', motor: 'mo', friction: 'fr', sound: 'so' };
  host.innerHTML = `
    <svg class="ef-flow" viewBox="0 0 360 80" role="img" preserveAspectRatio="xMinYMid meet">
      <defs>
        <pattern id="ef-stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="14" height="14" fill="transparent"/><rect width="5" height="14" fill="rgba(255,255,255,0.32)"/>
        </pattern>
      </defs>
      <g class="bands">${Object.values(C)
        .map((c) => `<path class="b ${c}"/><path class="s ${c}" fill="url(#ef-stripes)"/>`)
        .join('')}</g>
      <g class="tx"></g>
    </svg>`;
  const svg = /** @type {SVGSVGElement} */ (host.querySelector('svg'));
  const path = (k, kind = 'b') => /** @type {SVGPathElement} */ (svg.querySelector(`.${kind}.${C[k]}`));
  const tx = /** @type {SVGGElement} */ (svg.querySelector('.tx'));
  let lastTx = '';
  let lastShape = '';
  let lastAria = '';

  /**
   * e: { input, work, waste, motor, friction, sound } in J (null: not run yet); shares: the final split, used for the
   * thickness (so the bands keep their shape while the numbers grow); flowing: the stripes move; J(x): the joules with
   * their unit for the labels, G(x): the number alone (for the screen reader's sentence).
   */
  function draw({ e, shares, flowing, J, G }) {
    // the geometry for this width: the input band, where the branches part, where the bands end (labels after)
    const W = Math.round(Math.min(440, Math.max(240, host.clientWidth || 360)));
    const narrow = W < 330;
    const inX1 = narrow ? 70 : 92;
    const END = W - (narrow ? 128 : 150);
    const SPLIT = inX1 + (END - inX1) * 0.48;
    const compact = W < 420; // a phone, or a column beside the formula: the bands a little thinner
    const H = compact ? 58 : 66;
    IN.h = compact ? 42 : 50;
    const known = Boolean(e);
    const sh = known ? shares : { work: 0.5, motor: 1 / 6, friction: 1 / 6, sound: 1 / 6 };
    // the bands' shapes change only with the width and the shares: drawn again only then
    const shape = `${W}|${known}|${sh.work}|${sh.motor}|${sh.friction}|${Boolean(flowing)}`;
    const reshape = shape !== lastShape;
    lastShape = shape;
    if (reshape) {
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.classList.toggle('narrow', narrow);
      svg.classList.toggle('compact', compact);
    }
    const total = IN.h - GAP - 2 * SUB;
    const hw = Math.max(MIN, total * sh.work);
    const parts = ['motor', 'friction', 'sound'].map((k) => Math.max(MIN, total * sh[k]));
    // scale so the parts fill the band exactly
    const sum = hw + parts.reduce((a, b) => a + b, 0);
    const f = total / sum;
    const hW = hw * f;
    const hP = parts.map((p) => p * f);
    const top = IN.y0;
    const wasteH = hP.reduce((a, b) => a + b, 0);
    // input band
    if (reshape) path('input').setAttribute('d', `M${IN.x0},${top} L${inX1},${top} L${inX1},${top + hW + wasteH} L${IN.x0},${top + hW + wasteH} Z`);
    // work: straight on to the end
    if (reshape) path('work').setAttribute('d', band(inX1, top, top + hW, END, top, top + hW));
    // waste: down by GAP to the split, then fanned out by SUB
    if (reshape) path('waste').setAttribute('d', band(inX1, top + hW, top + hW + wasteH, SPLIT, top + hW + GAP, top + hW + GAP + wasteH));
    let a = top + hW + GAP;
    let b = top + hW + GAP;
    const ends = [];
    ['motor', 'friction', 'sound'].forEach((k, i) => {
      if (reshape) path(k).setAttribute('d', band(SPLIT, a, a + hP[i], END, b, b + hP[i]));
      ends.push(b + hP[i] / 2);
      a += hP[i];
      b += hP[i] + SUB;
    });
    if (reshape) {
      for (const k of Object.keys(C)) path(k, 's').setAttribute('d', path(k).getAttribute('d') || '');
      svg.classList.toggle('flowing', Boolean(flowing));
      svg.classList.toggle('known', known);
    }
    // labels: the input's inside its band, the rest after the ends; the waste's three parts are the figure's own
    // estimate (the book gives only the total), so they carry ≈
    const val = (k) => (known ? `${['motor', 'friction', 'sound'].includes(k) ? t('f_about') : ''}${J(e[k])}` : t('f_none'));
    const workY = top + hW / 2;
    const wasteTop = top + hW + GAP;
    const rows = [
      [workY, 'wk', t('f_work'), val('work')],
      [ends[0], 'mo', t('f_motor'), val('motor')],
      [ends[1], 'fr', t('f_friction'), val('friction')],
      [ends[2], 'so', t('f_sound'), val('sound')],
    ];
    // keep the waste rows apart (at least 12 px)
    for (let i = 2; i < rows.length; i++) rows[i][0] = Math.max(rows[i][0], rows[i - 1][0] + (narrow ? 11 : 12));
    if (rows[1][0] < workY + 15) rows[1][0] = workY + 15;
    for (let i = 2; i < rows.length; i++) rows[i][0] = Math.max(rows[i][0], rows[i - 1][0] + (narrow ? 11 : 12));
    const shift = Math.max(0, rows[3][0] + 6 - H);
    for (let i = 1; i < rows.length; i++) rows[i][0] -= shift;
    const inMid = top + (hW + wasteH) / 2;
    const html = `
      <text class="lab in" x="6" y="${inMid - 4}">${t('f_input')}</text>
      <text class="val in" x="6" y="${inMid + 11}">${val('input')}</text>
      <text class="lab ws" x="${narrow ? 2 : (inX1 + SPLIT) / 2 + 6}" y="${Math.min(H - 1, wasteTop + wasteH + 11)}" text-anchor="${narrow ? 'start' : 'middle'}">${t('f_waste')} <tspan class="val">${val('waste')}</tspan></text>
      ${rows
        .map(
          ([y, c, name, v]) =>
            `<text class="row ${c}" x="${END + 5}" y="${(y + 4).toFixed(1)}"><tspan class="lab">${name}</tspan> <tspan class="val">${v}</tspan></text>`,
        )
        .join('')}`;
    if (html !== lastTx) {
      tx.innerHTML = html;
      lastTx = html;
    }
    const n = (k) => (known ? G(e[k]) : '?');
    const aria = t('f_aria', {
      input: n('input'),
      work: n('work'),
      waste: n('waste'),
      motor: n('motor'),
      friction: n('friction'),
      sound: n('sound'),
    });
    if (aria !== lastAria) {
      lastAria = aria;
      svg.setAttribute('aria-label', aria);
    }
  }
  return { draw, svg };
}
