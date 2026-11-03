// The physics of the seismic-survey figure (book p203, topic 7.3.3): echo times from the boundaries, depth = v t / 2,
// the mirror rule for the rays, the dome holding gas over oil. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/seismic-survey/src/reading.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('echo times', () => {
  it('right above the blast an echo takes 2d / v', () => {
    close(r.echoTime(0, 700), 1400 / 2500);
    close(r.echoTime(0, 350, 2000), 0.35);
  });
  it('farther geophones hear it later: t = √(x² + 4d²) / v', () => {
    close(r.echoTime(1200, 250), 1300 / 2500); // 1200² + 500² = 1300²
    assert.ok(r.echoTime(300, 700) > r.echoTime(100, 700));
  });
  it('deeper boundaries echo later, at every geophone', () => {
    for (const g of r.GEOPHONES) {
      const [a, b, c] = r.arrivals(g);
      assert.ok(a < b && b < c, `geophone ${g.i}`);
    }
  });
  it('every echo reaches every geophone within the record', () => {
    for (const g of r.GEOPHONES) for (const t of r.arrivals(g)) assert.ok(t < r.RECORD, `${t}`);
  });
});

describe('depth from time', () => {
  it('d = v t / 2', () => {
    close(r.depthFromTime(0.56), 700, 1e-9);
    assert.equal(r.depthFromTime(1, 3000), 1500);
  });
  it("the first geophone (beside the blast) gives the boundaries' depths, read to 0.01 s", () => {
    assert.deepEqual(
      [0, 1, 2].map((k) => r.measure(k)),
      [
        { k: 0, t: 0.28, d: 350, true: 350 },
        { k: 1, t: 0.56, d: 700, true: 700 },
        { k: 2, t: 0.8, d: 1000, true: 1000 },
      ],
    );
  });
});

describe('the rays and the layers', () => {
  it('a ray reflects with equal angles (the mirror rule)', () => {
    const d = 700;
    const gx = r.LINE[4].x;
    const px = r.reflectionX(gx, d);
    const down = (px - r.SOURCE.x) / (d + r.SOURCE.y);
    const up = (gx - px) / d;
    close(down, up, 1e-9, 'tan of the angles');
  });
  it('the boundaries are flat on the cut face in front (where the rays are drawn), folded behind', () => {
    for (let k = 0; k < 3; k++) for (const x of [-900, 0, 900]) assert.ok(Math.abs(r.depthAt(k, x, r.FRONT) - r.DEPTHS[k]) < 12, `${k} ${x}`);
    assert.ok(r.depthAt(2, r.DOME.x, r.DOME.z) < 860, 'the dome rises under the grid');
  });
  it('the dome holds gas over oil: its crest is above the gas–oil contact, which is above the oil–water one', () => {
    const crest = r.depthAt(2, r.DOME.x, r.DOME.z);
    assert.ok(crest < r.GOC && r.GOC < r.OWC && r.OWC < r.DEPTHS[2]);
    assert.ok(r.depthAt(3, r.DOME.x, r.DOME.z) > r.OWC, 'the reservoir rock goes below the oil');
  });
  it('a trace has blips at its echoes', () => {
    const g = r.LINE[0];
    r.arrivals(g).forEach((t, k) => {
      const tr = r.trace(g, t);
      assert.equal(tr.k, k);
      close(tr.y, r.STRENGTH[k], 0.02);
    });
    assert.equal(r.trace(g, 0.05).k, -1);
  });
});
