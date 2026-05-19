import { generateHumanCode, hashString, signSpin } from "@/lib/tokens";

describe("generateHumanCode", () => {
  it("should generate a code in XXXX-XXXX format", () => {
    const code = generateHumanCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("should not contain ambiguous characters (0, 1, I, O)", () => {
    // Generate many codes and check none contain ambiguous chars
    for (let i = 0; i < 100; i++) {
      const code = generateHumanCode();
      expect(code).not.toMatch(/[01IO]/);
    }
  });

  it("should generate unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateHumanCode());
    }
    // With 32^8 possible combinations, 100 should all be unique
    expect(codes.size).toBe(100);
  });
});

describe("hashString", () => {
  it("should return a consistent hash for the same input", () => {
    const hash1 = hashString("test-input");
    const hash2 = hashString("test-input");
    expect(hash1).toBe(hash2);
  });

  it("should return different hashes for different inputs", () => {
    const hash1 = hashString("input-1");
    const hash2 = hashString("input-2");
    expect(hash1).not.toBe(hash2);
  });

  it("should return a 16-character hex string", () => {
    const hash = hashString("test");
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe("signSpin", () => {
  it("should return a consistent signature for the same input", () => {
    const data = { sessionId: "sess-1", prizeId: "prize-1", randomValue: 0.5 };
    const sig1 = signSpin(data);
    const sig2 = signSpin(data);
    expect(sig1).toBe(sig2);
  });

  it("should return different signatures for different inputs", () => {
    const sig1 = signSpin({ sessionId: "sess-1", prizeId: "prize-1", randomValue: 0.5 });
    const sig2 = signSpin({ sessionId: "sess-2", prizeId: "prize-1", randomValue: 0.5 });
    expect(sig1).not.toBe(sig2);
  });

  it("should return a 64-character hex string (SHA-256 HMAC)", () => {
    const sig = signSpin({ sessionId: "s", prizeId: "p", randomValue: 0.1 });
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });
});
