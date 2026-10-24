// DOM for the overlay UI. Everything is scoped under .pvc so the app can be mounted in any page.
import { ICONS, svg } from '@shared/student/icons.js';
import { buildStudentShell, learnSheet } from '@shared/student/shell.js';

export { ICONS };

export const SPECIMEN_ICONS = {
  none: svg('<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>'),
  sphere: svg('<circle cx="12" cy="13.5" r="7"/><path d="M12 6.5V4"/><circle cx="12" cy="2.8" r="1.2"/><path d="M8.5 11a4 4 0 0 1 3-2.6" class="hl"/>'),
  cylinder: svg('<ellipse cx="12" cy="5.5" rx="5.5" ry="2"/><path d="M6.5 5.5v13c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-13"/>'),
  block: svg('<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>'),
  ring: svg('<ellipse cx="12" cy="12" rx="8.5" ry="4"/><ellipse cx="12" cy="12" rx="5.5" ry="2.4"/><path d="M3.5 12v3c0 2.2 3.8 4 8.5 4s8.5-1.8 8.5-4v-3"/>'),
  bore: svg('<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 10.5h9a1.5 1.5 0 0 1 0 3H4"/>'),
};

/**
 * Student view (default): the 3D caliper, the reading as one labelled sum, and a short multiple-choice test.
 * Built for a phone first; the panel moves beside the caliper when the frame is short and wide.
 */
function buildSimpleUI(root, t) {
  const learn = learnSheet(t, {
    terms: [
      { cls: 'msr', label: 'msr_long', op: '=' },
      { cls: 'vsr', label: 'vsr_long', op: '+' },
      { cls: 'lc', label: 'lc_long', op: '×' },
      { cls: 'ze', label: 'ze_long', op: '−', wrap: 'pvc-ze-part' },
    ],
  });
  return buildStudentShell(root, t, { learn });
}

