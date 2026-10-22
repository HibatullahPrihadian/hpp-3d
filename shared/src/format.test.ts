import { describe, expect, it } from "vitest";
import { formatPercent, formatRupiah, parseNumber } from "./format";

describe("formatRupiah", () => {
  it("formats with Indonesian separators", () => {
    expect(formatRupiah(1_350_000)).toBe("Rp1.350.000");
    expect(formatRupiah(58_163)).toBe("Rp58.163");
    expect(formatRupiah(0)).toBe("Rp0");
  });
});

describe("formatPercent", () => {
  it("keeps decimals", () => {
    expect(formatPercent(50)).toBe("50%");
    expect(formatPercent(12.5)).toBe("12,5%");
  });
});

describe("parseNumber", () => {
  it.each([
    ["130000", 130000],
    ["130.000", 130000],
    ["130,000", 130000],
    ["1.350.000", 1_350_000],
    ["0,5", 0.5],
    ["0.5", 0.5],
    ["12,5", 12.5],
    ["1.000", 1000],
    ["2,75", 2.75],
    ["Rp 15.000", 15000],
    ["", 0],
    ["abc", 0],
    ["-", 0],
  ])("parses %s as %d", (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected);
  });
});
