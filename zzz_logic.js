export const AppConfig = {
  SHOW_DISORDER_UI: false,
};

export class MathUtil {
  static clamp(x, a, b) {
    const n = Number(x);
    if (!Number.isFinite(n)) return a;
    return Math.max(a, Math.min(b, n));
  }

  static pctToMult(pct) {
    const n = Number(pct) || 0;
    return 1 + (n / 100);
  }
}

export class ZzzMath {
  static LEVEL_FACTOR_TABLE = {
    1: 50, 2: 54, 3: 58, 4: 62, 5: 66, 6: 71, 7: 76, 8: 82, 9: 88, 10: 94,
    11: 100, 12: 107, 13: 114, 14: 121, 15: 129, 16: 137, 17: 145, 18: 153, 19: 162, 20: 172,
    21: 181, 22: 191, 23: 201, 24: 211, 25: 222, 26: 233, 27: 245, 28: 256, 29: 268, 30: 281,
    31: 293, 32: 306, 33: 319, 34: 333, 35: 347, 36: 361, 37: 375, 38: 390, 39: 405, 40: 421,
    41: 436, 42: 452, 43: 469, 44: 485, 45: 502, 46: 519, 47: 537, 48: 555, 49: 573, 50: 592,
    51: 610, 52: 629, 53: 649, 54: 669, 55: 689, 56: 709, 57: 730, 58: 751, 59: 772, 60: 794,
  };

  static levelFactor(level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    if (lv >= 60) return 794;
    return ZzzMath.LEVEL_FACTOR_TABLE[lv] ?? (lv + 100);
  }

  static resPctForAttr(i) {
    const specific = i.enemy.resByAttr[i.agent.attribute];
    if (specific !== null && specific !== undefined && Number.isFinite(specific)) return specific;
    return 0;
  }

  static computeResMult(i) {
    const baseRes = ZzzMath.resPctForAttr(i);
    const effResRaw = baseRes - (Number(i.enemy.resReductionPct) || 0) - (Number(i.agent.resIgnorePct) || 0);
    const effRes = Math.max(-100, effResRaw);
    return 1 - (effRes / 100);
  }

  static computeVulnMult(i) {
    return MathUtil.pctToMult((Number(i.enemy.dmgTakenPct) || 0) + (Number(i.enemy.dmgTakenOtherPct) || 0));
  }

  static computeDefMult(i) {
    const k = ZzzMath.levelFactor(i.agent.level);
    let def = Math.max(0, Number(i.enemy.def) || 0);
    const defPctDown = MathUtil.clamp((Number(i.enemy.defReductionPct || 0) + Number(i.agent.defIgnorePct || 0)) / 100, 0, 1);
    def = def * (1 - defPctDown);
    const ratio = (Number(i.agent.pen.ratioPct) || 0) / 100;
    def = def * (1 - ratio);
    const pen = Math.max(0, Number(i.agent.pen.flat) || 0);
    def = Math.max(0, def - pen);
    return k / (k + def);
  }

  static computeStunMult(i) {
    return i.enemy.isStunned ? (((Number(i.enemy.stunPct) || 0) / 100) || 1) : 1;
  }

  static dmgPctTotal(i, includeSkillType = true) {
    const b = i.agent.dmgBuckets;
    let total = (Number(b.generic) || 0) + (Number(b.attribute) || 0) + (Number(b.other) || 0);
    if (includeSkillType) total += (Number(b.skillType) || 0);
    return total;
  }
}

export class StandardCalculator {
  static compute(i) {
    const atk = Number(i.agent.atk) || 0;
    const skill = (Number(i.agent.skillMultPct) || 0) / 100;
    const dmgMult = MathUtil.pctToMult(ZzzMath.dmgPctTotal(i, true));
    const defMult = ZzzMath.computeDefMult(i);
    const resMult = ZzzMath.computeResMult(i);
    const vuln = ZzzMath.computeVulnMult(i);
    const stunMult = ZzzMath.computeStunMult(i);
    const base = atk * skill * dmgMult * defMult * resMult * vuln * stunMult;
    const nonCrit = base;
    const crit = base * (1 + (Number(i.agent.crit.dmg) || 0));
    const cr = MathUtil.clamp(Number(i.agent.crit.rate) || 0, 0, 1);
    const expected = nonCrit * (1 - cr) + crit * cr;
    return { nonCrit, crit, expected };
  }
}

