import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger, redactToken, truncateGid } from "@/lib/logger";

describe("truncateGid", () => {
  it("truncates long ids", () => {
    const long = "gid://shopify/Cart/" + "x".repeat(100);
    expect(truncateGid(long, 20).length).toBeLessThan(long.length);
    expect(truncateGid(long, 20).endsWith("…")).toBe(true);
  });
});

describe("redactToken", () => {
  it("hides token values", () => {
    expect(redactToken("")).toBe("none");
    expect(redactToken("short")).toBe("[redacted]");
    expect(redactToken("abcdef123456789")).toContain("…");
  });
});

describe("createLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes JSON lines without throwing", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const log = createLogger("test.scope");
    log.info("hello", { requestId: "r1" });
    log.warn("careful");
    log.error("oops", { code: 500 });

    expect(logSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();

    const line = (logSpy.mock.calls[0][0] as string) ?? "";
    expect(line).toContain('"scope":"test.scope"');
    expect(line).toContain('"msg":"hello"');
  });
});
