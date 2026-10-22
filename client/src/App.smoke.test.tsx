import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import App from "./App";

describe("App", () => {
  it("renders the calculator shell with Excel defaults", () => {
    const html = renderToString(<App />);
    expect(html).toContain("Kalkulator HPP Cetak 3D");
    expect(html).toContain("Rp38.775");
    expect(html).toContain("Rp58.163");
    expect(html).toContain("Rp87.244");
  });
});
