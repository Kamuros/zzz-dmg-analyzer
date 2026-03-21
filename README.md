# ZZZ Damage Logic Reference

This document consolidates the **current, reliable, and community-validated understanding** of Zenless Zone Zero (ZZZ) damage mechanics.

It is intended as a **single source of truth** for this project so the formula does not need to be re-researched repeatedly.

---

# 1. Scope and Philosophy

This calculator is **NOT a full combat simulator**.

It is designed for:
- Stat efficiency analysis
- Marginal value comparison
- Build optimization under consistent conditions

It intentionally omits systems that do not affect **relative stat ranking**.

---

# 2. Core Damage Formula (Standard Hits)

The validated high-level structure is:

```
Damage = ATK × Skill Multiplier × DMG% × DEF Multiplier × RES Multiplier × DMG Taken × Stun × Crit Expectation
```

This structure is consistent across:
- ZZZ community Google Docs (latest maintained sheet)
- NGA-derived breakdowns
- Reverse-engineered testing threads

---

# 3. Damage Buckets (Additive → Multiplicative)

All % damage bonuses are **additive within the same bucket**, then converted to a multiplier:

```
DMG Multiplier = 1 + (Generic + Attribute + Skill Type + Other) / 100
```

Buckets:
- Generic DMG%
- Attribute DMG%
- Skill Type DMG%
- Other DMG%

✔ Confirmed consistent across all major community sources

---

# 4. DEF System (Order and Behavior)

DEF is processed in the following order:

```
1. Combine DEF Reduction + DEF Ignore (additive)
2. Clamp combined value to [0, 100%]
3. Apply to enemy DEF
4. Apply PEN Ratio
5. Subtract Flat PEN
6. Floor DEF ≥ 0
7. DEF Multiplier = LevelFactor / (LevelFactor + DEF)
```

Key points:
- DEF Reduction and DEF Ignore are **additive**
- PEN Ratio is applied **after reduction/ignore**
- Flat PEN is applied last

✔ Strong agreement across community research and spreadsheets

---

# 5. RES System (Attribute + All RES)

Effective RES is:

```
Effective RES = Attribute RES + All RES - RES Reduction - RES Ignore
```

Constraints:
```
Minimum RES = -100%
```

Multiplier:

```
RES Multiplier = 1 - (Effective RES / 100)
```

Key behaviors:
- RES Reduction and RES Ignore are additive
- Negative RES increases damage
- All RES affects all attributes equally

✔ Confirmed by community docs and testing

---

# 6. DMG Taken Multipliers

```
DMG Taken Mult = 1 + (DMG Taken% + Other DMG Taken%)
```

- Fully multiplicative with all other systems

---

# 7. Stun Multiplier

```
If stunned:
    Multiplier = Stun%
Else:
    Multiplier = 1
```

---

# 8. Crit System (Expectation)

```
Expected Damage = NonCrit × (1 - CR) + Crit × CR
Crit Damage = Base × (1 + CD)
```

Constraints:
- Crit Rate capped at 100%

---

# 9. Anomaly System

## 9.1 Core Structure

Per-instance anomaly damage:

```
Anomaly = ATK × Coefficient × Proficiency × Level Mult × DMG% × Anomaly DMG% × DEF × RES × DMG Taken × Stun
```

Then:
- DOT types → multiplied by tick count
- Single-hit types → applied once

---

## 9.2 Anomaly Level Multiplier

```
Level Mult = 1 + (Level - 1) / 59
```

- Truncated to 4 decimal places
- Range: 1.0 → 2.0

✔ This matches the dominant modern community model

---

## 9.3 Anomaly Proficiency

```
Proficiency Mult = Proficiency × 0.01
```

---

## 9.4 Anomaly Types (Standard Values)

| Type        | Kind   | Instances | Multiplier (%) |
|-------------|--------|----------|----------------|
| Assault     | Single | 1        | 713%           |
| Shatter     | Single | 1        | 500%           |
| Burn        | DOT    | 20       | 50%            |
| Shock       | DOT    | 10       | 125%           |
| Corruption  | DOT    | 20       | 62.5%          |

✔ Matches widely accepted community tables

---

## 9.5 Disorder

Base:
```
450%
```

Modified by previous anomaly and time elapsed.

✔ Matches current community formula sheets

---

# 10. Rupture (Sheer Damage)

Rupture damage excludes DEF:

```
Damage = Sheer Force × Skill × DMG% × Sheer DMG% × RES × DMG Taken × Stun × Crit
```

✔ Confirmed by community documentation

---

# 11. Systems Intentionally Omitted

These are excluded because they do **not affect stat ranking**:

- Distance attenuation
- Enemy DEF buffs (handled via final DEF input)
- Anomaly cooldowns
- Snapshotting / multi-applier weighting

These systems affect:
- Timing
- Total damage over time

But NOT:
- Marginal stat efficiency

---

# 12. Reliability Summary

The implemented model is:

✔ Accurate for:
- Standard damage
- DEF / RES / PEN interactions
- Stat efficiency comparisons

⚠️ Approximate for:
- Full anomaly simulation
- Multi-agent interactions

---

# 13. Final Notes

This reference reflects:
- Latest maintained community Google Docs
- Cross-checked Reddit / NGA analysis
- Consolidated modern understanding

It prioritizes:

> Consistency, reproducibility, and correctness for stat analysis

rather than full in-game simulation.

