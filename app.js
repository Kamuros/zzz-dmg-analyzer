(() => {
  "use strict";
  class Dom {
    /** @param {Document} doc */
    constructor(doc) {
      this.doc = doc;
    }
    /** @param {string} id */
    byId(id) {
      return /** @type {HTMLElement|null} */ (this.doc.getElementById(id));
    }
    /** @param {string} id */
    input(id) {
      return /** @type {HTMLInputElement|null} */ (this.byId(id));
    }
    /** @param {string} id */
    select(id) {
      return /** @type {HTMLSelectElement|null} */ (this.byId(id));
    }
    /** @param {string} id */
    btn(id) {
      return /** @type {HTMLButtonElement|null} */ (this.byId(id));
    }
    /** @param {string} selector */
    qsa(selector) {
      return Array.from(this.doc.querySelectorAll(selector));
    }
    /** @param {HTMLElement} el */
    clear(el) {
      while (el.firstChild) el.removeChild(el.firstChild);
    }
    /** @param {string} tag */
    el(tag) {
      return this.doc.createElement(tag);
    }
    /** @param {HTMLElement} el @param {string} text */
    text(el, text) {
      el.textContent = text;
      return el;
    }
  }
  class MathUtil {
    static clamp(x, a, b) {
      const n = Number(x);
      if (!Number.isFinite(n)) return a;
      return Math.max(a, Math.min(b, n));
    }
    static pctToMult(pct) {
      const n = Number(pct) || 0;
      return 1 + (n / 100);
    }
    static fmt0(x) {
      return Number.isFinite(x) ? x.toFixed(0) : "—";
    }
    static fmt1(x) {
      return Number.isFinite(x) ? x.toFixed(1) : "—";
    }
    // Show 1 decimal only when fractional
    static fmtSmart(x) {
      if (!Number.isFinite(x)) return "—";
      const r = Math.round(x);
      if (Math.abs(x - r) < 1e-9) return String(r);
      return x.toFixed(1);
    }
  }
  class InputParser {
    /** @param {Dom} dom */
    constructor(dom) {
      this.dom = dom;
    }

    numById(id, fallback = 0) {
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return fallback;
      const v = /** @type {any} */ (el).value;
      if (v === "" || v === null || v === undefined) return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    }

    optNumById(id) {
      const el = this.dom.input(id);
      if (!el) return null;
      const v = el.value;
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    strById(id, fallback = "") {
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return fallback;
      const v = /** @type {any} */ (el).value;
      return (v === null || v === undefined) ? fallback : String(v);
    }

    boolSelectById(id) {
      const el = this.dom.select(id);
      if (!el) return false;
      return el.value === "true";
    }

    boolCheckboxById(id) {
      const el = this.dom.input(id);
      return !!el?.checked;
    }
    readAtk() {
      return Math.max(0, this.numById("atk", 0));
    }

    /** @returns {Inputs} */
    read() {
      const mode = this.strById("mode", "standard");

      /** @type {Inputs} */
      const i = Inputs.defaults();

      i.jsonName = (this.strById("jsonName", "").trim());
      i.mode = /** @type {Inputs["mode"]} */ (mode);

      i.agent.level = Math.max(1, Math.floor(this.numById("agentLevel", 60)));
      i.agent.attribute = /** @type {Attribute} */ (this.strById("attribute", "physical"));
      i.agent.atk = Math.max(0, this.readAtk());

      i.agent.crit.rate = MathUtil.clamp(this.numById("critRatePct", 0) / 100, 0, 1);
      i.agent.crit.dmg = Math.max(0, this.numById("critDmgPct", 0) / 100);

      i.agent.dmgBuckets.generic = this.numById("dmgGenericPct", 0);
      i.agent.dmgBuckets.attribute = this.numById("dmgAttrPct", 0);
      i.agent.dmgBuckets.skillType = this.numById("dmgSkillTypePct", 0);

      i.agent.dmgBuckets.other = this.numById("dmgOtherPct", 0);
      i.agent.dmgBuckets.vsStunned = this.numById("dmgVsStunnedPct", 0);

      i.agent.pen.ratioPct = this.numById("penRatioPct", 0);
      i.agent.pen.flat = Math.max(0, this.numById("penFlat", 0));

      i.agent.skillMultPct = Math.max(0, this.numById("skillMultPct", 100));

      // Anomaly
      i.agent.anomaly.type = this.strById("anomType", "auto");
      i.agent.anomaly.prof = Math.max(0, this.numById("anomProf", 0));
      i.agent.anomaly.dmgPct = this.numById("anomDmgPct", 0);
      i.agent.anomaly.disorderPct = this.numById("disorderDmgPct", 0);
      i.agent.anomaly.allowCrit = this.boolCheckboxById("anomAllowCrit");
      i.agent.anomaly.critRatePctOverride = this.optNumById("anomCritRatePct");
      i.agent.anomaly.critDmgPctOverride = this.optNumById("anomCritDmgPct");
      i.agent.anomaly.tickCountOverride = this.optNumById("anomTickCount");
      i.agent.anomaly.tickIntervalSecOverride = this.optNumById("anomTickIntervalSec");
      i.agent.anomaly.disorderPrevType = this.strById("disorderPrevType", "auto");
      i.agent.anomaly.disorderTimePassedSec = Math.max(0, this.numById("disorderTimePassedSec", 0));

      // Rupture
      i.agent.rupture.sheerForce = Math.max(0, this.numById("sheerForce", 0));
      i.agent.rupture.sheerDmgBonusPct = this.numById("sheerDmgBonusPct", 0);

      // Enemy
      i.enemy.level = Math.max(1, Math.floor(this.numById("enemyLevel", 70)));
      i.enemy.def = Math.max(0, this.numById("enemyDef", 0));

      i.enemy.resAllPct = this.numById("enemyResAllPct", 0);
      i.enemy.resByAttr.physical = this.optNumById("enemyResPhysicalPct");
      i.enemy.resByAttr.fire = this.optNumById("enemyResFirePct");
      i.enemy.resByAttr.ice = this.optNumById("enemyResIcePct");
      i.enemy.resByAttr.electric = this.optNumById("enemyResElectricPct");
      i.enemy.resByAttr.ether = this.optNumById("enemyResEtherPct");

      i.enemy.resReductionPct = this.numById("resReductionPct", 0);
      i.enemy.resIgnorePct = this.numById("resIgnorePct", 0);

      i.enemy.defReductionPct = this.numById("defReductionPct", 0);
      i.enemy.defIgnorePct = this.numById("defIgnorePct", 0);

      i.enemy.dmgTakenPct = this.numById("dmgTakenPct", 0);
      i.enemy.dmgTakenStunnedPct = this.numById("dmgTakenStunnedPct", 0);

      i.enemy.isStunned = this.boolSelectById("isStunned");
      i.enemy.stunPct = this.numById("stunPct", 150);

      // Marginal overrides are held in memory only (not in UI inputs)
      i.marginal.customApplied = MarginalAppliedStore.clone();

      return i;
    }
  }
  /**
   * @typedef {"physical"|"fire"|"ice"|"electric"|"ether"} Attribute
   */

  /**
   * @typedef {Object} Inputs
   * @property {string} jsonName
   * @property {"standard"|"anomaly"|"rupture"} mode
   * @property {{
   *   level: number,
   *   attribute: Attribute,
   *   atk: number,
   *   crit: {rate:number, dmg:number},
   *   dmgBuckets: {generic:number, attribute:number, skillType:number, other:number, vsStunned:number},
   *   pen: {ratioPct:number, flat:number},
   *   skillMultPct: number,
   *   anomaly: {
   *     type: string,
   *     prof: number,
   *     dmgPct: number,
   *     disorderPct: number,
   *     tickCountOverride: number|null,
   *     tickIntervalSecOverride: number|null,
   *     allowCrit: boolean,
   *     critRatePctOverride: number|null,
   *     critDmgPctOverride: number|null,
   *     disorderPrevType: string,
   *     disorderTimePassedSec: number
   *   },
   *   rupture: {sheerForce:number, sheerDmgBonusPct:number}
   * }} agent
   * @property {{
   *   level:number,
   *   def:number,
   *   resAllPct:number,
   *   resByAttr: Record<Attribute, number|null>,
   *   resReductionPct:number,
   *   resIgnorePct:number,
   *   defReductionPct:number,
   *   defIgnorePct:number,
   *   dmgTakenPct:number,
   *   dmgTakenStunnedPct:number,
   *   isStunned:boolean,
   *   stunPct:number
   * }} enemy
   * @property {{
   *   customApplied: Record<string, {kind:"pct"|"flat", value:number}>
   * }} marginal
   */

  class Inputs {
    /** @returns {Inputs} */
    static defaults() {
      return {
        jsonName: "",
        mode: "standard",
        agent: {
          level: 60,
          attribute: "physical",
          atk: 0,
          crit: { rate: 0.05, dmg: 0.50 },
          dmgBuckets: { generic: 0, attribute: 0, skillType: 0, other: 0, vsStunned: 0 },
          pen: { ratioPct: 0, flat: 0 },
          skillMultPct: 100,
          anomaly: {
            type: "auto",
            prof: 0,
            dmgPct: 0,
            disorderPct: 0,
            tickCountOverride: null,
            tickIntervalSecOverride: null,
            allowCrit: false,
            critRatePctOverride: null,
            critDmgPctOverride: null,
            disorderPrevType: "auto",
            disorderTimePassedSec: 0,
          },
          rupture: {
            sheerForce: 0,
            sheerDmgBonusPct: 0,
          },
        },
        enemy: {
          level: 70,
          def: 0,
          resAllPct: 0,
          resByAttr: { physical: null, fire: null, ice: null, electric: null, ether: null },
          resReductionPct: 0,
          resIgnorePct: 0,
          defReductionPct: 0,
          defIgnorePct: 0,
          dmgTakenPct: 0,
          dmgTakenStunnedPct: 0,
          isStunned: false,
          stunPct: 150,
        },
        marginal: {
          customApplied: Object.create(null),
        }
      };
    }
  }
  class MarginalAppliedStore {
    /** @type {Record<string, {kind:"pct"|"flat", value:number}>} */
    static _store = Object.create(null);

    static clear() {
      for (const k of Object.keys(MarginalAppliedStore._store)) delete MarginalAppliedStore._store[k];
    }

    /** Safe clone for persistence */
    static clone() {
      const out = {};
      for (const [k, v] of Object.entries(MarginalAppliedStore._store)) {
        if (!v || (v.kind !== "pct" && v.kind !== "flat")) continue;
        const n = Number(v.value);
        if (!Number.isFinite(n)) continue;
        out[k] = { kind: v.kind, value: n };
      }
      return out;
    }

    /** @param {any} data */
    static loadFromData(data) {
      MarginalAppliedStore.clear();
      const src = data?.marginal?.customApplied;
      if (!src || typeof src !== "object") return;
      for (const [k, v] of Object.entries(src)) {
        if (!v || (v.kind !== "pct" && v.kind !== "flat")) continue;
        const n = Number(v.value);
        if (!Number.isFinite(n)) continue;
        // only accept known stat keys
        if (!StatMeta.byKey(k)) continue;
        MarginalAppliedStore._store[k] = { kind: v.kind, value: n };
      }
    }

    /** @param {string} key @param {"pct"|"flat"} kind @param {number} value */
    static set(key, kind, value) {
      if (!StatMeta.byKey(key)) return;
      if (!Number.isFinite(value)) { delete MarginalAppliedStore._store[key]; return; }
      MarginalAppliedStore._store[key] = { kind, value };
    }

    /** @param {string} key */
    static get(key) {
      return MarginalAppliedStore._store[key] ?? null;
    }
  }
  class ZzzMath {
    static LEVEL_FACTOR_TABLE = {
      1: 50, 2: 54, 3: 58, 4: 62, 5: 66, 6: 71, 7: 76, 8: 82, 9: 88, 10: 94,
      11: 100, 12: 107, 13: 114, 14: 121, 15: 129, 16: 137, 17: 145, 18: 153, 19: 162, 20: 172,
      21: 181, 22: 191, 23: 201, 24: 211, 25: 222, 26: 233, 27: 245, 28: 256, 29: 268, 30: 281,
      31: 293, 32: 306, 33: 319, 34: 333, 35: 347, 36: 361, 37: 375, 38: 390, 39: 405, 40: 421,
      41: 436, 42: 452, 43: 469, 44: 485, 45: 502, 46: 519, 47: 537, 48: 555, 49: 573, 50: 592,
      51: 610, 52: 629, 53: 649, 54: 669, 55: 689, 56: 709, 57: 730, 58: 751, 59: 772, 60: 794,
    };

    /** @param {number} level */
    static levelFactor(level) {
      const lv = Math.max(1, Math.floor(Number(level) || 1));
      if (lv >= 60) return 794;
      return ZzzMath.LEVEL_FACTOR_TABLE[lv] ?? (lv + 100);
    }

    /** @param {Inputs} i */
    static resPctForAttr(i) {
      const all = Number(i.enemy.resAllPct ?? 0);
      const specific = i.enemy.resByAttr[i.agent.attribute];
      if (specific !== null && specific !== undefined && Number.isFinite(specific)) return all + specific;
      return all;
    }

    /** @param {Inputs} i */
    static computeResMult(i) {
      const baseRes = ZzzMath.resPctForAttr(i);
      const effRes = baseRes - (Number(i.enemy.resReductionPct) || 0) - (Number(i.enemy.resIgnorePct) || 0);
      return 1 - (effRes / 100);
    }

    /** @param {Inputs} i */
    static computeVulnMult(i) {
      const base = Number(i.enemy.dmgTakenPct || 0);
      const stunnedBonus = i.enemy.isStunned ? Number(i.enemy.dmgTakenStunnedPct || 0) : 0;
      return MathUtil.pctToMult(base + stunnedBonus);
    }

    /** @param {Inputs} i */
    static computeDefMult(i) {
      const k = ZzzMath.levelFactor(i.agent.level);

      // Start with raw DEF
      let def = Math.max(0, Number(i.enemy.def) || 0);

      // DEF shred/ignore as additive % of enemy DEF
      const defPctDown = MathUtil.clamp((Number(i.enemy.defReductionPct || 0) + Number(i.enemy.defIgnorePct || 0)) / 100, 0, 1);
      def = def * (1 - defPctDown);

      // PEN Ratio first
      const ratio = MathUtil.clamp((Number(i.agent.pen.ratioPct) || 0) / 100, 0, 1);
      def = def * (1 - ratio);

      // Flat PEN last
      const pen = Math.max(0, Number(i.agent.pen.flat) || 0);
      def = Math.max(0, def - pen);

      return k / (k + def);
    }

    /** @param {Inputs} i */
    static computeStunMult(i) {
      return i.enemy.isStunned ? ((Number(i.enemy.stunPct) || 0) / 100) : 1;
    }

    /** @param {Inputs} i */
    static dmgPctTotal(i, includeSkillType = true) {
      const b = i.agent.dmgBuckets;
      let total = (Number(b.generic) || 0) + (Number(b.attribute) || 0) + (Number(b.other) || 0);
      if (includeSkillType) total += (Number(b.skillType) || 0);
      if (i.enemy.isStunned) total += (Number(b.vsStunned) || 0);
      return total;
    }
  }
  class StandardCalculator {
    /** @param {Inputs} i */
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

  class AnomalyCalculator {
    static ANOM_META = {
      assault:    { label: "Assault",    kind: "single", instances: 1,  intervalSec: 0,   perInstanceMultPct: 713.0 },
      shatter:    { label: "Shatter",    kind: "single", instances: 1,  intervalSec: 0,   perInstanceMultPct: 500.0 },
      burn:       { label: "Burn",       kind: "dot",    instances: 20, intervalSec: 0.5, perInstanceMultPct: 50.0  },
      shock:      { label: "Shock",      kind: "dot",    instances: 10, intervalSec: 1.0, perInstanceMultPct: 125.0 },
      corruption: { label: "Corruption", kind: "dot",    instances: 20, intervalSec: 0.5, perInstanceMultPct: 62.5  },
    };

    static ANOM_FROM_ATTR = {
      physical: "assault",
      fire: "burn",
      electric: "shock",
      ice: "shatter",
      ether: "corruption",
    };

    /** @param {number} level */
    static anomalyLevelMult(level) {
      const lv = MathUtil.clamp(Math.floor(level ?? 1), 1, 60);
      const raw = 1 + (lv - 1) / 59;
      return Math.floor(raw * 10000) / 10000;
    }

    /** @param {number} prof */
    static anomalyProfMult(prof) {
      return Math.max(0, (Number(prof) || 0) * 0.01);
    }

    /** @param {Inputs} i */
    static inferType(i) {
      const t = i.agent.anomaly.type;
      if (t && t !== "auto") return t;
      return AnomalyCalculator.ANOM_FROM_ATTR[i.agent.attribute] ?? "assault";
    }

    /** @param {Inputs} i @param {string} currentType */
    static inferPrevType(i, currentType) {
      const v = i.agent.anomaly.disorderPrevType;
      return (v && v !== "auto") ? v : currentType;
    }

    /** @param {Inputs} i */
    static compute(i) {
      const anomType = AnomalyCalculator.inferType(i);
      const meta = AnomalyCalculator.ANOM_META[anomType] ?? AnomalyCalculator.ANOM_META.assault;

      const ticks = Math.max(1, Math.floor(i.agent.anomaly.tickCountOverride ?? meta.instances));
      const intervalSec = Math.max(0, Number(i.agent.anomaly.tickIntervalSecOverride ?? meta.intervalSec));
      const durationSec = (meta.kind === "dot") ? (ticks * intervalSec) : 0;

      const atk = Number(i.agent.atk) || 0;
      const profMult = AnomalyCalculator.anomalyProfMult(i.agent.anomaly.prof);
      const lvMult = AnomalyCalculator.anomalyLevelMult(i.agent.level);

      // Anomaly ignores "Skill DMG %" bucket by design (kept consistent with your previous logic)
      const dmgPctBase = ZzzMath.dmgPctTotal(i, false);

      const anomalyBonusMult = MathUtil.pctToMult(dmgPctBase + (Number(i.agent.anomaly.dmgPct) || 0));
      const disorderBonusMult = MathUtil.pctToMult(dmgPctBase + (Number(i.agent.anomaly.disorderPct) || 0));

      const defMult = ZzzMath.computeDefMult(i);
      const resMult = ZzzMath.computeResMult(i);
      const vuln = ZzzMath.computeVulnMult(i);
      const stunMult = ZzzMath.computeStunMult(i);

      const perInstBase = atk * (meta.perInstanceMultPct / 100);
      const perInstNonCrit = perInstBase * profMult * lvMult * anomalyBonusMult * defMult * resMult * vuln * stunMult;

      // Crit special-case toggle only (default anomalies cannot crit)
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

      // Disorder: depends on previous anomaly + time passed
      const prevType = AnomalyCalculator.inferPrevType(i, anomType);
      const t = MathUtil.clamp(Number(i.agent.anomaly.disorderTimePassedSec || 0), 0, 10);

      let disorderMultPct = 450;
      if (prevType === "burn") {
        disorderMultPct = 450 + Math.floor((10 - t) * 2) * 50;
      } else if (prevType === "shock") {
        disorderMultPct = 450 + Math.floor(10 - t) * 125;
      } else if (prevType === "corruption") {
        disorderMultPct = 450 + Math.floor((10 - t) * 2) * 62.5;
      } else if (prevType === "shatter" || prevType === "assault") {
        disorderMultPct = 450 + Math.floor(10 - t) * 7.5;
      }

      const disorderNonCrit = atk * (disorderMultPct / 100) * profMult * lvMult * disorderBonusMult * defMult * resMult * vuln * stunMult;
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

  class RuptureCalculator {
    /** @param {Inputs} i */
    static compute(i) {
      const sheerForce = Math.max(0, Number(i.agent.rupture.sheerForce) || 0);
      const skill = (Number(i.agent.skillMultPct) || 0) / 100;

      const dmgMult = MathUtil.pctToMult(ZzzMath.dmgPctTotal(i, true));
      const sheerMult = MathUtil.pctToMult(Number(i.agent.rupture.sheerDmgBonusPct) || 0);

      const resMult = ZzzMath.computeResMult(i);
      const vuln = ZzzMath.computeVulnMult(i);
      const stunMult = ZzzMath.computeStunMult(i);

      // Rupture ignores DEF entirely
      const base = sheerForce * skill * dmgMult * sheerMult * resMult * vuln * stunMult;

      const nonCrit = base;
      const crit = base * (1 + (Number(i.agent.crit.dmg) || 0));

      const cr = MathUtil.clamp(Number(i.agent.crit.rate) || 0, 0, 1);
      const expected = nonCrit * (1 - cr) + crit * cr;

      return { nonCrit, crit, expected };
    }
  }

  class Preview {
    /** @param {Inputs} i */
    static compute(i) {
      const std = StandardCalculator.compute(i);
      const anom = AnomalyCalculator.compute(i);
      const rup = RuptureCalculator.compute(i);

      if (i.mode === "standard") {
        return { mode: i.mode, output: std.expected, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: std.expected, anom: null };
      }
      if (i.mode === "anomaly") {
        const combined = std.expected + anom.combinedAvg;
        return { mode: i.mode, output: combined, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: combined, anom };
      }
      if (i.mode === "rupture") {
        return { mode: i.mode, output: rup.expected, output_noncrit: rup.nonCrit, output_crit: rup.crit, output_expected: rup.expected, anom: null };
      }
      // fallback
      return { mode: i.mode, output: std.expected, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: std.expected, anom: null };
    }
  }
  class StatMeta {
    static _LIST = [
      { key: "atk", label: "Total ATK", kind: "flat" },

      { key: "dmgGenericPct", label: "Generic DMG", kind: "pct" },
      { key: "dmgAttrPct", label: "Attribute DMG", kind: "pct" },
      { key: "dmgSkillTypePct", label: "Skill DMG", kind: "pct" },

      { key: "critRatePct", label: "Crit Rate", kind: "pct" },
      { key: "critDmgPct", label: "Crit DMG", kind: "pct" },

      { key: "penRatioPct", label: "PEN Ratio", kind: "pct" },
      { key: "penFlat", label: "PEN", kind: "flat" },

      { key: "defReductionPct", label: "DEF Reduction", kind: "pct" },
      { key: "defIgnorePct", label: "DEF Ignore", kind: "pct" },

      { key: "dmgTakenPct", label: "DMG Taken", kind: "pct" },
      { key: "stunPct", label: "Stunned Multiplier", kind: "pct" },

      { key: "anomDmgPct", label: "Anomaly DMG", kind: "pct" },
      { key: "disorderDmgPct", label: "Disorder DMG", kind: "pct" },

      { key: "sheerForce", label: "Sheer Force", kind: "flat" },
      { key: "sheerDmgBonusPct", label: "Sheer DMG Bonus", kind: "pct" },
    ];

    static _MAP = (() => {
      const m = new Map();
      for (const x of StatMeta._LIST) m.set(x.key, x);
      return m;
    })();

    static list() { return StatMeta._LIST; }

    /** @param {string} key */
    static byKey(key) { return StatMeta._MAP.get(key) ?? null; }
  }

  class MarginalAnalyzer {
    static DEFAULT_DELTA = { pct: 0, atk: 0, penFlat: 0, sheerForce: 0 };

    /** @param {Inputs} i @param {string} key */
    static originalDisplay(i, key) {
      switch (key) {
        case "atk": return { kind: "flat", value: i.agent.atk };

        case "dmgGenericPct": return { kind: "pct", value: i.agent.dmgBuckets.generic };
        case "dmgAttrPct": return { kind: "pct", value: i.agent.dmgBuckets.attribute };
        case "dmgSkillTypePct": return { kind: "pct", value: i.agent.dmgBuckets.skillType };

        case "critRatePct": return { kind: "pct", value: i.agent.crit.rate * 100 };
        case "critDmgPct": return { kind: "pct", value: i.agent.crit.dmg * 100 };

        case "penRatioPct": return { kind: "pct", value: i.agent.pen.ratioPct };
        case "penFlat": return { kind: "flat", value: i.agent.pen.flat };

        case "defReductionPct": return { kind: "pct", value: i.enemy.defReductionPct };
        case "defIgnorePct": return { kind: "pct", value: i.enemy.defIgnorePct };

        case "dmgTakenPct": return { kind: "pct", value: i.enemy.dmgTakenPct };
        case "stunPct": return { kind: "pct", value: i.enemy.stunPct };

        case "anomDmgPct": return { kind: "pct", value: i.agent.anomaly.dmgPct };
        case "disorderDmgPct": return { kind: "pct", value: i.agent.anomaly.disorderPct };

        case "sheerForce": return { kind: "flat", value: i.agent.rupture.sheerForce };
        case "sheerDmgBonusPct": return { kind: "pct", value: i.agent.rupture.sheerDmgBonusPct };

        default: return { kind: "pct", value: 0 };
      }
    }

    /** @param {string} key */
    static defaultApplied(key) {
      if (key === "atk") return { kind: "flat", value: MarginalAnalyzer.DEFAULT_DELTA.atk };
      if (key === "penFlat") return { kind: "flat", value: MarginalAnalyzer.DEFAULT_DELTA.penFlat };
      if (key === "sheerForce") return { kind: "flat", value: MarginalAnalyzer.DEFAULT_DELTA.sheerForce };
      return { kind: "pct", value: MarginalAnalyzer.DEFAULT_DELTA.pct };
    }

    /** @param {string} key @param {{kind:"pct"|"flat",value:number}|null} override */
    static resolveDelta(key, override) {
      const expectsFlat = (key === "atk" || key === "penFlat" || key === "sheerForce");
      if (override && Number.isFinite(override.value)) {
        if (expectsFlat && override.kind === "flat") return override;
        if (!expectsFlat && override.kind === "pct") return override;
      }
      return MarginalAnalyzer.defaultApplied(key);
    }

    /** @param {Inputs} i @param {string} key @param {{kind:"pct"|"flat",value:number}} d */
    static applyDeltaInPlace(i, key, d) {
      const dp = (d.kind === "pct") ? d.value : 0;
      const df = (d.kind === "flat") ? d.value : 0;

      switch (key) {
        case "atk": {
          const prev = i.agent.atk;
          i.agent.atk = prev + df;
          return () => { i.agent.atk = prev; };
        }

        case "dmgGenericPct": {
          const prev = i.agent.dmgBuckets.generic;
          i.agent.dmgBuckets.generic = prev + dp;
          return () => { i.agent.dmgBuckets.generic = prev; };
        }
        case "dmgAttrPct": {
          const prev = i.agent.dmgBuckets.attribute;
          i.agent.dmgBuckets.attribute = prev + dp;
          return () => { i.agent.dmgBuckets.attribute = prev; };
        }
        case "dmgSkillTypePct": {
          const prev = i.agent.dmgBuckets.skillType;
          i.agent.dmgBuckets.skillType = prev + dp;
          return () => { i.agent.dmgBuckets.skillType = prev; };
        }

        case "critRatePct": {
          const prev = i.agent.crit.rate;
          i.agent.crit.rate = MathUtil.clamp(prev + (dp / 100), 0, 1);
          return () => { i.agent.crit.rate = prev; };
        }
        case "critDmgPct": {
          const prev = i.agent.crit.dmg;
          i.agent.crit.dmg = prev + (dp / 100);
          return () => { i.agent.crit.dmg = prev; };
        }

        case "penRatioPct": {
          const prev = i.agent.pen.ratioPct;
          i.agent.pen.ratioPct = prev + dp;
          return () => { i.agent.pen.ratioPct = prev; };
        }
        case "penFlat": {
          const prev = i.agent.pen.flat;
          i.agent.pen.flat = prev + df;
          return () => { i.agent.pen.flat = prev; };
        }

        case "dmgTakenPct": {
          const prev = i.enemy.dmgTakenPct;
          i.enemy.dmgTakenPct = prev + dp;
          return () => { i.enemy.dmgTakenPct = prev; };
        }
        case "stunPct": {
          const prev = i.enemy.stunPct;
          i.enemy.stunPct = prev + dp;
          return () => { i.enemy.stunPct = prev; };
        }

        case "defReductionPct": {
          const prev = i.enemy.defReductionPct;
          i.enemy.defReductionPct = prev + dp;
          return () => { i.enemy.defReductionPct = prev; };
        }
        case "defIgnorePct": {
          const prev = i.enemy.defIgnorePct;
          i.enemy.defIgnorePct = prev + dp;
          return () => { i.enemy.defIgnorePct = prev; };
        }

        case "anomDmgPct": {
          const prev = i.agent.anomaly.dmgPct;
          i.agent.anomaly.dmgPct = prev + dp;
          return () => { i.agent.anomaly.dmgPct = prev; };
        }
        case "disorderDmgPct": {
          const prev = i.agent.anomaly.disorderPct;
          i.agent.anomaly.disorderPct = prev + dp;
          return () => { i.agent.anomaly.disorderPct = prev; };
        }

        case "sheerForce": {
          const prev = i.agent.rupture.sheerForce;
          i.agent.rupture.sheerForce = prev + df;
          return () => { i.agent.rupture.sheerForce = prev; };
        }
        case "sheerDmgBonusPct": {
          const prev = i.agent.rupture.sheerDmgBonusPct;
          i.agent.rupture.sheerDmgBonusPct = prev + dp;
          return () => { i.agent.rupture.sheerDmgBonusPct = prev; };
        }
      }
      return () => {};
    }

    /** @param {Inputs} i */
    static compute(i) {
      const base = Preview.compute(i);
      const baseOut = base.output;

      const rows = [];
      const ruptureAllowed = new Set([
        "dmgGenericPct","dmgAttrPct","dmgSkillTypePct","critRatePct","critDmgPct",
        "dmgTakenPct","stunPct","sheerForce","sheerDmgBonusPct"
      ]);

      for (const m of StatMeta.list()) {
        if (i.mode === "anomaly" && (m.key === "dmgSkillTypePct" || m.key === "critRatePct" || m.key === "critDmgPct")) continue;

        if (i.mode === "rupture") {
          if (!ruptureAllowed.has(m.key)) continue;
        } else {
          if (m.key === "sheerForce" || m.key === "sheerDmgBonusPct") continue;
        }

        if (i.mode === "standard" && (m.key === "anomDmgPct" || m.key === "disorderDmgPct")) continue;

        const override = MarginalAppliedStore.get(m.key);
        const applied = MarginalAnalyzer.resolveDelta(m.key, override);

        const revert = MarginalAnalyzer.applyDeltaInPlace(i, m.key, applied);
        const out2 = Preview.compute(i).output;
        revert();

        const gain = out2 - baseOut;
        const pctGain = baseOut !== 0 ? (gain / baseOut) * 100 : 0;

        const orig = MarginalAnalyzer.originalDisplay(i, m.key);
        let totalVal = orig.value + (applied?.value ?? 0);
        if (m.key === "critRatePct") totalVal = MathUtil.clamp(totalVal, 0, 100);

        rows.push({
          key: m.key,
          label: m.label,
          applied,
          out2,
          gain,
          pctGain,
          origVal: orig.value,
          totalVal,
          displayKind: orig.kind,
        });
      }

      rows.sort((a, b) => b.pctGain - a.pctGain);
      return { base, rows };
    }
  }

  class StorageManager {
    static SAVE_KEY = "zzz_calc_save_v3";

    /** @returns {any|null} */
    static getSaved() {
      try {
        const raw = localStorage.getItem(StorageManager.SAVE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
      return null;
    }

    /** @param {any} data */
    static setSaved(data) {
      localStorage.setItem(StorageManager.SAVE_KEY, JSON.stringify(data));
    }

    /** @param {string} name */
    static safeFileName(name) {
      return (name || "zzz_build")
        .replace(/[^a-z0-9 _\-]+/gi, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 60) || "zzz_build";
    }

    /** @param {File} file @param {(data:any)=>void} onData @param {(msg:string)=>void} onError */
    static importJsonFile(file, onData, onError) {
      // Basic DoS guard: reject very large JSON files
      const MAX_BYTES = 1_000_000; // 1MB
      if (file.size > MAX_BYTES) {
        onError("JSON file is too large.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || "");
          const data = JSON.parse(text);
          onData(data);
        } catch {
          onError("Invalid JSON.");
        }
      };
      reader.onerror = () => onError("Failed to read file.");
      reader.readAsText(file);
    }

    /** @param {any} data */
    static exportJson(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${StorageManager.safeFileName(data.jsonName)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    }
  }
  class Renderer {
    /** @param {Dom} dom */
    constructor(dom) {
      this.dom = dom;
      this.kpi = dom.byId("kpi");
      this.marginalBody = dom.byId("marginalBody");
    }

    applyModeVisibility(mode) {
      const showAnom = (mode === "anomaly");
      const showRupture = (mode === "rupture");

      this.dom.byId("anomalyHeader")?.classList.toggle("hidden", !showAnom);
      this.dom.byId("anomalyCard")?.classList.toggle("hidden", !showAnom);

      this.dom.byId("ruptureHeader")?.classList.toggle("hidden", !showRupture);
      this.dom.byId("ruptureCard")?.classList.toggle("hidden", !showRupture);
    }

    /** @param {{t:string, v:string}[]} items */
    renderKpi(items) {
      if (!this.kpi) return;
      this.dom.clear(this.kpi);

      for (const item of items) {
        const box = this.dom.el("div");
        box.className = "box";

        const t = this.dom.el("div");
        t.className = "t";
        t.textContent = item.t;

        const v = this.dom.el("div");
        v.className = "v";
        v.textContent = item.v;

        box.appendChild(t);
        box.appendChild(v);
        this.kpi.appendChild(box);
      }
    }

    /** @param {Inputs} i @param {ReturnType<typeof MarginalAnalyzer.compute>} marginal */
    renderMarginalTable(i, marginal) {
      if (!this.marginalBody) return;
      this.dom.clear(this.marginalBody);

      for (const r of marginal.rows) {
        const tr = this.dom.el("tr");

        const tdLabel = this.dom.el("td");
        tdLabel.textContent = r.label;

        const tdOrig = this.dom.el("td");
        tdOrig.appendChild(this._statCell(r.origVal, r.displayKind));

        const tdApplied = this.dom.el("td");
        tdApplied.appendChild(this._appliedInputCell(r));

        const tdSum = this.dom.el("td");
        tdSum.appendChild(this._statCell(r.totalVal, r.displayKind));

        const tdOut = this.dom.el("td");
        tdOut.textContent = MathUtil.fmt0(r.out2);

        const tdGain = this.dom.el("td");
        tdGain.textContent = MathUtil.fmt0(r.gain);

        const tdPct = this.dom.el("td");
        tdPct.textContent = `${MathUtil.fmtSmart(r.pctGain)}%`;

        tr.appendChild(tdLabel);
        tr.appendChild(tdOrig);
        tr.appendChild(tdApplied);
        tr.appendChild(tdSum);
        tr.appendChild(tdOut);
        tr.appendChild(tdGain);
        tr.appendChild(tdPct);

        this.marginalBody.appendChild(tr);
      }
    }

    _statCell(value, displayKind) {
      const wrap = this.dom.el("div");
      wrap.style.display = "flex";
      wrap.style.gap = "8px";
      wrap.style.alignItems = "center";

      const a = this.dom.el("span");
      a.className = "muted";
      a.textContent = MathUtil.fmtSmart(value);

      const b = this.dom.el("span");
      b.className = "muted";
      b.textContent = (displayKind === "pct") ? "%" : "";

      wrap.appendChild(a);
      wrap.appendChild(b);
      return wrap;
    }

    _appliedInputCell(row) {
      const kind = row.applied?.kind ?? "pct";
      const val = row.applied?.value ?? 0;

      const wrap = this.dom.el("div");
      wrap.style.display = "flex";
      wrap.style.gap = "8px";
      wrap.style.alignItems = "center";

      const input = this.dom.el("input");
      input.className = "appliedDelta";
      input.type = "number";
      input.style.width = "110px";
      input.style.padding = "6px 8px";
      input.style.borderRadius = "10px";
      input.step = (kind === "flat") ? "1" : "0.1";
      input.value = String(val);

      input.dataset.key = row.key;
      input.dataset.kind = kind;

      const unit = this.dom.el("span");
      unit.className = "muted";
      unit.textContent = (kind === "pct") ? "%" : "";

      wrap.appendChild(input);
      wrap.appendChild(unit);
      return wrap;
    }
  }
  class UiApplier {
    /** @param {Dom} dom */
    constructor(dom) {
      this.dom = dom;
    }

    /** @param {any} data */
    applyImportedData(data) {
      // Restore per-row marginal applied deltas
      MarginalAppliedStore.loadFromData(data);

      // jsonName + mode
      const jsonNameEl = this.dom.input("jsonName");
      if (jsonNameEl) jsonNameEl.value = String(data?.jsonName ?? "");

      const mode = (data?.mode ?? "standard");
      const modeEl = this.dom.select("mode");
      if (modeEl) modeEl.value = mode;

      // Agent
      const agent = data?.agent ?? {};
      const crit = agent?.crit ?? {};
      const dmg = agent?.dmgBuckets ?? {};
      const penRatioPct = agent?.pen?.ratioPct ?? 0;
      const penFlat = agent?.pen?.flat ?? 0;

      const agentLevel = this.dom.input("agentLevel");
      if (agentLevel) agentLevel.value = String(agent?.level ?? 60);

      const attribute = this.dom.select("attribute");
      if (attribute) attribute.value = String(agent?.attribute ?? "physical");

      // ATK
      const atkEl = this.dom.input("atk");
      const atkValue = (agent?.atk ?? 0);
      if (atkEl) atkEl.value = String(atkValue);

      const crEl = this.dom.input("critRatePct");
      if (crEl) crEl.value = String((Number(crit?.rate ?? 0) * 100));

      const cdEl = this.dom.input("critDmgPct");
      if (cdEl) cdEl.value = String((Number(crit?.dmg ?? 0) * 100));

      this._set("dmgGenericPct", dmg?.generic ?? 0);
      this._set("dmgAttrPct", dmg?.attribute ?? 0);
      this._set("dmgSkillTypePct", dmg?.skillType ?? 0);
      this._setIfExists("dmgOtherPct", dmg?.other ?? 0);
      this._setIfExists("dmgVsStunnedPct", dmg?.vsStunned ?? 0);

      this._set("penRatioPct", penRatioPct ?? 0);
      this._set("penFlat", penFlat ?? 0);

      this._set("skillMultPct", agent?.skillMultPct ?? 100);

      // Anomaly
      const an = agent?.anomaly ?? {};
      this._set("anomType", an?.type ?? "auto");
      this._set("anomProf", an?.prof ?? 0);
      this._set("anomDmgPct", an?.dmgPct ?? 0);
      this._set("disorderDmgPct", an?.disorderPct ?? 0);

      const allowCritEl = this.dom.input("anomAllowCrit");
      if (allowCritEl) allowCritEl.checked = !!an?.allowCrit;

      this._setIfExists("anomCritRatePct", (an?.critRatePctOverride ?? ""));
      this._setIfExists("anomCritDmgPct", (an?.critDmgPctOverride ?? ""));
      this._setIfExists("anomTickCount", (an?.tickCountOverride ?? ""));
      this._setIfExists("anomTickIntervalSec", (an?.tickIntervalSecOverride ?? ""));
      this._setIfExists("disorderPrevType", (an?.disorderPrevType ?? "auto"));
      this._setIfExists("disorderTimePassedSec", (an?.disorderTimePassedSec ?? 0));

      // Rupture
      const ru = agent?.rupture ?? {};
      this._set("sheerForce", ru?.sheerForce ?? 0);
      this._set("sheerDmgBonusPct", ru?.sheerDmgBonusPct ?? 0);

      // Enemy
      const enemy = data?.enemy ?? {};
      this._set("enemyLevel", enemy?.level ?? 70);
      this._set("enemyDef", enemy?.def ?? 0);

      this._set("enemyResAllPct", enemy?.resAllPct ?? 0);
      this._setIfExists("enemyResPhysicalPct", enemy?.resByAttr?.physical ?? "");
      this._setIfExists("enemyResFirePct", enemy?.resByAttr?.fire ?? "");
      this._setIfExists("enemyResIcePct", enemy?.resByAttr?.ice ?? "");
      this._setIfExists("enemyResElectricPct", enemy?.resByAttr?.electric ?? "");
      this._setIfExists("enemyResEtherPct", enemy?.resByAttr?.ether ?? "");

      this._setIfExists("resReductionPct", enemy?.resReductionPct ?? 0);
      this._setIfExists("resIgnorePct", enemy?.resIgnorePct ?? 0);

      this._set("defReductionPct", enemy?.defReductionPct ?? 0);
      this._set("defIgnorePct", enemy?.defIgnorePct ?? 0);

      this._set("dmgTakenPct", enemy?.dmgTakenPct ?? 0);
      this._setIfExists("dmgTakenStunnedPct", enemy?.dmgTakenStunnedPct ?? 0);

      const isStunnedEl = this.dom.select("isStunned");
      if (isStunnedEl) isStunnedEl.value = String(!!enemy?.isStunned);

      this._set("stunPct", enemy?.stunPct ?? 150);
    }

    _set(id, value) {
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return;
      /** @type {any} */ (el).value = String(value);
    }
    _setIfExists(id, value) {
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return;
      /** @type {any} */ (el).value = String(value);
    }
  }
  class App {
    constructor() {
      this.dom = new Dom(document);
      this.parser = new InputParser(this.dom);
      this.renderer = new Renderer(this.dom);
      this.applier = new UiApplier(this.dom);

      // Debounced refresh: coalesce multiple input events into one paint-frame.
      this._refreshPending = false;

      this._wireEvents();
      this.refresh();
    }

    requestRefresh() {
      if (this._refreshPending) return;
      this._refreshPending = true;
      const raf = (typeof requestAnimationFrame === "function")
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 16);
      raf(() => {
        this._refreshPending = false;
        this.refresh();
      });
    }

    refresh() {
      const i = this.parser.read();
      this.renderer.applyModeVisibility(i.mode);

      const preview = Preview.compute(i);
      const kpiItems = [{ t: "Expected DMG", v: MathUtil.fmt0(preview.output_expected) }];

      kpiItems.push({ t: "DMG (Non-Crit)", v: MathUtil.fmt0(preview.output_noncrit) });
      kpiItems.push({ t: "DMG (Crit)", v: MathUtil.fmt0(preview.output_crit) });

      if (preview.anom) {
                const anomLabel = (AnomalyCalculator.ANOM_META?.[preview.anom.anomType]?.label)
          ?? String(preview.anom.anomType || "").replace(/^./, (c) => c.toUpperCase());
        kpiItems.push({ t: "Anomaly Type", v: anomLabel });
        if (preview.anom.kind === "dot") {
          kpiItems.push({ t: "Expected Tick DMG", v: MathUtil.fmt0(preview.anom.anomalyPerTick.avg) });
          kpiItems.push({ t: "Ticks / Proc", v: MathUtil.fmt0(preview.anom.tickCount) });
          kpiItems.push({ t: "Tick Interval (Sec)", v: MathUtil.fmtSmart(preview.anom.tickIntervalSec) });
          kpiItems.push({ t: "DoT Duration (Sec)", v: MathUtil.fmtSmart(preview.anom.durationSec) });
          kpiItems.push({ t: "Anomaly Total / Proc", v: MathUtil.fmt0(preview.anom.anomalyPerProc.avg) });
        } else {
          kpiItems.push({ t: "Anomaly Hit", v: MathUtil.fmt0(preview.anom.anomalyPerProc.avg) });
        }
        kpiItems.push({ t: "Disorder Hit", v: MathUtil.fmt0(preview.anom.disorder.avg) });
      }

      this.renderer.renderKpi(kpiItems);

      const marginal = MarginalAnalyzer.compute(i);
      this.renderer.renderMarginalTable(i, marginal);
    }

    _wireEvents() {
      // Save/Load/Export/Import/Reset
      this.dom.btn("btnSave")?.addEventListener("click", () => {
        const data = this._exportData();
        StorageManager.setSaved(data);
        alert("Saved.");
        this.requestRefresh();
      });

      this.dom.btn("btnLoad")?.addEventListener("click", () => {
        const data = StorageManager.getSaved();
        if (!data) { alert("No saved build found."); return; }
        this.applier.applyImportedData(data);
        alert("Loaded.");
        this.requestRefresh();
      });

      this.dom.btn("btnExport")?.addEventListener("click", () => {
        const data = this._exportData();
        if (!data.jsonName) {
          const v = (prompt("Name this build (for the exported JSON file):", "My Build") || "").trim();
          if (v) data.jsonName = v;
        }
        StorageManager.exportJson(data);
      });

      this.dom.btn("btnImport")?.addEventListener("click", () => {
        this.dom.input("importFile")?.click();
      });

      this.dom.input("importFile")?.addEventListener("change", (e) => {
        const input = /** @type {HTMLInputElement} */ (e.target);
        const f = input.files?.[0];
        if (f) {
          StorageManager.importJsonFile(
            f,
            (data) => {
              this.applier.applyImportedData(data);
              alert("Imported.");
              this.requestRefresh();
},
            (msg) => alert(msg)
          );
        }
        input.value = "";
      });

      this.dom.btn("btnReset")?.addEventListener("click", () => {
        this.applier.applyImportedData(Inputs.defaults());
        this.requestRefresh();
      });

      this.dom.qsa("input:not(.appliedDelta)").forEach(el => {
        el.addEventListener("input", () => this.requestRefresh());
      });
      this.dom.qsa("select").forEach(el => {
        el.addEventListener("change", () => this.requestRefresh());
      });

      this.dom.byId("marginalBody")?.addEventListener("change", (e) => {
        const t = /** @type {HTMLElement} */ (e.target);
        if (!(t instanceof HTMLInputElement)) return;
        if (!t.classList.contains("appliedDelta")) return;

        const key = String(t.dataset.key || "");
        const kind = (t.dataset.kind === "flat") ? "flat" : "pct";
        const v = Number(t.value);

        if (!key) return;

        if (!Number.isFinite(v)) {
          MarginalAppliedStore.set(key, kind, NaN);
        } else {
          MarginalAppliedStore.set(key, kind, v);
        }
        this.requestRefresh();
      });
    }

    _exportData() {
      const i = this.parser.read();

      return {
        jsonName: i.jsonName,
        mode: i.mode,
        agent: {
          level: i.agent.level,
          attribute: i.agent.attribute,
          atk: i.agent.atk,
          crit: { rate: i.agent.crit.rate, dmg: i.agent.crit.dmg },
          dmgBuckets: { ...i.agent.dmgBuckets },
          pen: { ratioPct: i.agent.pen.ratioPct, flat: i.agent.pen.flat },
          skillMultPct: i.agent.skillMultPct,
          anomaly: { ...i.agent.anomaly },
          rupture: { ...i.agent.rupture },
        },
        enemy: {
          level: i.enemy.level,
          def: i.enemy.def,
          resAllPct: i.enemy.resAllPct,
          resByAttr: { ...i.enemy.resByAttr },
          resReductionPct: i.enemy.resReductionPct,
          resIgnorePct: i.enemy.resIgnorePct,
          defReductionPct: i.enemy.defReductionPct,
          defIgnorePct: i.enemy.defIgnorePct,
          dmgTakenPct: i.enemy.dmgTakenPct,
          dmgTakenStunnedPct: i.enemy.dmgTakenStunnedPct,
          isStunned: i.enemy.isStunned,
          stunPct: i.enemy.stunPct,
        },
        marginal: {
          customApplied: MarginalAppliedStore.clone(),
        },
      };
    }

  }

  // Init
  new App();
})();