export class AnomalyCalculator {
  static ANOM_META = {
    assault:    { label: 'Assault', kind: 'single', instances: 1, intervalSec: 0, perInstanceMultPct: 713.0 },
    shatter:    { label: 'Shatter', kind: 'single', instances: 1, intervalSec: 0, perInstanceMultPct: 500.0 },
    burn:       { label: 'Burn', kind: 'dot', instances: 20, intervalSec: 0.5, perInstanceMultPct: 50.0 },
    shock:      { label: 'Shock', kind: 'dot', instances: 10, intervalSec: 1.0, perInstanceMultPct: 125.0 },
    corruption: { label: 'Corruption', kind: 'dot', instances: 20, intervalSec: 0.5, perInstanceMultPct: 62.5 },
  };

  static ANOM_FROM_ATTR = {
    physical: 'assault',
    fire: 'burn',
    electric: 'shock',
    ice: 'shatter',
    ether: 'corruption',
  };

  static anomalyLevelMult(level) {
    const lv = MathUtil.clamp(Math.floor(level ?? 1), 1, 60);
    const raw = 1 + (lv - 1) / 59;
    return Math.floor(raw * 10000) / 10000;
  }

  static anomalyProfMult(prof) {
    return Math.max(0, (Number(prof) || 0) * 0.01);
  }

  static inferType(i) {
    const t = i.agent.anomaly.type;
    if (t && t !== 'auto') return t;
    return AnomalyCalculator.ANOM_FROM_ATTR[i.agent.attribute] ?? 'assault';
  }

  static inferPrevType(i, currentType) {
    const v = i.agent.anomaly.disorderPrevType;
    return (v && v !== 'auto') ? v : currentType;
  }

  static compute(i) {
    const anomType = AnomalyCalculator.inferType(i);
    const meta = AnomalyCalculator.ANOM_META[anomType] ?? AnomalyCalculator.ANOM_META.assault;
    const ticks = Math.max(1, Math.floor(i.agent.anomaly.tickCountOverride ?? meta.instances));
    const intervalSec = Math.max(0, Number(i.agent.anomaly.tickIntervalSecOverride ?? meta.intervalSec));
    const durationSec = (meta.kind === 'dot') ? (ticks * intervalSec) : 0;
    const atk = Number(i.agent.atk) || 0;
    const profMult = AnomalyCalculator.anomalyProfMult(i.agent.anomaly.prof);
    const lvMult = AnomalyCalculator.anomalyLevelMult(i.agent.level);
    const dmgPctBase = ZzzMath.dmgPctTotal(i, false);
    const stdBonusMult = MathUtil.pctToMult(dmgPctBase);
    const anomalySpecialMult = MathUtil.pctToMult(Number(i.agent.anomaly.dmgPct) || 0);
    const disorderSpecialMult = MathUtil.pctToMult(Number(i.agent.anomaly.disorderPct) || 0);
    const defMult = ZzzMath.computeDefMult(i);
    const resMult = ZzzMath.computeResMult(i);
    const vuln = ZzzMath.computeVulnMult(i);
    const stunMult = ZzzMath.computeStunMult(i);
    const perInstBase = atk * (meta.perInstanceMultPct / 100);
    const perInstNonCrit = perInstBase * profMult * lvMult * stdBonusMult * anomalySpecialMult * defMult * resMult * vuln * stunMult;
    const critEnabled = !!i.agent.anomaly.allowCrit;
    const crPct = i.agent.anomaly.critRatePctOverride;
    const cdPct = i.agent.anomaly.critDmgPctOverride;
    const critRate = (crPct === null) ? i.agent.crit.rate : MathUtil.clamp(crPct / 100, 0, 1);
    const critDmg = (cdPct === null) ? i.agent.crit.dmg : Math.max(0, cdPct / 100);
    const cr = MathUtil.clamp(Number(critRate) || 0, 0, 1);
    const perInstCrit = perInstNonCrit * (1 + (Number(critDmg) || 0));
    const perInstAvg = critEnabled ? (perInstNonCrit * (1 - cr) + perInstCrit * cr) : perInstNonCrit;
    const anomalyPerTick = { nonCrit: perInstNonCrit, crit: perInstCrit, avg: perInstAvg };
    const anomalyPerProc = { nonCrit: perInstNonCrit * ticks, crit: perInstCrit * ticks, avg: perInstAvg * ticks };

    const prevType = AnomalyCalculator.inferPrevType(i, anomType);
    const t = MathUtil.clamp(Number(i.agent.anomaly.disorderTimePassedSec || 0), 0, 10);
    let disorderMultPct = 450;
    if (prevType === 'burn') disorderMultPct = 450 + Math.floor((10 - t) * 2) * 50;
    else if (prevType === 'shock') disorderMultPct = 450 + Math.floor(10 - t) * 125;
    else if (prevType === 'corruption') disorderMultPct = 450 + Math.floor((10 - t) * 2) * 62.5;
    else if (prevType === 'shatter' || prevType === 'assault') disorderMultPct = 450 + Math.floor(10 - t) * 7.5;

    const disorderNonCrit = atk * (disorderMultPct / 100) * profMult * lvMult * stdBonusMult * disorderSpecialMult * defMult * resMult * vuln * stunMult;
    const disorderCrit = disorderNonCrit * (1 + (Number(critDmg) || 0));
    const disorderAvg = critEnabled ? (disorderNonCrit * (1 - cr) + disorderCrit * cr) : disorderNonCrit;

    return {
      anomType,
      kind: meta.kind,
      tickCount: ticks,
      tickIntervalSec: intervalSec,
      durationSec,
      anomalyPerTick,
      anomalyPerProc,
      disorderPrevType: prevType,
      disorderTimePassedSec: t,
      disorder: { nonCrit: disorderNonCrit, crit: disorderCrit, avg: disorderAvg },
      combinedAvg: anomalyPerProc.avg + disorderAvg,
    };
  }
}

