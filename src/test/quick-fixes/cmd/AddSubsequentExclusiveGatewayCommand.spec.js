import { describe, it, expect, vi } from "vitest";
import {
  AddSubsequentExclusiveGatewayCommand,
  getAllFollowingShapes,
  previewSubsequentExclusiveGateway,
} from "../../../lib/quick-fixes/cmd/AddSubsequentExclusiveGatewayCommand";
import { createMockShape, createMockConnection } from "../test-utils";

describe("AddSubsequentExclusiveGatewayCommand", () => {
  describe("preExecute", () => {
    it("should create an exclusive gateway after the unsafe cause", () => {
      // Arrange
      const parent = { id: "parent" };

      const mockModeling = {
        createShape: vi.fn(() => ({
          id: "eg_1",
          type: "bpmn:ExclusiveGateway",
          x: 200,
          y: 100,
          outgoing: [],
        })),
        reconnectStart: vi.fn(),
        connect: vi.fn(),
      };

      const mockSpaceTool = {
        makeSpace: vi.fn(),
      };

      const target = createMockShape({
        id: "target",
        x: 300,
        y: 100,
        outgoing: [],
        incoming: [],
      });

      const outFlow = createMockConnection({ id: "out_flow", target: target });
      target.incoming = [outFlow];

      const unsafeCause = createMockShape({
        id: "unsafe_cause",
        x: 100,
        y: 100,
        width: 100,
        outgoing: [outFlow],
        parent: parent,
      });
      outFlow.source = unsafeCause;

      const command = new AddSubsequentExclusiveGatewayCommand(
        mockModeling,
        mockSpaceTool,
      );

      // Act
      command.preExecute({ unsafeCause });

      // Assert
      expect(mockModeling.createShape).toHaveBeenCalledWith(
        { type: "bpmn:ExclusiveGateway" },
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
        parent,
      );

      expect(mockSpaceTool.makeSpace).toHaveBeenCalled();

      expect(mockModeling.connect).toHaveBeenCalled();
    });

    it("should reconnect outgoing flows from unsafe cause to new gateway", () => {
      // Arrange
      const parent = { id: "parent" };

      const newGateway = {
        id: "eg_1",
        type: "bpmn:ExclusiveGateway",
        x: 200,
        y: 100,
        outgoing: [],
      };

      const mockModeling = {
        createShape: vi.fn(() => newGateway),
        reconnectStart: vi.fn(),
        connect: vi.fn(),
      };

      const mockSpaceTool = {
        makeSpace: vi.fn(),
      };

      const target1 = createMockShape({ id: "target_1", x: 300 });
      const target2 = createMockShape({ id: "target_2", x: 300, y: 200 });

      const outFlow1 = createMockConnection({
        id: "out_flow_1",
        target: target1,
      });
      const outFlow2 = createMockConnection({
        id: "out_flow_2",
        target: target2,
      });

      const unsafeCause = createMockShape({
        id: "unsafe_cause",
        x: 100,
        y: 100,
        width: 100,
        outgoing: [outFlow1, outFlow2],
        parent: parent,
      });

      const command = new AddSubsequentExclusiveGatewayCommand(
        mockModeling,
        mockSpaceTool,
      );

      // Act
      command.preExecute({ unsafeCause });

      // Assert
      expect(mockModeling.reconnectStart).toHaveBeenCalledTimes(2);
    });
  });

  describe("$inject", () => {
    it("should have correct dependency injection", () => {
      // Arrange - nothing to arrange

      // Act - nothing to act

      // Assert
      expect(AddSubsequentExclusiveGatewayCommand.$inject).toEqual([
        "modeling",
        "spaceTool",
      ]);
    });
  });
});

describe("getAllFollowingShapes", () => {
  it("should return empty array for shape with no outgoing flows", () => {
    // Arrange
    const shape = createMockShape({ outgoing: [] });

    // Act
    const result = getAllFollowingShapes(shape, []);

    // Assert
    expect(result).toEqual([]);
  });

  it("should return following shapes that are to the right", () => {
    // Arrange
    const target = createMockShape({
      id: "target",
      x: 300,
      outgoing: [],
    });

    const outFlow = createMockConnection({
      id: "flow_1",
      target: target,
    });

    const startShape = createMockShape({
      id: "start",
      x: 100,
      outgoing: [outFlow],
    });

    outFlow.source = startShape;

    // Act
    const result = getAllFollowingShapes(startShape, []);

    // Assert
    expect(result).toContain(target);
  });

  it("should not include shapes that are to the left", () => {
    // Arrange
    const target = createMockShape({
      id: "target",
      x: 50, // To the left of start
      outgoing: [],
    });

    const outFlow = createMockConnection({
      id: "flow_1",
      target: target,
    });

    const startShape = createMockShape({
      id: "start",
      x: 100,
      outgoing: [outFlow],
    });

    // Act
    const result = getAllFollowingShapes(startShape, []);

    // Assert
    expect(result).not.toContain(target);
  });

  it("should include labels of following shapes", () => {
    // Arrange
    const label = { id: "target_label", type: "label" };
    const target = createMockShape({
      id: "target",
      x: 300,
      outgoing: [],
      label: label,
    });

    const outFlow = createMockConnection({
      id: "flow_1",
      target: target,
    });

    const startShape = createMockShape({
      id: "start",
      x: 100,
      outgoing: [outFlow],
    });

    // Act
    const result = getAllFollowingShapes(startShape, []);

    // Assert
    expect(result).toContain(target);
    expect(result).toContain(label);
  });

  it("should recursively find all following shapes", () => {
    // Arrange
    const target2 = createMockShape({
      id: "target_2",
      x: 500,
      outgoing: [],
    });

    const flow2 = createMockConnection({
      id: "flow_2",
      target: target2,
    });

    const target1 = createMockShape({
      id: "target_1",
      x: 300,
      outgoing: [flow2],
    });

    const flow1 = createMockConnection({
      id: "flow_1",
      target: target1,
    });

    const startShape = createMockShape({
      id: "start",
      x: 100,
      outgoing: [flow1],
    });

    // Act
    const result = getAllFollowingShapes(startShape, []);

    // Assert
    expect(result).toContain(target1);
    expect(result).toContain(target2);
  });

  it("should not include already seen shapes (handle cycles)", () => {
    // Arrange
    const target = createMockShape({
      id: "target",
      x: 300,
      outgoing: [],
    });

    const outFlow = createMockConnection({
      id: "flow_1",
      target: target,
    });

    const startShape = createMockShape({
      id: "start",
      x: 100,
      outgoing: [outFlow],
    });

    // Act
    const result = getAllFollowingShapes(startShape, [target]);

    // Assert
    expect(result.filter((s) => s.id === "target")).toHaveLength(1);
  });
});

describe("previewSubsequentExclusiveGateway", () => {
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

    const target = createMockShape({
      id: "target",
      x: 300,
      y: 100,
      outgoing: [],
    });

    const outFlow = createMockConnection({
      id: "out_flow",
      target: target,
    });

    const unsafeCause = createMockShape({
      id: "unsafe_cause",
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      outgoing: [outFlow],
    });

    // Act
    previewSubsequentExclusiveGateway(
      unsafeCause,
      mockComplexPreview,
      mockElementFactory,
      mockLayouter,
    );

    // Assert
    expect(mockElementFactory.createShape).toHaveBeenCalledWith({
      type: "bpmn:ExclusiveGateway",
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
