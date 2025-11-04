import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSchemaValidationCommand = vi.fn();
const mockGenerateActions = vi.fn();

vi.mock("../../source/modules/schema/validation/command", () => ({
  run: mockSchemaValidationCommand,
}));

vi.mock("../../source/modules/actions/generate", () => ({
  run: mockGenerateActions,
}));

describe("pre-app-build hook", () => {
  let preAppBuild: (config: Record<string, unknown>) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import("../../source/hooks/pre-app-build");
    preAppBuild = module.default;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should execute both schema validation and action generation when validation succeeds", async () => {
    mockSchemaValidationCommand.mockResolvedValue(undefined);
    mockGenerateActions.mockResolvedValue(undefined);

    await preAppBuild({});

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateActions).toHaveBeenCalledTimes(1);
    expect(mockSchemaValidationCommand).toHaveBeenCalledBefore(
      mockGenerateActions,
    );
  });

  it("should not execute action generation when schema validation fails", async () => {
    const validationError = new Error("Schema validation failed");
    mockSchemaValidationCommand.mockRejectedValue(validationError);
    mockGenerateActions.mockResolvedValue(undefined);

    await expect(preAppBuild({})).rejects.toThrow("Schema validation failed");

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateActions).not.toHaveBeenCalled();
  });

  it("should fail if action generation fails (validation passed)", async () => {
    mockSchemaValidationCommand.mockResolvedValue(undefined);
    const generationError = new Error("Failed to generate actions");
    mockGenerateActions.mockRejectedValue(generationError);

    await expect(preAppBuild({})).rejects.toThrow("Failed to generate actions");

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateActions).toHaveBeenCalledTimes(1);
  });
});