export class RuptureCalculator {
  static compute(i) {
    const sheerForce = Math.max(0, Number(i.agent.rupture.sheerForce) || 0);
    const skill = (Number(i.agent.skillMultPct) || 0) / 100;
    const dmgMult = MathUtil.pctToMult(ZzzMath.dmgPctTotal(i, true));
    const sheerMult = MathUtil.pctToMult(Number(i.agent.rupture.sheerDmgBonusPct) || 0);
    const resMult = ZzzMath.computeResMult(i);
    const vuln = ZzzMath.computeVulnMult(i);
    const stunMult = ZzzMath.computeStunMult(i);
    const base = sheerForce * skill * dmgMult * sheerMult * resMult * vuln * stunMult;
    const nonCrit = base;
    const crit = base * (1 + (Number(i.agent.crit.dmg) || 0));
    const cr = MathUtil.clamp(Number(i.agent.crit.rate) || 0, 0, 1);
    const expected = nonCrit * (1 - cr) + crit * cr;
    return { nonCrit, crit, expected };
  }
}

export class Preview {
  static compute(i) {
    const std = StandardCalculator.compute(i);
    const anom = AnomalyCalculator.compute(i);
    const rup = RuptureCalculator.compute(i);

    if (i.mode === 'standard') return { mode: i.mode, output: std.expected, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: std.expected, anom: null };
    if (i.mode === 'anomaly') {
      const disorderPart = AppConfig.SHOW_DISORDER_UI ? (anom.disorder?.avg ?? 0) : 0;
      const combined = std.expected + (anom.anomalyPerProc?.avg ?? 0) + disorderPart;
      return { mode: i.mode, output: combined, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: combined, anom };
    }
    if (i.mode === 'rupture') return { mode: i.mode, output: rup.expected, output_noncrit: rup.nonCrit, output_crit: rup.crit, output_expected: rup.expected, anom: null };
    return { mode: i.mode, output: std.expected, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: std.expected, anom: null };
  }
}

