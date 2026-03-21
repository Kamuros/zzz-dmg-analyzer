import { describe, expect, it } from "vitest";

import { MathUtil } from "./zzz_logic.js";

describe("MathUtil formatters", () => {
  it("formats whole-number outputs for KPI/table values", () => {
    expect(MathUtil.fmt0(12345.67)).toBe("12,346");
    expect(MathUtil.fmt0(undefined)).toBe("0");
  });

  it("formats percentage-style values with up to one decimal place", () => {
    expect(MathUtil.fmtMaybe1(80)).toBe("80");
    expect(MathUtil.fmtMaybe1(80.04)).toBe("80");
    expect(MathUtil.fmtMaybe1(80.05)).toBe("80.1");
  });

  it("formats smart values with up to two decimals", () => {
    expect(MathUtil.fmtSmart(12)).toBe("12");
    expect(MathUtil.fmtSmart(12.3)).toBe("12.3");
    expect(MathUtil.fmtSmart(12.345)).toBe("12.35");
  });
});
