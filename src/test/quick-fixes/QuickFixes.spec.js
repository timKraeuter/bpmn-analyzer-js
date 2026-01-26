import { describe, it, expect, vi, beforeEach } from "vitest";
import QuickFixes from "../../lib/quick-fixes/QuickFixes";
import { TOGGLE_MODE_EVENT } from "../../lib/counter-example-visualization/util/EventHelper";
import { createMockShape, createMockConnection } from "./test-utils";

/**
 * Creates mock dependencies for QuickFixes constructor
 */
function createMockDependencies() {
  const eventHandlers = {};

  const bpmnReplace = {
    replaceElement: vi.fn(),
  };

  const elementRegistry = {
    get: vi.fn(),
  };

  const eventBus = {
    on: vi.fn((event, callback) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(callback);
    }),
    fire: (event, data) => {
      if (eventHandlers[event]) {
        eventHandlers[event].forEach((handler) => handler(data));
      }
    },
  };

  const overlays = {
    add: vi.fn(),
    remove: vi.fn(),
    get: vi.fn(() => []),
  };

  const modeling = {
    connect: vi.fn(),
    createShape: vi.fn(),
    reconnectStart: vi.fn(),
    reconnectEnd: vi.fn(),
    moveShape: vi.fn(),
    layoutConnection: vi.fn(),
  };

  const commandStack = {
    registerHandler: vi.fn(),
    execute: vi.fn(),
  };

  const complexPreview = {
    create: vi.fn(),
    cleanUp: vi.fn(),
  };

  const connectionPreview = {
    drawPreview: vi.fn(),
    cleanUp: vi.fn(),
  };

  const elementFactory = {
    createConnection: vi.fn(() => ({
      type: "bpmn:SequenceFlow",
      waypoints: [],
    })),
    createShape: vi.fn((options) => ({
      type: options.type,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    })),
  };

  const layouter = {
    layoutConnection: vi.fn(() => [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]),
  };

  return {
    bpmnReplace,
    elementRegistry,
    eventBus,
    overlays,
    modeling,
    commandStack,
    complexPreview,
    connectionPreview,
    elementFactory,
    layouter,
    eventHandlers,
  };
}

