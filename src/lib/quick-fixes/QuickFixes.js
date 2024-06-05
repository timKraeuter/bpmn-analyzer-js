import { is, isAny } from "bpmn-js/lib/util/ModelUtil";
import {
  AddSubsequentExclusiveGatewayCommand,
  previewSubsequentExclusiveGateway,
} from "./cmd/AddSubsequentExclusiveGatewayCommand";
import {
  AddPrecedingParallelGatewayCommand,
  previewPrecedingParallelGateway,
} from "./cmd/AddPrecedingParallelGatewayCommand";
import {
  AddEndEventsForEachIncFlowCommand,
  previewAddedEndEvents,
} from "./cmd/AddEndEventsForEachIncFlowCommand";
import { TOGGLE_MODE_EVENT } from "../counter-example-visualization/util/EventHelper";
import { hasEventDefinition } from "bpmn-js/lib/util/DiUtil";
import { pointDistance } from "diagram-js/lib/util/Geometry";

/**
 * @typedef {import('diagram-js/lib/model/Types').Shape} Shape
 * @typedef {import('diagram-js/lib/model/Types').Connection} Connection
 */

const QUICK_FIX_NOTE_TYPE = "quick-fix-note";
const LIGHT_BULB_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiIGZpbGw9IndoaXRlIj48cGF0aCBkPSJNNDgwLTgwcS0zMyAwLTU2LjUtMjMuNVQ0MDAtMTYwaDE2MHEwIDMzLTIzLjUgNTYuNVQ0ODAtODBaTTMyMC0yMDB2LTgwaDMyMHY4MEgzMjBabTEwLTEyMHEtNjktNDEtMTA5LjUtMTEwVDE4MC01ODBxMC0xMjUgODcuNS0yMTIuNVQ0ODAtODgwcTEyNSAwIDIxMi41IDg3LjVUNzgwLTU4MHEwIDgxLTQwLjUgMTUwVDYzMC0zMjBIMzMwWm0yNC04MGgyNTJxNDUtMzIgNjkuNS03OVQ3MDAtNTgwcTAtOTItNjQtMTU2dC0xNTYtNjRxLTkyIDAtMTU2IDY0dC02NCAxNTZxMCA1NCAyNC41IDEwMXQ2OS41IDc5Wm0xMjYgMFoiLz48L3N2Zz4=";

