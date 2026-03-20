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
    static fmtMaybe1(x) {
      if (!Number.isFinite(x)) return "—";
      const rounded1 = Math.round(x * 10) / 10;
      const r = Math.round(rounded1);
      if (Math.abs(rounded1 - r) < 1e-6) return String(r);
      return rounded1.toFixed(1);
    }
    // Show 1 decimal only when fractional (with float-noise tolerance)
    static fmtSmart(x) {
      if (!Number.isFinite(x)) return "—";
      const rounded1 = Math.round(x * 10) / 10;
      const r = Math.round(rounded1);
      if (Math.abs(rounded1 - r) < 1e-6) return String(r);
      return rounded1.toFixed(1);
    }
  }

  class AppConfig {
    // Keep Disorder logic for future, but hide from UI for now.
    static SHOW_DISORDER_UI = false;
  }
  class I18n {
    static STORAGE_KEY = "zzz_calc_lang_v1";
    static current = "en";

    static STRINGS = {
      en: {
        "title.app": "Zenless Zone Zero: Damage Inputs + “Diminishing Returns” Analyzer V1.0",
        "ui.language": "Language",
        "label.mode": "Mode",
        "mode.standard": "Standard",
        "mode.anomaly": "Anomaly",
        "mode.rupture": "Rupture",
        "button.save": "Save",
        "button.load": "Load",
        "button.exportJson": "Export JSON",
        "button.importJson": "Import JSON",
        "button.reset": "Reset",
        "section.agentStats": "Agent Stats",
        "section.agentStatsAnomaly": "Agent Stats: Anomaly",
        "section.agentStatsRupture": "Agent Stats: Rupture",
        "section.advanced": "Advanced",
        "section.enemy": "Enemy",
        "section.outputs": "Outputs + Marginal Value",
        "label.agentLevel": "Agent Level",
        "label.attribute": "Attribute",
        "attr.physical": "Physical",
        "attr.fire": "Fire",
        "attr.ice": "Ice",
        "attr.electric": "Electric",
        "attr.ether": "Ether",
        "label.atk": "ATK",
        "label.critRatePct": "Crit Rate (%)",
        "label.critDmgPct": "Crit DMG (%)",
        "label.dmgGenericPct": "Generic DMG (%)",
        "label.dmgAttrPct": "Attribute DMG (%)",
        "label.dmgSkillTypePct": "Skill DMG (%)",
        "label.dmgOtherPct": "Other DMG (%)",
        "label.penRatioPct": "PEN Ratio (%)",
        "label.penFlat": "PEN",
        "label.defIgnorePct": "DEF Ignore (%)",
        "label.resIgnorePct": "RES Ignore (%)",
        "label.skillMultPct": "Skill Multiplier (%)",
        "label.anomType": "Anomaly Type",
        "option.auto": "Auto",
        "anom.assault": "Assault (Physical)",
        "anom.burn": "Burn (Fire)",
        "anom.shock": "Shock (Electric)",
        "anom.shatter": "Shatter (Ice)",
        "anom.corruption": "Corruption (Ether)",
        "label.anomProf": "Anomaly Proficiency",
        "label.anomDmgPct": "Anomaly DMG (%)",
        "label.disorderDmgPct": "Disorder DMG (%)",
        "label.anomTickCount": "Tick Count (Override)",
        "label.anomTickIntervalSec": "Tick Interval (Sec, Override)",
        "label.disorderPrevType": "Disorder: Previous Anomaly",
        "option.autoCurrentAnomaly": "Auto (Current Anomaly Type)",
        "anom.short.burn": "Burn",
        "anom.short.shock": "Shock",
        "anom.short.corruption": "Corruption",
        "anom.short.shatter": "Frozen (Ice)",
        "anom.short.assault": "Flinch (Physical)",
        "label.disorderTimePassedSec": "Disorder: Time Passed (Sec)",
        "label.sheerForce": "Sheer Force",
        "label.sheerDmgBonusPct": "Sheer DMG (%)",
        "label.baseAtk": "Base ATK",
        "label.atkPct": "ATK (%)",
        "label.atkPctFlatGain": "Gained ATK",
        "label.anomAllowCrit": "Allow Anomaly Crit",
        "option.off": "Off",
        "option.on": "On",
        "label.anomCritRatePct": "Anomaly Crit Rate (%)",
        "label.anomCritDmgPct": "Anomaly Crit DMG (%)",
        "label.enemyLevel": "Enemy Level",
        "label.enemyDef": "Enemy DEF",
        "label.defReductionPct": "DEF Reduction (%)",
        "label.enemyResPhysicalPct": "Physical RES (%)",
        "label.enemyResFirePct": "Fire RES (%)",
        "label.enemyResIcePct": "Ice RES (%)",
        "label.enemyResElectricPct": "Electric RES (%)",
        "label.enemyResEtherPct": "Ether RES (%)",
        "label.resReductionPct": "RES Reduction (%)",
        "label.dmgTakenPct": "DMG Taken (%)",
        "label.dmgTakenOtherPct": "Other DMG Taken (%)",
        "label.isStunned": "Stunned?",
        "option.no": "No",
        "option.yes": "Yes",
        "label.stunPct": "Stunned Multiplier (%)",
        "label.marginalMode": "Marginal Mode",
        "marginal.conditional": "Conditional / Incremental",
        "marginal.isolated": "Standalone / Isolated",
        "hint.marginalDefault": "Conditional mode compares each row after the other table test values are already applied. Isolated mode tests each row from the current build only.",
        "hint.marginalConditionalActive": "Conditional mode measures each row after the other non-zero Test Add values are already applied.",
        "hint.marginalConditionalIdle": "Conditional mode is selected. It behaves differently only when one or more Test Add values are non-zero.",
        "hint.marginalIsolatedActive": "Isolated mode measures each row from the current build only. Other Test Add values do not affect that row’s baseline.",
        "hint.marginalIsolatedIdle": "Isolated mode is selected. It behaves differently only when one or more Test Add values are non-zero.",
        "table.stat": "Stat",
        "table.baseEffective": "Base (Effective)",
        "table.testAdd": "Test Add",
        "table.testedTotal": "Tested Total",
        "table.newOutput": "New Output",
        "table.dmgGain": "DMG Gain",
        "table.dmgGainPct": "DMG Gain (%)",
        "table.efficiency": "Efficiency",
        "kpi.expectedDmg": "Expected DMG",
        "kpi.dmgNonCrit": "DMG (Non-Crit)",
        "kpi.dmgCrit": "DMG (Crit)",
        "kpi.anomalyType": "Anomaly Type",
        "kpi.expectedTickDmg": "Expected Tick DMG",
        "kpi.anomalyTotal": "Anomaly Total",
        "kpi.anomalyHit": "Anomaly Hit",
        "kpi.disorderHit": "Disorder Hit",
        "note.effectiveCapRaw": "Effective cap: {eff}% • Raw total: {raw}%",
        "note.effCombined": "Eff. combined: {eff}%",
        "note.effCombinedRaw": "Eff. combined: {eff}% (Raw {raw}%)",
        "tooltip.testAddPct": "Smart default increment for this stat. Edit any row to test your own amount.",
        "tooltip.testAddFlat": "Smart default flat increment for this stat. Edit any row to test your own amount.",
        "alert.saved": "Saved.",
        "alert.noSavedBuild": "No saved build found.",
        "alert.loaded": "Loaded.",
        "prompt.buildName": "Name this build (for the exported JSON file):",
        "alert.imported": "Imported.",
        "error.jsonTooLarge": "JSON file is too large.",
        "error.invalidJson": "Invalid JSON.",
        "error.readFile": "Failed to read file.",
        "label.genericDmg": "Generic DMG",
        "label.attributeDmg": "Attribute DMG",
        "label.skillDmg": "Skill DMG",
        "label.otherDmg": "Other DMG",
        "label.critRate": "Crit Rate",
        "label.critDmg": "Crit DMG",
        "label.penRatio": "PEN Ratio",
        "label.defReduction": "DEF Reduction",
        "label.resReduction": "RES Reduction",
        "label.resIgnore": "RES Ignore",
        "label.dmgTaken": "DMG Taken",
        "label.otherDmgTaken": "Other DMG Taken",
        "label.stunnedMultiplier": "Stunned Multiplier",
        "label.anomalyDmg": "Anomaly DMG",
        "label.disorderDmg": "Disorder DMG",
        "label.sheerDmgBonus": "Sheer DMG Bonus",
      },
      ko: {
        "title.app": "젠레스 존 제로: 데미지 + 스탯 효율 분석기 V1.0",
        "ui.language": "언어",
        "label.mode": "모드",
        "mode.standard": "일반",
        "mode.anomaly": "이상",
        "mode.rupture": "명파",
        "button.save": "저장",
        "button.load": "불러오기",
        "button.exportJson": "JSON 내보내기",
        "button.importJson": "JSON 가져오기",
        "button.reset": "초기화",
        "section.agentStats": "에이전트 스탯",
        "section.agentStatsAnomaly": "에이전트 스탯: 이상",
        "section.agentStatsRupture": "에이전트 스탯: 명파",
        "section.advanced": "고급",
        "section.enemy": "적",
        "section.outputs": "데미지 + 스탯 효율",
        "label.agentLevel": "에이전트 레벨",
        "label.attribute": "속성",
        "attr.physical": "물리",
        "attr.fire": "불",
        "attr.ice": "얼음",
        "attr.electric": "전기",
        "attr.ether": "에테르",
        "label.atk": "공격력",
        "label.critRatePct": "치명타 확률 (%)",
        "label.critDmgPct": "치명타 피해 (%)",
        "label.dmgGenericPct": "일반 피해 (%)",
        "label.dmgAttrPct": "속성 피해 (%)",
        "label.dmgSkillTypePct": "스킬 피해 (%)",
        "label.dmgOtherPct": "기타 피해 (%)",
        "label.penRatioPct": "관통률 (%)",
        "label.penFlat": "관통 수치",
        "label.defIgnorePct": "방어력 무시 (%)",
        "label.resIgnorePct": "속성 저항 무시 (%)",
        "label.skillMultPct": "스킬 배율 (%)",
        "label.anomType": "이상 유형",
        "option.auto": "자동",
        "anom.assault": "강타 (물리)",
        "anom.burn": "화상 (불)",
        "anom.shock": "감전 (전기)",
        "anom.shatter": "쇄빙 (얼음)",
        "anom.corruption": "침식 (에테르)",
        "label.anomProf": "이상 마스터리",
        "label.anomDmgPct": "이상 피해 (%)",
        "label.disorderDmgPct": "혼돈 피해 (%)",
        "label.anomTickCount": "틱 수 (수동 입력)",
        "label.anomTickIntervalSec": "틱 간격 (초, 수동 입력)",
        "label.disorderPrevType": "혼돈: 기존 이상",
        "option.autoCurrentAnomaly": "자동 (현재 이상 기준)",
        "anom.short.burn": "화상",
        "anom.short.shock": "감전",
        "anom.short.corruption": "침식",
        "anom.short.shatter": "빙결 (얼음)",
        "anom.short.assault": "경직 (물리)",
        "label.disorderTimePassedSec": "혼돈: 경과 시간 (초)",
        "label.sheerForce": "관입력",
        "label.sheerDmgBonusPct": "관입 피해 (%)",
        "label.baseAtk": "기초 공격력",
        "label.atkPct": "공격력 (%)",
        "label.atkPctFlatGain": "획득 공격력",
        "label.anomAllowCrit": "이상 치명 허용",
        "option.off": "끔",
        "option.on": "켬",
        "label.anomCritRatePct": "이상 치명타 확률 (%)",
        "label.anomCritDmgPct": "이상 치명타 피해 (%)",
        "label.enemyLevel": "적 레벨",
        "label.enemyDef": "적 방어력",
        "label.defReductionPct": "방어력 감소 (%)",
        "label.enemyResPhysicalPct": "물리 저항 (%)",
        "label.enemyResFirePct": "불 저항 (%)",
        "label.enemyResIcePct": "얼음 저항 (%)",
        "label.enemyResElectricPct": "전기 저항 (%)",
        "label.enemyResEtherPct": "에테르 저항 (%)",
        "label.resReductionPct": "속성 저항 감소 (%)",
        "label.dmgTakenPct": "받는 피해 (%)",
        "label.dmgTakenOtherPct": "기타 받는 피해 (%)",
        "label.isStunned": "그로기 여부",
        "option.no": "아니오",
        "option.yes": "예",
        "label.stunPct": "그로기 배율 (%)",
        "label.marginalMode": "스탯 효율 모드",
        "marginal.conditional": "누적",
        "marginal.isolated": "독립",
        "hint.marginalDefault": "조건부 모드는 다른 테스트 추가 값이 적용된 상태에서 각 행을 측정합니다. 독립 모드는 현재 빌드만 기준으로 각 행을 개별 측정합니다.",
        "hint.marginalConditionalActive": "조건부 모드는 다른 0이 아닌 테스트 추가 값이 이미 적용된 상태에서 각 행을 측정합니다.",
        "hint.marginalConditionalIdle": "조건부 모드가 선택되어 있습니다. 하나 이상의 테스트 추가 값이 0이 아닐 때만 차이가 생깁니다.",
        "hint.marginalIsolatedActive": "독립 모드는 현재 빌드만 기준으로 각 행을 측정합니다. 다른 테스트 추가 값은 해당 행의 기준값에 영향을 주지 않습니다.",
        "hint.marginalIsolatedIdle": "독립 모드가 선택되어 있습니다. 하나 이상의 테스트 추가 값이 0이 아닐 때만 차이가 생깁니다.",
        "table.stat": "스탯",
        "table.baseEffective": "기본값 (실효)",
        "table.testAdd": "테스트 추가",
        "table.testedTotal": "테스트 합계",
        "table.newOutput": "새 출력값",
        "table.dmgGain": "피해 증가",
        "table.dmgGainPct": "피해 증가 (%)",
        "table.efficiency": "효율",
        "kpi.expectedDmg": "기대 피해",
        "kpi.dmgNonCrit": "비치명 피해",
        "kpi.dmgCrit": "치명 피해",
        "kpi.anomalyType": "이상 유형",
        "kpi.expectedTickDmg": "예상 틱 피해",
        "kpi.anomalyTotal": "이상 총 피해",
        "kpi.anomalyHit": "이상 피해",
        "kpi.disorderHit": "혼돈 피해",
        "note.effectiveCapRaw": "실효 상한: {eff}% • 원시 합계: {raw}%",
        "note.effCombined": "실효 합산: {eff}%",
        "note.effCombinedRaw": "실효 합산: {eff}% (원시 {raw}%)",
        "tooltip.testAddPct": "이 스탯의 기본 증가량입니다. 원하는 시험값으로 직접 수정할 수 있습니다.",
        "tooltip.testAddFlat": "이 스탯의 기본 고정 증가량입니다. 원하는 시험값으로 직접 수정할 수 있습니다.",
        "alert.saved": "저장되었습니다.",
        "alert.noSavedBuild": "저장된 빌드를 찾을 수 없습니다.",
        "alert.loaded": "불러왔습니다.",
        "prompt.buildName": "내보낼 JSON 파일 이름을 입력하세요:",
        "alert.imported": "가져왔습니다.",
        "error.jsonTooLarge": "JSON 파일이 너무 큽니다.",
        "error.invalidJson": "유효하지 않은 JSON입니다.",
        "error.readFile": "파일을 읽지 못했습니다.",
        "label.genericDmg": "일반 피해",
        "label.attributeDmg": "속성 피해",
        "label.skillDmg": "스킬 피해",
        "label.otherDmg": "기타 피해",
        "label.critRate": "치명타 확률",
        "label.critDmg": "치명타 피해",
        "label.penRatio": "관통률",
        "label.defReduction": "방어력 감소",
        "label.resReduction": "속성 저항 감소",
        "label.resIgnore": "속성 저항 무시",
        "label.dmgTaken": "받는 피해",
        "label.otherDmgTaken": "기타 받는 피해",
        "label.stunnedMultiplier": "그로기 배율",
        "label.anomalyDmg": "이상 피해",
        "label.disorderDmg": "혼돈 피해",
        "label.sheerDmgBonus": "관입 피해",
      },
    };

    static init(dom) {
      const saved = localStorage.getItem(I18n.STORAGE_KEY);
      I18n.current = saved === "ko" ? "ko" : "en";
      const sel = dom.select("languageSelect");
      if (sel) sel.value = I18n.current;
      I18n.applyDocument(document);
    }

    static setLanguage(lang, dom) {
      I18n.current = lang === "ko" ? "ko" : "en";
      localStorage.setItem(I18n.STORAGE_KEY, I18n.current);
      const sel = dom?.select?.("languageSelect");
      if (sel) sel.value = I18n.current;
      I18n.applyDocument(document);
    }

    static t(key, vars = null) {
      const table = I18n.STRINGS[I18n.current] || I18n.STRINGS.en;
      let out = table[key] ?? I18n.STRINGS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replaceAll(`{${k}}`, String(v));
        }
      }
      return out;
    }

    static applyDocument(root) {
      if (!root) return;
      const html = document.documentElement;
      if (html) html.lang = I18n.current === "ko" ? "ko" : "en";
      root.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;
        el.textContent = I18n.t(key);
      });
      root.querySelectorAll("[data-i18n-label]").forEach((el) => {
        const key = el.getAttribute("data-i18n-label");
        if (!key) return;
        el.setAttribute("data-label", I18n.t(key));
      });
    }
  }

  class MarginalSort {
    static DEFAULT = { key: "pctGain", dir: "desc" };

    /** @param {{key:string, dir:"asc"|"desc"}} state @param {string} key */
    static nextState(state, key) {
      if (state.key === key) return { key, dir: state.dir === "desc" ? "asc" : "desc" };
      return { key, dir: key === "label" ? "asc" : "desc" };
    }

    /** @param {any} row @param {string} key */
    static valueFor(row, key) {
      switch (key) {
        case "label": return String(row.label || "");
        case "origVal": return Number(row.origVal);
        case "appliedVal": return Number(row.applied?.value ?? 0);
        case "totalVal": return Number(row.totalVal);
        case "out2": return Number(row.out2);
        case "gain": return Number(row.gain);
        case "pctGain": return Number(row.pctGain);
        case "efficiency": return Number(row.efficiency);
        default: return Number(row[key]);
      }
    }

    /** @param {Array<any>} rows @param {{key:string, dir:"asc"|"desc"}} state */
    static sortRows(rows, state) {
      const dir = state.dir === "asc" ? 1 : -1;
      const key = state.key || "pctGain";
      return [...rows].sort((a, b) => {
        const av = MarginalSort.valueFor(a, key);
        const bv = MarginalSort.valueFor(b, key);

        if (typeof av === "string" || typeof bv === "string") {
          const cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
          if (cmp !== 0) return cmp * dir;
        } else {
          const an = Number.isFinite(av) ? av : Number.NEGATIVE_INFINITY;
          const bn = Number.isFinite(bv) ? bv : Number.NEGATIVE_INFINITY;
          if (an !== bn) return (an - bn) * dir;
        }

        return String(a.label || "").localeCompare(String(b.label || ""), undefined, { sensitivity: "base" });
      });
    }

    /** @param {{key:string, dir:"asc"|"desc"}} state @param {string} key */
    static indicator(state, key) {
      if (state.key !== key) return "";
      return state.dir === "desc" ? "▼" : "▲";
    }
  }

  class MetricRanker {
    /** @param {Array<any>} rows @param {(row:any)=>number|null} getter */
    static top3(rows, getter) {
      const unique = [];
      for (const row of rows) {
        const v = getter(row);
        if (!Number.isFinite(v) || v <= 0) continue;
        if (!unique.some((x) => Math.abs(x - v) < 1e-9)) unique.push(v);
      }
      unique.sort((a, b) => b - a);
      return unique.slice(0, 3);
    }

    /** @param {number|null} value @param {number[]} top */
    static rankClass(value, top) {
      if (!Number.isFinite(value) || value <= 0) return "";
      for (let idx = 0; idx < top.length; idx++) {
        if (Math.abs(value - top[idx]) < 1e-9) return `rank-${idx + 1}`;
      }
      return "";
    }

    /** @param {string} rankClass */
    static rankNumber(rankClass) {
      const m = /^rank-(\d+)$/.exec(String(rankClass || ""));
      return m ? Number(m[1]) : Infinity;
    }

    /** @param {string[]} rankClasses */
    static bestRankClass(rankClasses) {
      let best = "";
      let bestNum = Infinity;
      for (const cls of rankClasses) {
        const n = MetricRanker.rankNumber(cls);
        if (n < bestNum) {
          bestNum = n;
          best = cls;
        }
      }
      return best;
    }
  }

  class InputParser {
    /** @param {Dom} dom */
    constructor(dom) {
      this.dom = dom;
    }

    parseNumericValue(raw, fallback = 0) {
      if (raw === "" || raw === null || raw === undefined) return fallback;
      if (typeof raw === "number") return Number.isFinite(raw) ? raw : fallback;
      const s = String(raw).trim();
      if (!s) return fallback;
      if (!/^[+\-\d.\s]+$/.test(s)) return fallback;
      const compact = s.replace(/\s+/g, "");
      const parts = compact.split("+");
      let total = 0;
      let sawValidPart = false;
      for (let idx = 0; idx < parts.length; idx++) {
        const part = parts[idx];
        const isLast = idx === parts.length - 1;
        if (!part) {
          if (isLast && sawValidPart) break;
          return fallback;
        }
        const n = Number(part);
        if (!Number.isFinite(n)) return fallback;
        total += n;
        sawValidPart = true;
      }
      return sawValidPart ? total : fallback;
    }

    numById(id, fallback = 0) {
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return fallback;
      const v = /** @type {any} */ (el).value;
      return this.parseNumericValue(v, fallback);
    }

    optNumById(id) {
      const el = this.dom.input(id);
      if (!el) return null;
      const v = el.value;
      if (v === "" || v === null || v === undefined) return null;
      const n = this.parseNumericValue(v, NaN);
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
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return false;
      // Supports both <input type="checkbox"> and <select> with 0/1 values.
      if ((el instanceof HTMLInputElement) && String(el.type).toLowerCase() === "checkbox") return !!el.checked;
      const v = String((/** @type {any} */ (el)).value ?? "").toLowerCase();
      return v === "1" || v === "true" || v === "yes" || v === "on";
    }
    /** @returns {Inputs} */
    read() {
      const mode = this.strById("mode", "standard");

      /** @type {Inputs} */
      const i = Inputs.defaults();

      i.jsonName = (this.strById("jsonName", "").trim());
      i.mode = /** @type {Inputs["mode"]} */ (mode);

      i.agent.level = MathUtil.clamp(Math.floor(this.numById("agentLevel", 60)), 1, 60);
      i.agent.attribute = /** @type {Attribute} */ (this.strById("attribute", "physical"));
      i.agent.atkInput = Math.max(0, this.numById("atk", 0));
      i.agent.baseAtk = Math.max(0, this.numById("baseAtk", 0));
      i.agent.atkPct = Math.max(0, this.numById("atkPct", 0));
      i.agent.atk = Math.max(0, i.agent.atkInput);

      i.agent.crit.rate = MathUtil.clamp(this.numById("critRatePct", 0) / 100, 0, 1);
      i.agent.crit.dmg = Math.max(0, this.numById("critDmgPct", 0) / 100);

      i.agent.dmgBuckets.generic = this.numById("dmgGenericPct", 0);
      i.agent.dmgBuckets.attribute = this.numById("dmgAttrPct", 0);
      i.agent.dmgBuckets.skillType = this.numById("dmgSkillTypePct", 0);

      i.agent.dmgBuckets.other = this.numById("dmgOtherPct", 0);
      i.agent.resIgnorePct = this.numById("resIgnorePct", 0);
      i.agent.pen.ratioPct = this.numById("penRatioPct", 0);
      i.agent.pen.flat = Math.max(0, this.numById("penFlat", 0));

      i.agent.skillMultPct = Math.max(0, this.numById("skillMultPct", 100));

      // Anomaly
      i.agent.anomaly.type = this.strById("anomType", "auto");
      i.agent.anomaly.prof = Math.max(0, this.numById("anomProf", 100));
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
      i.enemy.level = MathUtil.clamp(Math.floor(this.numById("enemyLevel", 70)), 1, 70);
      i.enemy.def = Math.max(0, this.numById("enemyDef", 0));

      i.enemy.resByAttr.physical = this.optNumById("enemyResPhysicalPct");
      i.enemy.resByAttr.fire = this.optNumById("enemyResFirePct");
      i.enemy.resByAttr.ice = this.optNumById("enemyResIcePct");
      i.enemy.resByAttr.electric = this.optNumById("enemyResElectricPct");
      i.enemy.resByAttr.ether = this.optNumById("enemyResEtherPct");

      i.enemy.resReductionPct = this.numById("resReductionPct", 0);

      i.enemy.defReductionPct = this.numById("defReductionPct", 0);
      i.agent.defIgnorePct = this.numById("defIgnorePct", 0);

      i.enemy.dmgTakenPct = this.numById("dmgTakenPct", 0);
      i.enemy.dmgTakenOtherPct = this.numById("dmgTakenOtherPct", 0);
i.enemy.isStunned = this.boolSelectById("isStunned");
      i.enemy.stunPct = this.numById("stunPct", 150);

      // Marginal settings/overrides are held in memory only (not in UI inputs)
      i.marginal.mode = /** @type {"conditional"|"isolated"} */ (this.strById("marginalMode", "conditional"));
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
   *   dmgBuckets: {generic:number, attribute:number, skillType:number, other:number},
   *   pen: {ratioPct:number, flat:number},
   *   resIgnorePct: number,
   *   defIgnorePct: number,
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
   *   resByAttr: Record<Attribute, number|null>,
   *   resReductionPct:number,
   *   defReductionPct:number,
   *   dmgTakenPct:number,
   *   dmgTakenOtherPct:number,
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
          atkInput: 0,
          baseAtk: 0,
          atkPct: 0,
          crit: { rate: 0.05, dmg: 0.50 },
          dmgBuckets: { generic: 0, attribute: 0, skillType: 0, other: 0 },
          pen: { ratioPct: 0, flat: 0 },
          resIgnorePct: 0,
          defIgnorePct: 0,
          skillMultPct: 100,
          anomaly: {
            type: "auto",
            prof: 100,
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
          resByAttr: { physical: null, fire: null, ice: null, electric: null, ether: null },
          resReductionPct: 0,
          defReductionPct: 0,
          dmgTakenPct: 0,
          dmgTakenOtherPct: 0,
isStunned: false,
          stunPct: 150,
        },
        marginal: {
          mode: "conditional",
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
      const specific = i.enemy.resByAttr[i.agent.attribute];
      if (specific !== null && specific !== undefined && Number.isFinite(specific)) return specific;
      return 0;
    }

    /** @param {Inputs} i */
    static computeResMult(i) {
      const baseRes = ZzzMath.resPctForAttr(i);
      const effRes = baseRes - (Number(i.enemy.resReductionPct) || 0) - (Number(i.agent.resIgnorePct) || 0);
      return 1 - (effRes / 100);
    }

    /** @param {Inputs} i */
    static computeVulnMult(i) {
      return MathUtil.pctToMult((Number(i.enemy.dmgTakenPct) || 0) + (Number(i.enemy.dmgTakenOtherPct) || 0));
}

    /** @param {Inputs} i */
    static computeDefMult(i) {
      const k = ZzzMath.levelFactor(i.agent.level);

      // Start with raw DEF
      let def = Math.max(0, Number(i.enemy.def) || 0);

      // DEF shred/ignore as additive % of enemy DEF
      const defPctDown = MathUtil.clamp((Number(i.enemy.defReductionPct || 0) + Number(i.agent.defIgnorePct || 0)) / 100, 0, 1);
      def = def * (1 - defPctDown);

      // PEN Ratio first (not hard-capped at 100%)
      const ratio = (Number(i.agent.pen.ratioPct) || 0) / 100;
      def = def * (1 - ratio);

      // Flat PEN last
      const pen = Math.max(0, Number(i.agent.pen.flat) || 0);
      def = Math.max(0, def - pen);

      return k / (k + def);
    }

    /** @param {Inputs} i */
    static computeStunMult(i) {
      return i.enemy.isStunned ? (((Number(i.enemy.stunPct) || 0) / 100) || 1) : 1;
    }

    /** @param {Inputs} i */
    static dmgPctTotal(i, includeSkillType = true) {
      const b = i.agent.dmgBuckets;
      let total = (Number(b.generic) || 0) + (Number(b.attribute) || 0) + (Number(b.other) || 0);
      if (includeSkillType) total += (Number(b.skillType) || 0);
return total;
    }
  }
  class StandardCalculator {
    /** @param {Inputs} i @param {string} key @param {number} rawValue */
    static effectiveDisplay(i, key, rawValue) {
      if (key === "critRatePct") {
        const eff = MathUtil.clamp(rawValue, 0, 100);
        return { primary: eff, secondary: Math.abs(eff - rawValue) > 1e-9 ? I18n.t("note.effectiveCapRaw", { eff: MathUtil.fmtSmart(eff), raw: MathUtil.fmtSmart(rawValue) }) : "" };
      }
      if (key === "defReductionPct" || key === "defIgnorePct") {
        const defRed = (key === "defReductionPct") ? rawValue : Number(i.enemy.defReductionPct) || 0;
        const defIgn = (key === "defIgnorePct") ? rawValue : Number(i.agent.defIgnorePct) || 0;
        const combinedRaw = defRed + defIgn;
        const combinedEff = MathUtil.clamp(combinedRaw, 0, 100);
        const secondary = (Math.abs(combinedEff - combinedRaw) > 1e-9 ? I18n.t("note.effCombinedRaw", { eff: MathUtil.fmtSmart(combinedEff), raw: MathUtil.fmtSmart(combinedRaw) }) : I18n.t("note.effCombined", { eff: MathUtil.fmtSmart(combinedEff) }));
        return { primary: rawValue, secondary };
      }
      return { primary: rawValue, secondary: "" };
    }

    /** @param {number} baseOut @param {number} newOut */
    static computePctGain(baseOut, newOut) {
      if (!Number.isFinite(baseOut) || !Number.isFinite(newOut)) return null;
      if (baseOut === 0) {
        if (newOut === 0) return 0;
        return null;
      }
      return ((newOut - baseOut) / baseOut) * 100;
    }

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

    /** @param {Inputs} i @param {string} key @param {number} rawValue */
    static effectiveDisplay(i, key, rawValue) {
      if (key === "critRatePct") {
        const eff = MathUtil.clamp(rawValue, 0, 100);
        return { primary: eff, secondary: Math.abs(eff - rawValue) > 1e-9 ? I18n.t("note.effectiveCapRaw", { eff: MathUtil.fmtSmart(eff), raw: MathUtil.fmtSmart(rawValue) }) : "" };
      }
      if (key === "defReductionPct" || key === "defIgnorePct") {
        const defRed = (key === "defReductionPct") ? rawValue : Number(i.enemy.defReductionPct) || 0;
        const defIgn = (key === "defIgnorePct") ? rawValue : Number(i.agent.defIgnorePct) || 0;
        const combinedRaw = defRed + defIgn;
        const combinedEff = MathUtil.clamp(combinedRaw, 0, 100);
        const secondary = (Math.abs(combinedEff - combinedRaw) > 1e-9 ? I18n.t("note.effCombinedRaw", { eff: MathUtil.fmtSmart(combinedEff), raw: MathUtil.fmtSmart(combinedRaw) }) : I18n.t("note.effCombined", { eff: MathUtil.fmtSmart(combinedEff) }));
        return { primary: rawValue, secondary };
      }
      return { primary: rawValue, secondary: "" };
    }

    /** @param {number} baseOut @param {number} newOut */
    static computePctGain(baseOut, newOut) {
      if (!Number.isFinite(baseOut) || !Number.isFinite(newOut)) return null;
      if (baseOut === 0) {
        if (newOut === 0) return 0;
        return null;
      }
      return ((newOut - baseOut) / baseOut) * 100;
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

      const stdBonusMult = MathUtil.pctToMult(dmgPctBase);

      // Separate Anomaly DMG % bucket (separate from standard DMG % bucket)
      const anomalySpecialMult = MathUtil.pctToMult(Number(i.agent.anomaly.dmgPct) || 0);

      // Separate Disorder DMG % bucket
      const disorderSpecialMult = MathUtil.pctToMult(Number(i.agent.anomaly.disorderPct) || 0);

      const defMult = ZzzMath.computeDefMult(i);
      const resMult = ZzzMath.computeResMult(i);
      const vuln = ZzzMath.computeVulnMult(i);
      const stunMult = ZzzMath.computeStunMult(i);

      const perInstBase = atk * (meta.perInstanceMultPct / 100);
      const perInstNonCrit = perInstBase * profMult * lvMult * stdBonusMult * anomalySpecialMult * defMult * resMult * vuln * stunMult;

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

  class RuptureCalculator {
    /** @param {Inputs} i @param {string} key @param {number} rawValue */
    static effectiveDisplay(i, key, rawValue) {
      if (key === "critRatePct") {
        const eff = MathUtil.clamp(rawValue, 0, 100);
        return { primary: eff, secondary: Math.abs(eff - rawValue) > 1e-9 ? I18n.t("note.effectiveCapRaw", { eff: MathUtil.fmtSmart(eff), raw: MathUtil.fmtSmart(rawValue) }) : "" };
      }
      if (key === "defReductionPct" || key === "defIgnorePct") {
        const defRed = (key === "defReductionPct") ? rawValue : Number(i.enemy.defReductionPct) || 0;
        const defIgn = (key === "defIgnorePct") ? rawValue : Number(i.agent.defIgnorePct) || 0;
        const combinedRaw = defRed + defIgn;
        const combinedEff = MathUtil.clamp(combinedRaw, 0, 100);
        const secondary = (Math.abs(combinedEff - combinedRaw) > 1e-9 ? I18n.t("note.effCombinedRaw", { eff: MathUtil.fmtSmart(combinedEff), raw: MathUtil.fmtSmart(combinedRaw) }) : I18n.t("note.effCombined", { eff: MathUtil.fmtSmart(combinedEff) }));
        return { primary: rawValue, secondary };
      }
      return { primary: rawValue, secondary: "" };
    }

    /** @param {number} baseOut @param {number} newOut */
    static computePctGain(baseOut, newOut) {
      if (!Number.isFinite(baseOut) || !Number.isFinite(newOut)) return null;
      if (baseOut === 0) {
        if (newOut === 0) return 0;
        return null;
      }
      return ((newOut - baseOut) / baseOut) * 100;
    }

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
    /** @param {Inputs} i @param {string} key @param {number} rawValue */
    static effectiveDisplay(i, key, rawValue) {
      if (key === "critRatePct") {
        const eff = MathUtil.clamp(rawValue, 0, 100);
        return { primary: eff, secondary: Math.abs(eff - rawValue) > 1e-9 ? I18n.t("note.effectiveCapRaw", { eff: MathUtil.fmtSmart(eff), raw: MathUtil.fmtSmart(rawValue) }) : "" };
      }
      if (key === "defReductionPct" || key === "defIgnorePct") {
        const defRed = (key === "defReductionPct") ? rawValue : Number(i.enemy.defReductionPct) || 0;
        const defIgn = (key === "defIgnorePct") ? rawValue : Number(i.agent.defIgnorePct) || 0;
        const combinedRaw = defRed + defIgn;
        const combinedEff = MathUtil.clamp(combinedRaw, 0, 100);
        const secondary = (Math.abs(combinedEff - combinedRaw) > 1e-9 ? I18n.t("note.effCombinedRaw", { eff: MathUtil.fmtSmart(combinedEff), raw: MathUtil.fmtSmart(combinedRaw) }) : I18n.t("note.effCombined", { eff: MathUtil.fmtSmart(combinedEff) }));
        return { primary: rawValue, secondary };
      }
      return { primary: rawValue, secondary: "" };
    }

    /** @param {number} baseOut @param {number} newOut */
    static computePctGain(baseOut, newOut) {
      if (!Number.isFinite(baseOut) || !Number.isFinite(newOut)) return null;
      if (baseOut === 0) {
        if (newOut === 0) return 0;
        return null;
      }
      return ((newOut - baseOut) / baseOut) * 100;
    }

    /** @param {Inputs} i */
    static compute(i) {
      const std = StandardCalculator.compute(i);
      const anom = AnomalyCalculator.compute(i);
      const rup = RuptureCalculator.compute(i);

      if (i.mode === "standard") {
        return { mode: i.mode, output: std.expected, output_noncrit: std.nonCrit, output_crit: std.crit, output_expected: std.expected, anom: null };
      }
      if (i.mode === "anomaly") {
        const disorderPart = AppConfig.SHOW_DISORDER_UI ? (anom.disorder?.avg ?? 0) : 0;
        const combined = std.expected + (anom.anomalyPerProc?.avg ?? 0) + disorderPart;
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
      { key: "atk", labelKey: "label.atk", label: "ATK", kind: "flat" },

      { key: "dmgGenericPct", labelKey: "label.genericDmg", label: "Generic DMG", kind: "pct" },
      { key: "dmgAttrPct", labelKey: "label.attributeDmg", label: "Attribute DMG", kind: "pct" },
      { key: "dmgSkillTypePct", labelKey: "label.skillDmg", label: "Skill DMG", kind: "pct" },
      { key: "dmgOtherPct", labelKey: "label.otherDmg", label: "Other DMG", kind: "pct" },

      { key: "critRatePct", labelKey: "label.critRate", label: "Crit Rate", kind: "pct" },
      { key: "critDmgPct", labelKey: "label.critDmg", label: "Crit DMG", kind: "pct" },

      { key: "penRatioPct", labelKey: "label.penRatio", label: "PEN Ratio", kind: "pct" },
      { key: "defReductionPct", labelKey: "label.defReduction", label: "DEF Reduction", kind: "pct" },
      { key: "defIgnorePct", labelKey: "label.defIgnorePct", label: "DEF Ignore", kind: "pct" },
      { key: "resReductionPct", labelKey: "label.resReduction", label: "RES Reduction", kind: "pct" },
      { key: "resIgnorePct", labelKey: "label.resIgnore", label: "RES Ignore", kind: "pct" },

      { key: "dmgTakenPct", labelKey: "label.dmgTaken", label: "DMG Taken", kind: "pct" },
      { key: "dmgTakenOtherPct", labelKey: "label.otherDmgTaken", label: "Other DMG Taken", kind: "pct" },
      { key: "stunPct", labelKey: "label.stunnedMultiplier", label: "Stunned Multiplier", kind: "pct" },

      { key: "anomProf", labelKey: "label.anomProf", label: "Anomaly Proficiency", kind: "flat" },
      { key: "anomDmgPct", labelKey: "label.anomalyDmg", label: "Anomaly DMG", kind: "pct" },
      { key: "disorderDmgPct", labelKey: "label.disorderDmg", label: "Disorder DMG", kind: "pct" },

      { key: "sheerForce", labelKey: "label.sheerForce", label: "Sheer Force", kind: "flat" },
      { key: "sheerDmgBonusPct", labelKey: "label.sheerDmgBonus", label: "Sheer DMG Bonus", kind: "pct" },
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
    static DEFAULTS_BY_KEY = {
      atk: { kind: "flat", value: 0 },
      dmgGenericPct: { kind: "pct", value: 0 },
      dmgAttrPct: { kind: "pct", value: 30 },
      dmgSkillTypePct: { kind: "pct", value: 0 },
      dmgOtherPct: { kind: "pct", value: 30 },
      critRatePct: { kind: "pct", value: 24 },
      critDmgPct: { kind: "pct", value: 48 },
      penRatioPct: { kind: "pct", value: 24 },
      penFlat: { kind: "flat", value: 0 },
      defReductionPct: { kind: "pct", value: 0 },
      defIgnorePct: { kind: "pct", value: 0 },
      resReductionPct: { kind: "pct", value: 0 },
      resIgnorePct: { kind: "pct", value: 0 },
      dmgTakenPct: { kind: "pct", value: 0 },
      dmgTakenOtherPct: { kind: "pct", value: 0 },
      stunPct: { kind: "pct", value: 30 },
      anomProf: { kind: "flat", value: 9 },
      anomDmgPct: { kind: "pct", value: 0 },
      disorderDmgPct: { kind: "pct", value: 5 },
      sheerForce: { kind: "flat", value: 0 },
      sheerDmgBonusPct: { kind: "pct", value: 0 },
    };

    /** @param {Inputs} i */
    static cloneInputs(i) {
      if (typeof structuredClone === "function") return structuredClone(i);
      return JSON.parse(JSON.stringify(i));
    }

    /** @param {Inputs} i @param {Iterable<[string, {kind:"pct"|"flat", value:number}]>} entries */
    static applyManyInPlace(i, entries) {
      const reverts = [];
      for (const [key, d] of entries) {
        reverts.push(MarginalAnalyzer.applyDeltaInPlace(i, key, d));
      }
      return () => {
        for (let idx = reverts.length - 1; idx >= 0; idx--) reverts[idx]();
      };
    }

    /** @param {Inputs} i @param {string} key */
    static originalDisplay(i, key) {
      switch (key) {
        case "atk": return { kind: "flat", value: i.agent.atk };

        case "dmgGenericPct": return { kind: "pct", value: i.agent.dmgBuckets.generic };
        case "dmgAttrPct": return { kind: "pct", value: i.agent.dmgBuckets.attribute };
        case "dmgSkillTypePct": return { kind: "pct", value: i.agent.dmgBuckets.skillType };
        case "dmgOtherPct": return { kind: "pct", value: i.agent.dmgBuckets.other };

        case "critRatePct": return { kind: "pct", value: i.agent.crit.rate * 100 };
        case "critDmgPct": return { kind: "pct", value: i.agent.crit.dmg * 100 };

        case "penRatioPct": return { kind: "pct", value: i.agent.pen.ratioPct };
        case "penFlat": return { kind: "flat", value: i.agent.pen.flat };

        case "defReductionPct": return { kind: "pct", value: i.enemy.defReductionPct };
        case "defIgnorePct": return { kind: "pct", value: i.agent.defIgnorePct };
        case "resReductionPct": return { kind: "pct", value: i.enemy.resReductionPct };
        case "resIgnorePct": return { kind: "pct", value: i.agent.resIgnorePct };

        case "dmgTakenPct": return { kind: "pct", value: i.enemy.dmgTakenPct };
        case "dmgTakenOtherPct": return { kind: "pct", value: i.enemy.dmgTakenOtherPct };
        case "stunPct": return { kind: "pct", value: i.enemy.stunPct };

        case "anomProf": return { kind: "flat", value: i.agent.anomaly.prof };
        case "anomDmgPct": return { kind: "pct", value: i.agent.anomaly.dmgPct };
        case "disorderDmgPct": return { kind: "pct", value: i.agent.anomaly.disorderPct };

        case "sheerForce": return { kind: "flat", value: i.agent.rupture.sheerForce };
        case "sheerDmgBonusPct": return { kind: "pct", value: i.agent.rupture.sheerDmgBonusPct };

        default: return { kind: "pct", value: 0 };
      }
    }

    /** @param {string} key */
    static defaultApplied(key) {
      return MarginalAnalyzer.DEFAULTS_BY_KEY[key] ?? { kind: "pct", value: 5 };
    }

    /** @param {string} key @param {{kind:"pct"|"flat",value:number}|null} override */
    static resolveDelta(key, override) {
      const expectsFlat = (key === "atk" || key === "penFlat" || key === "sheerForce" || key === "anomProf");
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
        case "dmgOtherPct": {
          const prev = i.agent.dmgBuckets.other;
          i.agent.dmgBuckets.other = prev + dp;
          return () => { i.agent.dmgBuckets.other = prev; };
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
        case "dmgTakenOtherPct": {
          const prev = i.enemy.dmgTakenOtherPct;
          i.enemy.dmgTakenOtherPct = prev + dp;
          return () => { i.enemy.dmgTakenOtherPct = prev; };
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
          const prev = i.agent.defIgnorePct;
          i.agent.defIgnorePct = prev + dp;
          return () => { i.agent.defIgnorePct = prev; };
        }
        case "resReductionPct": {
          const prev = i.enemy.resReductionPct;
          i.enemy.resReductionPct = prev + dp;
          return () => { i.enemy.resReductionPct = prev; };
        }
        case "resIgnorePct": {
          const prev = i.agent.resIgnorePct;
          i.agent.resIgnorePct = prev + dp;
          return () => { i.agent.resIgnorePct = prev; };
        }

        case "anomProf": {
          const prev = i.agent.anomaly.prof;
          i.agent.anomaly.prof = Math.max(0, prev + df);
          return () => { i.agent.anomaly.prof = prev; };
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

    /** @param {Inputs} i @param {string} key @param {number} rawValue */
    static effectiveDisplay(i, key, rawValue) {
      if (key === "critRatePct") {
        const eff = MathUtil.clamp(rawValue, 0, 100);
        return { primary: eff, secondary: Math.abs(eff - rawValue) > 1e-9 ? I18n.t("note.effectiveCapRaw", { eff: MathUtil.fmtSmart(eff), raw: MathUtil.fmtSmart(rawValue) }) : "" };
      }
      if (key === "defReductionPct" || key === "defIgnorePct") {
        const defRed = (key === "defReductionPct") ? rawValue : Number(i.enemy.defReductionPct) || 0;
        const defIgn = (key === "defIgnorePct") ? rawValue : Number(i.agent.defIgnorePct) || 0;
        const combinedRaw = defRed + defIgn;
        const combinedEff = MathUtil.clamp(combinedRaw, 0, 100);
        const secondary = (Math.abs(combinedEff - combinedRaw) > 1e-9 ? I18n.t("note.effCombinedRaw", { eff: MathUtil.fmtSmart(combinedEff), raw: MathUtil.fmtSmart(combinedRaw) }) : I18n.t("note.effCombined", { eff: MathUtil.fmtSmart(combinedEff) }));
        return { primary: rawValue, secondary };
      }
      return { primary: rawValue, secondary: "" };
    }

    /** @param {number} baseOut @param {number} newOut */
    static computePctGain(baseOut, newOut) {
      if (!Number.isFinite(baseOut) || !Number.isFinite(newOut)) return null;
      if (baseOut === 0) {
        if (newOut === 0) return 0;
        return null;
      }
      return ((newOut - baseOut) / baseOut) * 100;
    }

    /** @param {Inputs} i */
    static compute(i) {
      const originalByKey = new Map();
      for (const m of StatMeta.list()) {
        originalByKey.set(m.key, MarginalAnalyzer.originalDisplay(i, m.key));
      }

      const base = Preview.compute(i);
      const rows = [];
      const ruptureAllowed = new Set([
        "dmgGenericPct","dmgAttrPct","dmgSkillTypePct","dmgOtherPct","critRatePct","critDmgPct",
        "resReductionPct","resIgnorePct","dmgTakenPct","dmgTakenOtherPct","stunPct","sheerForce","sheerDmgBonusPct"
      ]);

      /** @type {Map<string, {kind:"pct"|"flat", value:number}>} */
      const resolvedDeltas = new Map();
      for (const m of StatMeta.list()) {
        const override = MarginalAppliedStore.get(m.key);
        resolvedDeltas.set(m.key, MarginalAnalyzer.resolveDelta(m.key, override));
      }

      const marginalMode = i.marginal?.mode === "isolated" ? "isolated" : "conditional";

      for (const m of StatMeta.list()) {
        if (i.mode === "anomaly" && (m.key === "dmgSkillTypePct" || m.key === "critRatePct" || m.key === "critDmgPct")) continue;
        if (i.mode !== "anomaly" && (m.key === "anomProf" || m.key === "anomDmgPct"  || m.key === "disorderDmgPct")) continue;
        if (!AppConfig.SHOW_DISORDER_UI && (m.key === "disorderDmgPct")) continue;

        if (i.mode === "rupture") {
          if (!ruptureAllowed.has(m.key)) continue;
        } else {
          if (m.key === "sheerForce" || m.key === "sheerDmgBonusPct") continue;
        }

        if (i.mode === "standard" && (m.key === "anomDmgPct"  || m.key === "disorderDmgPct")) continue;

        const applied = resolvedDeltas.get(m.key) ?? MarginalAnalyzer.defaultApplied(m.key);
        const orig = originalByKey.get(m.key) ?? { kind: m.kind, value: 0 };

        const rowBaseInputs = MarginalAnalyzer.cloneInputs(i);
        if (marginalMode === "conditional") {
          for (const [otherKey, otherDelta] of resolvedDeltas.entries()) {
            if (otherKey === m.key) continue;
            MarginalAnalyzer.applyDeltaInPlace(rowBaseInputs, otherKey, otherDelta);
          }
        }
        const rowBaseOut = Preview.compute(rowBaseInputs).output;

        const rowNewInputs = MarginalAnalyzer.cloneInputs(rowBaseInputs);
        MarginalAnalyzer.applyDeltaInPlace(rowNewInputs, m.key, applied);
        const newOut = Preview.compute(rowNewInputs).output;

        const rawTotalVal = orig.value + (applied?.value ?? 0);
        const origDisplay = MarginalAnalyzer.effectiveDisplay(i, m.key, orig.value);
        const totalDisplay = MarginalAnalyzer.effectiveDisplay(rowNewInputs, m.key, rawTotalVal);

        let shownOut = newOut;
        let gain = newOut - rowBaseOut;
        let pctGain = MarginalAnalyzer.computePctGain(rowBaseOut, newOut);

        if (!Number.isFinite(gain)) gain = 0;

        if (m.key === "critRatePct" && totalDisplay.primary <= origDisplay.primary) {
          shownOut = rowBaseOut;
          gain = 0;
          pctGain = 0;
        }

        rows.push({
          key: m.key,
          label: I18n.t(m.labelKey || m.label),
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
      for (const row of rows) {
        if (Number.isFinite(row.pctGain)) bestPctGain = Math.max(bestPctGain, row.pctGain);
      }

      for (const row of rows) {
        if (bestPctGain > 0 && Number.isFinite(row.pctGain)) row.efficiency = (row.pctGain / bestPctGain) * 100;
      }

      return { base, rows, bestPctGain };
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
        onError(I18n.t("error.jsonTooLarge"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || "");
          const data = JSON.parse(text);
          onData(data);
        } catch {
          onError(I18n.t("error.invalidJson"));
        }
      };
      reader.onerror = () => onError(I18n.t("error.readFile"));
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
      this.marginalHead = dom.byId("marginalHead");
      this.atkPctFlatGain = dom.input("atkPctFlatGain");
    }

    applyModeVisibility(mode) {
      const showAnom = (mode === "anomaly");
      const showRupture = (mode === "rupture");

      this.dom.byId("anomalySection")?.classList.toggle("hidden", !showAnom);
      this.dom.byId("ruptureSection")?.classList.toggle("hidden", !showRupture);
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


    /** @param {Inputs} i */
    renderAtkPctFlatGain(i) {
      if (!this.atkPctFlatGain) return;
      const baseAtk = Math.max(0, Number(i.agent.baseAtk) || 0);
      const atkPct = Math.max(0, Number(i.agent.atkPct) || 0);
      const flatGain = baseAtk * atkPct / 100;
      this.atkPctFlatGain.value = MathUtil.fmtSmart(flatGain);
    }

    /** @param {Inputs} i @param {ReturnType<typeof MarginalAnalyzer.compute>} marginal @param {{key:string, dir:"asc"|"desc"}} sortState */
    renderMarginalTable(i, marginal, sortState) {
      if (!this.marginalBody) return;
      this.dom.clear(this.marginalBody);
      this.renderMarginalModeHint(i, marginal);

      const activeEl = document.activeElement instanceof HTMLInputElement ? document.activeElement : null;
      const activeAppliedKey = activeEl?.classList.contains("appliedDelta") ? String(activeEl.dataset.key || "") : "";
      const activeSelectionStart = activeEl?.classList.contains("appliedDelta") ? (activeEl.selectionStart ?? null) : null;
      const activeSelectionEnd = activeEl?.classList.contains("appliedDelta") ? (activeEl.selectionEnd ?? null) : null;

      const sortedRows = MarginalSort.sortRows(marginal.rows, sortState);
      const topGain = MetricRanker.top3(marginal.rows, (row) => Number(row.gain));
      const topEff = MetricRanker.top3(marginal.rows, (row) => Number(row.efficiency));

      for (let idx = 0; idx < sortedRows.length; idx++) {
        const r = sortedRows[idx];
        const tr = this.dom.el("tr");

        const gainRank = MetricRanker.rankClass(Number(r.gain), topGain);
        const effRank = MetricRanker.rankClass(Number(r.efficiency), topEff);
        const rowRank = MetricRanker.bestRankClass([gainRank, effRank]);
        if (rowRank) tr.classList.add(`row-${rowRank}`);
        else if (r.efficiency !== null && Number.isFinite(r.efficiency) && r.efficiency >= 80) tr.classList.add("top-row");

        const tdLabel = this.dom.el("td");
        tdLabel.textContent = r.label;

        const tdOrig = this.dom.el("td");
        tdOrig.appendChild(this._statCell(r.origVal, r.displayKind, r.origDisplayNote));

        const tdApplied = this.dom.el("td");
        tdApplied.appendChild(this._appliedInputCell(r));

        const tdSum = this.dom.el("td");
        tdSum.appendChild(this._statCell(r.totalVal, r.displayKind, r.totalDisplayNote));

        const tdOut = this.dom.el("td");
        tdOut.textContent = MathUtil.fmt0(r.out2);

        const tdGain = this.dom.el("td");
        tdGain.textContent = MathUtil.fmt0(r.gain);
        tdGain.classList.add("metric-cell", "metric-gain");
        if (gainRank) tdGain.classList.add(gainRank);

        const tdPct = this.dom.el("td");
        tdPct.textContent = (r.pctGain === null) ? "∞" : `${MathUtil.fmtSmart(r.pctGain)}%`;

        const tdEff = this.dom.el("td");
        tdEff.textContent = (r.efficiency === null) ? "—" : `${MathUtil.fmtMaybe1(r.efficiency)}%`;
        tdEff.classList.add("metric-cell", "metric-eff");
        if (effRank) tdEff.classList.add(effRank);

        tr.appendChild(tdLabel);
        tr.appendChild(tdOrig);
        tr.appendChild(tdApplied);
        tr.appendChild(tdSum);
        tr.appendChild(tdOut);
        tr.appendChild(tdGain);
        tr.appendChild(tdPct);
        tr.appendChild(tdEff);

        this.marginalBody.appendChild(tr);
      }

      this.renderMarginalHeader(sortState);

      if (activeAppliedKey) {
        const nextInput = /** @type {HTMLInputElement|null} */ (this.marginalBody.querySelector(`input.appliedDelta[data-key="${CSS.escape(activeAppliedKey)}"]`));
        if (nextInput) {
          nextInput.focus({ preventScroll: true });
          if (activeSelectionStart !== null && activeSelectionEnd !== null) {
            try {
              nextInput.setSelectionRange(activeSelectionStart, activeSelectionEnd);
            } catch {}
          }
        }
      }
    }

    renderMarginalModeHint(i, marginal) {
      const hint = this.dom.byId("marginalModeHint");
      if (!hint) return;
      const mode = i.marginal?.mode === "isolated" ? "isolated" : "conditional";
      const hasTestAdds = marginal.rows.some((row) => {
        const v = Number(row.applied?.value ?? 0);
        return Number.isFinite(v) && Math.abs(v) > 1e-9;
      });
      if (mode === "conditional") {
        hint.textContent = hasTestAdds
          ? I18n.t("hint.marginalConditionalActive")
          : I18n.t("hint.marginalConditionalIdle")
      } else {
        hint.textContent = hasTestAdds
          ? I18n.t("hint.marginalIsolatedActive")
          : I18n.t("hint.marginalIsolatedIdle")
      }
    }

    /** @param {{key:string, dir:"asc"|"desc"}} sortState */
    renderMarginalHeader(sortState) {
      if (!this.marginalHead) return;
      this.dom.qsa("#marginalHead th[data-sort-key]").forEach((th) => {
        if (!(th instanceof HTMLElement)) return;
        const label = th.dataset.i18nLabel ? I18n.t(th.dataset.i18nLabel) : (th.dataset.label || th.textContent || "");
        const key = th.dataset.sortKey || "";
        const arrowEl = th.querySelector(".sort-arrow");
        if (arrowEl) arrowEl.textContent = MarginalSort.indicator(sortState, key);
        th.classList.toggle("sorted", sortState.key === key);
        th.setAttribute("aria-sort",
          sortState.key !== key ? "none" : (sortState.dir === "desc" ? "descending" : "ascending")
        );
        const textEl = th.querySelector(".sort-label");
        if (textEl) textEl.textContent = label;
      });
    }

    _statCell(value, displayKind, note = "") {
      const wrap = this.dom.el("div");
      wrap.style.display = "flex";
      wrap.style.flexDirection = "column";
      wrap.style.gap = "2px";

      const top = this.dom.el("div");
      top.style.display = "flex";
      top.style.gap = "8px";
      top.style.alignItems = "center";

      const a = this.dom.el("span");
      a.style.fontWeight = "600";
      a.textContent = MathUtil.fmtSmart(value);

      const b = this.dom.el("span");
      b.className = "muted";
      b.textContent = (displayKind === "pct") ? "%" : "";

      top.appendChild(a);
      top.appendChild(b);
      wrap.appendChild(top);

      if (note) {
        const sub = this.dom.el("div");
        sub.className = "muted";
        sub.style.fontSize = "11px";
        sub.textContent = note;
        wrap.appendChild(sub);
      }

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
      input.type = "text";
      input.inputMode = "decimal";
      input.dataset.numberOnly = "true";
      input.style.width = "110px";
      input.style.padding = "6px 8px";
      input.style.borderRadius = "10px";
      input.step = (kind === "flat") ? "1" : "0.1";
      input.value = String(val);
      input.title = kind === "pct"
        ? I18n.t("tooltip.testAddPct")
        : I18n.t("tooltip.testAddFlat");

      input.dataset.key = row.key;
      input.dataset.kind = kind;
      NumericInputGuard.bind(input);

      const unit = this.dom.el("span");
      unit.className = "muted";
      unit.textContent = (kind === "pct") ? "%" : "";

      wrap.appendChild(input);
      wrap.appendChild(unit);
      return wrap;
    }
  }

  class NumericInputGuard {
    static PLUS_ALLOWED_IDS = new Set([
      "atk","critRatePct","critDmgPct","dmgGenericPct","dmgAttrPct","dmgSkillTypePct","dmgOtherPct",
      "penRatioPct","penFlat","defIgnorePct","resIgnorePct","anomProf","anomDmgPct","sheerForce","sheerDmgBonusPct"
    ]);

    static MINUS_ALLOWED_IDS = new Set([
      "enemyResPhysicalPct","enemyResFirePct","enemyResIcePct","enemyResElectricPct","enemyResEtherPct"
    ]);

    /** @param {HTMLInputElement} el */
    static allowsPlus(el) {
      return el.dataset.allowPlus === "true" || NumericInputGuard.PLUS_ALLOWED_IDS.has(el.id);
    }

    /** @param {HTMLInputElement} el */
    static allowsMinus(el) {
      return el.dataset.allowMinus === "true" || NumericInputGuard.MINUS_ALLOWED_IDS.has(el.id);
    }

    /** @param {HTMLInputElement} el */
    static integerOnly(el) {
      return el.dataset.integerOnly === "true";
    }

    /** @param {HTMLInputElement} el @param {string} value */
    static sanitize(el, value) {
      const allowPlus = NumericInputGuard.allowsPlus(el);
      const allowMinus = NumericInputGuard.allowsMinus(el);
      const integerOnly = NumericInputGuard.integerOnly(el);
      let s = String(value ?? "");
      s = s.replace(/,/g, "").replace(/\s+/g, allowPlus ? "" : "");
      s = s.replace(/[eE]/g, "");
      if (allowPlus) {
        s = s.replace(/[^0-9.+]/g, "");
        s = s.replace(/^\++/, "");
        s = s.replace(/\+{2,}/g, "+");
        const parts = s.split("+");
        const cleaned = parts.map((part) => {
          if (!part) return "";
          if (integerOnly) return part.replace(/\./g, "");
          const firstDot = part.indexOf(".");
          if (firstDot === -1) return part;
          return part.slice(0, firstDot + 1) + part.slice(firstDot + 1).replace(/\./g, "");
        });
        s = cleaned.join("+").replace(/\+{2,}/g, "+");
        if (s.startsWith("+")) s = s.slice(1);
        return s;
      }
      s = allowMinus ? s.replace(/[^0-9.-]/g, "") : s.replace(/[^0-9.]/g, "");
      if (allowMinus) {
        s = s.replace(/(?!^)-/g, "");
      }
      if (integerOnly) return s.replace(/\./g, "");
      const startIndex = (allowMinus && s.startsWith("-")) ? 1 : 0;
      const firstDot = s.indexOf(".", startIndex);
      if (firstDot === -1) return s;
      return s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    }

    /** @param {HTMLInputElement} el */
    static bind(el) {
      const disallowKeys = new Set(["e", "E", ","]);
      if (!NumericInputGuard.allowsMinus(el)) disallowKeys.add("-");
      if (!NumericInputGuard.allowsPlus(el)) disallowKeys.add("+");
      el.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (disallowKeys.has(e.key)) e.preventDefault();
      });
      el.addEventListener("beforeinput", (e) => {
        const data = e.data;
        if (!data) return;
        const allowPlus = NumericInputGuard.allowsPlus(el);
        const allowMinus = NumericInputGuard.allowsMinus(el);
        const allowedPattern = allowPlus
          ? (NumericInputGuard.integerOnly(el) ? /^[0-9+]+$/ : /^[0-9.+]+$/)
          : allowMinus
            ? (NumericInputGuard.integerOnly(el) ? /^[0-9-]+$/ : /^[0-9.-]+$/)
            : (NumericInputGuard.integerOnly(el) ? /^[0-9]+$/ : /^[0-9.]+$/);
        if (!allowedPattern.test(data)) e.preventDefault();
      });
      el.addEventListener("input", () => {
        const cleaned = NumericInputGuard.sanitize(el, el.value);
        if (el.value !== cleaned) el.value = cleaned;
      });
      el.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)?.getData("text") || "";
        const cleaned = NumericInputGuard.sanitize(el, pasted);
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const next = el.value.slice(0, start) + cleaned + el.value.slice(end);
        el.value = NumericInputGuard.sanitize(el, next);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }

  class UiApplier {
    /** @param {Dom} dom */
    constructor(dom) {
      this.dom = dom;
    }

    /** @param {any} data */
    applyImportedData(data) {
      // Restore per-row marginal settings/deltas
      MarginalAppliedStore.loadFromData(data);
      this._setIfExists("marginalMode", data?.marginal?.mode ?? "conditional");

      // jsonName + mode
      const jsonNameEl = this.dom.input("jsonName");
      if (jsonNameEl) jsonNameEl.value = String(data?.jsonName ?? "");

      const importedLang = data?.ui?.language;
      if (importedLang) I18n.setLanguage(importedLang, this.dom);

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
      const atkValue = (agent?.atkInput ?? agent?.atk ?? 0);
      if (atkEl) atkEl.value = String(atkValue);
      this._setIfExists("baseAtk", agent?.baseAtk ?? 0);
      this._setIfExists("atkPct", agent?.atkPct ?? 0);

      const crEl = this.dom.input("critRatePct");
      if (crEl) crEl.value = String((Number(crit?.rate ?? 0) * 100));

      const cdEl = this.dom.input("critDmgPct");
      if (cdEl) cdEl.value = String((Number(crit?.dmg ?? 0) * 100));

      this._set("dmgGenericPct", dmg?.generic ?? 0);
      this._set("dmgAttrPct", dmg?.attribute ?? 0);
      this._set("dmgSkillTypePct", dmg?.skillType ?? 0);
      this._setIfExists("dmgOtherPct", dmg?.other ?? 0);
      this._setIfExists("resIgnorePct", agent?.resIgnorePct ?? 0);
      this._set("penRatioPct", penRatioPct ?? 0);
      this._set("penFlat", penFlat ?? 0);

      this._set("skillMultPct", agent?.skillMultPct ?? 100);

      // Anomaly
      const an = agent?.anomaly ?? {};
      this._set("anomType", an?.type ?? "auto");
      this._set("anomProf", an?.prof ?? 0);
      this._set("anomDmgPct", an?.dmgPct ?? 0);
      this._set("disorderDmgPct", an?.disorderPct ?? 0);

      const allowCritEl = this.dom.input("anomAllowCrit") || this.dom.select("anomAllowCrit");
      if (allowCritEl) {
        if (String(allowCritEl.type).toLowerCase() === "checkbox") {
          allowCritEl.checked = !!an?.allowCrit;
        } else {
          allowCritEl.value = (an?.allowCrit ? "1" : "0");
        }
      }

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

      this._setIfExists("enemyResPhysicalPct", enemy?.resByAttr?.physical ?? "");
      this._setIfExists("enemyResFirePct", enemy?.resByAttr?.fire ?? "");
      this._setIfExists("enemyResIcePct", enemy?.resByAttr?.ice ?? "");
      this._setIfExists("enemyResElectricPct", enemy?.resByAttr?.electric ?? "");
      this._setIfExists("enemyResEtherPct", enemy?.resByAttr?.ether ?? "");

      this._setIfExists("resReductionPct", enemy?.resReductionPct ?? 0);

      this._set("defReductionPct", enemy?.defReductionPct ?? 0);
      this._set("defIgnorePct", agent?.defIgnorePct ?? 0);

      this._set("dmgTakenPct", enemy?.dmgTakenPct ?? 0);
      this._set("dmgTakenOtherPct", enemy?.dmgTakenOtherPct ?? 0);
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
      this.sortState = { ...MarginalSort.DEFAULT };

      I18n.init(this.dom);
      this._wireNumericGuards();

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

      this._applyToggleUi(i);

      const preview = Preview.compute(i);
      const kpiItems = [{ t: I18n.t("kpi.expectedDmg"), v: MathUtil.fmt0(preview.output_expected) }];

      kpiItems.push({ t: I18n.t("kpi.dmgNonCrit"), v: MathUtil.fmt0(preview.output_noncrit) });
      kpiItems.push({ t: I18n.t("kpi.dmgCrit"), v: MathUtil.fmt0(preview.output_crit) });

      if (preview.anom) {
                const anomLabelKeyMap = { assault: "anom.assault", burn: "anom.burn", shock: "anom.shock", shatter: "anom.shatter", corruption: "anom.corruption" };
        const anomLabel = I18n.t(anomLabelKeyMap[preview.anom.anomType] || preview.anom.anomType || "");
        kpiItems.push({ t: I18n.t("kpi.anomalyType"), v: anomLabel });
        if (preview.anom.kind === "dot") {
          kpiItems.push({ t: I18n.t("kpi.expectedTickDmg"), v: MathUtil.fmt0(preview.anom.anomalyPerTick.avg) });
          kpiItems.push({ t: I18n.t("kpi.anomalyTotal"), v: MathUtil.fmt0(preview.anom.anomalyPerProc.avg) });
        } else {
          kpiItems.push({ t: I18n.t("kpi.anomalyHit"), v: MathUtil.fmt0(preview.anom.anomalyPerProc.avg) });
        }
        if (AppConfig.SHOW_DISORDER_UI) {
          kpiItems.push({ t: I18n.t("kpi.disorderHit"), v: MathUtil.fmt0(preview.anom.disorder.avg) });
        }
      }

      this.renderer.renderKpi(kpiItems);
      this.renderer.renderAtkPctFlatGain(i);

      const marginal = MarginalAnalyzer.compute(i);
      this.renderer.renderMarginalTable(i, marginal, this.sortState);
      I18n.applyDocument(document);
    }


    _applyToggleUi(i) {
      // Allow Anomaly Crit -> enable/disable override fields
      const allowCrit = !!i.agent.anomaly.allowCrit;
      this._setDisabled("anomCritRatePct", !allowCrit);
      this._setDisabled("anomCritDmgPct", !allowCrit);

      // Stunned? -> enable/disable stunned multiplier input
      const stunned = !!i.enemy.isStunned;
      this._setDisabled("stunPct", !stunned);
    }

    _setDisabled(id, disabled) {
      const el = this.dom.input(id) || this.dom.select(id);
      if (!el) return;
      (/** @type {any} */ (el)).disabled = !!disabled;
      const label = el.closest ? el.closest("label") : null;
      if (label) label.classList.toggle("is-disabled", !!disabled);
    }


    _wireNumericGuards() {
      this.dom.qsa('input[data-number-only="true"]').forEach((el) => {
        if (el instanceof HTMLInputElement) NumericInputGuard.bind(el);
      });
    }

    _wireEvents() {
      // Save/Load/Export/Import/Reset
      this.dom.btn("btnSave")?.addEventListener("click", () => {
        const data = this._exportData();
        StorageManager.setSaved(data);
        alert(I18n.t("alert.saved"));
        this.requestRefresh();
      });

      this.dom.btn("btnLoad")?.addEventListener("click", () => {
        const data = StorageManager.getSaved();
        if (!data) { alert(I18n.t("alert.noSavedBuild")); return; }
        this.applier.applyImportedData(data);
        alert(I18n.t("alert.loaded"));
        this.requestRefresh();
      });

      this.dom.btn("btnExport")?.addEventListener("click", () => {
        const data = this._exportData();
        if (!data.jsonName) {
          const v = (prompt(I18n.t("prompt.buildName"), "My Build") || "").trim();
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
              alert(I18n.t("alert.imported"));
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
      this.dom.select("languageSelect")?.addEventListener("change", (e) => {
        const target = /** @type {HTMLSelectElement} */ (e.target);
        I18n.setLanguage(target.value, this.dom);
        this.requestRefresh();
      });

      const syncAppliedDeltaValue = (e) => {
        const t = /** @type {HTMLElement} */ (e.target);
        if (!(t instanceof HTMLInputElement)) return null;
        if (!t.classList.contains("appliedDelta")) return null;

        const key = String(t.dataset.key || "");
        const kind = (t.dataset.kind === "flat") ? "flat" : "pct";
        if (!key) return null;

        const raw = String(t.value ?? "").trim();
        if (raw === "") {
          MarginalAppliedStore.set(key, kind, 0);
          return { input: t, key, kind, value: 0 };
        }

        const v = Number(raw);
        if (!Number.isFinite(v)) {
          MarginalAppliedStore.set(key, kind, NaN);
          return { input: t, key, kind, value: NaN };
        }

        MarginalAppliedStore.set(key, kind, v);
        return { input: t, key, kind, value: v };
      };

      this.dom.byId("marginalBody")?.addEventListener("input", (e) => {
        syncAppliedDeltaValue(e);
      });
      this.dom.byId("marginalBody")?.addEventListener("change", (e) => {
        const result = syncAppliedDeltaValue(e);
        if (!result) return;
        this.requestRefresh();
      });
      this.dom.byId("marginalBody")?.addEventListener("focusout", (e) => {
        const result = syncAppliedDeltaValue(e);
        if (!result) return;
        this.requestRefresh();
      });
      this.dom.byId("marginalBody")?.addEventListener("keydown", (e) => {
        const t = /** @type {HTMLElement} */ (e.target);
        if (!(t instanceof HTMLInputElement)) return;
        if (!t.classList.contains("appliedDelta")) return;
        if (e.key === "Enter") t.blur();
      });

      this.dom.byId("marginalHead")?.addEventListener("click", (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const th = /** @type {HTMLElement|null} */ (target.closest("th[data-sort-key]"));
        if (!th) return;
        const key = String(th.dataset.sortKey || "");
        if (!key) return;
        this.sortState = MarginalSort.nextState(this.sortState, key);
        this.requestRefresh();
      });
    }

    _exportData() {
      const i = this.parser.read();

      return {
        jsonName: i.jsonName,
        ui: { language: I18n.current },
        mode: i.mode,
        agent: {
          level: i.agent.level,
          attribute: i.agent.attribute,
          atk: i.agent.atk,
          atkInput: i.agent.atkInput,
          baseAtk: i.agent.baseAtk,
          atkPct: i.agent.atkPct,
          crit: { rate: i.agent.crit.rate, dmg: i.agent.crit.dmg },
          dmgBuckets: { ...i.agent.dmgBuckets },
          pen: { ratioPct: i.agent.pen.ratioPct, flat: i.agent.pen.flat },
          resIgnorePct: i.agent.resIgnorePct,
          defIgnorePct: i.agent.defIgnorePct,
          skillMultPct: i.agent.skillMultPct,
          anomaly: { ...i.agent.anomaly },
          rupture: { ...i.agent.rupture },
        },
        enemy: {
          level: i.enemy.level,
          def: i.enemy.def,
          resByAttr: { ...i.enemy.resByAttr },
          resReductionPct: i.enemy.resReductionPct,
          defReductionPct: i.enemy.defReductionPct,
          dmgTakenPct: i.enemy.dmgTakenPct,
          dmgTakenOtherPct: i.enemy.dmgTakenOtherPct,
          isStunned: i.enemy.isStunned,
          stunPct: i.enemy.stunPct,
        },
        marginal: {
          mode: i.marginal.mode,
          customApplied: MarginalAppliedStore.clone(),
        },
      };
    }

  }

  // Init
  new App();
})();