export class StatMeta {
  static _LIST = [
    { key: 'atk', labelKey: 'label.atk', label: 'ATK', kind: 'flat' },
    { key: 'dmgGenericPct', labelKey: 'label.genericDmg', label: 'Generic DMG', kind: 'pct' },
    { key: 'dmgAttrPct', labelKey: 'label.attributeDmg', label: 'Attribute DMG', kind: 'pct' },
    { key: 'dmgSkillTypePct', labelKey: 'label.skillDmg', label: 'Skill DMG', kind: 'pct' },
    { key: 'dmgOtherPct', labelKey: 'label.otherDmg', label: 'Other DMG', kind: 'pct' },
    { key: 'critRatePct', labelKey: 'label.critRate', label: 'Crit Rate', kind: 'pct' },
    { key: 'critDmgPct', labelKey: 'label.critDmg', label: 'Crit DMG', kind: 'pct' },
    { key: 'penRatioPct', labelKey: 'label.penRatio', label: 'PEN Ratio', kind: 'pct' },
    { key: 'defReductionPct', labelKey: 'label.defReduction', label: 'DEF Reduction', kind: 'pct' },
    { key: 'defIgnorePct', labelKey: 'label.defIgnorePct', label: 'DEF Ignore', kind: 'pct' },
    { key: 'resReductionPct', labelKey: 'label.resReduction', label: 'RES Reduction', kind: 'pct' },
    { key: 'resIgnorePct', labelKey: 'label.resIgnore', label: 'RES Ignore', kind: 'pct' },
    { key: 'dmgTakenPct', labelKey: 'label.dmgTaken', label: 'DMG Taken', kind: 'pct' },
    { key: 'dmgTakenOtherPct', labelKey: 'label.otherDmgTaken', label: 'Other DMG Taken', kind: 'pct' },
    { key: 'stunPct', labelKey: 'label.stunnedMultiplier', label: 'Stunned Multiplier', kind: 'pct' },
    { key: 'anomProf', labelKey: 'label.anomProf', label: 'Anomaly Proficiency', kind: 'flat' },
    { key: 'anomDmgPct', labelKey: 'label.anomalyDmg', label: 'Anomaly DMG', kind: 'pct' },
    { key: 'disorderDmgPct', labelKey: 'label.disorderDmg', label: 'Disorder DMG', kind: 'pct' },
    { key: 'sheerForce', labelKey: 'label.sheerForce', label: 'Sheer Force', kind: 'flat' },
    { key: 'sheerDmgBonusPct', labelKey: 'label.sheerDmgBonus', label: 'Sheer DMG Bonus', kind: 'pct' },
  ];

  static _MAP = (() => {
    const m = new Map();
    for (const x of StatMeta._LIST) m.set(x.key, x);
    return m;
  })();

  static list() { return StatMeta._LIST; }
  static byKey(key) { return StatMeta._MAP.get(key) ?? null; }
}

export class MarginalAnalyzer {
  static DEFAULTS_BY_KEY = {
    atk: { kind: 'flat', value: 0 },
    dmgGenericPct: { kind: 'pct', value: 0 },
    dmgAttrPct: { kind: 'pct', value: 30 },
    dmgSkillTypePct: { kind: 'pct', value: 0 },
    dmgOtherPct: { kind: 'pct', value: 30 },
    critRatePct: { kind: 'pct', value: 24 },
    critDmgPct: { kind: 'pct', value: 48 },
    penRatioPct: { kind: 'pct', value: 24 },
    penFlat: { kind: 'flat', value: 0 },
    defReductionPct: { kind: 'pct', value: 0 },
    defIgnorePct: { kind: 'pct', value: 0 },
    resReductionPct: { kind: 'pct', value: 0 },
    resIgnorePct: { kind: 'pct', value: 0 },
    dmgTakenPct: { kind: 'pct', value: 0 },
    dmgTakenOtherPct: { kind: 'pct', value: 0 },
    stunPct: { kind: 'pct', value: 30 },
    anomProf: { kind: 'flat', value: 9 },
    anomDmgPct: { kind: 'pct', value: 0 },
    disorderDmgPct: { kind: 'pct', value: 5 },
    sheerForce: { kind: 'flat', value: 0 },
    sheerDmgBonusPct: { kind: 'pct', value: 0 },
  };