export default function QuickFixes(
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
) {
  eventBus.on(TOGGLE_MODE_EVENT, (event) => {
    // Hide/Show quick fixes when the execution example visualization is active/inactive.
    const overlaysRoot = document
      .getElementsByClassName("djs-overlay-container")
      .item(0);
    if (event.active) {
      overlaysRoot.classList.add("quick-fixes-hide");
    } else {
      overlaysRoot.classList.remove("quick-fixes-hide");
    }
  });

  commandStack.registerHandler(
    "addSubsequentExclusiveGatewayCommand",
    AddSubsequentExclusiveGatewayCommand,
  );
  commandStack.registerHandler(
    "addPrecedingParallelGatewayCommand",
    AddPrecedingParallelGatewayCommand,
  );
  commandStack.registerHandler(
    "addEndEventsForEachIncFlowCommand",
    AddEndEventsForEachIncFlowCommand,
  );

  eventBus.on(
    "analysis.done",
    (/** @param {CheckingResponse} result */ result) => {
      overlays.remove({
        type: QUICK_FIX_NOTE_TYPE,
      });
      result.property_results
        .filter((property) => !property.fulfilled)
        .forEach((propertyResult) => {
          if (propertyResult.property === "Safeness") {
            addQuickFixesSafeness(
              propertyResult.problematic_elements[0],
              propertyResult,
            );
          }
          if (propertyResult.property === "ProperCompletion") {
            addQuickFixesProperCompletion(
              propertyResult.problematic_elements[0],
            );
          }
          if (propertyResult.property === "OptionToComplete") {
            addQuickFixesOptionToComplete(
              propertyResult,
              result.property_results,
            );
          }
          if (propertyResult.property === "NoDeadActivities") {
            addQuickFixesForDeadActivities(propertyResult);
          }
        });
    },
  );

  /**
   *
   * @param {Shape} activity
   * @param {string[]} dead_activity_ids
   * @returns {Shape | undefined}
   */
  function findNearestConnectedFlowNode(activity, dead_activity_ids) {
    let nearest = undefined;
    activity.parent.children
      .filter(
        (child) =>
          child.x < activity.x &&
          is(child, "bpmn:FlowNode") &&
          child.type !== "label" &&
          isStartOrConnected(child) &&
          !isAny(child, ["bpmn:EndEvent"]) &&
          !dead_activity_ids.includes(child.id),
      )
      .forEach((flowNode) => {
        if (!nearest) {
          nearest = flowNode;
        } else {
          const distanceNearest = activity.x - nearest.x;
          const distanceFlowNode = activity.x - flowNode.x;
          if (distanceFlowNode < distanceNearest) {
            nearest = flowNode;
          }
        }
      });
    return nearest;
  }

  function isStartOrConnected(child) {
    return is(child, "bpmn:StartEvent") || child.incoming.length > 0;
  }

  /**
   *
   * @param {Shape} activity
   * @param {string[]} dead_activities
   */
  function proposeAddIncomingSequenceFlowQuickFix(activity, dead_activities) {
    const nearestFlowNode = findNearestConnectedFlowNode(
      activity,
      dead_activities,
    );
    if (nearestFlowNode) {
      addQuickFixForShape(
        activity,
        {
          top: -45,
          left: getLeftPositionForShape(activity),
        },
        "Click to add an incoming sequence flow to fix the dead Activity.",
        () => {
          modeling.connect(nearestFlowNode, activity);
        },
        () => {
          const connection = elementFactory.createConnection({
            type: "bpmn:SequenceFlow",
          });
          connection.waypoints = layouter.layoutConnection(connection, {
            source: nearestFlowNode,
            target: activity,
          });
          complexPreview.create({
            created: [connection],
          });
        },
      );
    }
  }

  /**
   *
   * @param {Shape} flowNode
   * @param {string[]} dead_activity_ids
   * @param {string} message
   */
  function proposeAddIncomingMessageFlowQuickFix(
    flowNode,
    dead_activity_ids,
    message,
  ) {
    const nearestMessageProducer = findNearestMessageProducer(
      flowNode,
      dead_activity_ids,
    );
    if (nearestMessageProducer) {
      let context = {
        getConnection: () => {
          return elementFactory.createConnection({
            type: "bpmn:MessageFlow",
          });
        },
      };
      addQuickFixForShape(
        flowNode,
        {
          top: -45,
          left: getLeftPositionForShape(flowNode),
        },
        `Click to add incoming message flow to fix ${message}`,
        () => {
          modeling.connect(nearestMessageProducer, flowNode);
        },
        () => {
          // Reset context since it is reused on each hover.
          context.connectionPreviewGfx = undefined;
          connectionPreview.drawPreview(context, true, {
            source: nearestMessageProducer,
            target: flowNode,
          });
        },
        () => {
          connectionPreview.cleanUp(context);
        },
      );
    }
  }

  /**
   *
   * @param {Shape} activity
   * @param {string[]} dead_activity_ids
   * @returns {Shape | undefined}
   */
  function findNearestMessageProducer(activity, dead_activity_ids) {
    if (!activity.parent.parent) {
      return undefined; // We are not in a collaboration.
    }
    const possibleProducers = activity.parent.parent.children
      .filter(
        (child) => is(child, "bpmn:Participant") && child !== activity.parent,
      )
      .flatMap((participant) => participant.children)
      .filter(
        (flowNode) =>
          (flowNode.type !== "label" &&
            isAny(flowNode, ["bpmn:IntermediateThrowEvent", "bpmn:EndEvent"]) &&
            hasEventDefinition(flowNode, "bpmn:MessageEventDefinition")) ||
          (is(flowNode, "bpmn:SendTask") &&
            !dead_activity_ids.includes(flowNode.id)),
      );

    let nearest = undefined;
    let distanceNearest = undefined;
    possibleProducers.forEach((flowNode) => {
      if (!nearest) {
        nearest = flowNode;
        distanceNearest = pointDistance(activity, nearest);
      } else {
        const distanceFlowNode = pointDistance(activity, flowNode);
        if (distanceFlowNode < distanceNearest) {
          nearest = flowNode;
          distanceNearest = distanceFlowNode;
        }
      }
    });
    return nearest;
  }

  function numberOfSequenceFlows(flowNode) {
    return flowNode.incoming.filter((flow) => is(flow, "bpmn:SequenceFlow"))
      .length;
  }

  function numberOfMessageFlows(flowNode) {
    return flowNode.incoming.filter((flow) => is(flow, "bpmn:MessageFlow"))
      .length;
  }

  /**
   * @param {PropertyResult} propertyResult
   */
  function addQuickFixesForDeadActivities(propertyResult) {
    propertyResult.problematic_elements.forEach((deadActivityId) => {
      const activity = elementRegistry.get(deadActivityId);
      if (numberOfSequenceFlows(activity) === 0) {
        proposeAddIncomingSequenceFlowQuickFix(
          activity,
          propertyResult.problematic_elements,
        );
        return;
      }
      if (
        is(activity, "bpmn:ReceiveTask") &&
        numberOfMessageFlows(activity) === 0
      ) {
        proposeAddIncomingMessageFlowQuickFix(
          activity,
          propertyResult.problematic_elements,
          "the dead Receive Task.",
        );
      }
    });
  }

  function addOptionToCompleteParallelQuickFix(exclusiveGateway) {
    addQuickFixForShape(
      exclusiveGateway,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to parallel to guarantee termination.",
      () => {
        replaceWithParallelGateway(exclusiveGateway);
      },
      () => {},
    );
  }

  /**
   * @param {PropertyResult} propertyResult
   * @param {PropertyResult[]} propertyResults
   */
  function addQuickFixesOptionToComplete(propertyResult, propertyResults) {
    if (!propertyResult.counter_example) {
      return;
    }

    const lastTransition = propertyResult.counter_example.transitions
      .slice(-1)
      .pop();
    if (lastTransition) {
      const lastState = lastTransition.next_state;
      lastState.snapshots.forEach((snapshot) => {
        tryFindBlockingPGsAndAddQuickFix(snapshot.tokens);
        tryFindBlockingMessageEventsAndAddQuickFix(
          snapshot.tokens,
          propertyResults,
        );
      });
    }
  }

  /**
   * @param {Map<string, number>} tokens
   * @param {PropertyResult[]} propertyResults
   */
  function tryFindBlockingMessageEventsAndAddQuickFix(tokens, propertyResults) {
    const noDeadActivitiesProperty = propertyResults.find(
      (propertyResult) => propertyResult.property === "NoDeadActivities",
    );
    tokens.forEach((_, id) => {
      const blockingElement = elementRegistry.get(id).target;
      if (
        is(blockingElement, "bpmn:IntermediateCatchEvent") &&
        hasEventDefinition(blockingElement, "bpmn:MessageEventDefinition") &&
        numberOfMessageFlows(blockingElement) === 0
      ) {
        proposeAddIncomingMessageFlowQuickFix(
          blockingElement,
          noDeadActivitiesProperty.problematic_elements,
          "the blocking Message Catch Event.",
        );
      }
    });
  }

  /**
   * @param {Map<string, number>} tokens
   */
  function findBlockingPGs(tokens) {
    let blockingPGs = [];
    tokens.forEach((_, id) => {
      const blockingElement = elementRegistry.get(id).target;
      if (
        is(blockingElement, "bpmn:ParallelGateway") &&
        blockingElement.incoming.length > 1
      ) {
        blockingPGs.push(blockingElement);
      }
    });
    return blockingPGs;
  }

  /**
   * @param {Map<string, number>} tokens
   */
  function tryFindBlockingPGsAndAddQuickFix(tokens) {
    const blockingPGs = findBlockingPGs(tokens);
    if (blockingPGs.length === 1) {
      const problematicPG = blockingPGs.pop();
      addOptionToCompleteExclusiveQuickFix(problematicPG);

      const exgCause = findProperCompletionChoiceCause(problematicPG);
      if (exgCause) {
        addOptionToCompleteParallelQuickFix(exgCause);
      }
    }
  }

  function addOptionToCompleteExclusiveQuickFix(problematicPG) {
    addQuickFixForShape(
      problematicPG,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to exclusive to guarantee termination.",
      () => {
        replaceWithExclusiveGateway(problematicPG);
      },
      () => {},
    );
  }

  /**
   * @param {string} problematicElementId
   */
  function addQuickFixesProperCompletion(problematicElementId) {
    const problematicEndEvent = elementRegistry.get(problematicElementId);
    if (problematicEndEvent.incoming.length <= 1) {
      // Unsafe is the cause which has other quick fixes.
      return;
    }
    addQuickFixForShape(
      problematicEndEvent,
      {
        top: -45,
        left: 0,
      },
      "Click to create additional end events.",
      () => {
        commandStack.execute("addEndEventsForEachIncFlowCommand", {
          problematicEndEvent,
        });
      },
      () => {
        previewAddedEndEvents(
          problematicEndEvent,
          complexPreview,
          elementFactory,
          layouter,
        );
      },
    );
  }

  /**
   * @param {Connection} element
   * @param {string[]} problematic_elements
   * @returns {Shape | undefined}
   */
  function findUnsafeMerge(element, problematic_elements) {
    const source = element.source;
    if (
      source.incoming.length > 1 &&
      noUnsafeIncFlow(source, problematic_elements)
    ) {
      return source;
    }
    for (const inFlow of source.incoming) {
      const unsafeMerge = findUnsafeMerge(inFlow, problematic_elements);
      if (unsafeMerge) {
        return unsafeMerge;
      }
    }
    return undefined;
  }

  /**
   * @param {Shape} source
   * @param {string[]} problematic_elements
   * @returns {boolean}
   */
  function noUnsafeIncFlow(source, problematic_elements) {
    return !source.incoming.some((sf) => problematic_elements.includes(sf.id));
  }

  /**
   * @param {Connection} inFlow
   * @param {Shape[]} choices
   * @param {Connection[]} seenFlows
   */
  function findAllPrecedingSFChoices(inFlow, choices, seenFlows) {
    const source = inFlow.source;
    if (source.outgoing.length > 1 && source.type === "bpmn:ExclusiveGateway") {
      choices.push(source);
    }
    if (source.incoming) {
      for (const inFlow of source.incoming) {
        if (seenFlows.includes(inFlow)) {
          continue;
        }
        seenFlows.push(inFlow);
        findAllPrecedingSFChoices(inFlow, choices, seenFlows);
      }
    }
    return choices;
  }

  /**
   * @param {Connection} inFlow
   * @param {Shape[]} splits
   * @param {Connection[]} seenFlows
   */
  function findAllPrecedingSFSplits(inFlow, splits, seenFlows) {
    const source = inFlow.source;
    if (source.outgoing.length > 1 && source.type !== "bpmn:ExclusiveGateway") {
      splits.push(source);
    }
    if (source.incoming) {
      for (const inFlow of source.incoming) {
        if (seenFlows.includes(inFlow)) {
          continue;
        }
        seenFlows.push(inFlow);
        findAllPrecedingSFSplits(inFlow, splits, seenFlows);
      }
    }
    return splits;
  }

  /**
   * @param {string} elementID
   * @param {PropertyResult} propertyResult
   */
  function addQuickFixesSafeness(elementID, propertyResult) {
    const element = elementRegistry.get(elementID);
    const unsafeMerge = findUnsafeMerge(
      element,
      propertyResult.problematic_elements,
    );
    if (unsafeMerge) {
      addUnsafeMergeFix(unsafeMerge);
      const unsafeCause = findUnsafeCause(unsafeMerge);
      if (unsafeCause) {
        addUnsafeCauseFix(unsafeCause);
      }
    }
  }

  /**
   * @param {Shape} unsafeMerge
   */
  function addUnsafeMergeFix(unsafeMerge) {
    if (is(unsafeMerge, "bpmn:ExclusiveGateway")) {
      addExclusiveToParallelGatewayQuickFix(unsafeMerge);
    } else {
      addPrecedingParallelGatewayQuickFix(unsafeMerge);
    }
  }

  function getLeftPositionForShape(unsafeMerge) {
    return unsafeMerge.width / 2 - 17; // 17 is roughly half the size of the note (40 / 2)
  }

  /**
   * @param {Shape} unsafeMerge
   */
  function addPrecedingParallelGatewayQuickFix(unsafeMerge) {
    addQuickFixForShape(
      unsafeMerge,
      {
        top: -45,
        left: getLeftPositionForShape(unsafeMerge),
      },
      "Click to add preceding parallel gateway to fix synchronization.",
      () =>
        commandStack.execute("addPrecedingParallelGatewayCommand", {
          unsafeMerge,
        }),
      () => {
        previewPrecedingParallelGateway(
          unsafeMerge,
          complexPreview,
          elementFactory,
          layouter,
        );
      },
    );
  }

  function addSubsequentExclusiveGatewayQuickFix(unsafeCause) {
    addQuickFixForShape(
      unsafeCause,
      {
        top: -45,
        left: getLeftPositionForShape(unsafeCause),
      },
      "Click to add subsequent exclusive gateway to fix synchronization.",
      () =>
        commandStack.execute("addSubsequentExclusiveGatewayCommand", {
          unsafeCause,
        }),
      () => {
        previewSubsequentExclusiveGateway(
          unsafeCause,
          complexPreview,
          elementFactory,
          layouter,
        );
      },
    );
  }

  /**
   * @param {Shape} unsafeCause
   */
  function addUnsafeCauseFix(unsafeCause) {
    if (is(unsafeCause, "bpmn:ParallelGateway")) {
      addParallelToExclusiveGatewaySafenessQuickFix(unsafeCause);
    } else {
      // Other flow node such as an Activity
      addSubsequentExclusiveGatewayQuickFix(unsafeCause);
    }
  }

  /**
   * @param {Shape} gateway
   */
  function addParallelToExclusiveGatewaySafenessQuickFix(gateway) {
    addQuickFixForShape(
      gateway,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to exclusive to fix synchronization.",
      () => {
        replaceWithExclusiveGateway(gateway);
      },
      () => {},
    );
  }

  /**
   * @param {Shape} pg
   */
  function findProperCompletionChoiceCause(pg) {
    const preceding_choices = pg.incoming.map((inFlow) =>
      findAllPrecedingSFChoices(inFlow, [], []),
    );
    return findCommonSplitOrChoice(preceding_choices);
  }

  /**
   * @param {Shape} ex_gateway
   */
  function findUnsafeCause(ex_gateway) {
    const preceding_splits = ex_gateway.incoming.map((inFlow) =>
      findAllPrecedingSFSplits(inFlow, [], []),
    );
    return findCommonSplitOrChoice(preceding_splits);
  }

  /**
   * @param {Shape[][]} preceding_pgs
   */
  function findCommonSplitOrChoice(preceding_pgs) {
    for (const pg of preceding_pgs[0]) {
      if (preceding_pgs.every((pgs) => pgs.includes(pg))) {
        return pg;
      }
    }
    return undefined;
  }

  /**
   * @param {Shape} exclusiveGateway
   */
  function addExclusiveToParallelGatewayQuickFix(exclusiveGateway) {
    addQuickFixForShape(
      exclusiveGateway,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to fix synchronization.",
      () => {
        replaceWithParallelGateway(exclusiveGateway);
      },
      () => {},
    );
  }

  /**
   * @param {Shape} shape
   * @param position
   * @param {string} text
   * @param applyFunction
   * @param previewFunction
   * @param previewCleanupFunction
   */
  function addQuickFixForShape(
    shape,
    position,
    text,
    applyFunction,
    previewFunction,
    previewCleanupFunction = () => complexPreview.cleanUp(),
  ) {
    if (quickFixExistsAtShape(shape)) {
      return;
    }
    overlays.add(shape, QUICK_FIX_NOTE_TYPE, {
      position,
      html: `<div id=${shape.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltipText">${text}</span>
           </div>`,
    });

    document.getElementById(shape.id).addEventListener("click", () => {
      previewCleanupFunction();
      applyFunction();
    });
    document.getElementById(shape.id).addEventListener("mouseenter", () => {
      previewFunction();
    });
    document.getElementById(shape.id).addEventListener("mouseleave", () => {
      previewCleanupFunction();
    });
  }

  /**
   * @param {Shape} shape
   * @returns {boolean}
   */
  function quickFixExistsAtShape(shape) {
    const existingQuickFixes = overlays.get({
      element: shape,
      type: QUICK_FIX_NOTE_TYPE,
    });
    return existingQuickFixes.length > 0;
  }

  /**
   * @param {Shape} gateway
   */
  function replaceWithExclusiveGateway(gateway) {
    bpmnReplace.replaceElement(gateway, {
      type: "bpmn:ExclusiveGateway",
    });
  }

  /**
   * @param {Shape} gateway
   */
  function replaceWithParallelGateway(gateway) {
    bpmnReplace.replaceElement(gateway, {
      type: "bpmn:ParallelGateway",
    });
  }
}
QuickFixes.$inject = [
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
];
