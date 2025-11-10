import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSchemaValidationCommand = vi.fn();
const mockGenerateRuntimeActions = vi.fn();
const mockGenerateSchema = vi.fn();

vi.mock("../../source/modules/schema/validation/command", () => ({
  run: mockSchemaValidationCommand,
}));

vi.mock("../../source/modules/actions/generate", () => ({
  generateRuntimeActions: mockGenerateRuntimeActions,
  generateSchema: mockGenerateSchema,
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

  it("should execute schema validation, schema generation, and runtime actions generation in correct order", async () => {
    const mockSchema = [{ name: "test", type: "text" }];
    mockSchemaValidationCommand.mockResolvedValue(mockSchema);
    mockGenerateRuntimeActions.mockResolvedValue(undefined);
    mockGenerateSchema.mockResolvedValue(undefined);

    await preAppBuild({});

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateSchema).toHaveBeenCalledTimes(1);
    expect(mockGenerateRuntimeActions).toHaveBeenCalledTimes(1);
    expect(mockGenerateSchema).toHaveBeenCalledWith(mockSchema);
    expect(mockSchemaValidationCommand).toHaveBeenCalledBefore(
      mockGenerateSchema,
    );
    expect(mockGenerateSchema).toHaveBeenCalledBefore(
      mockGenerateRuntimeActions,
    );
  });

  it("should not execute action generation when schema validation fails", async () => {
    const validationError = new Error("Schema validation failed");
    mockSchemaValidationCommand.mockRejectedValue(validationError);
    mockGenerateRuntimeActions.mockResolvedValue(undefined);
    mockGenerateSchema.mockResolvedValue(undefined);

    await expect(preAppBuild({})).rejects.toThrow("Schema validation failed");

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateRuntimeActions).not.toHaveBeenCalled();
    expect(mockGenerateSchema).not.toHaveBeenCalled();
  });

  it("should fail if schema generation fails (validation passed)", async () => {
    const mockSchema = [{ name: "test", type: "text" }];
    mockSchemaValidationCommand.mockResolvedValue(mockSchema);
    const generationError = new Error("Failed to generate schema");
    mockGenerateSchema.mockRejectedValue(generationError);
    mockGenerateRuntimeActions.mockResolvedValue(undefined);

    await expect(preAppBuild({})).rejects.toThrow("Failed to generate schema");

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateSchema).toHaveBeenCalledTimes(1);
    expect(mockGenerateRuntimeActions).not.toHaveBeenCalled();
  });

  it("should fail if runtime actions generation fails (validation and schema passed)", async () => {
    const mockSchema = [{ name: "test", type: "text" }];
    mockSchemaValidationCommand.mockResolvedValue(mockSchema);
    mockGenerateSchema.mockResolvedValue(undefined);
    const generationError = new Error("Failed to generate actions");
    mockGenerateRuntimeActions.mockRejectedValue(generationError);

    await expect(preAppBuild({})).rejects.toThrow("Failed to generate actions");

    expect(mockSchemaValidationCommand).toHaveBeenCalledTimes(1);
    expect(mockGenerateSchema).toHaveBeenCalledTimes(1);
    expect(mockGenerateSchema).toHaveBeenCalledWith(mockSchema);
    expect(mockGenerateRuntimeActions).toHaveBeenCalledTimes(1);
  });
});
