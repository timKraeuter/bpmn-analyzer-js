import { is } from "bpmn-js/lib/util/ModelUtil";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";

/**
 * @typedef {import('diagram-js/lib/model/Types').Shape} Shape
 * @typedef {import('diagram-js/lib/model/Types').Connection} Connection
 */

const QUICK_FIX_NOTE_TYPE = "quick-fix-note";
const LIGHT_BULB_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiIGZpbGw9IndoaXRlIj48cGF0aCBkPSJNNDgwLTgwcS0zMyAwLTU2LjUtMjMuNVQ0MDAtMTYwaDE2MHEwIDMzLTIzLjUgNTYuNVQ0ODAtODBaTTMyMC0yMDB2LTgwaDMyMHY4MEgzMjBabTEwLTEyMHEtNjktNDEtMTA5LjUtMTEwVDE4MC01ODBxMC0xMjUgODcuNS0yMTIuNVQ0ODAtODgwcTEyNSAwIDIxMi41IDg3LjVUNzgwLTU4MHEwIDgxLTQwLjUgMTUwVDYzMC0zMjBIMzMwWm0yNC04MGgyNTJxNDUtMzIgNjkuNS03OVQ3MDAtNTgwcTAtOTItNjQtMTU2dC0xNTYtNjRxLTkyIDAtMTU2IDY0dC02NCAxNTZxMCA1NCAyNC41IDEwMXQ2OS41IDc5Wm0xMjYgMFoiLz48L3N2Zz4=";

