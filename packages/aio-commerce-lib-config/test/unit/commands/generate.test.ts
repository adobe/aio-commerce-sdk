import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateExtConfig = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMakeOutputDirFor = vi.fn();

vi.mock("node:fs/promises", () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));

vi.mock("#commands/generate/actions/lib", () => ({
  updateExtConfig: mockUpdateExtConfig,
}));

vi.mock("#commands/utils", () => ({
  makeOutputDirFor: mockMakeOutputDirFor,
}));

describe("generate actions command", () => {
  let generateActionsCommand: () => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockMakeOutputDirFor.mockResolvedValue("/mock/output/dir");
    mockReadFile.mockResolvedValue("template content");
    mockWriteFile.mockResolvedValue(undefined);
    mockUpdateExtConfig.mockResolvedValue({});

    const { run } = await import("#commands/generate/actions/run");
    generateActionsCommand = run;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should execute ext config update and action files generation in correct order", async () => {
    await generateActionsCommand();

    expect(mockUpdateExtConfig).toHaveBeenCalledTimes(1);
    expect(mockMakeOutputDirFor).toHaveBeenCalledTimes(1);
    expect(mockReadFile).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockUpdateExtConfig).toHaveBeenCalledBefore(mockMakeOutputDirFor);
  });

  it("should not execute action file generation when ext config update fails", async () => {
    const updateError = new Error("Failed to update ext config");
    mockUpdateExtConfig.mockRejectedValue(updateError);

    await expect(generateActionsCommand()).rejects.toThrow(
      "Failed to update ext config",
    );

    expect(mockUpdateExtConfig).toHaveBeenCalledTimes(1);
    expect(mockMakeOutputDirFor).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("should fail if action file generation fails (ext config update passed)", async () => {
    const generationError = new Error("Failed to generate action files");
    mockWriteFile.mockRejectedValue(generationError);

    await expect(generateActionsCommand()).rejects.toThrow(
      "Failed to generate action files",
    );

    expect(mockUpdateExtConfig).toHaveBeenCalledTimes(1);
    expect(mockMakeOutputDirFor).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalled();
  });
});
