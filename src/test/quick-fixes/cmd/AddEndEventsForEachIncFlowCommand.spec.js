import { describe, it, expect, vi } from "vitest";
import {
  AddEndEventsForEachIncFlowCommand,
  previewAddedEndEvents,
} from "../../../lib/quick-fixes/cmd/AddEndEventsForEachIncFlowCommand";
import { createMockShape, createMockConnection } from "../test-utils";

describe("AddEndEventsForEachIncFlowCommand", () => {
  describe("preExecute", () => {
    it("should create new end events for each incoming flow except the first", () => {
      // Arrange
      const parent = { id: "parent" };

      const createdEndEvents = [];
      const mockModeling = {
        createShape: vi.fn((shape, position) => {
          const endEvent = {
            id: `end_${createdEndEvents.length}`,
            type: "bpmn:EndEvent",
            x: position.x,
            y: position.y,
          };
          createdEndEvents.push(endEvent);
          return endEvent;
        }),
        reconnectEnd: vi.fn(),
        layoutConnection: vi.fn(),
        moveShape: vi.fn(),
      };

      const source1 = createMockShape({ id: "task_1", x: 100, y: 100 });
      const source2 = createMockShape({ id: "task_2", x: 100, y: 200 });
      const source3 = createMockShape({ id: "task_3", x: 100, y: 300 });

      const inFlow1 = createMockConnection({ id: "flow_1", source: source1 });
      const inFlow2 = createMockConnection({ id: "flow_2", source: source2 });
      const inFlow3 = createMockConnection({ id: "flow_3", source: source3 });

      const endEvent = createMockShape({
        id: "end_event",
        type: "bpmn:EndEvent",
        x: 300,
        y: 200,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2, inFlow3],
        parent: parent,
      });

      inFlow1.target = endEvent;
      inFlow2.target = endEvent;
      inFlow3.target = endEvent;

      const command = new AddEndEventsForEachIncFlowCommand(mockModeling);

      // Act
      command.preExecute({ problematicEndEvent: endEvent });

      // Assert
      expect(mockModeling.createShape).toHaveBeenCalledTimes(2);

      expect(mockModeling.createShape).toHaveBeenCalledWith(
        { type: "bpmn:EndEvent" },
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
        parent,
      );
    });

    it("should reconnect incoming flows to new end events", () => {
      // Arrange
      const parent = { id: "parent" };

      const mockModeling = {
        createShape: vi.fn(() => ({
          id: "new_end",
          type: "bpmn:EndEvent",
          x: 300,
          y: 200,
        })),
        reconnectEnd: vi.fn(),
        layoutConnection: vi.fn(),
        moveShape: vi.fn(),
      };

      const source1 = createMockShape({ id: "task_1", x: 100, y: 100 });
      const source2 = createMockShape({ id: "task_2", x: 100, y: 200 });

      const inFlow1 = createMockConnection({ id: "flow_1", source: source1 });
      const inFlow2 = createMockConnection({ id: "flow_2", source: source2 });

      const endEvent = createMockShape({
        id: "end_event",
        type: "bpmn:EndEvent",
        x: 300,
        y: 150,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2],
        parent: parent,
      });

      const command = new AddEndEventsForEachIncFlowCommand(mockModeling);

      // Act
      command.preExecute({ problematicEndEvent: endEvent });

      // Assert
      expect(mockModeling.reconnectEnd).toHaveBeenCalledTimes(1);
      expect(mockModeling.reconnectEnd).toHaveBeenCalledWith(
        inFlow2,
        expect.any(Object),
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
      );
    });

    it("should layout connections after reconnecting", () => {
      // Arrange
      const parent = { id: "parent" };

      const mockModeling = {
        createShape: vi.fn(() => ({
          id: "new_end",
          type: "bpmn:EndEvent",
          x: 300,
          y: 200,
        })),
        reconnectEnd: vi.fn(),
        layoutConnection: vi.fn(),
        moveShape: vi.fn(),
      };

      const source1 = createMockShape({ id: "task_1", x: 100, y: 100 });
      const source2 = createMockShape({ id: "task_2", x: 100, y: 200 });

      const inFlow1 = createMockConnection({ id: "flow_1", source: source1 });
      const inFlow2 = createMockConnection({ id: "flow_2", source: source2 });

      const endEvent = createMockShape({
        id: "end_event",
        type: "bpmn:EndEvent",
        x: 300,
        y: 150,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2],
        parent: parent,
      });

      const command = new AddEndEventsForEachIncFlowCommand(mockModeling);

      // Act
      command.preExecute({ problematicEndEvent: endEvent });

      // Assert
      expect(mockModeling.layoutConnection).toHaveBeenCalledWith(inFlow2, {
        waypoints: [],
      });
    });

    it("should move the original end event to align with its source", () => {
      // Arrange
      const parent = { id: "parent" };

      const mockModeling = {
        createShape: vi.fn(() => ({
          id: "new_end",
          type: "bpmn:EndEvent",
          x: 300,
          y: 200,
        })),
        reconnectEnd: vi.fn(),
        layoutConnection: vi.fn(),
        moveShape: vi.fn(),
      };

      const source1 = createMockShape({ id: "task_1", x: 100, y: 100 });
      const source2 = createMockShape({ id: "task_2", x: 100, y: 200 });

      const inFlow1 = createMockConnection({ id: "flow_1", source: source1 });
      const inFlow2 = createMockConnection({ id: "flow_2", source: source2 });

      const endEvent = createMockShape({
        id: "end_event",
        type: "bpmn:EndEvent",
        x: 300,
        y: 150,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2],
        parent: parent,
      });

      const command = new AddEndEventsForEachIncFlowCommand(mockModeling);

      // Act
      command.preExecute({ problematicEndEvent: endEvent });

      // Assert
      expect(mockModeling.moveShape).toHaveBeenCalledWith(
        endEvent,
        expect.objectContaining({
          x: 0,
          y: expect.any(Number),
        }),
      );
    });
  });

  describe("$inject", () => {
    it("should have correct dependency injection", () => {
      // Arrange - nothing to arrange

      // Act - nothing to act

      // Assert
      expect(AddEndEventsForEachIncFlowCommand.$inject).toEqual(["modeling"]);
    });
  });
});