export default function AnalysisQuickFixes(
  bpmnReplace,
  elementRegistry,
  eventBus,
  overlays,
  modeling,
  spaceTool,
) {
  eventBus.on(
    "analysis.done",
    (/** @param {CheckingResponse} result */ result) => {
      overlays.remove({
        type: QUICK_FIX_NOTE_TYPE,
      });
      for (const propertyResult of result.property_results) {
        if (propertyResult.fulfilled) {
          continue;
        }
        if (propertyResult.property === "Safeness") {
          addQuickFixUnsafeIfPossible(
            propertyResult.problematic_elements[0],
            propertyResult,
          );
        }
        if (propertyResult.property === "ProperCompletion") {
          addQuickFixProperCompletionIfPossible(
            propertyResult.problematic_elements[0],
          );
        }
        if (propertyResult.property === "OptionToComplete") {
          addQuickFixOptionToCompleteIfPossible(propertyResult);
        } else {
          // TODO: Add quick fixes for dead activities.
        }
      }
    },
  );

  function addOptionToCompleteParallelQuickFix(exclusiveGateway) {
    addQuickFixForElement(
      exclusiveGateway,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to parallel to fix Option To Complete.",
      () => {
        replaceWithParallelGateway(exclusiveGateway);
      },
    );
  }

  /**
   * @param {PropertyResult} propertyResult
   */
  function addQuickFixOptionToCompleteIfPossible(propertyResult) {
    const lastTransition = propertyResult.counter_example.transitions
      .slice(-1)
      .pop();
    if (lastTransition) {
      const lastState = lastTransition.next_state;
      if (lastState.snapshots.length !== 1) {
        console.error("Not dealing with more than one snapshot yet!");
        return;
      }
      const tokens = lastState.snapshots[0].tokens;
      const blockingPGs = Object.keys(tokens)
        .map((id) => elementRegistry.get(id).target)
        .filter(
          (flowNode) =>
            flowNode.type === "bpmn:ParallelGateway" &&
            flowNode.incoming.length > 1,
        );
      if (blockingPGs.length === 1) {
        const problematicPG = blockingPGs.pop();
        addOptionToCompleteExclusiveQuickFix(problematicPG);

        const exgCause = findProperCompletionChoiceCause(problematicPG);
        if (exgCause) {
          addOptionToCompleteParallelQuickFix(exgCause);
        }
      }
    }
  }

  function addOptionToCompleteExclusiveQuickFix(problematicPG) {
    addQuickFixForElement(
      problematicPG,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to exclusive to fix Option To Complete.",
      () => {
        replaceWithExclusiveGateway(problematicPG);
      },
    );
  }

  /**
   * @param {string} problematicElementId
   */
  function addQuickFixProperCompletionIfPossible(problematicElementId) {
    const problematicEndEvent = elementRegistry.get(problematicElementId);
    if (problematicEndEvent.incoming.length <= 1) {
      // Unsafe is the cause which has other quick fixes.
      return;
    }
    addQuickFixForElement(
      problematicEndEvent,
      {
        top: -45,
        left: 0,
      },
      "Click to create an additional end event to fix Proper Completion.",
      () => {
        makeEndEventForEachIncomingFlow(problematicEndEvent);
      },
    );
  }

  /**
   * @param {Shape} problematicEndEvent
   */
  function makeEndEventForEachIncomingFlow(problematicEndEvent) {
    let oldMid = getMid(problematicEndEvent);
    const inFlows = problematicEndEvent.incoming.slice(1);
    inFlows.forEach((inFlow) => {
      const endEvent = modeling.createShape(
        { type: "bpmn:EndEvent" },
        {
          x: oldMid.x,
          y: oldMid.y + 110, // Same as auto append
        },
        problematicEndEvent.parent,
      );
      modeling.reconnectEnd(inFlow, endEvent, {
        x: endEvent.x,
        y: endEvent.y,
      });
      modeling.layoutConnection(inFlow, {
        waypoints: [], // Forces new layout of the waypoints
      });
      oldMid = getMid(endEvent);
    });
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
   */
  function findAllPrecedingSFChoices(inFlow, choices) {
    // TODO: Cycles!
    const source = inFlow.source;
    if (source.outgoing.length > 1 && source.type === "bpmn:ExclusiveGateway") {
      choices.push(source);
    }
    if (source.incoming) {
      for (const inFlow of source.incoming) {
        findAllPrecedingSFChoices(inFlow, choices);
      }
    }
    return choices;
  }

  /**
   * @param {Connection} inFlow
   * @param {Shape[]} splits
   */
  function findAllPrecedingSFSplits(inFlow, splits) {
    // TODO: Cycles!
    const source = inFlow.source;
    if (source.outgoing.length > 1 && source.type !== "bpmn:ExclusiveGateway") {
      splits.push(source);
    }
    if (source.incoming) {
      for (const inFlow of source.incoming) {
        findAllPrecedingSFSplits(inFlow, splits);
      }
    }
    return splits;
  }

  /**
   * @param {string} elementID
   * @param {PropertyResult} propertyResult
   */
  function addQuickFixUnsafeIfPossible(elementID, propertyResult) {
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

  /**
   * @param {Shape} startShape
   * @param {Shape[]} shapes
   */
  function getAllFollowingShapes(startShape, shapes) {
    startShape.outgoing.forEach((sf) => {
      const target = sf.target;
      if (target.x > startShape.x && !shapes.includes(target)) {
        shapes.push(target);
        getAllFollowingShapes(target, shapes);
      }
    });
    return shapes;
  }

  /**
   * @param {Shape} unsafeMerge
   */
  function addPrecedingParallelGatewayQuickFix(unsafeMerge) {
    addQuickFixForElement(
      unsafeMerge,
      {
        top: -45,
        left: unsafeMerge.width / 2 - 18, // 18 is roughly half the size of the note (40 / 2)
      },
      "Click to add preceding parallel gateway to fix Safeness.",
      () => {
        addPrecedingParallelGateway(unsafeMerge);
      },
    );
  }

  /**
   * @param {Shape} unsafeMerge
   */
  function addPrecedingParallelGateway(unsafeMerge) {
    // TODO: Undo should undo all these commands.
    // Create parallel gateway
    const pg = modeling.createShape(
      { type: "bpmn:ParallelGateway" },
      {
        x: unsafeMerge.x,
        y: getMid(unsafeMerge).y,
      },
      unsafeMerge.parent,
    );
    // Move everything after unsafeMerge to the right to make space for the pg.
    const shapesToBeMoved = getAllFollowingShapes(unsafeMerge, [unsafeMerge]);
    spaceTool.makeSpace(
      shapesToBeMoved, // Move these elements
      [], // Dont resize anything
      {
        x: 75, // Shift x by 75
        y: 0,
      },
      "e", // Move east
      0,
    );
    // Change incoming sfs
    const inFlows = unsafeMerge.incoming.map((sf) => sf);
    for (const inFlow of inFlows) {
      modeling.reconnectEnd(inFlow, pg, getMid(pg));
    }
    // Add new sf between pg and activity.
    modeling.connect(pg, unsafeMerge);
  }

  function addSubsequentExclusiveGatewayQuickFix(unsafeCause) {
    addQuickFixForElement(
      unsafeCause,
      {
        top: -45,
        left: unsafeCause.width / 2 - 18, // 18 is roughly half the size of the note (40 / 2)
      },
      "Click to add subsequent exclusive gateway to fix Safeness.",
      () => {
        addSubsequentExclusiveGateway(unsafeCause);
      },
    );
  }

  /**
   * @param {Shape} unsafeCause
   */
  function addSubsequentExclusiveGateway(unsafeCause) {
    // TODO: Undo should undo all these commands.
    // Create exclusive gateway
    const eg = modeling.createShape(
      { type: "bpmn:ExclusiveGateway" },
      {
        x: unsafeCause.x + unsafeCause.width + 75,
        y: getMid(unsafeCause).y,
      },
      unsafeCause.parent,
    );
    // Move everything after unsafeCause to the right to make space for the ex g
    const shapesToBeMoved = getAllFollowingShapes(unsafeCause, []);
    spaceTool.makeSpace(
      shapesToBeMoved, // Move these elements
      [], // Dont resize anything
      {
        x: 75, // Shift x by 75
        y: 0,
      },
      "e", // Move east
      0,
    );
    // Change outgoing sfs
    const outFlows = unsafeCause.outgoing.map((sf) => sf);
    for (const outFlow of outFlows) {
      modeling.reconnectStart(outFlow, eg, getMid(eg));
    }
    // Add new sf between ex g and flow node.
    modeling.connect(unsafeCause, eg);
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
    addQuickFixForElement(
      gateway,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to exclusive to fix Safeness.",
      () => {
        replaceWithExclusiveGateway(gateway);
      },
    );
  }

  /**
   * @param {Shape} pg
   */
  function findProperCompletionChoiceCause(pg) {
    const preceding_choices = pg.incoming.map((inFlow) =>
      findAllPrecedingSFChoices(inFlow, []),
    );
    return findCommonSplitOrChoice(preceding_choices);
  }

  /**
   * @param {Shape} ex_gateway
   */
  function findUnsafeCause(ex_gateway) {
    const preceding_splits = ex_gateway.incoming.map((inFlow) =>
      findAllPrecedingSFSplits(inFlow, []),
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
    addQuickFixForElement(
      exclusiveGateway,
      {
        top: -45,
        left: 7.5,
      },
      "Click to change gateway to parallel to fix Safeness.",
      () => {
        replaceWithParallelGateway(exclusiveGateway);
      },
    );
  }

  /**
   * @param {Shape} element
   * @param position
   * @param {string} text
   * @param applyFunction
   */
  function addQuickFixForElement(element, position, text, applyFunction) {
    overlays.add(element, QUICK_FIX_NOTE_TYPE, {
      position,
      html: `<div id=${element.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltiptext">${text}</span>
           </div>`,
    });

    document
      .getElementById(element.id)
      .addEventListener("click", applyFunction);
  }

  /**
   * @param {Shape} gateway
   */
  function replaceWithExclusiveGateway(gateway) {
    const targetElement = {
      type: "bpmn:ExclusiveGateway",
    };
    bpmnReplace.replaceElement(gateway, targetElement);
  }

  /**
   * @param {Shape} gateway
   */
  function replaceWithParallelGateway(gateway) {
    const targetElement = {
      type: "bpmn:ParallelGateway",
    };
    bpmnReplace.replaceElement(gateway, targetElement);
  }
}
AnalysisQuickFixes.$inject = [
  "bpmnReplace",
  "elementRegistry",
  "eventBus",
  "overlays",
  "modeling",
  "spaceTool",
];