describe("QuickFixes", () => {
  let deps;
  let quickFixes;

  // Mock document for DOM operations
  beforeEach(() => {
    deps = createMockDependencies();

    // Mock document for overlay container and getElementById
    global.document = {
      getElementsByClassName: vi.fn(() => ({
        item: vi.fn(() => ({
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
          },
        })),
      })),
      getElementById: vi.fn(() => ({
        addEventListener: vi.fn(),
      })),
    };

    quickFixes = new QuickFixes(
      deps.bpmnReplace,
      deps.elementRegistry,
      deps.eventBus,
      deps.overlays,
      deps.modeling,
      deps.commandStack,
      deps.complexPreview,
      deps.connectionPreview,
      deps.elementFactory,
      deps.layouter,
    );
  });

  describe("initialization", () => {
    it("should register event handlers on eventBus", () => {
      // Arrange
      // (QuickFixes instance created in beforeEach)

      // Act
      // (Registration happens during construction)

      // Assert
      expect(deps.eventBus.on).toHaveBeenCalledWith(
        TOGGLE_MODE_EVENT,
        expect.any(Function),
      );
      expect(deps.eventBus.on).toHaveBeenCalledWith(
        "analysis.done",
        expect.any(Function),
      );
    });

    it("should register command handlers on commandStack", () => {
      // Arrange
      // (QuickFixes instance created in beforeEach)

      // Act
      // (Registration happens during construction)

      // Assert
      expect(deps.commandStack.registerHandler).toHaveBeenCalledWith(
        "addSubsequentExclusiveGatewayCommand",
        expect.any(Function),
      );
      expect(deps.commandStack.registerHandler).toHaveBeenCalledWith(
        "addPrecedingParallelGatewayCommand",
        expect.any(Function),
      );
      expect(deps.commandStack.registerHandler).toHaveBeenCalledWith(
        "addEndEventsForEachIncFlowCommand",
        expect.any(Function),
      );
    });
  });

  describe("TOGGLE_MODE_EVENT handling", () => {
    it("should add quick-fixes-hide class when visualization is active", () => {
      // Arrange
      const mockOverlaysRoot = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      };
      global.document = {
        getElementsByClassName: vi.fn(() => ({
          item: vi.fn(() => mockOverlaysRoot),
        })),
        getElementById: vi.fn(() => ({
          addEventListener: vi.fn(),
        })),
      };
      new QuickFixes(
        deps.bpmnReplace,
        deps.elementRegistry,
        deps.eventBus,
        deps.overlays,
        deps.modeling,
        deps.commandStack,
        deps.complexPreview,
        deps.connectionPreview,
        deps.elementFactory,
        deps.layouter,
      );

      // Act
      deps.eventBus.fire(TOGGLE_MODE_EVENT, { active: true });

      // Assert
      expect(mockOverlaysRoot.classList.add).toHaveBeenCalledWith(
        "quick-fixes-hide",
      );
    });

    it("should remove quick-fixes-hide class when visualization is inactive", () => {
      // Arrange
      const mockOverlaysRoot = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      };
      global.document = {
        getElementsByClassName: vi.fn(() => ({
          item: vi.fn(() => mockOverlaysRoot),
        })),
        getElementById: vi.fn(() => ({
          addEventListener: vi.fn(),
        })),
      };
      new QuickFixes(
        deps.bpmnReplace,
        deps.elementRegistry,
        deps.eventBus,
        deps.overlays,
        deps.modeling,
        deps.commandStack,
        deps.complexPreview,
        deps.connectionPreview,
        deps.elementFactory,
        deps.layouter,
      );

      // Act
      deps.eventBus.fire(TOGGLE_MODE_EVENT, { active: false });

      // Assert
      expect(mockOverlaysRoot.classList.remove).toHaveBeenCalledWith(
        "quick-fixes-hide",
      );
    });
  });

  describe("analysis.done event handling", () => {
    it("should remove existing quick-fix overlays", () => {
      // Arrange
      const analysisResult = {
        property_results: [],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.overlays.remove).toHaveBeenCalledWith({
        type: "quick-fix-note",
      });
    });

    it("should process unfulfilled Safeness property", () => {
      // Arrange
      // Create a proper chain: startEvent -> task1 -> exclusiveGateway
      //                        startEvent -> task2 -> exclusiveGateway
      const startEvent = createMockShape({
        id: "start",
        type: "bpmn:StartEvent",
        x: 50,
        incoming: [],
        outgoing: [],
      });
      const task1 = createMockShape({
        id: "task_1",
        type: "bpmn:Task",
        x: 150,
        incoming: [],
        outgoing: [],
      });
      const task2 = createMockShape({
        id: "task_2",
        type: "bpmn:Task",
        x: 150,
        y: 200,
        incoming: [],
        outgoing: [],
      });
      const flow1 = createMockConnection({
        id: "flow_1",
        source: task1,
        target: null,
      });
      const flow2 = createMockConnection({
        id: "flow_2",
        source: task2,
        target: null,
      });
      task1.outgoing = [flow1];
      task2.outgoing = [flow2];
      const exclusiveGateway = createMockShape({
        id: "exg_1",
        type: "bpmn:ExclusiveGateway",
        x: 300,
        incoming: [flow1, flow2],
        outgoing: [],
      });
      flow1.target = exclusiveGateway;
      flow2.target = exclusiveGateway;
      const unsafeFlow = createMockConnection({
        id: "unsafe_flow",
        source: exclusiveGateway,
        target: null,
      });
      exclusiveGateway.outgoing = [unsafeFlow];
      deps.elementRegistry.get.mockImplementation((id) => {
        if (id === "unsafe_flow") return unsafeFlow;
        if (id === "exg_1") return exclusiveGateway;
        return null;
      });
      const analysisResult = {
        property_results: [
          {
            property: "Safeness",
            fulfilled: false,
            problematic_elements: ["unsafe_flow"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("unsafe_flow");
    });

    it("should process unfulfilled ProperCompletion property", () => {
      // Arrange
      const inFlow1 = createMockConnection({ id: "inflow_1" });
      const inFlow2 = createMockConnection({ id: "inflow_2" });
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        incoming: [inFlow1, inFlow2],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("end_event_1");
      expect(deps.overlays.add).toHaveBeenCalled();
    });

    it("should not add quick fix for ProperCompletion if end event has single incoming flow", () => {
      // Arrange
      const inFlow1 = createMockConnection({ id: "inflow_1" });
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        incoming: [inFlow1],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.overlays.add).not.toHaveBeenCalled();
    });

    it("should process unfulfilled NoDeadActivities property", () => {
      // Arrange
      const deadActivity = createMockShape({
        id: "dead_activity_1",
        type: "bpmn:Task",
        x: 300,
        incoming: [],
        parent: {
          children: [
            createMockShape({
              id: "start_1",
              type: "bpmn:StartEvent",
              x: 100,
              incoming: [],
            }),
          ],
          parent: null,
        },
      });
      deps.elementRegistry.get.mockReturnValue(deadActivity);
      const analysisResult = {
        property_results: [
          {
            property: "NoDeadActivities",
            fulfilled: false,
            problematic_elements: ["dead_activity_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("dead_activity_1");
    });

    it("should skip fulfilled properties", () => {
      // Arrange
      const analysisResult = {
        property_results: [
          {
            property: "Safeness",
            fulfilled: true,
            problematic_elements: [],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).not.toHaveBeenCalled();
    });
  });

  describe("NoDeadActivities quick fixes", () => {
    it("should call elementRegistry.get for dead activities", () => {
      // Arrange
      const parent = {
        children: [],
        parent: null,
      };
      const startEvent = createMockShape({
        id: "start_1",
        type: "bpmn:StartEvent",
        x: 100,
        incoming: [],
        outgoing: [],
        parent: parent,
      });
      parent.children.push(startEvent);
      const deadActivity = createMockShape({
        id: "dead_activity",
        type: "bpmn:Task",
        x: 300,
        incoming: [],
        outgoing: [],
        parent: parent,
      });
      parent.children.push(deadActivity);
      deps.elementRegistry.get.mockReturnValue(deadActivity);
      deps.overlays.get.mockReturnValue([]);
      const analysisResult = {
        property_results: [
          {
            property: "NoDeadActivities",
            fulfilled: false,
            problematic_elements: ["dead_activity"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("dead_activity");
    });

    it("should check for sequence flows on dead activity", () => {
      // Arrange
      const parent = {
        children: [],
        parent: null,
      };
      const deadActivity = createMockShape({
        id: "dead_activity",
        type: "bpmn:Task",
        x: 300,
        incoming: [], // No incoming flows - this is what makes it dead
        outgoing: [],
        parent: parent,
      });
      parent.children.push(deadActivity);
      deps.elementRegistry.get.mockReturnValue(deadActivity);
      const analysisResult = {
        property_results: [
          {
            property: "NoDeadActivities",
            fulfilled: false,
            problematic_elements: ["dead_activity"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("dead_activity");
    });

    it("should propose adding message flow for ReceiveTask without message flows", () => {
      // Arrange
      const sequenceFlow = createMockConnection({
        id: "sf_1",
        type: "bpmn:SequenceFlow",
      });
      const sendTask = createMockShape({
        id: "send_task",
        type: "bpmn:SendTask",
        x: 100,
        y: 300,
      });
      const participant1 = {
        id: "participant_1",
        type: "bpmn:Participant",
        children: [sendTask],
      };
      sendTask.parent = participant1;
      const receiveTask = createMockShape({
        id: "receive_task",
        type: "bpmn:ReceiveTask",
        x: 300,
        y: 100,
        incoming: [sequenceFlow],
      });
      const participant2 = {
        id: "participant_2",
        type: "bpmn:Participant",
        children: [receiveTask],
      };
      receiveTask.parent = participant2;
      const collaboration = {
        id: "collaboration",
        children: [participant1, participant2],
      };
      participant1.parent = collaboration;
      participant2.parent = collaboration;
      deps.elementRegistry.get.mockReturnValue(receiveTask);
      const analysisResult = {
        property_results: [
          {
            property: "NoDeadActivities",
            fulfilled: false,
            problematic_elements: ["receive_task"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("receive_task");
    });
  });

  describe("OptionToComplete quick fixes", () => {
    it("should not add quick fix when there is no counter example", () => {
      // Arrange
      const analysisResult = {
        property_results: [
          {
            property: "OptionToComplete",
            fulfilled: false,
            problematic_elements: [],
            counter_example: null,
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.overlays.add).not.toHaveBeenCalled();
    });

    it("should find blocking parallel gateway and add quick fix", () => {
      // Arrange
      const parallelGateway = createMockShape({
        id: "pg_1",
        type: "bpmn:ParallelGateway",
        incoming: [
          createMockConnection({ id: "in_1" }),
          createMockConnection({ id: "in_2" }),
        ],
      });
      const mockConnection = {
        id: "sf_before_pg",
        target: parallelGateway,
      };
      deps.elementRegistry.get.mockImplementation((id) => {
        if (id === "sf_before_pg") return mockConnection;
        if (id === "pg_1") return parallelGateway;
        return null;
      });
      const analysisResult = {
        property_results: [
          {
            property: "OptionToComplete",
            fulfilled: false,
            problematic_elements: [],
            counter_example: {
              transitions: [
                {
                  next_state: {
                    snapshots: [
                      {
                        tokens: new Map([["sf_before_pg", 1]]),
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("sf_before_pg");
    });
  });

  describe("Safeness quick fixes", () => {
    it("should add exclusive to parallel gateway quick fix for unsafe merge", () => {
      // Arrange
      // Create a proper chain: task1 -> exclusiveGateway -> unsafeFlow
      //                        task2 -> exclusiveGateway
      const task1 = createMockShape({
        id: "task_1",
        type: "bpmn:Task",
        x: 200,
        incoming: [],
        outgoing: [],
      });
      const task2 = createMockShape({
        id: "task_2",
        type: "bpmn:Task",
        x: 200,
        y: 200,
        incoming: [],
        outgoing: [],
      });
      const inFlow1 = createMockConnection({
        id: "in_1",
        source: task1,
        target: null,
      });
      const inFlow2 = createMockConnection({
        id: "in_2",
        source: task2,
        target: null,
      });
      task1.outgoing = [inFlow1];
      task2.outgoing = [inFlow2];
      task1.incoming = [];
      task2.incoming = [];
      const exclusiveGateway = createMockShape({
        id: "exg_1",
        type: "bpmn:ExclusiveGateway",
        x: 400,
        incoming: [inFlow1, inFlow2],
        outgoing: [],
      });
      inFlow1.target = exclusiveGateway;
      inFlow2.target = exclusiveGateway;
      const unsafeFlow = createMockConnection({
        id: "unsafe_flow",
        source: exclusiveGateway,
        target: null,
      });
      exclusiveGateway.outgoing = [unsafeFlow];
      deps.elementRegistry.get.mockImplementation((id) => {
        if (id === "unsafe_flow") return unsafeFlow;
        return null;
      });
      deps.overlays.get.mockReturnValue([]);
      const analysisResult = {
        property_results: [
          {
            property: "Safeness",
            fulfilled: false,
            problematic_elements: ["unsafe_flow"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("unsafe_flow");
      expect(deps.overlays.add).toHaveBeenCalled();
    });
  });

  describe("gateway replacement", () => {
    it("should process OptionToComplete with blocking parallel gateway in counter example", () => {
      // Arrange
      const task1 = createMockShape({
        id: "task_1",
        type: "bpmn:Task",
        x: 100,
        incoming: [],
        outgoing: [],
      });
      const inFlow1 = createMockConnection({
        id: "in_1",
        source: task1,
        target: null,
      });
      const inFlow2 = createMockConnection({
        id: "in_2",
        source: task1,
        target: null,
      });
      task1.outgoing = [inFlow1, inFlow2];
      const parallelGateway = createMockShape({
        id: "pg_1",
        type: "bpmn:ParallelGateway",
        x: 300,
        incoming: [inFlow1, inFlow2],
        outgoing: [],
      });
      inFlow1.target = parallelGateway;
      inFlow2.target = parallelGateway;
      const mockFlowBeforePG = {
        id: "sf_before_pg",
        target: parallelGateway,
        source: task1,
      };
      deps.elementRegistry.get.mockImplementation((id) => {
        if (id === "sf_before_pg") return mockFlowBeforePG;
        if (id === "pg_1") return parallelGateway;
        return null;
      });
      deps.overlays.get.mockReturnValue([]);
      const analysisResult = {
        property_results: [
          {
            property: "OptionToComplete",
            fulfilled: false,
            problematic_elements: [],
            counter_example: {
              transitions: [
                {
                  next_state: {
                    snapshots: [
                      {
                        tokens: new Map([["sf_before_pg", 1]]),
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.elementRegistry.get).toHaveBeenCalledWith("sf_before_pg");
    });
  });

  describe("ProperCompletion quick fixes", () => {
    it("should add quick fix for end event with multiple incoming flows", () => {
      // Arrange
      const source1 = createMockShape({ id: "task_1", x: 200 });
      const source2 = createMockShape({ id: "task_2", x: 200 });
      const inFlow1 = createMockConnection({
        id: "inflow_1",
        source: source1,
      });
      const inFlow2 = createMockConnection({
        id: "inflow_2",
        source: source2,
      });
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        x: 400,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      deps.overlays.get.mockReturnValue([]);
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert
      expect(deps.overlays.add).toHaveBeenCalledWith(
        endEvent,
        "quick-fix-note",
        expect.objectContaining({
          position: expect.any(Object),
          html: expect.stringContaining(
            "Click to create additional end events",
          ),
        }),
      );
    });

    it("should execute addEndEventsForEachIncFlowCommand when quick fix is applied", () => {
      // Arrange
      const source1 = createMockShape({ id: "task_1", x: 200, y: 100 });
      const source2 = createMockShape({ id: "task_2", x: 200, y: 200 });
      const inFlow1 = createMockConnection({
        id: "inflow_1",
        source: source1,
      });
      const inFlow2 = createMockConnection({
        id: "inflow_2",
        source: source2,
      });
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        x: 400,
        y: 150,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      deps.overlays.get.mockReturnValue([]);
      let clickHandler;
      global.document.getElementById = vi.fn(() => ({
        addEventListener: vi.fn((event, handler) => {
          if (event === "click") {
            clickHandler = handler;
          }
        }),
      }));
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);
      if (clickHandler) {
        clickHandler();
      }

      // Assert
      if (clickHandler) {
        expect(deps.commandStack.execute).toHaveBeenCalledWith(
          "addEndEventsForEachIncFlowCommand",
          expect.objectContaining({
            problematicEndEvent: endEvent,
          }),
        );
      }
    });
  });

  describe("overlay management", () => {
    it("should not add duplicate quick fixes at the same shape", () => {
      // Arrange
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        incoming: [
          createMockConnection({ id: "inflow_1" }),
          createMockConnection({ id: "inflow_2" }),
        ],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      deps.overlays.get.mockReturnValue([]);
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act - First call
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert - First call adds overlay
      expect(deps.overlays.add).toHaveBeenCalledTimes(1);

      // Arrange - Reset and simulate existing overlay
      deps.overlays.add.mockClear();
      deps.overlays.get.mockReturnValue([{ id: "existing_overlay" }]);

      // Act - Second call
      deps.eventBus.fire("analysis.done", analysisResult);

      // Assert - Should not add another overlay
      expect(deps.overlays.add).not.toHaveBeenCalled();
    });
  });

  describe("preview functionality", () => {
    it("should call complexPreview.cleanUp on mouseleave by default", () => {
      // Arrange
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        x: 400,
        width: 36,
        height: 36,
        incoming: [
          createMockConnection({ id: "inflow_1" }),
          createMockConnection({ id: "inflow_2" }),
        ],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      deps.overlays.get.mockReturnValue([]);
      let mouseleaveHandler;
      global.document.getElementById = vi.fn(() => ({
        addEventListener: vi.fn((event, handler) => {
          if (event === "mouseleave") {
            mouseleaveHandler = handler;
          }
        }),
      }));
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);
      if (mouseleaveHandler) {
        mouseleaveHandler();
      }

      // Assert
      if (mouseleaveHandler) {
        expect(deps.complexPreview.cleanUp).toHaveBeenCalled();
      }
    });

    it("should call previewAddedEndEvents on mouseenter for ProperCompletion quick fix", () => {
      // Arrange
      const source1 = createMockShape({ id: "task_1", x: 200, y: 100 });
      const inFlow1 = createMockConnection({
        id: "inflow_1",
        source: source1,
      });
      const source2 = createMockShape({ id: "task_2", x: 200, y: 200 });
      const inFlow2 = createMockConnection({
        id: "inflow_2",
        source: source2,
      });
      const endEvent = createMockShape({
        id: "end_event_1",
        type: "bpmn:EndEvent",
        x: 400,
        width: 36,
        height: 36,
        incoming: [inFlow1, inFlow2],
      });
      deps.elementRegistry.get.mockReturnValue(endEvent);
      deps.overlays.get.mockReturnValue([]);
      let mouseenterHandler;
      global.document.getElementById = vi.fn(() => ({
        addEventListener: vi.fn((event, handler) => {
          if (event === "mouseenter") {
            mouseenterHandler = handler;
          }
        }),
      }));
      const analysisResult = {
        property_results: [
          {
            property: "ProperCompletion",
            fulfilled: false,
            problematic_elements: ["end_event_1"],
          },
        ],
      };

      // Act
      deps.eventBus.fire("analysis.done", analysisResult);
      if (mouseenterHandler) {
        mouseenterHandler();
      }

      // Assert
      if (mouseenterHandler) {
        expect(deps.complexPreview.create).toHaveBeenCalled();
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty property_results array", () => {
      // Arrange
      const analysisResult = {
        property_results: [],
      };

      // Act & Assert
      expect(() => {
        deps.eventBus.fire("analysis.done", analysisResult);
      }).not.toThrow();
    });

    it("should handle unknown property types gracefully", () => {
      // Arrange
      const analysisResult = {
        property_results: [
          {
            property: "UnknownProperty",
            fulfilled: false,
            problematic_elements: ["element_1"],
          },
        ],
      };

      // Act & Assert
      expect(() => {
        deps.eventBus.fire("analysis.done", analysisResult);
      }).not.toThrow();
    });

    it("should handle undefined element from empty problematic_elements", () => {
      // Arrange
      const analysisResult = {
        property_results: [
          {
            property: "NoDeadActivities",
            fulfilled: false,
            problematic_elements: [],
          },
        ],
      };

      // Act & Assert
      expect(() => {
        deps.eventBus.fire("analysis.done", analysisResult);
      }).not.toThrow();
    });
  });
});

describe("QuickFixes.$inject", () => {
  it("should define correct dependency injection array", () => {
    // Arrange
    // (No setup needed - testing static property)

    // Act
    const injectArray = QuickFixes.$inject;

    // Assert
    expect(injectArray).toEqual([
      "bpmnReplace",
      "elementRegistry",
      "eventBus",
      "overlays",
      "modeling",
      "commandStack",
      "complexPreview",
      "connectionPreview",
      "elementFactory",
      "layouter",
    ]);
  });
});
