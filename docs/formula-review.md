# ZZZ damage formula review

## What was extracted

The app's combat math was moved from `app.js` into `zzz_logic.js` so the core calculators and marginal analysis can be inspected without reading through the DOM/UI code.

## Community references reviewed

1. The current public **"ZZZ Stats and Damage Calculation"** Google Doc, updated automatically and covering general damage, DEF, RES, Sheer Damage, Anomaly, and Disorder.
2. The older **"ZZZ Damage Calculation"** Google Doc linked from Reddit, used to confirm the same overall structure and note the newer doc supersedes it.
3. A Reddit thread discussing Disc 5 PEN Ratio vs Attribute DMG, notable because it links directly to the damage doc and explicitly calls out the DEF multiplier / PEN interaction.

## Validation summary

### Matches community findings well

- **General damage structure**: the app uses `ATK * skill multiplier * DMG% * DEF * RES * DMG Taken * Stun * Crit expectation`, which matches the community docs' high-level formula.
- **DMG bucket handling**: the app adds generic, attribute, skill-type, and other DMG% together before converting to a multiplier, matching the docs' additive DMG% bucket guidance.
- **DEF pipeline**: the app applies DEF Reduction and DEF Ignore additively, then applies PEN Ratio, then Flat PEN, while flooring effective DEF at zero. That matches the documented DEF order.
- **RES handling**: the app subtracts RES Reduction and RES Ignore from the target attribute resistance, clamps effective RES at the community-documented `-100%` floor, and converts the result to `1 - RES%`, which matches the docs' described structure.
- **Rupture / Sheer damage**: the app explicitly omits the DEF multiplier for rupture mode, matching the Sheer Damage section in the current community doc.
- **Anomaly separation**: the app treats general DMG% and Anomaly DMG% as separate multiplicative terms, matching the anomaly section in the doc.
- **Anomaly defaults**: Burn/Shock/Corruption/Shatter/Assault hit counts and intervals match the commonly cited community values from the public docs.
- **Disorder timing tables**: the app's burn/shock/corruption/shatter/assault disorder base coefficients line up with the values described in the community documents.
- **Marginal table modes**: the app's isolated vs conditional comparison logic is internally consistent and now easier to inspect in the extracted module.

### Important caveats / limitations

- **Distance attenuation is not modeled**. The community docs call out Billy/Grace/Harumasa/Rina/Zhu Yuan range penalties, but the app has no distance input or multiplier.
- **Defense buffs / percent DEF buffs on enemies are not modeled**. The app only accepts a final enemy DEF value plus reductions/ignore/PEN.
- **Anomaly snapshotting and multi-applier weighting are not modeled**. The app is a single-state calculator, so it cannot represent mixed contributor anomaly buildup snapshots.
- **Anomaly cooldown behavior is not modeled**. The current community doc notes a 3-second per-enemy cooldown for the same anomaly and a global cooldown after disorder; the app only computes per-proc damage.
- **Anomaly level scaling is simplified**. The app uses a linear `1..2x` level multiplier from level 1 to 60, whereas the community material describes a dedicated buff-level multiplier table/formula. This is the largest formula-risk area in the current implementation.
- **Preview behavior in anomaly mode is app-specific**. The app currently reports standard expected hit damage plus anomaly proc damage together; that is useful for build comparisons, but it is not a direct copy of the community formula sheet's per-event outputs.

## Reliability conclusion

The app's **standard damage**, **DEF/RES/PEN ordering**, **rupture/sheer handling**, and **marginal table comparison logic** are broadly reliable and align with the community formula references.

The biggest places where accuracy can drift from community-tested behavior are:

1. the simplified **anomaly level multiplier**,
2. omitted systems such as **distance attenuation**, **snapshotting**, and **anomaly cooldown behavior**.

That means the calculator is a solid comparative tool for standard hit damage and marginal-stat inspection, but its anomaly outputs should still be treated as approximate until the level multiplier and any relevant missing mechanics are brought in line with the current community sheet.