describe("previewAddedEndEvents", () => {
  it("should create preview with new end events for each incoming flow", () => {
    // Arrange
    const mockComplexPreview = {
      create: vi.fn(),
    };

    const mockElementFactory = {
      createShape: vi.fn((options) => ({
        type: options.type,
        x: 0,
        y: 0,
        width: 36,
        height: 36,
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

    const source1 = createMockShape({ id: "task_1", x: 100, y: 100 });
    const source2 = createMockShape({ id: "task_2", x: 100, y: 200 });

    const inFlow1 = createMockConnection({ id: "flow_1", source: source1 });
    const inFlow2 = createMockConnection({ id: "flow_2", source: source2 });

    const endEvent = createMockShape({
      id: "end_event",
      type: "bpmn:EndEvent",
      x: 300,
      y: 150,
      width: 36,
      height: 36,
      incoming: [inFlow1, inFlow2],
    });

    // Act
    previewAddedEndEvents(
      endEvent,
      mockComplexPreview,
      mockElementFactory,
      mockLayouter,
    );

    // Assert
    expect(mockElementFactory.createShape).toHaveBeenCalledWith({
      type: "bpmn:EndEvent",
    });
    expect(mockElementFactory.createShape).toHaveBeenCalledTimes(2);

    expect(mockElementFactory.createConnection).toHaveBeenCalledTimes(2);

    expect(mockComplexPreview.create).toHaveBeenCalledWith({
      created: expect.any(Array),
      removed: endEvent.incoming,
    });
  });

  it("should position end events aligned with their source shapes", () => {
    // Arrange
    const mockComplexPreview = {
      create: vi.fn(),
    };

    const createdShapes = [];
    const mockElementFactory = {
      createShape: vi.fn((options) => {
        const shape = {
          type: options.type,
          x: 0,
          y: 0,
          width: 36,
          height: 36,
        };
        createdShapes.push(shape);
        return shape;
      }),
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

    const source1 = createMockShape({
      id: "task_1",
      x: 100,
      y: 100,
      height: 80,
    });
    const source2 = createMockShape({
      id: "task_2",
      x: 100,
      y: 300,
      height: 80,
    });

    const inFlow1 = createMockConnection({ id: "flow_1", source: source1 });
    const inFlow2 = createMockConnection({ id: "flow_2", source: source2 });

    const endEvent = createMockShape({
      id: "end_event",
      type: "bpmn:EndEvent",
      x: 300,
      y: 200,
      width: 36,
      height: 36,
      incoming: [inFlow1, inFlow2],
    });

    // Act
    previewAddedEndEvents(
      endEvent,
      mockComplexPreview,
      mockElementFactory,
      mockLayouter,
    );

    // Assert
    expect(createdShapes[0].x).toBe(endEvent.x);
    expect(createdShapes[1].x).toBe(endEvent.x);

    expect(createdShapes[0].y).toBe(122);
    expect(createdShapes[1].y).toBe(322);
  });
});
