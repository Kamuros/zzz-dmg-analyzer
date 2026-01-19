// ===========================
  // Helpers
  // ===========================
  const $ = (id) => document.getElementById(id);

  // Per-stat custom deltas for the Marginal table's editable “Δ Stat” column
  // key -> { kind: "pct" | "flat", value: number }
  const CUSTOM_APPLIED = Object.create(null);

  // Default deltas (used when the user hasn't overridden a row)
  const DEFAULT_DELTA = {
    pct: 0,      // +1% for % stats
    atk: 0,     // +10 ATK
    penFlat: 0, // +10 PEN
    sheerForce: 0,
  };

  const num = (id, fallback = 0) => {
    const el = $(id);
    const v = el?.value;
    if (v === "" || v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // Optional numeric input: returns null when blank/invalid
  const optNum = (id) => {
    const el = $(id);
    const v = el?.value;
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmt0 = (x) => Number.isFinite(x) ? x.toFixed(0) : "—";
  const fmt1 = (x) => Number.isFinite(x) ? x.toFixed(1) : "—";
  // Show decimals only when the value is actually fractional.
  // Examples: 1     -> "1"
  //           1.0   -> "1"
  //           1.1   -> "1.1"
  //           123.45-> "123.5"
  const fmtSmart = (x) => {
    if (!Number.isFinite(x)) return "—";
    const r = Math.round(x);
    if (Math.abs(x - r) < 1e-9) return String(r);
    return x.toFixed(1);
  };

  // Sanitize custom applied deltas to a plain JSON object
  function cloneCustomApplied() {
    const out = {};
    for (const [k, v] of Object.entries(CUSTOM_APPLIED)) {
      if (!v || (v.kind !== "pct" && v.kind !== "flat")) continue;
      const n = Number(v.value);
      if (!Number.isFinite(n)) continue;
      out[k] = { kind: v.kind, value: n };
    }
    return out;
  }

  function applyCustomAppliedFromData(data) {
    // Clear current overrides
    for (const k of Object.keys(CUSTOM_APPLIED)) delete CUSTOM_APPLIED[k];
    const src = data?.marginal?.customApplied;
    if (!src || typeof src !== "object") return;
    for (const [k, v] of Object.entries(src)) {
      if (!v || (v.kind !== "pct" && v.kind !== "flat")) continue;
      const n = Number(v.value);
      if (!Number.isFinite(n)) continue;
      CUSTOM_APPLIED[k] = { kind: v.kind, value: n };
    }
  }
  const clone = (x) => JSON.parse(JSON.stringify(x));

  const pctToMult = (pct) => 1 + (pct / 100);

  // ===========================
  // Data model (inputs)
  // ===========================
  function defaultInputs() {
    return {
      // Optional label used only for JSON export/import (not for local Save/Load)
      jsonName: "",
      mode: "standard",

      agent: {
        level: 60,
        attribute: "physical",
        atkBase: 1000,

        crit: { rate: 0.05, dmg: 0.50 },

        dmgBuckets: {
          generic: 0,
          attribute: 0,
          skillType: 0,
          other: 0,
          vsStunned: 0,
        },

        penRatioPct: 0,
        penFlat: 0,

        skillMultPct: 100,

        anomaly: {
          type: "auto",
          prof: 0,
          dmgPct: 0,
          disorderPct: 0,
          // Optional overrides (leave blank in UI to use defaults per anomaly type)
          tickCountOverride: null,
          tickIntervalSecOverride: null,

          // Special-case toggle: anomalies generally cannot crit in ZZZ,
          // but some character-specific effects may effectively make anomaly instances crit-like.
          allowCrit: false,

          // Optional anomaly-specific crit overrides (used only when allowCrit is true).
          // Leave blank in the UI to reuse the agent's crit stats.
          critRatePctOverride: null,
          critDmgPctOverride: null,

          // Disorder modeling inputs
          disorderPrevType: "auto",
          disorderTimePassedSec: 0,

          // legacy fields kept in saves (not used in calculations)
          baseManual: 0,
          procCount: 1,
          specialMult: 1,
        },

        rupture: {
          sheerForce: 0,
          sheerDmgBonusPct: 0,
        },
      },

      enemy: {
        level: 70,
        def: 953,

        resAllPct: 0,
        resPhysicalPct: null,
        resFirePct: null,
        resIcePct: null,
        resElectricPct: null,
        resEtherPct: null,

        resReductionPct: 0,
        resIgnorePct: 0,

        defReductionPct: 0,
        defIgnorePct: 0,

        dmgTakenPct: 0,
        dmgTakenStunnedPct: 0,

        isStunned: false,
        stunPct: 150,

        // extra knob used in statMeta (kept for completeness)
        dazeVulnMult: 1.0,
      },

      marginal: {
        deltaPreset: "1",
        basis: "raw",
        topN: "all",
      },
    };
  }

  // ===========================
  // Stat meta for marginal table
  // ===========================
  function statMeta() {
    return [
      { key: "atkBase", label: "Total ATK" },

      { key: "dmgGenericPct", label: "Generic DMG" },
      { key: "dmgAttrPct", label: "Attribute DMG" },
      { key: "dmgSkillTypePct", label: "Skill DMG" },

      { key: "critRatePct", label: "Crit Rate" },
      { key: "critDmgPct", label: "Crit DMG" },

      { key: "penRatioPct", label: "PEN Ratio" },
      { key: "penFlat", label: "PEN" },

      { key: "defReductionPct", label: "DEF Reduction" },
      { key: "defIgnorePct", label: "DEF Ignore" },

      { key: "dmgTakenPct", label: "DMG Taken" },

      { key: "stunPct", label: "Stunned Multiplier" },

      { key: "anomDmgPct", label: "Anomaly DMG" },
      { key: "disorderDmgPct", label: "Disorder DMG" },

      { key: "sheerForce", label: "Sheer Force" },
      { key: "sheerDmgBonusPct", label: "Sheer DMG Bonus" },
    ];
  }

  // ===========================
  // Read/Apply UI
  // ===========================
  function readInputs() {
    const i = defaultInputs();

    // JSON name is purely a convenience label (embedded in exported JSON + used for filename).
    // Local Save/Load always uses a single slot.
    i.jsonName = (($("jsonName")?.value ?? "").trim());
    i.mode = $("mode").value;

    i.agent.level = num("agentLevel", 60);
    i.agent.attribute = $("attribute").value;
    i.agent.atkBase = num("atkBase", 0);

    i.agent.crit.rate = clamp(num("critRatePct", 0) / 100, 0, 1);
    i.agent.crit.dmg = num("critDmgPct", 0) / 100;

    i.agent.dmgBuckets.generic = num("dmgGenericPct", 0);
    i.agent.dmgBuckets.attribute = num("dmgAttrPct", 0);
    i.agent.dmgBuckets.skillType = num("dmgSkillTypePct", 0);

    // Advanced (rare) damage knobs
    i.agent.dmgBuckets.other = num("dmgOtherPct", 0);
    i.agent.dmgBuckets.vsStunned = num("dmgVsStunnedPct", 0);


    i.agent.penRatioPct = num("penRatioPct", 0);
    i.agent.penFlat = num("penFlat", 0);

    i.agent.skillMultPct = num("skillMultPct", 100);

    // Anomaly
    i.agent.anomaly.type = $("anomType").value;
    i.agent.anomaly.prof = num("anomProf", 0);
    i.agent.anomaly.dmgPct = num("anomDmgPct", 0);
    i.agent.anomaly.disorderPct = num("disorderDmgPct", 0);
    i.agent.anomaly.allowCrit = !!$("anomAllowCrit")?.checked;
    i.agent.anomaly.critRatePctOverride = optNum("anomCritRatePct");
    i.agent.anomaly.critDmgPctOverride = optNum("anomCritDmgPct");
    i.agent.anomaly.tickCountOverride = optNum("anomTickCount");
    i.agent.anomaly.tickIntervalSecOverride = optNum("anomTickIntervalSec");
    i.agent.anomaly.disorderPrevType = $("disorderPrevType")?.value ?? "auto";
    i.agent.anomaly.disorderTimePassedSec = num("disorderTimePassedSec", 0);

    // Rupture
    i.agent.rupture.sheerForce = num("sheerForce", 0);
    i.agent.rupture.sheerDmgBonusPct = num("sheerDmgBonusPct", 0);

    // Enemy
    i.enemy.level = num("enemyLevel", 70);
    i.enemy.def = num("enemyDef", 0);

    i.enemy.resAllPct = num("enemyResAllPct", 0);
    i.enemy.resPhysicalPct = optNum("enemyResPhysicalPct");
    i.enemy.resFirePct = optNum("enemyResFirePct");
    i.enemy.resIcePct = optNum("enemyResIcePct");
    i.enemy.resElectricPct = optNum("enemyResElectricPct");
    i.enemy.resEtherPct = optNum("enemyResEtherPct");

    i.enemy.resReductionPct = num("resReductionPct", 0);
    i.enemy.resIgnorePct = num("resIgnorePct", 0);

    i.enemy.defReductionPct = num("defReductionPct", 0);
    i.enemy.defIgnorePct = num("defIgnorePct", 0);

    i.enemy.dmgTakenPct = num("dmgTakenPct", 0);
    i.enemy.dmgTakenStunnedPct = num("dmgTakenStunnedPct", 0);

    i.enemy.isStunned = ($("isStunned").value === "true");
    i.enemy.stunPct = num("stunPct", 150);

    // Marginal config (legacy fields kept for backward-compatible saves)
    // The UI controls for these were removed; the table uses per-row Δ Stat inputs.
    const deltaPresetEl = $("deltaPreset");
    const basisEl = $("marginalBasis");
    const topNEl = $("topN");
    i.marginal.deltaPreset = deltaPresetEl ? deltaPresetEl.value : "1";
    i.marginal.basis = basisEl ? basisEl.value : "raw";
    i.marginal.topN = topNEl ? topNEl.value : "all";
    // Persist per-row "Applied" deltas (editable marginal table inputs)
    i.marginal.customApplied = cloneCustomApplied();

    return i;
  }

  function applyModeVisibility(mode) {
    const showAnom = (mode === "anomaly" || mode === "hybrid");
    const showRupture = (mode === "rupture");

    $("anomalyHeader").classList.toggle("hidden", !showAnom);
    $("anomalyCard").classList.toggle("hidden", !showAnom);

    $("ruptureHeader").classList.toggle("hidden", !showRupture);
    $("ruptureCard").classList.toggle("hidden", !showRupture);
  }

  // ===========================
  // Core formulas (preview output)
  // ===========================
  function getResPctForAttribute(enemy, attr) {
    // If both an all-attribute RES and a specific attribute RES are provided,
    // they should stack additively (e.g., All -16% + Ether -20% = -36%).
    const map = {
      physical: enemy.resPhysicalPct,
      fire: enemy.resFirePct,
      ice: enemy.resIcePct,
      electric: enemy.resElectricPct,
      ether: enemy.resEtherPct,
    };
    const specific = map[attr];
    const all = enemy.resAllPct ?? 0;
    if (specific !== null && specific !== undefined && Number.isFinite(specific)) return all + specific;
    return all;
  }
const LEVEL_FACTOR_TABLE = {
    1: 50, 2: 54, 3: 58, 4: 62, 5: 66, 6: 71, 7: 76, 8: 82, 9: 88, 10: 94,
    11: 100, 12: 107, 13: 114, 14: 121, 15: 129, 16: 137, 17: 145, 18: 153, 19: 162, 20: 172,
    21: 181, 22: 191, 23: 201, 24: 211, 25: 222, 26: 233, 27: 245, 28: 256, 29: 268, 30: 281,
    31: 293, 32: 306, 33: 319, 34: 333, 35: 347, 36: 361, 37: 375, 38: 390, 39: 405, 40: 421,
    41: 436, 42: 452, 43: 469, 44: 485, 45: 502, 46: 519, 47: 537, 48: 555, 49: 573, 50: 592,
    51: 610, 52: 629, 53: 649, 54: 669, 55: 689, 56: 709, 57: 730, 58: 751, 59: 772, 60: 794,
  };

  function levelFactor(level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    if (lv >= 60) return 794;
    return LEVEL_FACTOR_TABLE[lv] ?? (lv + 100); // fallback for safety
  }

  function computeDefMult(i) {
    const aLv = Math.max(1, i.agent.level);

    let def = Math.max(0, i.enemy.def);

    // Shred + ignore as additive percent of enemy DEF (applied before PEN flat)
    const defPctDown = clamp((i.enemy.defReductionPct + i.enemy.defIgnorePct) / 100, 0, 0.95);
    def = def * (1 - defPctDown);

    // Flat PEN reduces remaining DEF (clamped)
    const pen = Math.max(0, i.agent.penFlat);
    def = Math.max(0, def - pen);

    const ratio = clamp(i.agent.penRatioPct / 100, 0, 0.95);
    def = def * (1 - ratio);

    // ZZZ baseline: use Level Factor table instead of (level + 100) approximation
    const k = levelFactor(aLv);
    const mult = k / (k + def);
    return mult;
  }


  function computeVulnMult(i) {
    const base = Number(i.enemy.dmgTakenPct || 0);
    const stunnedBonus = (i.enemy.isStunned ? Number(i.enemy.dmgTakenStunnedPct || 0) : 0);
    return pctToMult(base + stunnedBonus);
  }

  function computeResMult(i) {
    // Base RES stacks: All-Attribute RES + Attribute-specific RES (if provided)
    const baseResPct = getResPctForAttribute(i.enemy, i.agent.attribute);

    // RES Reduction (target-side) and RES Ignore (attacker-side) are applied additively to the final RES term.
    // Effective RES = Base RES - Reduction - Ignore
    const effResPct = baseResPct - Number(i.enemy.resReductionPct || 0) - Number(i.enemy.resIgnorePct || 0);

    // Multiplier = 1 - (Effective RES / 100)
    // Negative Effective RES increases damage.
    return 1 - (effResPct / 100);
  }

  function computeStandardOutput(i) {
    const atk = i.agent.atkBase;
    const skill = i.agent.skillMultPct / 100;

    const dmgPctTotal =
      i.agent.dmgBuckets.generic +
      i.agent.dmgBuckets.attribute +
      i.agent.dmgBuckets.skillType +
      i.agent.dmgBuckets.other +
      (i.enemy.isStunned ? i.agent.dmgBuckets.vsStunned : 0);

    const dmgMult = pctToMult(dmgPctTotal);

    const defMult = computeDefMult(i);
    const resMult = computeResMult(i);

    const vuln = computeVulnMult(i);
    const stunMult = i.enemy.isStunned ? (i.enemy.stunPct / 100) : 1;

    const base = atk * skill * dmgMult * defMult * resMult * vuln * stunMult;

    const nonCrit = base;
    const crit = base * (1 + i.agent.crit.dmg);

    const cr = clamp(i.agent.crit.rate, 0, 1);
    const expected = nonCrit * (1 - cr) + crit * cr;

    return { nonCrit, crit, expected };
  }

  // ===========================
  // Anomaly model (in-game-like defaults)
  // ===========================
  // Based on commonly referenced community formula summaries:
  // - Anomalies generally cannot crit.
  // - Burn/Shock/Corruption are multi-instance effects over ~10s.
  // - Shatter/Assault are single-instance.
  // - Disorder depends on previous anomaly + time passed since application.
  // This calculator still simplifies some edge cases (ICDs, proc caps in real combat, etc.).

  const ANOM_META = {
    assault:   { label: "Assault",   kind: "single", durationSec: 0,  instances: 1,  intervalSec: 0,   perInstanceMultPct: 713.0, canCrit: false },
    shatter:   { label: "Shatter",   kind: "single", durationSec: 0,  instances: 1,  intervalSec: 0,   perInstanceMultPct: 500.0, canCrit: false },
    burn:      { label: "Burn",      kind: "dot",    durationSec: 10, instances: 20, intervalSec: 0.5, perInstanceMultPct: 50.0,  canCrit: false },
    shock:     { label: "Shock",     kind: "dot",    durationSec: 10, instances: 10, intervalSec: 1.0, perInstanceMultPct: 125.0, canCrit: false },
    corruption:{ label: "Corruption",kind: "dot",    durationSec: 10, instances: 20, intervalSec: 0.5, perInstanceMultPct: 62.5,  canCrit: false },
  };

  const ANOM_TYPE_FROM_ATTR = {
    physical: "Assault",
    fire: "Burn",
    electric: "Shock",
    ice: "Shatter",
    ether: "Corruption",
  };

  function inferAnomType(i) {
    if (i.agent.anomaly.type !== "auto") return i.agent.anomaly.type;
    return ANOM_TYPE_FROM_ATTR[i.agent.attribute] ?? "assault";
  }

  function inferDisorderPrevType(i, currentAnomType) {
    const v = i.agent.anomaly.disorderPrevType;
    return (v && v !== "auto") ? v : currentAnomType;
  }

  function anomalyLevelMult(level) {
    const lv = clamp(Math.floor(level ?? 1), 1, 60);
    // 1 + (level - 1) / 59, truncated to 4 decimals.
    const raw = 1 + (lv - 1) / 59;
    return Math.floor(raw * 10000) / 10000;
  }

  function anomalyProfMult(prof) {
    // Community guides commonly represent proficiency scaling as prof * 0.01
    return Math.max(0, (Number(prof) || 0) * 0.01);
  }

  function computeAnomalyOutput(i) {
    const anomType = inferAnomType(i);
    const meta = ANOM_META[anomType] ?? ANOM_META.assault;

    // Overrides (blank => defaults)
    const ticks = Math.max(1, Math.floor(i.agent.anomaly.tickCountOverride ?? meta.instances));
    const intervalSec = Math.max(0, Number(i.agent.anomaly.tickIntervalSecOverride ?? meta.intervalSec));
    const durationSec = (meta.kind === "dot") ? (ticks * intervalSec) : 0;

    // Core multipliers (same buckets as standard damage for now)
    const atk = i.agent.atkBase;
    const profMult = anomalyProfMult(i.agent.anomaly.prof);
    const lvMult = anomalyLevelMult(i.agent.level);

    const dmgPctTotal =
      i.agent.dmgBuckets.generic +
      i.agent.dmgBuckets.attribute +
      i.agent.dmgBuckets.other +
      (i.enemy.isStunned ? i.agent.dmgBuckets.vsStunned : 0);

    // Per-type damage bonuses for anomaly/disorder
    const anomalyBonusMult = pctToMult(dmgPctTotal + i.agent.anomaly.dmgPct);
    const disorderBonusMult = pctToMult(dmgPctTotal + i.agent.anomaly.disorderPct);

    const defMult = computeDefMult(i);
    const resMult = computeResMult(i);
    const vuln = computeVulnMult(i);
    const stunMult = i.enemy.isStunned ? (i.enemy.stunPct / 100) : 1;

    // Base multiplier for each anomaly instance
    const perInstBase = atk * (meta.perInstanceMultPct / 100);

    // Base damage (non-crit)
    const perInstNonCrit = perInstBase * profMult * lvMult * anomalyBonusMult * defMult * resMult * vuln * stunMult;
    // Crit overrides (special cases only)
    const crPct = (i.agent.anomaly.critRatePctOverride ?? null);
    const cdPct = (i.agent.anomaly.critDmgPctOverride ?? null);
    const critRate = (crPct === null) ? i.agent.crit.rate : clamp(crPct / 100, 0, 1);
    const critDmg = (cdPct === null) ? i.agent.crit.dmg : Math.max(0, cdPct / 100);

    const perInstCrit = perInstNonCrit * (1 + critDmg);

    const canCritByDefault = !!meta.canCrit;
    const allowCrit = !!i.agent.anomaly.allowCrit;
    // By default anomalies cannot crit. If the user enables the special-case toggle,
    // we allow crit math to apply (useful for character-specific exceptions).
    const critEnabled = allowCrit;
    const cr = clamp(critRate, 0, 1);
    const perInstAvg = critEnabled ? (perInstNonCrit * (1 - cr) + perInstCrit * cr) : perInstNonCrit;

    const anomalyPerTick = {
      nonCrit: perInstNonCrit,
      crit: perInstCrit,
      avg: perInstAvg,
    };

    const anomalyPerProc = {
      nonCrit: perInstNonCrit * ticks,
      crit: perInstCrit * ticks,
      avg: perInstAvg * ticks,
    };

    // Disorder (single instance) — depends on previous anomaly + time passed
    const prevType = inferDisorderPrevType(i, anomType);
    const t = clamp(Number(i.agent.anomaly.disorderTimePassedSec || 0), 0, 10);

    // These are simplified numeric equivalents of common "previous anomaly" disorder multipliers.
    // Using stepwise floors as often described (10s window).
    let disorderMultPct;
    if (prevType === "burn") {
      disorderMultPct = 450 + Math.floor((10 - t) * 2) * 50;
    } else if (prevType === "shock") {
      disorderMultPct = 450 + Math.floor(10 - t) * 125;
    } else if (prevType === "corruption") {
      disorderMultPct = 450 + Math.floor((10 - t) * 2) * 62.5;
    } else if (prevType === "shatter") {
      // "Frozen" in some summaries
      disorderMultPct = 450 + Math.floor(10 - t) * 7.5;
    } else if (prevType === "assault") {
      // "Flinch" in some summaries
      disorderMultPct = 450 + Math.floor(10 - t) * 7.5;
    } else {
      disorderMultPct = 450;
    }

    const disorderNonCrit = atk * (disorderMultPct / 100) * profMult * lvMult * disorderBonusMult * defMult * resMult * vuln * stunMult;
    const disorderCrit = disorderNonCrit * (1 + critDmg);
    const disorderAvg = critEnabled ? (disorderNonCrit * (1 - cr) + disorderCrit * cr) : disorderNonCrit;

    return {
      anomType,
      kind: meta.kind,
      canCritByDefault,
      critEnabled,

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

  function computeRuptureOutput(i) {
    // Rupture (Sheer DMG) model (community-tested).
    // Key properties consistently reported:
    // - Uses Sheer Force as the base offensive stat (not ATK).
    // - Ignores enemy DEF entirely, so DEF/PEN/DEF shred/DEF ignore do not apply.
    // - Still affected by RES, standard DMG Bonus buckets, CRIT, DMG Taken, and Stun multiplier.
    // - Sheer DMG Bonus is its own multiplier, separate from regular DMG Bonus.

    const sheerForce = Math.max(0, i.agent.rupture.sheerForce);
    const skill = i.agent.skillMultPct / 100;

    const dmgPctTotal =
      i.agent.dmgBuckets.generic +
      i.agent.dmgBuckets.attribute +
      i.agent.dmgBuckets.skillType +
      i.agent.dmgBuckets.other +
      (i.enemy.isStunned ? i.agent.dmgBuckets.vsStunned : 0);

    const dmgMult = pctToMult(dmgPctTotal);
    const sheerMult = pctToMult(i.agent.rupture.sheerDmgBonusPct);
    const resMult = computeResMult(i);
    const vuln = computeVulnMult(i);
    const stunMult = i.enemy.isStunned ? (i.enemy.stunPct / 100) : 1;

    // No DEF multiplier for rupture: treated as 1 because Sheer DMG ignores enemy DEF.
    const base = sheerForce * skill * dmgMult * sheerMult * resMult * vuln * stunMult;

    const nonCrit = base;
    const crit = base * (1 + i.agent.crit.dmg);
    const cr = clamp(i.agent.crit.rate, 0, 1);
    const expected = nonCrit * (1 - cr) + crit * cr;

    return { nonCrit, crit, expected };
  }

  function computePreviewOutput(i) {
    const std = computeStandardOutput(i);
    const anom = computeAnomalyOutput(i);
    const rup = computeRuptureOutput(i);

    if (i.mode === "standard") {
      return {
        mode: i.mode,
        output_noncrit: std.nonCrit,
        output_crit: std.crit,
        output_expected: std.expected,
        output: std.expected,
      };
    }

    if (i.mode === "anomaly") {
      return {
        mode: i.mode,
        anom,
        output_expected: anom.combinedAvg,
        output: anom.combinedAvg,
      };
    }

    if (i.mode === "rupture") {
      return {
        mode: i.mode,
        rupture: rup.expected,
        output_noncrit: rup.nonCrit,
        output_crit: rup.crit,
        output_expected: rup.expected,
        output: rup.expected,
      };
    }

    // hybrid
    return {
      mode: i.mode,
      output_noncrit: std.nonCrit,
      output_crit: std.crit,
      // Hybrid is still a simplistic "add standard hit + anomaly proc" view.
      output_expected: std.expected + anom.combinedAvg,
      output: std.expected + anom.combinedAvg,
    };
  }

  // ===========================
  // Marginal analysis
  // ===========================
  function getDefaultAppliedForKey(key) {
    if (key === "atkBase") return { kind: "flat", value: DEFAULT_DELTA.atk };
    if (key === "penFlat") return { kind: "flat", value: DEFAULT_DELTA.penFlat };
    if (key === "sheerForce") return { kind: "flat", value: DEFAULT_DELTA.sheerForce };
    return { kind: "pct", value: DEFAULT_DELTA.pct };
  }


  function getOriginalDisplayForKey(i, key) {
    // Returns the current stat in the same units the user sees in inputs.
    // kind: "flat" (raw number) or "pct" (percentage points)
    switch (key) {
      case "atkBase": return { kind: "flat", value: i.agent.atkBase };

      case "dmgGenericPct": return { kind: "pct", value: i.agent.dmgBuckets.generic };
      case "dmgAttrPct": return { kind: "pct", value: i.agent.dmgBuckets.attribute };
      case "dmgSkillTypePct": return { kind: "pct", value: i.agent.dmgBuckets.skillType };

      case "critRatePct": return { kind: "pct", value: i.agent.crit.rate * 100 };
      case "critDmgPct": return { kind: "pct", value: i.agent.crit.dmg * 100 };

      case "penRatioPct": return { kind: "pct", value: i.agent.penRatioPct };
      case "penFlat": return { kind: "flat", value: i.agent.penFlat };

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

  function applyDelta(i, key, overrideDelta = null) {
    const j = clone(i);
    const d = (overrideDelta && Number.isFinite(overrideDelta.value))
      ? overrideDelta
      : getDefaultAppliedForKey(key);

    const dp = (d.kind === "pct") ? d.value : DEFAULT_DELTA.pct;
    const df = (d.kind === "flat") ? d.value : DEFAULT_DELTA.penFlat;

    switch (key) {
      case "atkBase": j.agent.atkBase += df; break;

      case "dmgGenericPct": j.agent.dmgBuckets.generic += dp; break;
      case "dmgAttrPct": j.agent.dmgBuckets.attribute += dp; break;
      case "dmgSkillTypePct": j.agent.dmgBuckets.skillType += dp; break;

      case "critRatePct":
        j.agent.crit.rate = clamp(j.agent.crit.rate + (dp / 100), 0, 1); break;
      case "critDmgPct":
        j.agent.crit.dmg += (dp / 100); break;

      case "penRatioPct": j.agent.penRatioPct += dp; break;
      case "penFlat": j.agent.penFlat += df; break;

      case "dmgTakenPct": j.enemy.dmgTakenPct += dp; break;
      case "stunPct": j.enemy.stunPct += dp; break;

      case "defReductionPct": j.enemy.defReductionPct += dp; break;
      case "defIgnorePct": j.enemy.defIgnorePct += dp; break;

      case "anomDmgPct": j.agent.anomaly.dmgPct += dp; break;
      case "disorderDmgPct": j.agent.anomaly.disorderPct += dp; break;

      case "sheerForce": j.agent.rupture.sheerForce += df; break;
      case "sheerDmgBonusPct": j.agent.rupture.sheerDmgBonusPct += dp; break;
    }

    return { j, applied: d };
  }

  function computeMarginals(i) {
    const base = computePreviewOutput(i);
    const baseOut = base.output;

    const rows = [];
    for (const m of statMeta()) {
      // Hide irrelevant stats by mode
      if (i.mode === "anomaly" && (m.key === "dmgSkillTypePct" || m.key === "critRatePct" || m.key === "critDmgPct")) continue;

      if (i.mode === "rupture") {
        // Rupture ignores all DEF-side factors and ATK/PEN. It still uses:
        // - Sheer Force + Sheer DMG Bonus
        // - regular DMG% buckets (Generic/Attribute/SkillType)
        // - CRIT
        // - DMG Taken and Stun multiplier
        // RES is applied via enemy inputs (not a marginal stat row)
        const allowed = new Set([
          "dmgGenericPct",
          "dmgAttrPct",
          "dmgSkillTypePct",
          "critRatePct",
          "critDmgPct",
          "dmgTakenPct",
          "stunPct",
          "sheerForce",
          "sheerDmgBonusPct",
        ]);
        if (!allowed.has(m.key)) continue;
      }

      if (i.mode !== "rupture" && (m.key === "sheerForce" || m.key === "sheerDmgBonusPct")) continue;
      if (i.mode === "standard" && (m.key === "anomDmgPct" || m.key === "disorderDmgPct")) continue;

      const override = CUSTOM_APPLIED[m.key] ?? null;
      const { j, applied } = applyDelta(i, m.key, override);
      const out2 = computePreviewOutput(j).output;
      const gain = out2 - baseOut;
      const pctGain = baseOut !== 0 ? (gain / baseOut) * 100 : 0;

      let deltaText = "";
      if (m.key === "atkBase") {
        deltaText = `+${fmt1(applied.value)} ATK`;
      } else if (applied.kind === "flat") {
        deltaText = `+${fmt1(applied.value)} (flat)`;
      } else {
        deltaText = `+${fmt1(applied.value)}%`;
      }

      const orig = getOriginalDisplayForKey(i, m.key);
      const origVal = orig.value;
      let totalVal = origVal + (applied?.value ?? 0);
      if (m.key === "critRatePct") totalVal = clamp(totalVal, 0, 100);

      rows.push({ ...m, applied, deltaText, out2, gain, pctGain, origVal, totalVal, displayKind: orig.kind });
    }

    rows.sort((a,b) => b.pctGain - a.pctGain);
    return { base, rows };
  }

  // ===========================
  // Save/Load/Export/Import
  // ===========================
  // Local Save/Load is intentionally a single temporal slot.
  // JSON export/import can carry a user-chosen name for better organisation.
  const SAVE_KEY = "zzz_calc_save_v1";

  function getSavedBuild() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    // Back-compat: old multi-slot saves (zzz_calc_saves)
    try {
      const legacy = JSON.parse(localStorage.getItem("zzz_calc_saves") || "{}");
      if (legacy && typeof legacy === "object") {
        if (legacy["1"]) return legacy["1"];
        const firstKey = Object.keys(legacy)[0];
        if (firstKey) return legacy[firstKey];
      }
    } catch {}

    return null;
  }

  function setSavedBuild(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function applyImportedData(data) {
    // Restore per-row marginal "Applied" deltas (if present)
    applyCustomAppliedFromData(data);

    // minimal: write values back to UI (keeping ids stable)
    const jsonNameEl = $("jsonName");
    if (jsonNameEl) jsonNameEl.value = data.jsonName ?? "";
    $("mode").value = data.mode ?? "standard";

    $("agentLevel").value = data.agent?.level ?? 60;
    $("attribute").value = data.agent?.attribute ?? "physical";
    $("atkBase").value = data.agent?.atkBase ?? 0;

    $("critRatePct").value = ((data.agent?.crit?.rate ?? 0) * 100);
    $("critDmgPct").value = ((data.agent?.crit?.dmg ?? 0) * 100);

    $("dmgGenericPct").value = data.agent?.dmgBuckets?.generic ?? 0;
    $("dmgAttrPct").value = data.agent?.dmgBuckets?.attribute ?? 0;
    $("dmgSkillTypePct").value = data.agent?.dmgBuckets?.skillType ?? 0;

    const otherEl = $("dmgOtherPct"); if (otherEl) otherEl.value = data.agent?.dmgBuckets?.other ?? 0;
    const vsStunEl = $("dmgVsStunnedPct"); if (vsStunEl) vsStunEl.value = data.agent?.dmgBuckets?.vsStunned ?? 0;


    $("penRatioPct").value = data.agent?.penRatioPct ?? 0;
    $("penFlat").value = data.agent?.penFlat ?? 0;

    $("skillMultPct").value = data.agent?.skillMultPct ?? 100;

    $("anomType").value = data.agent?.anomaly?.type ?? "auto";
    $("anomProf").value = data.agent?.anomaly?.prof ?? 0;
    $("anomDmgPct").value = data.agent?.anomaly?.dmgPct ?? 0;
    $("disorderDmgPct").value = data.agent?.anomaly?.disorderPct ?? 0;
    const allowCritEl = $("anomAllowCrit");
    if (allowCritEl) allowCritEl.checked = !!(data.agent?.anomaly?.allowCrit ?? false);

    const anomCrEl = $("anomCritRatePct");
    if (anomCrEl) anomCrEl.value = data.agent?.anomaly?.critRatePctOverride ?? "";
    const anomCdEl = $("anomCritDmgPct");
    if (anomCdEl) anomCdEl.value = data.agent?.anomaly?.critDmgPctOverride ?? "";
    const tickCountEl = $("anomTickCount");
    if (tickCountEl) tickCountEl.value = data.agent?.anomaly?.tickCountOverride ?? "";
    const tickIntEl = $("anomTickIntervalSec");
    if (tickIntEl) tickIntEl.value = data.agent?.anomaly?.tickIntervalSecOverride ?? "";
    const prevEl = $("disorderPrevType");
    if (prevEl) prevEl.value = data.agent?.anomaly?.disorderPrevType ?? "auto";
    const tEl = $("disorderTimePassedSec");
    if (tEl) tEl.value = data.agent?.anomaly?.disorderTimePassedSec ?? 0;

    $("sheerForce").value = data.agent?.rupture?.sheerForce ?? 0;
    $("sheerDmgBonusPct").value = data.agent?.rupture?.sheerDmgBonusPct ?? 0;

    $("enemyLevel").value = data.enemy?.level ?? 70;
    $("enemyDef").value = data.enemy?.def ?? 0;

    // RES import: keep All-Attribute RES and per-attribute RES as separate fields.
    // Effective RES used in damage calc is: All + Specific (if provided for the agent's attribute).
    // This matches in-game behavior (e.g., All -16% + Ether -20% = -36%).
    {
      $("enemyResAllPct").value = data.enemy?.resAllPct ?? 0;

      const p = $("enemyResPhysicalPct"); if (p) p.value = data.enemy?.resPhysicalPct ?? "";
      const f = $("enemyResFirePct"); if (f) f.value = data.enemy?.resFirePct ?? "";
      const ic = $("enemyResIcePct"); if (ic) ic.value = data.enemy?.resIcePct ?? "";
      const el = $("enemyResElectricPct"); if (el) el.value = data.enemy?.resElectricPct ?? "";
      const et = $("enemyResEtherPct"); if (et) et.value = data.enemy?.resEtherPct ?? "";
    }

    const rr = $("resReductionPct"); if (rr) rr.value = data.enemy?.resReductionPct ?? 0;
    const ri = $("resIgnorePct"); if (ri) ri.value = data.enemy?.resIgnorePct ?? 0;

    $("defReductionPct").value = data.enemy?.defReductionPct ?? 0;
    $("defIgnorePct").value = data.enemy?.defIgnorePct ?? 0;

    $("dmgTakenPct").value = data.enemy?.dmgTakenPct ?? 0;
    const dts = $("dmgTakenStunnedPct"); if (dts) dts.value = data.enemy?.dmgTakenStunnedPct ?? 0;

    $("isStunned").value = String(data.enemy?.isStunned ?? false);
    $("stunPct").value = data.enemy?.stunPct ?? 150;

    // Legacy (controls removed)
    const dpEl = $("deltaPreset");
    const mbEl = $("marginalBasis");
    const tnEl = $("topN");
    if (dpEl) dpEl.value = data.marginal?.deltaPreset ?? "1";
    if (mbEl) mbEl.value = data.marginal?.basis ?? "raw";
    if (tnEl) tnEl.value = data.marginal?.topN ?? "all";
  }

  function saveBuild() {
    const data = readInputs();
    setSavedBuild(data);
    alert("Saved.");
  }

  function loadBuild() {
    const data = getSavedBuild();
    if (!data) { alert("No saved build found."); return; }
    applyImportedData(data);
    refresh();
    alert("Loaded.");
  }

  function exportJSON() {
    const data = readInputs();

    // If the user didn't type a name, ask once at export time.
    if (!data.jsonName) {
      const suggested = "My Build";
      const v = (prompt("Name this build (for the exported JSON file):", suggested) || "").trim();
      if (v) data.jsonName = v;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (data.jsonName || "zzz_build")
      .replace(/[^a-z0-9 _\-]+/gi, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 60);
    a.download = `${safeName || "zzz_build"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        applyImportedData(data);
        refresh();
        alert("Imported.");
      } catch (e) {
        alert("Invalid JSON.");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    applyImportedData(defaultInputs());
    refresh();
  }

  // ===========================
  // Render
  // ===========================
  function refresh() {
    const i = readInputs();
    applyModeVisibility(i.mode);

    const out = computePreviewOutput(i);
    const anomOut = (i.mode === "anomaly" || i.mode === "hybrid") ? computeAnomalyOutput(i) : null;

    const mode = i.mode;
    const labelPrefix =
      (mode === "standard") ? "Output" :
      (mode === "anomaly")  ? "Anomaly Output" :
      (mode === "rupture")  ? "Rupture Output" :
      "Combined Output";

    const kpiItems = [
      { t:`Expected DMG`,    v: fmt0(out.output_expected) },
    ];

    if (mode === "standard" || mode === "hybrid" || mode === "rupture") {
      kpiItems.push({ t:`DMG (Non-Crit)`, v: fmt0(out.output_noncrit) });
      kpiItems.push({ t:`DMG (Crit)`,     v: fmt0(out.output_crit) });
    }

    if (mode === "anomaly" || mode === "hybrid") {
      // Update anomaly info pills (if present in DOM)
      const kindPill = $("anomKindPill");
      const canCritPill = $("anomCanCritPill");
      if (kindPill && anomOut) kindPill.textContent = (anomOut.kind === "dot") ? "DoT" : "Single";
      if (canCritPill && anomOut) {
        if (anomOut.critEnabled) canCritPill.textContent = "Crit: ON";
        else canCritPill.textContent = anomOut.canCritByDefault ? "Crit: YES" : "Crit: NO";
      }

      if (anomOut) {
        kpiItems.push({ t: `Anomaly Type`, v: anomOut.anomType });

        if (anomOut.kind === "dot") {
          kpiItems.push({ t: `Tick DMG (AVG)`, v: fmt0(anomOut.anomalyPerTick.avg) });
          kpiItems.push({ t: `Ticks / Proc`, v: fmt0(anomOut.tickCount) });
          kpiItems.push({ t: `Tick Interval (s)`, v: fmt1(anomOut.tickIntervalSec) });
          kpiItems.push({ t: `DoT Duration (s)`, v: fmt1(anomOut.durationSec) });
          kpiItems.push({ t: `Anomaly Total / Proc`, v: fmt0(anomOut.anomalyPerProc.avg) });
        } else {
          kpiItems.push({ t: `Anomaly Hit (AVG)`, v: fmt0(anomOut.anomalyPerProc.avg) });
        }

        kpiItems.push({ t: `Disorder Hit (AVG)`, v: fmt0(anomOut.disorder.avg) });
      }
    }

    $("kpi").innerHTML = kpiItems
      .map(x => `<div class="box"><div class="t">${x.t}</div><div class="v">${x.v}</div></div>`)
      .join("");

    const { rows } = computeMarginals(i);

    $("marginalBody").innerHTML = rows.map(r => {
      const kind = r.applied?.kind ?? "pct";
      const val = r.applied?.value ?? 0;

      const unit = (r.displayKind === "pct") ? "%" : "";
      const step = (kind === "flat") ? 1 : 0.1;

      const fmtStat = (x) => fmtSmart(x);
      const origText = fmtStat(r.origVal);
      const totalText = fmtStat(r.totalVal);

      return `
      <tr>
        <td>${r.label}</td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="muted">${origText}</span>
            <span class="muted">${unit}</span>
          </div>
        </td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            <input
              class="appliedDelta"
              data-key="${r.key}"
              data-kind="${kind}"
              type="number"
              step="${step}"
              value="${String(val)}"
              style="width:110px; padding:6px 8px; border-radius:10px;"
            />
            <span class="muted">${(kind === "pct") ? "%" : ""}</span>
          </div>
        </td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="muted">${totalText}</span>
            <span class="muted">${unit}</span>
          </div>
        </td>
        <td>${fmt0(r.out2)}</td>
        <td>${fmt0(r.gain)}</td>
        <td>${fmtSmart(r.pctGain)}%</td>
      </tr>
    `;
    }).join("");
  }

  // ===========================
  // Wire events
  // ===========================
  $("btnSave").addEventListener("click", () => { saveBuild(); refresh(); });
  $("btnLoad").addEventListener("click", () => { loadBuild(); refresh(); });
  $("btnExport").addEventListener("click", exportJSON);
  $("btnImport").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) importJSONFile(f);
    e.target.value = "";
  });
  $("btnReset").addEventListener("click", resetAll);

  document.querySelectorAll("input:not(.appliedDelta), select").forEach(el => {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });

  // Editable “Applied” inputs inside the marginal table
  $("marginalBody").addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (!t.classList.contains("appliedDelta")) return;

    const key = t.dataset.key;
    const kind = t.dataset.kind === "flat" ? "flat" : "pct";
    const v = Number(t.value);

    if (!key) return;

    if (!Number.isFinite(v)) {
      delete CUSTOM_APPLIED[key];
    } else {
      CUSTOM_APPLIED[key] = { kind, value: v };
    }

    refresh();
  });

  // Init
  refresh();