  static cloneInputs(i) {
    if (typeof structuredClone === 'function') return structuredClone(i);
    return JSON.parse(JSON.stringify(i));
  }

  static originalDisplay(i, key) {
    switch (key) {
      case 'atk': return { kind: 'flat', value: i.agent.atk };
      case 'dmgGenericPct': return { kind: 'pct', value: i.agent.dmgBuckets.generic };
      case 'dmgAttrPct': return { kind: 'pct', value: i.agent.dmgBuckets.attribute };
      case 'dmgSkillTypePct': return { kind: 'pct', value: i.agent.dmgBuckets.skillType };
      case 'dmgOtherPct': return { kind: 'pct', value: i.agent.dmgBuckets.other };
      case 'critRatePct': return { kind: 'pct', value: i.agent.crit.rate * 100 };
      case 'critDmgPct': return { kind: 'pct', value: i.agent.crit.dmg * 100 };
      case 'penRatioPct': return { kind: 'pct', value: i.agent.pen.ratioPct };
      case 'penFlat': return { kind: 'flat', value: i.agent.pen.flat };
      case 'defReductionPct': return { kind: 'pct', value: i.enemy.defReductionPct };
      case 'defIgnorePct': return { kind: 'pct', value: i.agent.defIgnorePct };
      case 'resReductionPct': return { kind: 'pct', value: i.enemy.resReductionPct };
      case 'resIgnorePct': return { kind: 'pct', value: i.agent.resIgnorePct };
      case 'dmgTakenPct': return { kind: 'pct', value: i.enemy.dmgTakenPct };
      case 'dmgTakenOtherPct': return { kind: 'pct', value: i.enemy.dmgTakenOtherPct };
      case 'stunPct': return { kind: 'pct', value: i.enemy.stunPct };
      case 'anomProf': return { kind: 'flat', value: i.agent.anomaly.prof };
      case 'anomDmgPct': return { kind: 'pct', value: i.agent.anomaly.dmgPct };
      case 'disorderDmgPct': return { kind: 'pct', value: i.agent.anomaly.disorderPct };
      case 'sheerForce': return { kind: 'flat', value: i.agent.rupture.sheerForce };
      case 'sheerDmgBonusPct': return { kind: 'pct', value: i.agent.rupture.sheerDmgBonusPct };
      default: return { kind: 'pct', value: 0 };
    }
  }

  static defaultApplied(key) {
    return MarginalAnalyzer.DEFAULTS_BY_KEY[key] ?? { kind: 'pct', value: 5 };
  }

  static resolveDelta(key, override) {
    const expectsFlat = (key === 'atk' || key === 'penFlat' || key === 'sheerForce' || key === 'anomProf');
    if (override && Number.isFinite(override.value)) {
      if (expectsFlat && override.kind === 'flat') return override;
      if (!expectsFlat && override.kind === 'pct') return override;
    }
    return MarginalAnalyzer.defaultApplied(key);
  }

