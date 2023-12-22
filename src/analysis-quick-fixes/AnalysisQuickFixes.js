import { is } from "bpmn-js/lib/util/ModelUtil";
import { AddSubsequentExclusiveGatewayCommand } from "./commands/AddSubsequentExclusiveGatewayCommand";
import { AddPrecedingParallelGatewayCommand } from "./commands/AddPrecedingParallelGatewayCommand";
import { AddEndEventsForEachIncFlowCommand } from "./commands/AddEndEventsForEachIncFlowCommand";

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
  commandStack,
) {
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
        commandStack.execute("addEndEventsForEachIncFlowCommand", {
          problematicEndEvent,
        });
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
      () =>
        commandStack.execute("addPrecedingParallelGatewayCommand", {
          unsafeMerge,
        }),
    );
  }

  function addSubsequentExclusiveGatewayQuickFix(unsafeCause) {
    addQuickFixForElement(
      unsafeCause,
      {
        top: -45,
        left: unsafeCause.width / 2 - 18, // 18 is roughly half the size of the note (40 / 2)
      },
      "Click to add subsequent exclusive gateway to fix Safeness.",
      () =>
        commandStack.execute("addSubsequentExclusiveGatewayCommand", {
          unsafeCause,
        }),
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
  "commandStack",
];
