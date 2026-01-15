// ===========================
  // Helpers
  // ===========================
  const $ = (id) => document.getElementById(id);
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
  const pctToMult = (pct) => 1 + (pct / 100);

  // Round half-up (0.5 always rounds up; negative values round away from zero)
  function roundHalfUp(value, decimals = 2) {
    const f = 10 ** decimals;
    if (!Number.isFinite(value)) return value;
    const x = value * f;
    const r = value >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);
    return r / f;
  }

  function fmt(value, decimals = 2) {
    const r = roundHalfUp(value, decimals);
    return Number.isFinite(r) ? r.toFixed(decimals) : String(value);
  }

  // UI formatting helpers (half-up). Calculations remain full precision.
  const fmt0 = (v) => fmt(v, 0);
  const fmt1 = (v) => fmt(v, 1);

  // ZZZ-like DEF multiplier (Level Factor table + effective DEF with PEN ratio and flat PEN)
  // DEF Mult = LF / (effectiveDEF + LF)
  function levelFactor(level) {
    const t = [null,
      50,54,58,62,66,71,76,82,88,94,
      100,107,114,121,129,137,145,153,162,172,
      181,191,201,211,222,233,245,256,268,281,
      293,306,319,333,347,361,375,390,405,421,
      436,452,469,485,502,519,537,555,573,592,
      610,629,649,669,689,709,730,751,772
    ];
    if (level >= 60) return 794;
    return t[level] ?? 794;
  }

  function computeDefMult(i) {
    const lf = levelFactor(i.agent.level);

    let def = Math.max(0, i.enemy.def);

    // Apply DEF reduction as scaling on DEF
    def *= (1 - (i.enemy.defReductionPct / 100));

    // Apply PEN ratio and flat PEN
    def = def * (1 - (i.agent.penRatioPct / 100)) - i.agent.penFlat;

    // Apply DEF Ignore as an additional "ignore remaining DEF" knob
    def *= (1 - (i.agent.defIgnorePct / 100));

    def = Math.max(0, def);
    return lf / (def + lf);
  }

  const STORAGE_KEY = "zzz_calc.saves.v3";

  function getAllSaves() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === "object") ? obj : {};
    } catch {
      return {};
    }
  }

  function setAllSaves(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }


  // ===========================
  // Read inputs (schema v3)
  // ===========================
  function readInputs() {
    const mode = $("mode").value;
    const stunned = $("isStunned").value === "true";

    const dmgBuckets = {
      generic: num("dmgGenericPct"),
      attribute: num("dmgAttrPct"),
      skillType: num("dmgSkillTypePct"),
      other: num("dmgOtherPct"),
      vsStunned: stunned ? num("dmgVsStunnedPct") : 0,
      anomaly: (mode === "anomaly" || mode === "hybrid") ? num("anomDmgPct") : 0,
      disorder: (mode === "anomaly" || mode === "hybrid") ? num("disorderDmgPct") : 0,
    };

    return {
      schemaVersion: 3,
      saveName: $("saveName").value.trim() || "My Build",
      mode,

      agent: {
        level: Math.max(1, Math.floor(num("agentLevel", 60))),
        atkBase: num("atkBase", 2000),
        atkFlatBonus: num("atkFlatBonus", 0),
        attribute: $("attribute").value,
        skillMultPct: num("skillMultPct", 300),
        specialMult: num("specialMult", 1),

        crit: {
          rate: clamp(num("critRatePct", 50) / 100, 0, 1),
          dmg: Math.max(0, num("critDmgPct", 100) / 100)
        },

        dmgBuckets,

        penRatioPct: Math.max(0, num("penRatioPct")),
        penFlat: Math.max(0, num("penFlat")),
        defIgnorePct: Math.max(0, num("defIgnorePct")),

        rupture: {
          sheerForce: Math.max(0, num("sheerForce")),
          sheerDmgBonusPct: num("sheerDmgBonusPct"),
          atkToSheerPct: num("atkToSheerPct")
        },

        anomaly: {
          // AP (Anomaly Proficiency) directly scales anomaly damage: AP bonus = AP / 100.
          proficiency: Math.max(0, num("anomProf", 0)),

          type: $("anomType") ? $("anomType").value : "auto",

          // Frequency inputs (needed for per-rotation totals)
          triggersPerRot: Math.max(0, num("anomTriggersPerRot", 0)),
          disorderTriggersPerRot: Math.max(0, num("disorderTriggersPerRot", 0)),

          // Advanced/legacy fields (not shown in UI). Kept for backward-compat.
          mastery: 0,
          baseManual: 0,
          procCount: 1,
          durationSec: 10,
          allowCrit: false,
          specialMult: 1
        }
      },

      enemy: {
        level: Math.max(1, Math.floor(num("enemyLevel", 60))),
        def: Math.max(0, Math.floor(num("enemyDef", 0))),
        resAllPct: num("enemyResAllPct", 0),
        resByAttr: {
          physical: optNum("enemyResPhysicalPct") ?? 0,
          fire: optNum("enemyResFirePct") ?? 0,
          ice: optNum("enemyResIcePct") ?? 0,
          electric: optNum("enemyResElectricPct") ?? 0,
          ether: optNum("enemyResEtherPct") ?? 0,
        },

        defReductionPct: num("defReductionPct", 0),
        defMultOverride: optNum("defMultOverride"),
        enemyDmgTakenMult: optNum("enemyDmgTakenMult"),

        dmgTakenPct: num("dmgTakenPct", 0),
        stunned,
        stunPct: num("stunPct", 100),
        dmgTakenStunnedPct: stunned ? num("dmgTakenStunnedPct", 0) : 0,
        dazeVulnMult: num("dazeVulnMult", 1)
      },

      meta: { updatedAt: new Date().toISOString() }
    };
  }

  // ===========================
  // Preview output model
  // ===========================
  function computeZones(i) {
    const atkTotal = (i.agent.atkBase + i.agent.atkFlatBonus);
    const atkEffective = atkTotal;

    const base = atkEffective * (i.agent.skillMultPct / 100);

    const dmgPctTotal =
      i.agent.dmgBuckets.generic +
      i.agent.dmgBuckets.attribute +
      i.agent.dmgBuckets.skillType +
      i.agent.dmgBuckets.other +
      i.agent.dmgBuckets.vsStunned;

    const dmgMult = pctToMult(dmgPctTotal);

    const critRate = i.agent.crit.rate;
    const critDmg = i.agent.crit.dmg;

    // Expected crit multiplier: E = 1*(1-CR) + (1+CD)*CR = 1 + CR*CD
    const critMult_expected = 1 + (critRate * critDmg);

    const attr = i.agent.attribute;
    const resPct = (i.enemy.resAllPct || 0) + ((i.enemy.resByAttr && i.enemy.resByAttr[attr]) || 0);
    const resMult = 1 - (resPct / 100);

    const defMult = (i.enemy.defMultOverride !== null && i.enemy.defMultOverride !== undefined)
      ? clamp(i.enemy.defMultOverride, 0, 1)
      : computeDefMult(i);

    const dmgTakenPctTotal = i.enemy.dmgTakenPct + i.enemy.dmgTakenStunnedPct;
    const dmgTakenMultOverride = (i.enemy.enemyDmgTakenMult !== null && i.enemy.enemyDmgTakenMult !== undefined)
      ? Math.max(0, i.enemy.enemyDmgTakenMult)
      : 1;
    const dmgTakenMult = pctToMult(dmgTakenPctTotal) * dmgTakenMultOverride;

    const stunMult = i.enemy.stunned ? (i.enemy.stunPct / 100) : 1;
    const dazeVulnMult = i.enemy.stunned ? i.enemy.dazeVulnMult : 1;

    const specialMult = i.agent.specialMult;

    return {
      atkTotal,
      atkEffective,
      base,
      dmgPctTotal,
      dmgMult,
      critRate,
      critDmg,
      critMult_expected,
      defMult,
      resMult,
      dmgTakenMult,
      stunMult,
      dazeVulnMult,
      specialMult
    };
  }

  function computePreviewOutput(i) {
    const z = computeZones(i);

    // Base (non-crit) damage
    const nonCritPerHit =
      z.base *
      z.dmgMult *
      1 *
      z.defMult *
      z.resMult *
      z.dmgTakenMult *
      z.stunMult *
      z.dazeVulnMult *
      z.specialMult;

    // Crit damage (when crit happens)
    const critPerHit = nonCritPerHit * (1 + z.critDmg);

    // Expected damage (AVG) weighted by crit rate
    const expectedPerHit = nonCritPerHit * (1 + (z.critRate * z.critDmg));

    const nonCritTotal = nonCritPerHit;
    const critTotal = critPerHit;
    const expectedTotal = expectedPerHit;

    // ===== Anomaly / Disorder (ZZZ-style approximation) =====
    // Community formula summary:
    // Outgoing Anomaly DMG = Base * DMG% * DEF * RES * DMG Taken * Stun * (AP/100) * BuffLevelMult

    const resolveAnomType = (attr, t) => {
      if (t && t !== "auto") return t;
      return ({
        physical: "assault",
        fire: "burn",
        electric: "shock",
        ice: "shatter",
        ether: "corruption",
      }[attr] || "assault");
    };

    // Base multipliers per anomaly type (per proc/tick/hit)
    const ANOM_MV_PER_PROC = {
      burn: 0.50,        // 50% * ATK per tick
      shock: 1.25,       // 125% * ATK per tick
      corruption: 0.625, // 62.5% * ATK per tick
      shatter: 5.00,     // 500% * ATK once
      assault: 7.13      // 713% * ATK once
    };

    // Default proc counts for a full trigger window (no timing UI):
    // Burn/Corruption: 10s @ 0.5s ticks => 20 procs
    // Shock: 10s @ 1s ticks => 10 procs (cap 16)
    // Shatter/Assault: 1 proc
    const DEFAULT_PROC_COUNT = { assault: 1, burn: 20, shock: 10, shatter: 1, corruption: 20 };

    const anomType = resolveAnomType(i.agent.attribute, i.agent.anomaly.type || "auto");
    const procCount = DEFAULT_PROC_COUNT[anomType] || 1;

    const basePerProc = (ANOM_MV_PER_PROC[anomType] || 0) * Math.max(0, z.atkEffective);
    const basePerTrigger = basePerProc * procCount;

    // DMG% for anomalies: Generic + Attribute + Anomaly/Disorder bucket (exclude Skill-Type DMG%).
    const anomalyDmgPctTotal =
      (i.agent.dmgBuckets.generic || 0) +
      (i.agent.dmgBuckets.attribute || 0) +
      (i.agent.dmgBuckets.anomaly || 0);

    const disorderDmgPctTotal =
      (i.agent.dmgBuckets.generic || 0) +
      (i.agent.dmgBuckets.attribute || 0) +
      (i.agent.dmgBuckets.disorder || 0);

    const anomalyMult = pctToMult(anomalyDmgPctTotal);
    const disorderMult = pctToMult(disorderDmgPctTotal);

    // AP bonus: AP / 100 (so 100 AP = 1.00x)
    const apBonus = Math.max(0, i.agent.anomaly.proficiency || 0) / 100;

    // Buff level multiplier approximation (community guide): 1 + 0.0169 * (Level - 1)
    const buffLvlMult = 1 + 0.0169 * (Math.max(1, i.agent.level) - 1);

    // Anomalies typically cannot crit (we keep crit disabled in UI), so no crit multiplier here.

    const anomalyPerTrigger =
      basePerTrigger *
      anomalyMult *
      z.defMult *
      z.resMult *
      z.dmgTakenMult *
      z.stunMult *
      apBonus *
      buffLvlMult;

    // Disorder approximation:
    // Based on remaining procs; without timing UI we assume full remaining procs.
    // Shock disorder adds +6 extra procs.
    const disorderExtraProcs = (anomType === "shock") ? 6 : 0;
    const disorderBase = basePerProc * (procCount + disorderExtraProcs);

    const disorderPerTrigger =
      disorderBase *
      disorderMult *
      z.defMult *
      z.resMult *
      z.dmgTakenMult *
      z.stunMult *
      apBonus *
      buffLvlMult;

    const anomalyPerRot = anomalyPerTrigger * (i.agent.anomaly.triggersPerRot || 0);
    const disorderPerRot = disorderPerTrigger * (i.agent.anomaly.disorderTriggersPerRot || 0);

    const anomalyPerProc = procCount > 0 ? (anomalyPerTrigger / procCount) : 0;


    const sheerFromAtk = z.atkEffective * (i.agent.rupture.atkToSheerPct / 100);
    const sheerForceEffective = i.agent.rupture.sheerForce + sheerFromAtk;
    const sheerDmgMult = pctToMult(i.agent.rupture.sheerDmgBonusPct);
    const sheerPerHit =
      sheerForceEffective *
      (i.agent.skillMultPct / 100) *
      sheerDmgMult *
      z.resMult *
      z.dmgTakenMult *
      z.stunMult *
      z.dazeVulnMult *
      z.specialMult;

    let outputNonCrit = nonCritTotal;
    let outputCrit = critTotal;
    let outputExpected = expectedTotal;

    if (i.mode === "anomaly") {
      // Anomaly is typically non-crit (so AVG = total)
      outputNonCrit = anomalyPerRot + disorderPerRot;
      outputCrit = outputNonCrit;
      outputExpected = outputNonCrit;
    }
    if (i.mode === "rupture") {
      // Rupture is typically non-crit (so AVG = total)
      outputNonCrit = sheerPerHit;
      outputCrit = outputNonCrit;
      outputExpected = outputNonCrit;
    }
    if (i.mode === "hybrid") {
      const add = anomalyPerRot + disorderPerRot;
      outputNonCrit = nonCritTotal + add;
      outputCrit = critTotal + add;
      outputExpected = expectedTotal + add;
    }

    return {
      zones: z,

      standard_noncrit_per_hit: nonCritPerHit,
      standard_crit_per_hit: critPerHit,
      standard_expected_per_hit: expectedPerHit,
      standard_noncrit_total: nonCritTotal,
      standard_crit_total: critTotal,
      standard_expected_total: expectedTotal,

      anomaly_total: anomalyPerRot + disorderPerRot,
      anomaly_per_trigger: anomalyPerTrigger,
      anomaly_per_proc: anomalyPerProc,
      anomaly_proc_count: procCount,
      anomaly_type: anomType,
      rupture_total: sheerPerHit,

      output_noncrit: outputNonCrit,
      output_crit: outputCrit,
      output_expected: outputExpected,
      output: outputExpected
    };
  }

  // ===========================
  // Diminishing returns / marginal value table
  // ===========================
  function getDeltaConfig() {
    const p = Number($("deltaPreset").value);
    const basis = $("marginalBasis") ? $("marginalBasis").value : "raw";

    const equiv = {
      main: { penRatioPct: 24, dmgAttrPct: 30, hpPct: 30, critRatePct: null, critDmgPct: null },
      sub:  { penRatioPct: null, dmgAttrPct: null, hpPct: 3,  critRatePct: 2.4, critDmgPct: 4.8 }
    };

    return {
      basis,
      raw: { pct: p, atkFlat: p * 10, penFlat: p * 10 },
      equiv
    };
  }

  function getDeltaForKey(key, i, cfg) {
    const raw = cfg.raw;

    if (cfg.basis === "raw") {
      if (key === "atkBase") return { kind: "flat", value: raw.atkFlat };
      if (key === "penFlat" || key === "sheerForce") return { kind: "flat", value: raw.penFlat };
      return { kind: "pct", value: raw.pct };
    }

    const eq = cfg.equiv[cfg.basis] || {};
    const pctOrRaw = (v) => (typeof v === "number" && !Number.isNaN(v)) ? v : raw.pct;

    switch (key) {
      case "atkBase":
        return { kind: "flat", value: raw.atkFlat };

      case "dmgAttrPct":
        return { kind: "pct", value: pctOrRaw(eq.dmgAttrPct) };

      case "penRatioPct":
        return { kind: "pct", value: pctOrRaw(eq.penRatioPct) };

      case "critRatePct":
        return { kind: "pct", value: pctOrRaw(eq.critRatePct) };
      case "critDmgPct":
        return { kind: "pct", value: pctOrRaw(eq.critDmgPct) };

      default:
        if (key === "penFlat" || key === "sheerForce") return { kind: "flat", value: raw.penFlat };
        return { kind: "pct", value: raw.pct };
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function applyDelta(i, key, deltaCfg) {
    const j = clone(i);
    const d = getDeltaForKey(key, i, deltaCfg);

    const dp = (d.kind === "pct") ? d.value : deltaCfg.raw.pct;
    const df = (d.kind === "flat") ? d.value : deltaCfg.raw.penFlat;

    switch (key) {
      case "atkBase": j.agent.atkBase += df; break;

      case "dmgGenericPct": j.agent.dmgBuckets.generic += dp; break;
      case "dmgAttrPct": j.agent.dmgBuckets.attribute += dp; break;
      case "dmgSkillTypePct": j.agent.dmgBuckets.skillType += dp; break;
      case "dmgOtherPct": j.agent.dmgBuckets.other += dp; break;
      case "dmgVsStunnedPct": j.agent.dmgBuckets.vsStunned += dp; break;

      case "critRatePct":
        j.agent.crit.rate = clamp(j.agent.crit.rate + (dp / 100), 0, 1); break;
      case "critDmgPct":
        j.agent.crit.dmg += (dp / 100); break;

      case "dmgTakenPct": j.enemy.dmgTakenPct += dp; break;
      case "dmgTakenStunnedPct": j.enemy.dmgTakenStunnedPct += dp; break;
      case "stunPct": j.enemy.stunPct += dp; break;
      case "dazeVulnMult":
        j.enemy.dazeVulnMult += 0.05 * (deltaCfg.raw.pct / 5); break;

      case "defReductionPct": j.enemy.defReductionPct += dp; break;
      case "penRatioPct": j.agent.penRatioPct += dp; break;
      case "penFlat": j.agent.penFlat += df; break;
      case "defIgnorePct": j.agent.defIgnorePct += dp; break;

      case "sheerForce": j.agent.rupture.sheerForce += df; break;
      case "sheerDmgBonusPct": j.agent.rupture.sheerDmgBonusPct += dp; break;

      case "anomDmgPct": j.agent.dmgBuckets.anomaly += dp; break;
      case "disorderDmgPct": j.agent.dmgBuckets.disorder += dp; break;

      default: break;
    }
    return { j, applied: d };
  }

  function statMeta() {
    return [
      { key:"atkBase",         label:"Total ATK" },

      { key:"dmgGenericPct",   label:"Generic DMG%" },
      { key:"dmgAttrPct",      label:"Attribute DMG%" },
      { key:"dmgSkillTypePct", label:"Skill DMG% (Basic/Special/Ult)" },

      { key:"critRatePct",     label:"Crit Rate (%)" },
      { key:"critDmgPct",      label:"Crit DMG (%)" },

      { key:"dmgTakenPct",     label:"Damage Taken +%" },
      { key:"stunPct",         label:"Stunned Multiplier (%)" },

      { key:"defReductionPct", label:"DEF Reduction (%)" },
      { key:"penRatioPct",     label:"PEN Ratio (%)" },
      { key:"penFlat",         label:"PEN" },
      { key:"defIgnorePct",    label:"DEF Ignore (%)" },

      { key:"sheerForce",      label:"Sheer Force" },
      { key:"sheerDmgBonusPct",label:"Sheer DMG Bonus (%)" },

      { key:"anomDmgPct",      label:"Anomaly DMG%" },
      { key:"disorderDmgPct",  label:"Disorder DMG%" },
    ];
  }

  function computeMarginals(i) {
    const base = computePreviewOutput(i);
    const baseOut = base.output;

    const deltaCfg = getDeltaConfig();

    const rows = [];
    for (const m of statMeta()) {
      if (i.mode !== "rupture" && (m.key === "sheerForce" || m.key === "sheerDmgBonusPct")) continue;
      if (i.mode === "standard" && (m.key === "anomDmgPct" || m.key === "disorderDmgPct")) continue;

      const { j, applied } = applyDelta(i, m.key, deltaCfg);
      const out2 = computePreviewOutput(j).output;
      const gain = out2 - baseOut;
      const pctGain = baseOut !== 0 ? (gain / baseOut) * 100 : 0;

      let deltaText = "";
      if (m.key === "dazeVulnMult") {
        const step = 0.05 * (deltaCfg.raw.pct / 5);
        deltaText = `+${fmt1(step)} mult`;
      } else if (m.key === "atkBase") {
        deltaText = `+${fmt1(applied.value)} ATK`;
      } else if (applied.kind === "flat") {
        deltaText = `+${fmt1(applied.value)} (flat)`;
      } else {
        deltaText = `+${fmt1(applied.value)}%`;
      }

      rows.push({ ...m, deltaText, out2, gain, pctGain });
    }

    rows.sort((a,b) => b.pctGain - a.pctGain);
    return { base, rows };
  }

  // ===========================
  // Save/Load/Export/Import
  // ===========================
  function saveBuild() {
    const data = readInputs();
    const name = (data.saveName || "").trim() || "My Build";
    data.saveName = name;
    const saves = getAllSaves();
    saves[name] = data;
    setAllSaves(saves);
    alert(`Saved "${name}".`);
  }

  function loadBuild() {
    const name = ($("saveName").value || "").trim() || "My Build";
    const saves = getAllSaves();
    const data = saves[name];
    if (!data) {
      alert(`No save found named "${name}".`);
      return;
    }
    applyImportedData(data);
    refresh();
    alert(`Loaded "${name}".`);
  }

  function exportJSON() {
    const data = readInputs();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(data.saveName || "build").replaceAll(" ", "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSONFile(file) {
    const r = new FileReader();
    r.onload = () => {
      try { applyInputs(JSON.parse(r.result)); refresh(); }
      catch { alert("Invalid JSON."); }
    };
    r.readAsText(file);
  }

  // ===========================
  // Apply inputs to form
  // ===========================
  function setVal(id, v) { const el = $(id); if (el) el.value = v; }

  function applyInputs(d) {
    setVal("saveName", d.saveName ?? "My Build");
    setVal("mode", d.mode ?? "standard");

    setVal("agentLevel", d.agent?.level ?? 60);
    setVal("atkBase", d.agent?.atkBase ?? d.agent?.atkFlat ?? 2000);
    setVal("atkFlatBonus", d.agent?.atkFlatBonus ?? 0);
    setVal("skillMultPct", d.agent?.skillMultPct ?? 300);
    setVal("critRatePct", ((d.agent?.crit?.rate ?? 0.5) * 100));
    setVal("critDmgPct", ((d.agent?.crit?.dmg ?? 1.0) * 100));
    setVal("attribute", d.agent?.attribute ?? "physical");
    setVal("specialMult", d.agent?.specialMult ?? 1);

    const b = d.agent?.dmgBuckets ?? {};
    setVal("dmgGenericPct", b.generic ?? 0);
    setVal("dmgAttrPct", b.attribute ?? 0);
    setVal("dmgSkillTypePct", b.skillType ?? 0);
    setVal("dmgOtherPct", b.other ?? 0);
    setVal("dmgVsStunnedPct", b.vsStunned ?? 0);
    setVal("anomDmgPct", b.anomaly ?? 0);
    setVal("disorderDmgPct", b.disorder ?? 0);

    setVal("enemyLevel", d.enemy?.level ?? 60);
    setVal("enemyDef", d.enemy?.def ?? 0);
    setVal("enemyResAllPct", d.enemy?.resAllPct ?? 0);
    setVal("enemyResPhysicalPct", d.enemy?.resByAttr?.physical ?? "");
    setVal("enemyResFirePct", d.enemy?.resByAttr?.fire ?? "");
    setVal("enemyResIcePct", d.enemy?.resByAttr?.ice ?? "");
    setVal("enemyResElectricPct", d.enemy?.resByAttr?.electric ?? "");
    setVal("enemyResEtherPct", d.enemy?.resByAttr?.ether ?? "");
    setVal("defReductionPct", d.enemy?.defReductionPct ?? 0);
    setVal("penRatioPct", d.agent?.penRatioPct ?? 0);
    setVal("penFlat", d.agent?.penFlat ?? 0);
    setVal("defIgnorePct", d.agent?.defIgnorePct ?? 0);

    const defOverride = (d.enemy?.defMultOverride !== undefined && d.enemy?.defMultOverride !== null)
      ? d.enemy.defMultOverride
      : ((d.enemy?.useManualDefMult) ? (d.enemy?.defMultManual ?? 1) : null);
    setVal("defMultOverride", defOverride ?? "");
    setVal("enemyDmgTakenMult", (d.enemy?.enemyDmgTakenMult ?? "") );

    setVal("dmgTakenPct", d.enemy?.dmgTakenPct ?? 0);
    setVal("isStunned", String(!!d.enemy?.stunned));
    setVal("stunPct", d.enemy?.stunPct ?? 100);
    setVal("dmgTakenStunnedPct", d.enemy?.dmgTakenStunnedPct ?? 0);
    setVal("dazeVulnMult", d.enemy?.dazeVulnMult ?? 1);

    setVal("sheerForce", d.agent?.rupture?.sheerForce ?? 0);
    setVal("sheerDmgBonusPct", d.agent?.rupture?.sheerDmgBonusPct ?? 0);
    setVal("atkToSheerPct", d.agent?.rupture?.atkToSheerPct ?? 30);

    setVal("anomMastery", d.agent?.anomaly?.mastery ?? 0);
    setVal("anomProf", d.agent?.anomaly?.proficiency ?? 0);
    setVal("anomBaseManual", d.agent?.anomaly?.baseManual ?? 0);
    setVal("anomTriggersPerRot", d.agent?.anomaly?.triggersPerRot ?? 0);
    setVal("disorderTriggersPerRot", d.agent?.anomaly?.disorderTriggersPerRot ?? 0);
    setVal("anomSpecialMult", d.agent?.anomaly?.specialMult ?? 1);
  }

  function resetAll() {
    applyInputs({
      saveName: "My Build",
      mode: "standard",
      agent: {
        level: 60,
        atkBase: 2000, atkFlatBonus: 0, attribute: "physical",
        skillMultPct: 300, specialMult: 1,
        crit: { rate: 0.5, dmg: 1.0 },
        dmgBuckets: { generic:0, attribute:0, skillType:0, other:0, vsStunned:0, anomaly:0, disorder:0 },
        penRatioPct: 0, penFlat: 0, defIgnorePct: 0,
        rupture: { sheerForce: 0, sheerDmgBonusPct: 0, atkToSheerPct: 30 },
        anomaly: { mastery: 0, proficiency: 0, baseManual: 0, triggersPerRot: 0, disorderTriggersPerRot: 0, specialMult: 1 }
      },
      enemy: {
        level: 60, def: 0, resAllPct: 0, resByAttr: { physical:0, fire:0, ice:0, electric:0, ether:0 },
        defReductionPct: 0, defMultOverride: null, enemyDmgTakenMult: null,
        dmgTakenPct: 0, stunned: false, stunPct: 100, dmgTakenStunnedPct: 0, dazeVulnMult: 1
      },
      meta: {}
    });
    refresh();
  }

  // ===========================
  // Visibility controls
  // ===========================
  function applyModeVisibility(mode) {
    const showAnom = (mode === "anomaly" || mode === "hybrid");
    const showRupture = (mode === "rupture");
    $("anomalyHeader").classList.toggle("hidden", !showAnom);
    $("anomalyCard").classList.toggle("hidden", !showAnom);
    $("ruptureHeader").classList.toggle("hidden", !showRupture);
    $("ruptureCard").classList.toggle("hidden", !showRupture);
  }

  // ===========================
  // Render
  // ===========================
  function refresh() {
    const i = readInputs();
    applyModeVisibility(i.mode);

    const out = computePreviewOutput(i);

    // KPI tiles: show only what matches the selected mode
    const mode = i.mode;
    const labelPrefix =
      (mode === "standard") ? "Output" :
      (mode === "anomaly")  ? "Anomaly Output" :
      (mode === "rupture")  ? "Rupture Output" :
      "Combined Output"; // hybrid

    const kpiItems = [
      { t:`${labelPrefix} (AVG)`,    v: fmt0(out.output_expected) },
      { t:`${labelPrefix} (Normal)`, v: fmt0(out.output_noncrit) },
      { t:`${labelPrefix} (Crit)`,   v: fmt0(out.output_crit) },
    ];

    if (mode === "anomaly") {
      const typeLabel = (out.anomaly_type || "").replace(/(^\w|_\w)/g, (m) => m.replace("_"," ").toUpperCase());
      kpiItems.push(
        { t:"Anomaly Total (per rotation)", v: fmt0(out.anomaly_total) },
        { t:`Anomaly Per Trigger (${typeLabel || "Auto"})`, v: fmt0(out.anomaly_per_trigger) },
        { t:"Anomaly Per Proc/Tick", v: fmt0(out.anomaly_per_proc) },
        { t:"Anomaly Proc Count", v: String(out.anomaly_proc_count ?? "") },
      );
    }

    if (mode === "hybrid") {
      kpiItems.push(
        { t:"Standard (AVG) only", v: fmt0(out.standard_expected_total) },
        { t:"Anomaly Total",       v: fmt0(out.anomaly_total) },
        { t:"Anomaly Per Proc/Tick", v: fmt0(out.anomaly_per_proc) },
      );
    }

    $("kpi").innerHTML = kpiItems
      .map(x => `<div class="box"><div class="t">${x.t}</div><div class="v">${x.v}</div></div>`)
      .join("");

    const { rows } = computeMarginals(i);

    const topSel = $("topN").value;
    const shown = (topSel === "all") ? rows : rows.slice(0, Number(topSel));

    $("marginalBody").innerHTML = shown.map(r => `
      <tr>
        <td>${r.label}</td>
        <td>${r.deltaText}</td>
        <td>${fmt0(r.out2)}</td>
        <td>${fmt1(r.gain)}</td>
        <td>${fmt1(r.pctGain)}%</td>
      </tr>
    `).join("");
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

  document.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", refresh);
    el.addEventListener("change", refresh);
  });

  // Init
  refresh();
