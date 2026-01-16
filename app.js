// ===========================
  // Helpers
  // ===========================
  const $ = (id) => document.getElementById(id);

  // Per-stat custom deltas for the Marginal table's editable “Δ Stat” column
  // key -> { kind: "pct" | "flat", value: number }
  const CUSTOM_APPLIED = Object.create(null);

  // Default deltas (used when the user hasn't overridden a row)
  const DEFAULT_DELTA = {
    pct: 1,      // +1% for % stats
    atk: 10,     // +10 ATK
    penFlat: 10, // +10 PEN
    sheerForce: 10,
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
  const clone = (x) => JSON.parse(JSON.stringify(x));

  const pctToMult = (pct) => 1 + (pct / 100);

  // ===========================
  // Data model (inputs)
  // ===========================
  function defaultInputs() {
    return {
      saveName: "1",
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
          mastery: 0,
          dmgPct: 0,
          disorderPct: 0,
          triggersPerRot: 0,
          disorderTriggersPerRot: 0,

          // legacy fields kept in saves (not used in calculations)
          baseManual: 0,
          procCount: 1,
          allowCrit: false,
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

        defReductionPct: 0,
        defIgnorePct: 0,

        dmgTakenPct: 0,
        dmgTakenStunnedPct: 0,

        isStunned: false,
        stunPct: 100,

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
      { key: "dmgSkillTypePct", label: "Skill DMG (Basic/Special/Ult)" },

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

    i.saveName = ($("saveName").value || "1");
    i.mode = $("mode").value;

    i.agent.level = num("agentLevel", 60);
    i.agent.attribute = $("attribute").value;
    i.agent.atkBase = num("atkBase", 0);

    i.agent.crit.rate = clamp(num("critRatePct", 0) / 100, 0, 1);
    i.agent.crit.dmg = num("critDmgPct", 0) / 100;

    i.agent.dmgBuckets.generic = num("dmgGenericPct", 0);
    i.agent.dmgBuckets.attribute = num("dmgAttrPct", 0);
    i.agent.dmgBuckets.skillType = num("dmgSkillTypePct", 0);

    i.agent.penRatioPct = num("penRatioPct", 0);
    i.agent.penFlat = num("penFlat", 0);

    i.agent.skillMultPct = num("skillMultPct", 100);

    // Anomaly
    i.agent.anomaly.type = $("anomType").value;
    i.agent.anomaly.prof = num("anomProf", 0);
    i.agent.anomaly.mastery = num("anomMastery", 0);
    i.agent.anomaly.dmgPct = num("anomDmgPct", 0);
    i.agent.anomaly.disorderPct = num("disorderDmgPct", 0);
    i.agent.anomaly.triggersPerRot = num("anomTriggersPerRot", 0);
    i.agent.anomaly.disorderTriggersPerRot = num("disorderTriggersPerRot", 0);

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

    i.enemy.defReductionPct = num("defReductionPct", 0);
    i.enemy.defIgnorePct = num("defIgnorePct", 0);

    i.enemy.dmgTakenPct = num("dmgTakenPct", 0);
    i.enemy.isStunned = ($("isStunned").value === "true");
    i.enemy.stunPct = num("stunPct", 100);

    // Marginal config (legacy fields kept for backward-compatible saves)
    // The UI controls for these were removed; the table uses per-row Δ Stat inputs.
    const deltaPresetEl = $("deltaPreset");
    const basisEl = $("marginalBasis");
    const topNEl = $("topN");
    i.marginal.deltaPreset = deltaPresetEl ? deltaPresetEl.value : "1";
    i.marginal.basis = basisEl ? basisEl.value : "raw";
    i.marginal.topN = topNEl ? topNEl.value : "all";

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
    const map = {
      physical: enemy.resPhysicalPct,
      fire: enemy.resFirePct,
      ice: enemy.resIcePct,
      electric: enemy.resElectricPct,
      ether: enemy.resEtherPct,
    };
    const specific = map[attr];
    return (specific !== null && specific !== undefined) ? specific : enemy.resAllPct;
  }

  function computeDefMult(i) {
    const aLv = Math.max(1, i.agent.level);
    const eLv = Math.max(1, i.enemy.level);

    let def = Math.max(0, i.enemy.def);

    // Shred + ignore as additive percent of enemy DEF (applied before PEN flat)
    const defPctDown = clamp((i.enemy.defReductionPct + i.enemy.defIgnorePct) / 100, 0, 0.95);
    def = def * (1 - defPctDown);

    // Flat PEN reduces remaining DEF (clamped)
    const pen = Math.max(0, i.agent.penFlat);
    def = Math.max(0, def - pen);

    const ratio = clamp(i.agent.penRatioPct / 100, 0, 0.95);
    def = def * (1 - ratio);

    // Classic (aLv + 100) / (aLv + 100 + def)
    const k = aLv + 100;
    const mult = k / (k + def);
    return mult;
  }

  function computeResMult(i) {
    const resPct = getResPctForAttribute(i.enemy, i.agent.attribute);
    // Simple model: multiplier = 1 - RES (can go above 1 if negative)
    return 1 - (resPct / 100);
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

    const vuln = pctToMult(i.enemy.dmgTakenPct);
    const stunMult = i.enemy.isStunned ? (i.enemy.stunPct / 100) : 1;

    const base = atk * skill * dmgMult * defMult * resMult * vuln * stunMult;

    const nonCrit = base;
    const crit = base * (1 + i.agent.crit.dmg);

    const cr = clamp(i.agent.crit.rate, 0, 1);
    const expected = nonCrit * (1 - cr) + crit * cr;

    return { nonCrit, crit, expected };
  }

  // NOTE: this is still your existing anomaly model (not crit-enabled).
  // If you later want “anomaly crit special cases”, we can extend it.
  const DEFAULT_PROC_COUNT = {
    assault: 1,
    burn: 1,
    shock: 1,
    shatter: 1,
    corruption: 1,
    auto: 1,
  };

  function inferAnomType(i) {
    if (i.agent.anomaly.type !== "auto") return i.agent.anomaly.type;
    const attr = i.agent.attribute;
    if (attr === "physical") return "assault";
    if (attr === "fire") return "burn";
    if (attr === "electric") return "shock";
    if (attr === "ice") return "shatter";
    if (attr === "ether") return "corruption";
    return "assault";
  }

  function computeAnomalyOutput(i) {
    const anomType = inferAnomType(i);
    const procCount = DEFAULT_PROC_COUNT[anomType] ?? 1;

    // Simplified model: base scales with ATK and mastery/prof
    const atk = i.agent.atkBase;
    const prof = i.agent.anomaly.prof;
    const mastery = i.agent.anomaly.mastery;

    // This is placeholder-ish but matches your current approach.
    const baseAnom = atk * (1 + mastery / 1000) * (1 + prof / 1000);
    const anomalyMult = pctToMult(i.agent.anomaly.dmgPct);
    const disorderMult = pctToMult(i.agent.anomaly.disorderPct);

    const anomalyPerTrigger = baseAnom * anomalyMult * procCount;
    const disorderPerTrigger = baseAnom * disorderMult * procCount;

    const anomalyPerRot = anomalyPerTrigger * i.agent.anomaly.triggersPerRot;
    const disorderPerRot = disorderPerTrigger * i.agent.anomaly.disorderTriggersPerRot;

    return {
      anomalyPerTrigger,
      disorderPerTrigger,
      anomalyPerRot,
      disorderPerRot,
      combinedPerRot: anomalyPerRot + disorderPerRot,
    };
  }

  function computeRuptureOutput(i) {
    const sheerForce = i.agent.rupture.sheerForce;
    const sheerBonus = pctToMult(i.agent.rupture.sheerDmgBonusPct);

    // Placeholder: base rupture uses sheerForce scaled by bonus
    const out = sheerForce * sheerBonus;
    return { out };
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
        anomaly_per_trigger: anom.anomalyPerTrigger,
        disorder_per_trigger: anom.disorderPerTrigger,
        anomaly_per_rotation: anom.anomalyPerRot,
        disorder_per_rotation: anom.disorderPerRot,
        output_expected: anom.combinedPerRot,
        output: anom.combinedPerRot,
      };
    }

    if (i.mode === "rupture") {
      return {
        mode: i.mode,
        rupture: rup.out,
        output_expected: rup.out,
        output: rup.out,
      };
    }

    // hybrid
    return {
      mode: i.mode,
      output_noncrit: std.nonCrit,
      output_crit: std.crit,
      output_expected: std.expected + anom.combinedPerRot,
      output: std.expected + anom.combinedPerRot,
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

      rows.push({ ...m, applied, deltaText, out2, gain, pctGain });
    }

    rows.sort((a,b) => b.pctGain - a.pctGain);
    return { base, rows };
  }

  // ===========================
  // Save/Load/Export/Import
  // ===========================
  function getAllSaves() {
    try {
      return JSON.parse(localStorage.getItem("zzz_calc_saves") || "{}");
    } catch {
      return {};
    }
  }
  function setAllSaves(saves) {
    localStorage.setItem("zzz_calc_saves", JSON.stringify(saves));
  }

  function applyImportedData(data) {
    // minimal: write values back to UI (keeping ids stable)
    $("saveName").value = data.saveName ?? "1";
    $("mode").value = data.mode ?? "standard";

    $("agentLevel").value = data.agent?.level ?? 60;
    $("attribute").value = data.agent?.attribute ?? "physical";
    $("atkBase").value = data.agent?.atkBase ?? 0;

    $("critRatePct").value = ((data.agent?.crit?.rate ?? 0) * 100);
    $("critDmgPct").value = ((data.agent?.crit?.dmg ?? 0) * 100);

    $("dmgGenericPct").value = data.agent?.dmgBuckets?.generic ?? 0;
    $("dmgAttrPct").value = data.agent?.dmgBuckets?.attribute ?? 0;
    $("dmgSkillTypePct").value = data.agent?.dmgBuckets?.skillType ?? 0;

    $("penRatioPct").value = data.agent?.penRatioPct ?? 0;
    $("penFlat").value = data.agent?.penFlat ?? 0;

    $("skillMultPct").value = data.agent?.skillMultPct ?? 100;

    $("anomType").value = data.agent?.anomaly?.type ?? "auto";
    $("anomProf").value = data.agent?.anomaly?.prof ?? 0;
    $("anomMastery").value = data.agent?.anomaly?.mastery ?? 0;
    $("anomDmgPct").value = data.agent?.anomaly?.dmgPct ?? 0;
    $("disorderDmgPct").value = data.agent?.anomaly?.disorderPct ?? 0;
    $("anomTriggersPerRot").value = data.agent?.anomaly?.triggersPerRot ?? 0;
    $("disorderTriggersPerRot").value = data.agent?.anomaly?.disorderTriggersPerRot ?? 0;

    $("sheerForce").value = data.agent?.rupture?.sheerForce ?? 0;
    $("sheerDmgBonusPct").value = data.agent?.rupture?.sheerDmgBonusPct ?? 0;

    $("enemyLevel").value = data.enemy?.level ?? 70;
    $("enemyDef").value = data.enemy?.def ?? 0;

    $("enemyResAllPct").value = data.enemy?.resAllPct ?? 0;
    $("enemyResPhysicalPct").value = data.enemy?.resPhysicalPct ?? "";
    $("enemyResFirePct").value = data.enemy?.resFirePct ?? "";
    $("enemyResIcePct").value = data.enemy?.resIcePct ?? "";
    $("enemyResElectricPct").value = data.enemy?.resElectricPct ?? "";
    $("enemyResEtherPct").value = data.enemy?.resEtherPct ?? "";

    $("defReductionPct").value = data.enemy?.defReductionPct ?? 0;
    $("defIgnorePct").value = data.enemy?.defIgnorePct ?? 0;

    $("dmgTakenPct").value = data.enemy?.dmgTakenPct ?? 0;
    $("isStunned").value = String(data.enemy?.isStunned ?? false);
    $("stunPct").value = data.enemy?.stunPct ?? 100;

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
    const name = (data.saveName || "").trim() || "My Build";
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zzz_build.json";
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

    const mode = i.mode;
    const labelPrefix =
      (mode === "standard") ? "Output" :
      (mode === "anomaly")  ? "Anomaly Output" :
      (mode === "rupture")  ? "Rupture Output" :
      "Combined Output";

    const kpiItems = [
      { t:`DMG (AVG)`,    v: fmt0(out.output_expected) },
    ];

    if (mode === "standard" || mode === "hybrid") {
      kpiItems.push({ t:`DMG (Non-Crit)`, v: fmt0(out.output_noncrit) });
      kpiItems.push({ t:`DMG (Crit)`,     v: fmt0(out.output_crit) });
    }

    if (mode === "anomaly" || mode === "hybrid") {
      kpiItems.push({ t:`Anomaly/Rot`,   v: fmt0(out.anomaly_per_rotation ?? 0) });
      kpiItems.push({ t:`Disorder/Rot`,  v: fmt0(out.disorder_per_rotation ?? 0) });
    }

    if (mode === "rupture") {
      kpiItems.push({ t:`Rupture`, v: fmt0(out.rupture ?? 0) });
    }

    $("kpi").innerHTML = kpiItems
      .map(x => `<div class="box"><div class="t">${x.t}</div><div class="v">${x.v}</div></div>`)
      .join("");

    const { rows } = computeMarginals(i);

    $("marginalBody").innerHTML = rows.map(r => {
      const kind = r.applied?.kind ?? "pct";
      const val = r.applied?.value ?? 0;

      const unit = (r.key === "atkBase") ? "ATK"
                : (kind === "flat") ? "flat"
                : "%";

      const step = (kind === "flat") ? 1 : 0.1;

      return `
      <tr>
        <td>${r.label}</td>
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
            <span class="muted">${unit}</span>
          </div>
        </td>
        <td>${fmt0(r.out2)}</td>
        <td>${fmt1(r.gain)}</td>
        <td>${fmt1(r.pctGain)}%</td>
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