export function buildUI(root, t, { ui = 'simple', kinds }) {
  if (ui === 'simple') return buildSimpleUI(root, t);
  const n = t.num;
  const modeOf = { sphere: 'outside', cylinder: 'outside', block: 'outside', ring: 'inside', bore: 'depth' };
  root.innerHTML = `
  <header class="pvc-header" data-ui="${ui}">
    <div class="pvc-title">
      <h1 class="pvc-title-text">${t('title')}</h1>
      <button class="pvc-lc-badge" data-act="cycle-lc" title="${t('least_count')}"></button>
    </div>
    <div class="pvc-tools">
      <div class="pvc-seg" role="group" aria-label="View">
        <button data-view="front"><span class="l">${t('view_front')}</span><span class="sh">${t('view_front_short')}</span></button>
        <button data-view="3d">${t('view_3d')}</button>
      </div>
      <button class="pvc-tool" data-toggle="magnifier" title="${t('magnifier_tip')}">${ICONS.magnifier}<span>${t('magnifier')}</span></button>
      <button class="pvc-tool" data-toggle="guides" title="${t('guides_tip')}">${ICONS.guides}<span>${t('guides')}</span></button>
      <button class="pvc-tool" data-toggle="labels" title="${t('parts')} (P)">${ICONS.parts}<span>${t('parts')}</span></button>
      <button class="pvc-tool" data-toggle="locked" title="${t('lock')} (L)"><i class="ic-lock">${ICONS.unlock}</i><span>${t('lock')}</span></button>
      <div class="pvc-pop-wrap">
        <button class="pvc-tool icon-only" data-pop="settings" title="${t('settings')}" aria-label="${t('settings')}">${ICONS.settings}</button>
        <div class="pvc-pop pvc-settings" data-popover="settings" hidden>
          <div class="pvc-set-row">
            <label>${t('least_count')}</label>
            <div class="pvc-seg small" data-set="lc">
              <button data-v="0.1">${n('0.1')}</button><button data-v="0.05">${n('0.05')}</button><button data-v="0.02">${n('0.02')}</button>
            </div>
          </div>
          <div class="pvc-set-row">
            <label>${t('zero_error')}</label>
            <div class="pvc-stepper">
              <button data-act="ze-" aria-label="−">${ICONS.minus}</button>
              <output class="pvc-ze-value">0</output>
              <button data-act="ze+" aria-label="+">${ICONS.plus}</button>
            </div>
          </div>
          <div class="pvc-set-row">
            <label>${t('units')}</label>
            <div class="pvc-seg small" data-set="unit"><button data-v="mm">${t('unit_mm')}</button><button data-v="cm">${t('unit_cm')}</button></div>
          </div>
          <div class="pvc-set-row">
            <label>${t('sound')}</label>
            <button class="pvc-switch" data-toggle="sound" role="switch" aria-label="${t('sound')}"><i></i></button>
          </div>
          <div class="pvc-set-actions">
            <button class="pvc-btn" data-act="reset">${ICONS.reset}${t('reset')}</button>
            <button class="pvc-btn" data-act="fullscreen">${ICONS.expand}${t('fullscreen')}</button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="pvc-stage" data-ui="${ui}">
    <div class="pvc-canvas"></div>
    <div class="pvc-anno-layer"></div>
    <div class="pvc-lens-layer"></div>

    <div class="pvc-hint" role="status" aria-live="polite"><span class="pvc-hint-text"></span><button class="pvc-hint-act" hidden></button></div>

    <div class="pvc-actions">
      <div class="pvc-pop-wrap up">
        <button class="pvc-action" data-pop="specimens">${ICONS.measure}<span>${t('measure')}</span></button>
        <div class="pvc-pop pvc-tray" data-popover="specimens" hidden>
          ${['none', ...kinds]
            .map(
              (k) => `<button class="pvc-sp" data-specimen="${k}">${SPECIMEN_ICONS[k]}<b>${t(`sp_${k}`)}</b><small>${k === 'none' ? '&nbsp;' : t(`mode_${modeOf[k]}`)}</small></button>`,
            )
            .join('')}
        </div>
      </div>
      <button class="pvc-action" data-act="tour">${ICONS.play}<span>${t('show_me')}</span></button>
      <button class="pvc-action" data-act="practice">${ICONS.target}<span>${t('practice')}</span></button>
    </div>

    <div class="pvc-tour" hidden>
      <div class="pvc-tour-head"><span class="pvc-tour-step"></span><button class="pvc-icon" data-act="tour-close" aria-label="${t('close')}" title="${t('close')}">${ICONS.close}</button></div>
      <h3 class="pvc-tour-title"></h3>
      <p class="pvc-tour-body"></p>
      <div class="pvc-tour-dots"></div>
      <div class="pvc-tour-nav">
        <button class="pvc-btn" data-act="tour-prev">${ICONS.chevL}${t('back')}</button>
        <button class="pvc-btn primary" data-act="tour-next"><span>${t('next')}</span>${ICONS.chevR}</button>
      </div>
    </div>
  </div>

  <div class="pvc-dock">
    <div class="pvc-read">
      <div class="pvc-readout">
        <div class="pvc-ro-label"><span class="pvc-ro-title">${t('reading')}</span><button class="pvc-icon small" data-toggle="hidden" title="${t('hide_reading')}">${ICONS.eye}</button></div>
        <div class="pvc-ro-value"><span class="v">0</span><span class="u"></span></div>
        <div class="pvc-ro-status"><i></i><span></span></div>
      </div>
      <div class="pvc-eq">
        <div class="pvc-term msr"><i></i><span class="k">${t('msr_long')}</span><span class="s">${t('msr')}</span><span class="v">0</span><span class="u"></span></div>
        <div class="pvc-term vsr"><i></i><span class="k">${t('vsr_long')}</span><span class="s">${t('vsr')}</span><span class="v">0</span><span class="u"></span></div>
        <div class="pvc-term lc"><i></i><span class="k">${t('lc_long')}</span><span class="s">${t('lc')}</span><span class="v">0</span><span class="u"></span></div>
        <div class="pvc-term ze ze-only"><i></i><span class="k">${t('ze_long')}</span><span class="s">${t('ze')}</span><span class="v">0</span><span class="u"></span></div>
      </div>
      <div class="pvc-work"></div>
    </div>

    <form class="pvc-practice" hidden autocomplete="off">
      <div class="pvc-p-q"></div>
      <div class="pvc-p-row">
        <div class="pvc-p-input"><input type="text" inputmode="decimal" placeholder="${t('p_placeholder')}" aria-label="${t('p_placeholder')}" /><span class="u">${t('unit_mm')}</span></div>
        <button class="pvc-btn primary" type="submit">${ICONS.check}${t('p_check')}</button>
        <button class="pvc-btn" type="button" data-act="p-reveal">${t('p_reveal')}</button>
        <button class="pvc-btn" type="button" data-act="p-next">${t('p_next')}${ICONS.chevR}</button>
      </div>
      <div class="pvc-p-foot">
        <span class="pvc-p-feedback" role="status" aria-live="polite"></span>
        <span class="pvc-p-score"></span>
        <label class="pvc-p-ze"><input type="checkbox" data-act="p-ze" /> ${t('p_zero_errors')}</label>
        <button class="pvc-link" type="button" data-act="p-exit">${t('p_exit')}</button>
      </div>
    </form>
  </div>`;

  const $ = (s) => root.querySelector(s);
  return {
    $,
    $$: (s) => [...root.querySelectorAll(s)],
    header: $('.pvc-header'),
    stage: $('.pvc-stage'),
    canvasHost: $('.pvc-canvas'),
    annoLayer: $('.pvc-anno-layer'),
    lensLayer: $('.pvc-lens-layer'),
    hint: $('.pvc-hint'),
    hintText: $('.pvc-hint-text'),
    hintAct: $('.pvc-hint-act'),
    tour: $('.pvc-tour'),
    dock: $('.pvc-dock'),
    read: $('.pvc-read'),
    practice: $('.pvc-practice'),
  };
}
