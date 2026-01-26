import { describe, it, expect, vi } from "vitest";
import {
  AddPrecedingParallelGatewayCommand,
  getAllPrecedingShapes,
  previewPrecedingParallelGateway,
} from "../../../lib/quick-fixes/cmd/AddPrecedingParallelGatewayCommand";
import { createMockShape, createMockConnection } from "../test-utils";

describe("AddPrecedingParallelGatewayCommand", () => {
  describe("preExecute", () => {
    it("should create a parallel gateway before the unsafe merge", () => {
      // Arrange
      const parent = { id: "parent" };

      const mockModeling = {
        createShape: vi.fn(() => ({
          id: "pg_1",
          type: "bpmn:ParallelGateway",
          x: 50,
          y: 100,
        })),
        reconnectEnd: vi.fn(),
        connect: vi.fn(),
      };

      const mockSpaceTool = {
        makeSpace: vi.fn(),
      };

      const source = createMockShape({ id: "source", x: 50 });
      const inFlow = createMockConnection({ id: "in_flow", source: source });
      source.outgoing = [inFlow];

      const unsafeMerge = createMockShape({
        id: "unsafe_merge",
        x: 200,
        y: 100,
        incoming: [inFlow],
        parent: parent,
      });
      inFlow.target = unsafeMerge;

      const command = new AddPrecedingParallelGatewayCommand(
        mockModeling,
        mockSpaceTool,
      );

      // Act
      command.preExecute({ unsafeMerge });

      // Assert
      expect(mockModeling.createShape).toHaveBeenCalledWith(
        { type: "bpmn:ParallelGateway" },
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
        parent,
      );

      expect(mockSpaceTool.makeSpace).toHaveBeenCalled();

      expect(mockModeling.connect).toHaveBeenCalled();
    });

    it("should reconnect incoming flows to the new parallel gateway", () => {
      // Arrange
      const parent = { id: "parent" };

      const newGateway = {
        id: "pg_1",
        type: "bpmn:ParallelGateway",
        x: 150,
        y: 100,
      };

      const mockModeling = {
        createShape: vi.fn(() => newGateway),
        reconnectEnd: vi.fn(),
        connect: vi.fn(),
      };

      const mockSpaceTool = {
        makeSpace: vi.fn(),
      };

      const source1 = createMockShape({ id: "source_1", x: 50 });
      const source2 = createMockShape({ id: "source_2", x: 50, y: 200 });

      const inFlow1 = createMockConnection({
        id: "in_flow_1",
        source: source1,
      });
      const inFlow2 = createMockConnection({
        id: "in_flow_2",
        source: source2,
      });

      source1.outgoing = [inFlow1];
      source2.outgoing = [inFlow2];

      const unsafeMerge = createMockShape({
        id: "unsafe_merge",
        x: 200,
        y: 100,
        incoming: [inFlow1, inFlow2],
        parent: parent,
      });

      inFlow1.target = unsafeMerge;
      inFlow2.target = unsafeMerge;

      const command = new AddPrecedingParallelGatewayCommand(
        mockModeling,
        mockSpaceTool,
      );

      // Act
      command.preExecute({ unsafeMerge });

      // Assert
      expect(mockModeling.reconnectEnd).toHaveBeenCalledTimes(2);
    });
  });

  describe("$inject", () => {
    it("should have correct dependency injection", () => {
      // Arrange - nothing to arrange

      // Act - nothing to act

      // Assert
      expect(AddPrecedingParallelGatewayCommand.$inject).toEqual([
        "modeling",
        "spaceTool",
      ]);
    });
  });
});