  static applyDeltaInPlace(i, key, d) {
    const dp = (d.kind === 'pct') ? d.value : 0;
    const df = (d.kind === 'flat') ? d.value : 0;
    switch (key) {
      case 'atk': { const prev = i.agent.atk; i.agent.atk = prev + df; return () => { i.agent.atk = prev; }; }
      case 'dmgGenericPct': { const prev = i.agent.dmgBuckets.generic; i.agent.dmgBuckets.generic = prev + dp; return () => { i.agent.dmgBuckets.generic = prev; }; }
      case 'dmgAttrPct': { const prev = i.agent.dmgBuckets.attribute; i.agent.dmgBuckets.attribute = prev + dp; return () => { i.agent.dmgBuckets.attribute = prev; }; }
      case 'dmgSkillTypePct': { const prev = i.agent.dmgBuckets.skillType; i.agent.dmgBuckets.skillType = prev + dp; return () => { i.agent.dmgBuckets.skillType = prev; }; }
      case 'dmgOtherPct': { const prev = i.agent.dmgBuckets.other; i.agent.dmgBuckets.other = prev + dp; return () => { i.agent.dmgBuckets.other = prev; }; }
      case 'critRatePct': { const prev = i.agent.crit.rate; i.agent.crit.rate = MathUtil.clamp(prev + (dp / 100), 0, 1); return () => { i.agent.crit.rate = prev; }; }
      case 'critDmgPct': { const prev = i.agent.crit.dmg; i.agent.crit.dmg = prev + (dp / 100); return () => { i.agent.crit.dmg = prev; }; }
      case 'penRatioPct': { const prev = i.agent.pen.ratioPct; i.agent.pen.ratioPct = prev + dp; return () => { i.agent.pen.ratioPct = prev; }; }
      case 'penFlat': { const prev = i.agent.pen.flat; i.agent.pen.flat = prev + df; return () => { i.agent.pen.flat = prev; }; }
      case 'dmgTakenPct': { const prev = i.enemy.dmgTakenPct; i.enemy.dmgTakenPct = prev + dp; return () => { i.enemy.dmgTakenPct = prev; }; }
      case 'dmgTakenOtherPct': { const prev = i.enemy.dmgTakenOtherPct; i.enemy.dmgTakenOtherPct = prev + dp; return () => { i.enemy.dmgTakenOtherPct = prev; }; }
      case 'stunPct': { const prev = i.enemy.stunPct; i.enemy.stunPct = prev + dp; return () => { i.enemy.stunPct = prev; }; }
      case 'defReductionPct': { const prev = i.enemy.defReductionPct; i.enemy.defReductionPct = prev + dp; return () => { i.enemy.defReductionPct = prev; }; }
      case 'defIgnorePct': { const prev = i.agent.defIgnorePct; i.agent.defIgnorePct = prev + dp; return () => { i.agent.defIgnorePct = prev; }; }
      case 'resReductionPct': { const prev = i.enemy.resReductionPct; i.enemy.resReductionPct = prev + dp; return () => { i.enemy.resReductionPct = prev; }; }
      case 'resIgnorePct': { const prev = i.agent.resIgnorePct; i.agent.resIgnorePct = prev + dp; return () => { i.agent.resIgnorePct = prev; }; }
      case 'anomProf': { const prev = i.agent.anomaly.prof; i.agent.anomaly.prof = Math.max(0, prev + df); return () => { i.agent.anomaly.prof = prev; }; }
      case 'anomDmgPct': { const prev = i.agent.anomaly.dmgPct; i.agent.anomaly.dmgPct = prev + dp; return () => { i.agent.anomaly.dmgPct = prev; }; }
      case 'disorderDmgPct': { const prev = i.agent.anomaly.disorderPct; i.agent.anomaly.disorderPct = prev + dp; return () => { i.agent.anomaly.disorderPct = prev; }; }
      case 'sheerForce': { const prev = i.agent.rupture.sheerForce; i.agent.rupture.sheerForce = prev + df; return () => { i.agent.rupture.sheerForce = prev; }; }
      case 'sheerDmgBonusPct': { const prev = i.agent.rupture.sheerDmgBonusPct; i.agent.rupture.sheerDmgBonusPct = prev + dp; return () => { i.agent.rupture.sheerDmgBonusPct = prev; }; }
      default: return () => {};
    }
  }

  static computePctGain(baseOut, newOut) {
    if (!Number.isFinite(baseOut) || !Number.isFinite(newOut)) return null;
    if (baseOut === 0) return newOut === 0 ? 0 : null;
    return ((newOut - baseOut) / baseOut) * 100;
  }

