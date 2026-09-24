import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.fn();

vi.mock("./connection.js", () => ({
  default: { transaction },
}));

const {
  createTransactionWithRetry,
  executeWithRetry,
  isTransientConnectionError,
} = await import("./transaction.js");

describe("database retry helpers", () => {
  beforeEach(() => {
    transaction.mockReset();
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // A healthy database connection should create one transaction and should not
  // incur any retry delay or additional connection attempt.
  it("creates a transaction without retrying when the connection succeeds", async () => {
    transaction.mockResolvedValue("transaction");

    await expect(createTransactionWithRetry()).resolves.toBe("transaction");
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  // DNS resolution can temporarily fail with EAI_AGAIN. The helper should wait
  // one second, retry the connection, and return the successfully created transaction.
  it("retries a transient transaction connection failure", async () => {
    transaction
      .mockRejectedValueOnce(
        Object.assign(new Error("DNS lookup failed"), { code: "EAI_AGAIN" }),
      )
      .mockResolvedValue("transaction");

    const result = createTransactionWithRetry();

    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toBe("transaction");
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  // Sequelize may wrap the original PostgreSQL error, so transient codes must
  // be recognized when they appear on a nested parent error as well.
  it("recognizes transient error codes nested on database errors", () => {
    expect(
      isTransientConnectionError({ parent: { code: "ECONNREFUSED" } }),
    ).toBe(true);
    expect(isTransientConnectionError({ code: "PERSISTENT_ERROR" })).toBe(
      false,
    );
  });

  // Permanent failures, such as authentication errors, should not be retried
  // because another connection attempt cannot resolve the underlying problem.
  it("does not retry non-transient transaction failures", async () => {
    const error = Object.assign(new Error("authentication failed"), {
      code: "28P01",
    });

    transaction.mockRejectedValue(error);

    await expect(createTransactionWithRetry()).rejects.toBe(error);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  // A transient failure is retried at most three times. After the one- and
  // three-second delays are exhausted, the original error is re-thrown.
  it("throws after exhausting transaction retries", async () => {
    const error = Object.assign(new Error("database unavailable"), {
      code: "ETIMEDOUT",
    });

    transaction.mockRejectedValue(error);

    const result = createTransactionWithRetry();
    const rejection = expect(result).rejects.toBe(error);

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(3000);

    await rejection;
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  // Read-only database work, such as loading application settings or reminders,
  // uses the generic wrapper and should receive the same retry behavior.
  it("returns the result of a retried database operation", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error("temporary failure"), { code: "EAI_AGAIN" }),
      )
      .mockResolvedValue("settings");

    const result = executeWithRetry(operation);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toBe("settings");
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
