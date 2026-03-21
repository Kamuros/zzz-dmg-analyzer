import { describe, expect, it } from 'vitest';
import { AnomalyCalculator, MarginalAnalyzer, Preview, RuptureCalculator, StandardCalculator, ZzzMath } from '../zzz_logic.js';

function makeInputs() {
  return {
    mode: 'standard',
    jsonName: '',
    agent: {
      level: 60,
      attribute: 'fire',
      atk: 1000,
      atkInput: 1000,
      baseAtk: 0,
      atkPct: 0,
      crit: { rate: 0.5, dmg: 1 },
      dmgBuckets: { generic: 20, attribute: 30, skillType: 40, other: 10 },
      pen: { ratioPct: 20, flat: 50 },
      resIgnorePct: 10,
      defIgnorePct: 10,
      skillMultPct: 200,
      anomaly: {
        type: 'auto',
        prof: 120,
        dmgPct: 25,
        disorderPct: 10,
        allowCrit: false,
        critRatePctOverride: null,
        critDmgPctOverride: null,
        tickCountOverride: null,
        tickIntervalSecOverride: null,
        disorderPrevType: 'auto',
        disorderTimePassedSec: 3.2,
      },
      rupture: { sheerForce: 600, sheerDmgBonusPct: 50 },
    },
    enemy: {
      level: 70,
      def: 500,
      resByAttr: { physical: 0, fire: 20, ice: 0, electric: 0, ether: 0 },
      resReductionPct: 5,
      defReductionPct: 15,
      dmgTakenPct: 0,
      dmgTakenOtherPct: 20,
      isStunned: true,
      stunPct: 150,
    },
    marginal: { mode: 'isolated' },
  };
}

describe('ZZZ community formula alignment', () => {
  it('uses additive DMG buckets and crit expectation for standard damage', () => {
    const i = makeInputs();
    const dmgMult = 1 + ((20 + 30 + 40 + 10) / 100);
    const defAfterShred = 500 * (1 - 0.25);
    const defAfterPenRatio = defAfterShred * (1 - 0.2);
    const effectiveDef = defAfterPenRatio - 50;
    const defMult = 794 / (794 + effectiveDef);
    const resMult = 1 - ((20 - 5 - 10) / 100);
    const vulnMult = 1.2;
    const stunMult = 1.5;
    const base = 1000 * 2 * dmgMult * defMult * resMult * vulnMult * stunMult;
    const expected = base * (1 + (0.5 * 1));

    expect(ZzzMath.computeDefMult(i)).toBeCloseTo(defMult, 10);
    expect(StandardCalculator.compute(i).expected).toBeCloseTo(expected, 10);
  });

  it('treats anomaly damage as its own multiplier and excludes skill dmg bucket', () => {
    const i = makeInputs();
    i.mode = 'anomaly';
    const anom = AnomalyCalculator.compute(i);
    const baseDmgBucketsWithoutSkill = 20 + 30 + 10;
    const expectedPerTick = 1000 * 0.5 * 1.2 * 2 * (1 + baseDmgBucketsWithoutSkill / 100) * 1.25 * ZzzMath.computeDefMult(i) * ZzzMath.computeResMult(i) * ZzzMath.computeVulnMult(i) * ZzzMath.computeStunMult(i);

    expect(anom.anomType).toBe('burn');
    expect(anom.tickCount).toBe(20);
    expect(anom.tickIntervalSec).toBe(0.5);
    expect(anom.anomalyPerTick.avg).toBeCloseTo(expectedPerTick, 10);
  });

  it('keeps anomaly crit disabled by default even when base crit stats exist', () => {
    const i = makeInputs();
    i.mode = 'anomaly';
    const anom = AnomalyCalculator.compute(i);
    expect(anom.anomalyPerTick.avg).toBeCloseTo(anom.anomalyPerTick.nonCrit, 10);
    expect(anom.anomalyPerTick.crit).toBeGreaterThan(anom.anomalyPerTick.avg);
  });


  it('clamps effective RES to the community-documented -100% floor', () => {
    const i = makeInputs();
    i.enemy.resByAttr.fire = -20;
    i.enemy.resReductionPct = 90;
    i.agent.resIgnorePct = 50;
    expect(ZzzMath.computeResMult(i)).toBe(2);
  });

  it('lets rupture ignore defense entirely', () => {
    const i = makeInputs();
    i.mode = 'rupture';
    const normal = RuptureCalculator.compute(i).expected;
    i.enemy.def = 5000;
    i.enemy.defReductionPct = 80;
    i.agent.pen.ratioPct = 100;
    i.agent.pen.flat = 9999;
    const changed = RuptureCalculator.compute(i).expected;
    expect(changed).toBeCloseTo(normal, 10);
  });

  it('supports isolated vs conditional marginal analysis with applied deltas', () => {
    const i = makeInputs();
    const customApplied = {
      dmgAttrPct: { kind: 'pct', value: 30 },
      critDmgPct: { kind: 'pct', value: 48 },
    };
    const isolated = MarginalAnalyzer.compute(i, { customApplied });
    i.marginal.mode = 'conditional';
    const conditional = MarginalAnalyzer.compute(i, { customApplied });
    const isoRow = isolated.rows.find((row) => row.key === 'critDmgPct');
    const condRow = conditional.rows.find((row) => row.key === 'critDmgPct');
    expect(isoRow).toBeTruthy();
    expect(condRow).toBeTruthy();
    expect(condRow.gain).not.toBeCloseTo(isoRow.gain, 10);
    expect(condRow.gain).toBeGreaterThan(isoRow.gain);
  });

  it('uses the documented disorder timing tables for removed anomalies', () => {
    const i = makeInputs();
    i.mode = 'anomaly';
    i.agent.anomaly.disorderPrevType = 'shock';
    i.agent.anomaly.disorderTimePassedSec = 3.2;
    const anom = AnomalyCalculator.compute(i);
    const disorderMultPct = 450 + (Math.floor(10 - 3.2) * 125);
    const expected = 1000 * (disorderMultPct / 100) * 1.2 * 2 * (1 + (20 + 30 + 10) / 100) * 1.1 * ZzzMath.computeDefMult(i) * ZzzMath.computeResMult(i) * ZzzMath.computeVulnMult(i) * ZzzMath.computeStunMult(i);
    expect(anom.disorder.avg).toBeCloseTo(expected, 10);
  });

  it('preview anomaly output currently includes standard expected hit plus anomaly proc damage', () => {
    const i = makeInputs();
    i.mode = 'anomaly';
    const preview = Preview.compute(i);
    const std = StandardCalculator.compute(i);
    const anom = AnomalyCalculator.compute(i);
    expect(preview.output).toBeCloseTo(std.expected + anom.anomalyPerProc.avg, 10);
  });
});