describe("getAllPrecedingShapes", () => {
  it("should return empty array for shape with no incoming flows", () => {
    // Arrange
    const shape = createMockShape({ incoming: [] });

    // Act
    const result = getAllPrecedingShapes(shape, []);

    // Assert
    expect(result).toEqual([]);
  });

  it("should return preceding shapes that are to the left", () => {
    // Arrange
    const source = createMockShape({
      id: "source",
      x: 50,
      incoming: [],
    });

    const inFlow = createMockConnection({
      id: "flow_1",
      source: source,
    });

    const endShape = createMockShape({
      id: "end",
      x: 200,
      incoming: [inFlow],
    });

    inFlow.target = endShape;

    // Act
    const result = getAllPrecedingShapes(endShape, []);

    // Assert
    expect(result).toContain(source);
  });

  it("should not include shapes that are to the right", () => {
    // Arrange
    const source = createMockShape({
      id: "source",
      x: 300, // To the right of end
      incoming: [],
    });

    const inFlow = createMockConnection({
      id: "flow_1",
      source: source,
    });

    const endShape = createMockShape({
      id: "end",
      x: 200,
      incoming: [inFlow],
    });

    // Act
    const result = getAllPrecedingShapes(endShape, []);

    // Assert
    expect(result).not.toContain(source);
  });

  it("should include labels of preceding shapes", () => {
    // Arrange
    const label = { id: "source_label", type: "label" };
    const source = createMockShape({
      id: "source",
      x: 50,
      incoming: [],
      label: label,
    });

    const inFlow = createMockConnection({
      id: "flow_1",
      source: source,
    });

    const endShape = createMockShape({
      id: "end",
      x: 200,
      incoming: [inFlow],
    });

    // Act
    const result = getAllPrecedingShapes(endShape, []);

    // Assert
    expect(result).toContain(source);
    expect(result).toContain(label);
  });

  it("should recursively find all preceding shapes", () => {
    // Arrange
    const source1 = createMockShape({
      id: "source_1",
      x: 50,
      incoming: [],
    });

    const flow1 = createMockConnection({
      id: "flow_1",
      source: source1,
    });

    const source2 = createMockShape({
      id: "source_2",
      x: 150,
      incoming: [flow1],
    });

    flow1.target = source2;

    const flow2 = createMockConnection({
      id: "flow_2",
      source: source2,
    });

    const endShape = createMockShape({
      id: "end",
      x: 300,
      incoming: [flow2],
    });

    flow2.target = endShape;

    // Act
    const result = getAllPrecedingShapes(endShape, []);

    // Assert
    expect(result).toContain(source2);
    expect(result).toContain(source1);
  });

  it("should not include already seen shapes (handle cycles)", () => {
    // Arrange
    const source = createMockShape({
      id: "source",
      x: 50,
      incoming: [],
    });

    const inFlow = createMockConnection({
      id: "flow_1",
      source: source,
    });

    const endShape = createMockShape({
      id: "end",
      x: 200,
      incoming: [inFlow],
    });

    // Act
    const result = getAllPrecedingShapes(endShape, [source]);

    // Assert
    expect(result.filter((s) => s.id === "source")).toHaveLength(1);
  });
});

describe("previewPrecedingParallelGateway", () => {
  it("should create preview with new gateway and connections", () => {
    // Arrange
    const mockComplexPreview = {
      create: vi.fn(),
    };

    const mockElementFactory = {
      createShape: vi.fn((options) => ({
        type: options.type,
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      })),
      createConnection: vi.fn(() => ({
        type: "bpmn:SequenceFlow",
        waypoints: [],
      })),
    };

    const mockLayouter = {
      layoutConnection: vi.fn(() => [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]),
    };

    const source = createMockShape({
      id: "source",
      x: 50,
      y: 100,
      incoming: [],
    });

    const inFlow = createMockConnection({
      id: "in_flow",
      source: source,
    });

    source.outgoing = [inFlow];

    const unsafeMerge = createMockShape({
      id: "unsafe_merge",
      x: 200,
      y: 100,
      width: 100,
      height: 80,
      incoming: [inFlow],
    });

    inFlow.target = unsafeMerge;

    // Act
    previewPrecedingParallelGateway(
      unsafeMerge,
      mockComplexPreview,
      mockElementFactory,
      mockLayouter,
    );

    // Assert
    expect(mockElementFactory.createShape).toHaveBeenCalledWith({
      type: "bpmn:ParallelGateway",
    });

    expect(mockElementFactory.createConnection).toHaveBeenCalled();

    expect(mockComplexPreview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        created: expect.any(Array),
        moved: expect.any(Array),
        removed: expect.any(Array),
      }),
    );
  });
});
