import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppConfig,
  MathUtil,
  ZzzMath,
  StandardCalculator,
  AnomalyCalculator,
  RuptureCalculator,
  Preview,
  MarginalAnalyzer,
  StatMeta,
} from './zzz_logic.js';

function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source ?? target;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(target?.[key] ?? {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function makeInputs(overrides = {}) {
  const base = {
    jsonName: '',
    mode: 'standard',
    agent: {
      level: 60,
      attribute: 'physical',
      atk: 2000,
      atkInput: 2000,
      baseAtk: 0,
      atkPct: 0,
      crit: { rate: 0.05, dmg: 0.5 },
      dmgBuckets: { generic: 0, attribute: 0, skillType: 0, other: 0 },
      pen: { ratioPct: 0, flat: 0 },
      resIgnorePct: 0,
      defIgnorePct: 0,
      skillMultPct: 100,
      anomaly: {
        type: 'auto',
        prof: 100,
        dmgPct: 0,
        disorderPct: 0,
        tickCountOverride: null,
        tickIntervalSecOverride: null,
        allowCrit: false,
        critRatePctOverride: null,
        critDmgPctOverride: null,
        disorderPrevType: 'auto',
        disorderTimePassedSec: 0,
      },
      rupture: {
        sheerForce: 2000,
        sheerDmgBonusPct: 0,
      },
    },
    enemy: {
      level: 70,
      def: 0,
      resByAttr: { physical: 0, fire: 0, ice: 0, electric: 0, ether: 0 },
      resReductionPct: 0,
      defReductionPct: 0,
      dmgTakenPct: 0,
      dmgTakenOtherPct: 0,
      isStunned: false,
      stunPct: 150,
    },
    marginal: {
      mode: 'conditional',
      customApplied: {},
    },
  };

  return deepMerge(base, overrides);
}

function closeTo(actual, expected, digits = 8) {
  expect(actual).toBeCloseTo(expected, digits);
}

describe('MathUtil', () => {
  it('clamps invalid values to lower bound and valid values into range', () => {
    expect(MathUtil.clamp(NaN, 1, 5)).toBe(1);
    expect(MathUtil.clamp('bad', 2, 9)).toBe(2);
    expect(MathUtil.clamp(-10, 0, 100)).toBe(0);
    expect(MathUtil.clamp(999, 0, 100)).toBe(100);
    expect(MathUtil.clamp(22, 0, 100)).toBe(22);
  });

  it('converts percentages to multipliers including negatives', () => {
    closeTo(MathUtil.pctToMult(0), 1);
    closeTo(MathUtil.pctToMult(25), 1.25);
    closeTo(MathUtil.pctToMult(-50), 0.5);
  });

  it('formats helper outputs without throwing', () => {
    expect(MathUtil.fmt0(12345.67)).toBe('12,346');
    expect(MathUtil.fmtMaybe1(12.34)).toBe('12.3');
    expect(MathUtil.fmtMaybe1(12)).toBe('12');
    expect(MathUtil.fmtSmart(12.345)).toBe('12.35');
  });
});

describe('ZzzMath helpers', () => {
  it('returns level factor table values and caps at level 60+', () => {
    expect(ZzzMath.levelFactor(1)).toBe(50);
    expect(ZzzMath.levelFactor(60)).toBe(794);
    expect(ZzzMath.levelFactor(99)).toBe(794);
  });

  it('uses specific enemy RES by attribute and falls back to 0 when absent', () => {
    const fire = makeInputs({
      agent: { attribute: 'fire' },
      enemy: { resByAttr: { physical: 0, fire: 25, ice: 0, electric: 0, ether: 0 } },
    });
    const ether = makeInputs({ agent: { attribute: 'ether' } });

    expect(ZzzMath.resPctForAttr(fire)).toBe(25);
    expect(ZzzMath.resPctForAttr(ether)).toBe(0);
  });

  it('adds all DMG% buckets together', () => {
    const i = makeInputs({
      agent: { dmgBuckets: { generic: 10, attribute: 20, skillType: 30, other: 40 } },
    });

    expect(ZzzMath.dmgPctTotal(i, true)).toBe(100);
    expect(ZzzMath.dmgPctTotal(i, false)).toBe(70);
  });

  it('computes RES multiplier with reduction and ignore, including negative resistance', () => {
    const i = makeInputs({
      agent: { attribute: 'fire', resIgnorePct: 15 },
      enemy: {
        resByAttr: { physical: 0, fire: 20, ice: 0, electric: 0, ether: 0 },
        resReductionPct: 10,
      },
    });
    closeTo(ZzzMath.computeResMult(i), 1.05);
  });

  it('floors effective RES at -100%', () => {
    const i = makeInputs({
      enemy: {
        resByAttr: { physical: -80, fire: 0, ice: 0, electric: 0, ether: 0 },
        resReductionPct: 50,
      },
      agent: { resIgnorePct: 50 },
    });

    closeTo(ZzzMath.computeResMult(i), 2);
  });

  it('computes vulnerability and stun multipliers', () => {
    const i = makeInputs({
      enemy: { dmgTakenPct: 20, dmgTakenOtherPct: 5, isStunned: true, stunPct: 150 },
    });

    closeTo(ZzzMath.computeVulnMult(i), 1.25);
    closeTo(ZzzMath.computeStunMult(i), 1.5);
  });

  it('returns 1 stun multiplier when enemy is not stunned', () => {
    const i = makeInputs({ enemy: { isStunned: false, stunPct: 200 } });
    closeTo(ZzzMath.computeStunMult(i), 1);
  });

  it('computes DEF multiplier in reduction -> pen ratio -> flat PEN order', () => {
    const i = makeInputs({
      agent: {
        level: 60,
        pen: { ratioPct: 20, flat: 100 },
        defIgnorePct: 10,
      },
      enemy: {
        def: 1000,
        defReductionPct: 20,
      },
    });

    const k = ZzzMath.levelFactor(60);
    const expectedDef = ((1000 * (1 - 0.3)) * (1 - 0.2)) - 100;
    const expected = k / (k + expectedDef);
    closeTo(ZzzMath.computeDefMult(i), expected);
  });

  it('caps combined DEF reduction and ignore at 100%', () => {
    const i = makeInputs({
      agent: { defIgnorePct: 80 },
      enemy: { def: 5000, defReductionPct: 80 },
    });

    closeTo(ZzzMath.computeDefMult(i), 1);
  });

  it('does not let flat PEN drive defense below zero', () => {
    const i = makeInputs({
      enemy: { def: 100 },
      agent: { pen: { ratioPct: 0, flat: 9999 } },
    });
    closeTo(ZzzMath.computeDefMult(i), 1);
  });
});

describe('StandardCalculator', () => {
  it('uses the full standard damage pipeline', () => {
    const i = makeInputs({
      agent: {
        atk: 2500,
        skillMultPct: 320,
        crit: { rate: 0.4, dmg: 1.2 },
        dmgBuckets: { generic: 20, attribute: 30, skillType: 10, other: 5 },
      },
      enemy: {
        def: 800,
        defReductionPct: 15,
        resByAttr: { physical: 10, fire: 0, ice: 0, electric: 0, ether: 0 },
        resReductionPct: 5,
        dmgTakenPct: 20,
        dmgTakenOtherPct: 10,
        isStunned: true,
        stunPct: 150,
      },
    });

    const dmgMult = 1.65;
    const defMult = ZzzMath.computeDefMult(i);
    const resMult = 0.95;
    const vuln = 1.3;
    const stun = 1.5;
    const base = 2500 * 3.2 * dmgMult * defMult * resMult * vuln * stun;

    const out = StandardCalculator.compute(i);
    closeTo(out.nonCrit, base);
    closeTo(out.crit, base * 2.2);
    closeTo(out.expected, base * 0.6 + base * 2.2 * 0.4);
  });

  it('caps crit rate to 100% for expected damage', () => {
    const i = makeInputs({ agent: { crit: { rate: 5, dmg: 1 } } });
    const out = StandardCalculator.compute(i);
    closeTo(out.expected, out.crit);
  });

  it('supports negative crit damage values exactly as stored', () => {
    const i = makeInputs({ agent: { crit: { rate: 1, dmg: -0.25 } } });
    const out = StandardCalculator.compute(i);
    closeTo(out.crit, out.nonCrit * 0.75);
    closeTo(out.expected, out.crit);
  });

  it('returns zero damage when ATK is zero', () => {
    const i = makeInputs({ agent: { atk: 0 } });
    const out = StandardCalculator.compute(i);
    closeTo(out.nonCrit, 0);
    closeTo(out.crit, 0);
    closeTo(out.expected, 0);
  });

  it('handles extreme enemy resistance without breaking output', () => {
    const i = makeInputs({
      enemy: { resByAttr: { physical: 250, fire: 0, ice: 0, electric: 0, ether: 0 } },
    });
    const out = StandardCalculator.compute(i);
    expect(Number.isFinite(out.expected)).toBe(true);
    expect(out.expected).toBeLessThan(0);
  });
});

describe('AnomalyCalculator', () => {
  it('maps auto anomaly type from attribute', () => {
    expect(AnomalyCalculator.inferType(makeInputs({ agent: { attribute: 'fire' } }))).toBe('burn');
    expect(AnomalyCalculator.inferType(makeInputs({ agent: { attribute: 'electric' } }))).toBe('shock');
    expect(AnomalyCalculator.inferType(makeInputs({ agent: { attribute: 'ether' } }))).toBe('corruption');
  });

  it('uses explicit anomaly type when not auto', () => {
    const i = makeInputs({ agent: { anomaly: { type: 'shatter' } } });
    expect(AnomalyCalculator.inferType(i)).toBe('shatter');
  });

  it('uses override tick count and interval for DOT anomalies', () => {
    const i = makeInputs({
      agent: {
        attribute: 'fire',
        anomaly: { tickCountOverride: 12, tickIntervalSecOverride: 0.75 },
      },
    });
    const out = AnomalyCalculator.compute(i);
    expect(out.tickCount).toBe(12);
    closeTo(out.tickIntervalSec, 0.75);
    closeTo(out.durationSec, 9);
  });

  it('falls back to metadata values when overrides are invalid', () => {
    const i = makeInputs({
      agent: {
        attribute: 'electric',
        anomaly: { tickCountOverride: 0, tickIntervalSecOverride: -5 },
      },
    });
    const out = AnomalyCalculator.compute(i);
    expect(out.tickCount).toBe(1);
    closeTo(out.tickIntervalSec, 0);
  });

  it('computes single-hit anomaly with correct average when crit is disabled', () => {
    const i = makeInputs({
      agent: {
        atk: 2000,
        level: 60,
        attribute: 'physical',
        dmgBuckets: { generic: 20, attribute: 10, skillType: 50, other: 5 },
        anomaly: {
          prof: 120,
          dmgPct: 10,
          allowCrit: false,
        },
      },
      enemy: {
        def: 500,
        resByAttr: { physical: 20, fire: 0, ice: 0, electric: 0, ether: 0 },
      },
    });

    const out = AnomalyCalculator.compute(i);
    expect(out.anomType).toBe('assault');
    expect(out.kind).toBe('single');
    closeTo(out.anomalyPerTick.nonCrit, out.anomalyPerProc.nonCrit);
    closeTo(out.anomalyPerTick.avg, out.anomalyPerProc.avg);
  });

  it('uses anomaly crit overrides when enabled', () => {
    const i = makeInputs({
      agent: {
        attribute: 'fire',
        crit: { rate: 0.1, dmg: 0.5 },
        anomaly: {
          prof: 100,
          allowCrit: true,
          critRatePctOverride: 100,
          critDmgPctOverride: 200,
        },
      },
    });

    const out = AnomalyCalculator.compute(i);
    closeTo(out.anomalyPerTick.crit, out.anomalyPerTick.nonCrit * 3);
    closeTo(out.anomalyPerTick.avg, out.anomalyPerTick.crit);
  });

  it('uses base crit values when anomaly crit overrides are null', () => {
    const i = makeInputs({
      agent: {
        attribute: 'fire',
        crit: { rate: 0.5, dmg: 1.5 },
        anomaly: {
          allowCrit: true,
          critRatePctOverride: null,
          critDmgPctOverride: null,
        },
      },
    });
    const out = AnomalyCalculator.compute(i);
    closeTo(out.anomalyPerTick.avg, out.anomalyPerTick.nonCrit * 0.5 + out.anomalyPerTick.crit * 0.5);
  });

  it('computes disorder scaling from previous burn time remaining', () => {
    const i = makeInputs({
      agent: {
        attribute: 'electric',
        anomaly: {
          allowCrit: false,
          disorderPrevType: 'burn',
          disorderTimePassedSec: 3.2,
        },
      },
    });

    const out = AnomalyCalculator.compute(i);
    expect(out.disorderPrevType).toBe('burn');
    closeTo(out.disorderTimePassedSec, 3.2);
    expect(out.disorder.avg).toBeGreaterThan(0);
  });

  it('auto-uses current anomaly type as previous type when disorder type is auto', () => {
    const i = makeInputs({ agent: { attribute: 'ice', anomaly: { disorderPrevType: 'auto' } } });
    const out = AnomalyCalculator.compute(i);
    expect(out.disorderPrevType).toBe('shatter');
  });

  it('clamps disorder time into the supported range', () => {
    const i = makeInputs({ agent: { attribute: 'fire', anomaly: { disorderTimePassedSec: 50 } } });
    const out = AnomalyCalculator.compute(i);
    closeTo(out.disorderTimePassedSec, 10);
  });

  it('keeps anomaly proficiency multiplier non-negative', () => {
    expect(AnomalyCalculator.anomalyProfMult(-50)).toBe(0);
    closeTo(AnomalyCalculator.anomalyProfMult(120), 1.2);
  });

  it('returns expected level multiplier bounds', () => {
    closeTo(AnomalyCalculator.anomalyLevelMult(1), 1);
    closeTo(AnomalyCalculator.anomalyLevelMult(60), 2);
  });
});

describe('RuptureCalculator', () => {
  it('uses full rupture pipeline and crit expectation', () => {
    const i = makeInputs({
      mode: 'rupture',
      agent: {
        skillMultPct: 250,
        crit: { rate: 0.25, dmg: 1 },
        dmgBuckets: { generic: 20, attribute: 10, skillType: 5, other: 15 },
        rupture: { sheerForce: 3500, sheerDmgBonusPct: 30 },
      },
      enemy: {
        resByAttr: { physical: 20, fire: 0, ice: 0, electric: 0, ether: 0 },
        resReductionPct: 10,
        dmgTakenPct: 20,
        isStunned: true,
        stunPct: 200,
      },
    });

    const out = RuptureCalculator.compute(i);
    const expectedBase = 3500 * 2.5 * 1.5 * 1.3 * 0.9 * 1.2 * 2;
    closeTo(out.nonCrit, expectedBase);
    closeTo(out.crit, expectedBase * 2);
    closeTo(out.expected, expectedBase * 0.75 + expectedBase * 2 * 0.25);
  });

  it('floors sheer force at zero', () => {
    const out = RuptureCalculator.compute(makeInputs({ mode: 'rupture', agent: { rupture: { sheerForce: -500 } } }));
    closeTo(out.expected, 0);
  });
});

describe('Preview integration', () => {
  beforeEach(() => {
    AppConfig.SHOW_DISORDER_UI = false;
  });

  afterEach(() => {
    AppConfig.SHOW_DISORDER_UI = false;
  });

  it('returns standard output in standard mode', () => {
    const i = makeInputs({ mode: 'standard' });
    const std = StandardCalculator.compute(i);
    const out = Preview.compute(i);
    closeTo(out.output, std.expected);
    expect(out.anom).toBeNull();
  });

  it('returns rupture output in rupture mode', () => {
    const i = makeInputs({ mode: 'rupture' });
    const rup = RuptureCalculator.compute(i);
    const out = Preview.compute(i);
    closeTo(out.output, rup.expected);
  });

  it('combines standard + anomaly and hides disorder when disabled', () => {
    const i = makeInputs({ mode: 'anomaly', agent: { attribute: 'fire' } });
    const std = StandardCalculator.compute(i);
    const anom = AnomalyCalculator.compute(i);
    const out = Preview.compute(i);
    closeTo(out.output, std.expected + anom.anomalyPerProc.avg);
  });

  it('includes disorder when the flag is enabled', () => {
    AppConfig.SHOW_DISORDER_UI = true;
    const i = makeInputs({ mode: 'anomaly', agent: { attribute: 'fire' } });
    const std = StandardCalculator.compute(i);
    const anom = AnomalyCalculator.compute(i);
    const out = Preview.compute(i);
    closeTo(out.output, std.expected + anom.anomalyPerProc.avg + anom.disorder.avg);
  });

  it('falls back to standard branch for unknown mode', () => {
    const i = makeInputs({ mode: 'something-else' });
    const std = StandardCalculator.compute(i);
    const out = Preview.compute(i);
    closeTo(out.output, std.expected);
  });
});

describe('StatMeta', () => {
  it('exposes lookup entries for known keys', () => {
    expect(StatMeta.byKey('atk')?.kind).toBe('flat');
    expect(StatMeta.byKey('resIgnorePct')?.kind).toBe('pct');
    expect(StatMeta.byKey('missing')).toBeNull();
    expect(StatMeta.list().length).toBeGreaterThan(10);
  });
});

describe('MarginalAnalyzer helpers', () => {
  it('clones with structuredClone when available', () => {
    const i = makeInputs();
    const cloned = MarginalAnalyzer.cloneInputs(i);
    expect(cloned).not.toBe(i);
    expect(cloned).toEqual(i);
  });

  it('falls back to JSON cloning when structuredClone is unavailable', () => {
    const original = globalThis.structuredClone;
    const i = makeInputs();
    try {
      // @ts-ignore
      delete globalThis.structuredClone;
      const cloned = MarginalAnalyzer.cloneInputs(i);
      expect(cloned).toEqual(i);
      expect(cloned).not.toBe(i);
    } finally {
      globalThis.structuredClone = original;
    }
  });

  it('returns original display values for representative keys', () => {
    const i = makeInputs({
      agent: {
        atk: 2500,
        crit: { rate: 0.25, dmg: 1.5 },
        pen: { ratioPct: 18, flat: 35 },
      },
      enemy: { defReductionPct: 12 },
    });
    expect(MarginalAnalyzer.originalDisplay(i, 'atk')).toEqual({ kind: 'flat', value: 2500 });
    expect(MarginalAnalyzer.originalDisplay(i, 'critRatePct')).toEqual({ kind: 'pct', value: 25 });
    expect(MarginalAnalyzer.originalDisplay(i, 'penRatioPct')).toEqual({ kind: 'pct', value: 18 });
    expect(MarginalAnalyzer.originalDisplay(i, 'defReductionPct')).toEqual({ kind: 'pct', value: 12 });
  });

  it('resolves deltas by stat kind and falls back to defaults for mismatches', () => {
    expect(MarginalAnalyzer.resolveDelta('atk', { kind: 'flat', value: 123 })).toEqual({ kind: 'flat', value: 123 });
    expect(MarginalAnalyzer.resolveDelta('atk', { kind: 'pct', value: 123 })).toEqual(MarginalAnalyzer.defaultApplied('atk'));
    expect(MarginalAnalyzer.resolveDelta('critRatePct', { kind: 'pct', value: 12 })).toEqual({ kind: 'pct', value: 12 });
    expect(MarginalAnalyzer.resolveDelta('critRatePct', { kind: 'flat', value: 12 })).toEqual(MarginalAnalyzer.defaultApplied('critRatePct'));
  });

  it('applies and reverts deltas in place across representative keys', () => {
    const i = makeInputs();
    const undoAtk = MarginalAnalyzer.applyDeltaInPlace(i, 'atk', { kind: 'flat', value: 100 });
    expect(i.agent.atk).toBe(2100);
    undoAtk();
    expect(i.agent.atk).toBe(2000);

    const undoCrit = MarginalAnalyzer.applyDeltaInPlace(i, 'critRatePct', { kind: 'pct', value: 24 });
    closeTo(i.agent.crit.rate, 0.29);
    undoCrit();
    closeTo(i.agent.crit.rate, 0.05);

    const undoAnom = MarginalAnalyzer.applyDeltaInPlace(i, 'anomProf', { kind: 'flat', value: 9 });
    expect(i.agent.anomaly.prof).toBe(109);
    undoAnom();
    expect(i.agent.anomaly.prof).toBe(100);
  });

  it('computes pct gain safely for zero and non-finite baselines', () => {
    expect(MarginalAnalyzer.computePctGain(100, 125)).toBe(25);
    expect(MarginalAnalyzer.computePctGain(0, 0)).toBe(0);
    expect(MarginalAnalyzer.computePctGain(0, 10)).toBeNull();
    expect(MarginalAnalyzer.computePctGain(NaN, 10)).toBeNull();
  });
});

describe('MarginalAnalyzer integration', () => {
  beforeEach(() => {
    AppConfig.SHOW_DISORDER_UI = false;
  });

  afterEach(() => {
    AppConfig.SHOW_DISORDER_UI = false;
  });

  it('computes conditional rows using other test-add deltas in the baseline', () => {
    const i = makeInputs({
      marginal: { mode: 'conditional' },
      customApplied: {},
    });
    const customApplied = new Map([
      ['atk', { kind: 'flat', value: 1000 }],
      ['dmgGenericPct', { kind: 'pct', value: 50 }],
    ]);

    const result = MarginalAnalyzer.compute(i, { customApplied });
    const atkRow = result.rows.find((row) => row.key === 'atk');
    const dmgRow = result.rows.find((row) => row.key === 'dmgGenericPct');

    expect(atkRow).toBeTruthy();
    expect(dmgRow).toBeTruthy();
    expect(atkRow.out2).toBeGreaterThan(dmgRow.out2 / 2);
    expect(result.bestPctGain).toBeGreaterThan(0);
  });

  it('computes isolated rows from current build only', () => {
    const i = makeInputs({ marginal: { mode: 'isolated' } });
    const customApplied = new Map([
      ['atk', { kind: 'flat', value: 1000 }],
      ['dmgGenericPct', { kind: 'pct', value: 50 }],
    ]);
    const result = MarginalAnalyzer.compute(i, { customApplied });
    const atkRow = result.rows.find((row) => row.key === 'atk');
    expect(atkRow.gain).toBeGreaterThan(0);
    expect(atkRow.pctGain).toBeGreaterThan(0);
  });

  it('zeros crit-rate marginal gain when extra crit is fully capped', () => {
    const i = makeInputs({ agent: { crit: { rate: 1.1, dmg: 1 } } });
    const result = MarginalAnalyzer.compute(i, {
      customApplied: new Map([['critRatePct', { kind: 'pct', value: 24 }]]),
    });
    const row = result.rows.find((r) => r.key === 'critRatePct');
    expect(row.gain).toBe(0);
    expect(row.pctGain).toBe(0);
  });

  it('filters standard-only anomaly and rupture rows appropriately by mode', () => {
    const standard = MarginalAnalyzer.compute(makeInputs({ mode: 'standard' }));
    expect(standard.rows.some((r) => r.key === 'anomProf')).toBe(false);
    expect(standard.rows.some((r) => r.key === 'sheerForce')).toBe(false);

    const anomaly = MarginalAnalyzer.compute(makeInputs({ mode: 'anomaly' }));
    expect(anomaly.rows.some((r) => r.key === 'anomProf')).toBe(true);
    expect(anomaly.rows.some((r) => r.key === 'critRatePct')).toBe(false);

    const rupture = MarginalAnalyzer.compute(makeInputs({ mode: 'rupture' }));
    expect(rupture.rows.some((r) => r.key === 'sheerForce')).toBe(true);
    expect(rupture.rows.some((r) => r.key === 'defReductionPct')).toBe(false);
  });

  it('shows disorder row only when feature flag is enabled', () => {
    const off = MarginalAnalyzer.compute(makeInputs({ mode: 'anomaly' }));
    expect(off.rows.some((r) => r.key === 'disorderDmgPct')).toBe(false);

    AppConfig.SHOW_DISORDER_UI = true;
    const on = MarginalAnalyzer.compute(makeInputs({ mode: 'anomaly' }));
    expect(on.rows.some((r) => r.key === 'disorderDmgPct')).toBe(true);
  });

  it('supports label and effective-display overrides', () => {
    const result = MarginalAnalyzer.compute(makeInputs(), {
      getLabel: (meta) => `X:${meta.key}`,
      effectiveDisplay: (_, key, rawValue) => ({ primary: rawValue + 1, secondary: `note:${key}` }),
    });
    const atkRow = result.rows.find((r) => r.key === 'atk');
    expect(atkRow.label).toBe('X:atk');
    expect(atkRow.origVal).toBe(2001);
    expect(atkRow.totalDisplayNote).toBe('note:atk');
  });

  it('normalizes non-finite gains back to zero', () => {
    const fakePreview = {
      compute: vi.fn()
        .mockReturnValueOnce({ output: 100 })
        .mockReturnValueOnce({ output: Infinity })
        .mockReturnValue({ output: 100 }),
    };
    const result = MarginalAnalyzer.compute(makeInputs(), { preview: fakePreview });
    const firstRow = result.rows[0];
    expect(firstRow.gain).toBe(0);
  });
});
