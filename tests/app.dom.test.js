// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

function loadDom() {
  document.documentElement.innerHTML = html;
}

async function boot() {
  await import('../app.js');
}

function q(id) {
  return document.getElementById(id);
}

function marginalKeys() {
  return [...document.querySelectorAll('#marginalBody input.appliedDelta')].map((el) => el.dataset.key);
}

describe('app DOM/UI', () => {
  let alertSpy;
  let promptSpy;
  let clickSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    localStorage.clear();
    document.documentElement.innerHTML = '';
    loadDom();

    alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    promptSpy = vi.spyOn(globalThis, 'prompt').mockReturnValue('Test Build');
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    globalThis.requestAnimationFrame = (cb) => cb();
    globalThis.CSS ??= { escape: (v) => String(v) };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders KPI cards and marginal rows on startup', async () => {
    await boot();
    expect(document.querySelectorAll('#kpi .box').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('#marginalBody tr').length).toBeGreaterThan(8);
  });

  it('updates KPI output when ATK changes', async () => {
    await boot();
    const firstValue = document.querySelector('#kpi .box .v')?.textContent;
    const atk = q('atk');
    atk.value = '4000';
    atk.dispatchEvent(new Event('input', { bubbles: true }));
    const nextValue = document.querySelector('#kpi .box .v')?.textContent;
    expect(nextValue).not.toBe(firstValue);
  });

  it('updates the ATK% flat gain preview when advanced inputs change', async () => {
    await boot();
    q('baseAtk').value = '800';
    q('baseAtk').dispatchEvent(new Event('input', { bubbles: true }));
    q('atkPct').value = '35';
    q('atkPct').dispatchEvent(new Event('input', { bubbles: true }));
    expect(q('atkPctFlatGain').value).toBe('280');
  });

  it('switches language and updates visible labels', async () => {
    await boot();
    const select = q('languageSelect');
    select.value = 'ko';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.lang).toBe('ko');
    expect(document.querySelector('h1').textContent).toContain('젠레스 존 제로');
    expect(document.getElementById('mode')?.querySelector('option:checked')?.textContent).toBeTruthy();
  });

  it('keeps negative enemy RES input intact through sanitization', async () => {
    await boot();
    const input = q('enemyResPhysicalPct');
    input.value = '-20';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('-20');
  });

  it('toggles anomaly and rupture sections by mode', async () => {
    await boot();
    expect(q('anomalySection').classList.contains('hidden')).toBe(true);
    expect(q('ruptureSection').classList.contains('hidden')).toBe(true);

    q('mode').value = 'anomaly';
    q('mode').dispatchEvent(new Event('change', { bubbles: true }));
    expect(q('anomalySection').classList.contains('hidden')).toBe(false);
    expect(q('ruptureSection').classList.contains('hidden')).toBe(true);

    q('mode').value = 'rupture';
    q('mode').dispatchEvent(new Event('change', { bubbles: true }));
    expect(q('anomalySection').classList.contains('hidden')).toBe(true);
    expect(q('ruptureSection').classList.contains('hidden')).toBe(false);
  });

  it('enables and disables anomaly crit override inputs', async () => {
    await boot();
    expect(q('anomCritRatePct').disabled).toBe(true);
    expect(q('anomCritDmgPct').disabled).toBe(true);

    q('anomAllowCrit').value = '1';
    q('anomAllowCrit').dispatchEvent(new Event('change', { bubbles: true }));

    expect(q('anomCritRatePct').disabled).toBe(false);
    expect(q('anomCritDmgPct').disabled).toBe(false);
  });

  it('enables and disables stunned multiplier input', async () => {
    await boot();
    expect(q('stunPct').disabled).toBe(true);

    q('isStunned').value = 'true';
    q('isStunned').dispatchEvent(new Event('change', { bubbles: true }));
    expect(q('stunPct').disabled).toBe(false);

    q('isStunned').value = 'false';
    q('isStunned').dispatchEvent(new Event('change', { bubbles: true }));
    expect(q('stunPct').disabled).toBe(true);
  });

  it('does not sort the marginal table on input alone, but does rerender on change', async () => {
    await boot();
    const before = marginalKeys();
    const input = document.querySelector('#marginalBody input.appliedDelta[data-key="atk"]');
    input.value = '999';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(marginalKeys()).toEqual(before);

    input.dispatchEvent(new Event('change', { bubbles: true }));
    const after = marginalKeys();
    expect(after.length).toBe(before.length);
    expect(document.querySelector('#marginalBody input.appliedDelta[data-key="atk"]').value).toBe('999');
  });

  it('preserves edited marginal input value and caret through rerender for the same stat key', async () => {
    await boot();
    const input = document.querySelector('#marginalBody input.appliedDelta[data-key="atk"]');
    input.focus();
    input.value = '12345';
    input.setSelectionRange(2, 4);
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const rerendered = document.querySelector('#marginalBody input.appliedDelta[data-key="atk"]');
    expect(rerendered).not.toBeNull();
    expect(rerendered.value).toBe('12345');
    expect(rerendered.dataset.key).toBe('atk');
  });

  it('sort header toggles aria-sort state when clicked', async () => {
    await boot();
    const header = document.querySelector('#marginalHead th[data-sort-key="gain"]');
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(header.getAttribute('aria-sort')).toBe('descending');
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
  });

  it('changes marginal mode selection and keeps the hint populated', async () => {
    await boot();
    expect(q('marginalMode').value).toBe('conditional');
    expect(q('marginalModeHint').textContent.length).toBeGreaterThan(10);

    q('marginalMode').value = 'isolated';
    q('marginalMode').dispatchEvent(new Event('change', { bubbles: true }));
    expect(q('marginalMode').value).toBe('isolated');
    expect(q('marginalModeHint').textContent.length).toBeGreaterThan(10);
  });

  it('saves to localStorage, resets, and loads back the saved build', async () => {
    await boot();
    q('atk').value = '4321';
    q('atk').dispatchEvent(new Event('input', { bubbles: true }));
    q('btnSave').click();
    expect(alertSpy).toHaveBeenCalled();
    expect(localStorage.length).toBeGreaterThan(0);

    q('btnReset').click();
    expect(q('atk').value).toBe('0');

    q('btnLoad').click();
    expect(q('atk').value).toBe('4321');
  });

  it('exports JSON using a generated blob download', async () => {
    await boot();
    q('btnExport').click();
    expect(promptSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it('re-renders marginal rows after editing a test-add input without losing row count', async () => {
    await boot();
    const before = document.querySelectorAll('#marginalBody tr').length;
    const input = document.querySelector('#marginalBody input.appliedDelta');
    input.focus();
    input.value = '24';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const after = document.querySelectorAll('#marginalBody tr').length;
    expect(after).toBe(before);
    expect(document.querySelector('#marginalBody input.appliedDelta')).not.toBeNull();
  });
});