  static compute(i, options = {}) {
    const preview = options.preview ?? Preview;
    const originalByKey = new Map();
    for (const m of StatMeta.list()) originalByKey.set(m.key, MarginalAnalyzer.originalDisplay(i, m.key));

    const base = preview.compute(i);
    const rows = [];
    const ruptureAllowed = new Set([
      'dmgGenericPct', 'dmgAttrPct', 'dmgSkillTypePct', 'dmgOtherPct', 'critRatePct', 'critDmgPct',
      'resReductionPct', 'resIgnorePct', 'dmgTakenPct', 'dmgTakenOtherPct', 'stunPct', 'sheerForce', 'sheerDmgBonusPct',
    ]);

    const resolvedDeltas = new Map();
    const deltaSource = options.customApplied ?? new Map();
    const getOverride = typeof deltaSource.get === 'function'
      ? (key) => deltaSource.get(key) ?? null
      : (key) => deltaSource[key] ?? null;
    for (const m of StatMeta.list()) resolvedDeltas.set(m.key, MarginalAnalyzer.resolveDelta(m.key, getOverride(m.key)));

    const marginalMode = i.marginal?.mode === 'isolated' ? 'isolated' : 'conditional';

    for (const m of StatMeta.list()) {
      if (i.mode === 'anomaly' && (m.key === 'dmgSkillTypePct' || m.key === 'critRatePct' || m.key === 'critDmgPct')) continue;
      if (i.mode !== 'anomaly' && (m.key === 'anomProf' || m.key === 'anomDmgPct' || m.key === 'disorderDmgPct')) continue;
      if (!AppConfig.SHOW_DISORDER_UI && m.key === 'disorderDmgPct') continue;
      if (i.mode === 'rupture') {
        if (!ruptureAllowed.has(m.key)) continue;
      } else if (m.key === 'sheerForce' || m.key === 'sheerDmgBonusPct') continue;
      if (i.mode === 'standard' && (m.key === 'anomDmgPct' || m.key === 'disorderDmgPct')) continue;

      const applied = resolvedDeltas.get(m.key) ?? MarginalAnalyzer.defaultApplied(m.key);
      const orig = originalByKey.get(m.key) ?? { kind: m.kind, value: 0 };
      const rowBaseInputs = MarginalAnalyzer.cloneInputs(i);
      if (marginalMode === 'conditional') {
        for (const [otherKey, otherDelta] of resolvedDeltas.entries()) {
          if (otherKey === m.key) continue;
          MarginalAnalyzer.applyDeltaInPlace(rowBaseInputs, otherKey, otherDelta);
        }
      }
      const rowBaseOut = preview.compute(rowBaseInputs).output;
      const rowNewInputs = MarginalAnalyzer.cloneInputs(rowBaseInputs);
      MarginalAnalyzer.applyDeltaInPlace(rowNewInputs, m.key, applied);
      const newOut = preview.compute(rowNewInputs).output;
      let shownOut = newOut;
      let gain = newOut - rowBaseOut;
      let pctGain = MarginalAnalyzer.computePctGain(rowBaseOut, newOut);
      if (!Number.isFinite(gain)) gain = 0;
      if (m.key === 'critRatePct') {
        const totalVal = orig.value + (applied?.value ?? 0);
        const cappedTotalVal = MathUtil.clamp(totalVal, 0, 100);
        const cappedOrigVal = MathUtil.clamp(orig.value, 0, 100);
        if (cappedTotalVal <= cappedOrigVal) {
          shownOut = rowBaseOut;
          gain = 0;
          pctGain = 0;
        }
      }
      const translate = typeof options.getLabel === 'function' ? options.getLabel : ((meta) => meta.label);
      const effectiveDisplay = typeof options.effectiveDisplay === 'function'
        ? options.effectiveDisplay
        : ((_, __, rawValue) => ({ primary: rawValue, secondary: '' }));
      const rawTotalVal = orig.value + (applied?.value ?? 0);
      const origDisplay = effectiveDisplay(i, m.key, orig.value);
      const totalDisplay = effectiveDisplay(rowNewInputs, m.key, rawTotalVal);
      rows.push({
        key: m.key,
        label: translate(m),
        applied,
        out2: shownOut,
        gain,
        pctGain,
        efficiency: null,
        origVal: origDisplay.primary,
        origValRaw: orig.value,
        origDisplayNote: origDisplay.secondary,
        totalVal: totalDisplay.primary,
        totalValRaw: rawTotalVal,
        totalDisplayNote: totalDisplay.secondary,
        displayKind: orig.kind,
      });
    }

    let bestPctGain = 0;
    for (const row of rows) if (Number.isFinite(row.pctGain)) bestPctGain = Math.max(bestPctGain, row.pctGain);
    for (const row of rows) if (bestPctGain > 0 && Number.isFinite(row.pctGain)) row.efficiency = (row.pctGain / bestPctGain) * 100;
    return { base, rows, bestPctGain };
  }
}
