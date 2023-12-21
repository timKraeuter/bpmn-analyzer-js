import { is } from "bpmn-js/lib/util/ModelUtil";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";

const QUICK_FIX_NOTE_TYPE = "quick-fix-note";
const LIGHT_BULB_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiIGZpbGw9IndoaXRlIj48cGF0aCBkPSJNNDgwLTgwcS0zMyAwLTU2LjUtMjMuNVQ0MDAtMTYwaDE2MHEwIDMzLTIzLjUgNTYuNVQ0ODAtODBaTTMyMC0yMDB2LTgwaDMyMHY4MEgzMjBabTEwLTEyMHEtNjktNDEtMTA5LjUtMTEwVDE4MC01ODBxMC0xMjUgODcuNS0yMTIuNVQ0ODAtODgwcTEyNSAwIDIxMi41IDg3LjVUNzgwLTU4MHEwIDgxLTQwLjUgMTUwVDYzMC0zMjBIMzMwWm0yNC04MGgyNTJxNDUtMzIgNjkuNS03OVQ3MDAtNTgwcTAtOTItNjQtMTU2dC0xNTYtNjRxLTkyIDAtMTU2IDY0dC02NCAxNTZxMCA1NCAyNC41IDEwMXQ2OS41IDc5Wm0xMjYgMFoiLz48L3N2Zz4=";

export default function QuickFixOverlays(
  bpmnReplace,
  elementRegistry,
  eventBus,
  overlays,
  modeling,
  spaceTool,
) {
  eventBus.on("analysis.done", (result) => {
    for (const propertyResult of result.property_results) {
      if (propertyResult.property === "Safeness") {
        addQuickFixUnsafeIfPossible(
          propertyResult.problematic_elements[0],
          propertyResult,
        );
      } else {
        // TODO: Add quick fixes for other soundness properties.
      }
    }
  });

  function noUnsafeIncFlow(source, problematic_elements) {
    return !source.incoming.some((sf) => problematic_elements.includes(sf.id));
  }

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

  function findAllPrecedingSFSplits(inFlow, splits) {
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

  function addQuickFixUnsafeIfPossible(elementID, propertyResult) {
    overlays.remove({
      type: QUICK_FIX_NOTE_TYPE,
    });
    const element = elementRegistry.get(elementID);
    if (!element) {
      return;
    }
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

  function addUnsafeMergeFix(unsafeMerge) {
    if (is(unsafeMerge, "bpmn:ExclusiveGateway")) {
      addExclusiveToParallelGatewayQuickFix(unsafeMerge);
    } else {
      addPrecedingParallelGatewayQuickFix(unsafeMerge);
    }
  }

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

  function addPrecedingParallelGatewayQuickFix(unsafeMerge) {
    overlays.add(unsafeMerge, QUICK_FIX_NOTE_TYPE, {
      position: {
        top: -45,
        left: unsafeMerge.width / 2 - 18, // 18 is roughly half the size of the note (40 / 2)
      },
      html: `<div id=${unsafeMerge.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltiptext">Click to add preceding parallel gateway to fix Safeness.</span>
           </div>`,
    });

    document.getElementById(unsafeMerge.id).addEventListener("click", () => {
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
    });
  }

  function addPrecedingExclusiveGatewayQuickFix(unsafeCause) {
    overlays.add(unsafeCause, QUICK_FIX_NOTE_TYPE, {
      position: {
        top: -45,
        left: unsafeCause.width / 2 - 18, // 18 is roughly half the size of the note (40 / 2)
      },
      html: `<div id=${unsafeCause.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltiptext">Click to add subsequent exclusive gateway to fix Safeness.</span>
           </div>`,
    });

    document.getElementById(unsafeCause.id).addEventListener("click", () => {
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
      // Move everything after unsafeCause to the right to make space for the eg.
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
      // Add new sf between eg and flow node.
      modeling.connect(unsafeCause, eg);
    });
  }

  function addUnsafeCauseFix(unsafeCause) {
    if (is(unsafeCause, "bpmn:ParallelGateway")) {
      addParallelToExclusiveGatewayQuickFix(unsafeCause);
    } else {
      // Other flow node
      addPrecedingExclusiveGatewayQuickFix(unsafeCause);
    }
  }

  function addParallelToExclusiveGatewayQuickFix(gateway) {
    overlays.add(gateway, QUICK_FIX_NOTE_TYPE, {
      position: {
        top: -45,
        left: 7.5,
      },
      html: `<div id=${gateway.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltiptext">Click to change gateway to exclusive to fix Safeness.</span>
           </div>`,
    });

    document.getElementById(gateway.id).addEventListener("click", () => {
      replaceWithExclusiveGateway(gateway, bpmnReplace);
    });
  }

  function findUnsafeCause(ex_gateway) {
    const preceding_splits = ex_gateway.incoming.map((inFlow) =>
      findAllPrecedingSFSplits(inFlow, []),
    );
    return findCommonSplit(preceding_splits);
  }

  function findCommonSplit(preceding_pgs) {
    for (const pg of preceding_pgs[0]) {
      if (preceding_pgs.every((pgs) => pgs.includes(pg))) {
        return pg;
      }
    }
    return undefined;
  }

  function addExclusiveToParallelGatewayQuickFix(gateway) {
    overlays.add(gateway, QUICK_FIX_NOTE_TYPE, {
      position: {
        top: -45,
        left: 7.5,
      },
      html: `<div id=${gateway.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltiptext">Click to change gateway to parallel to fix Safeness.</span>
           </div>`,
    });

    document.getElementById(gateway.id).addEventListener("click", () => {
      replaceWithParallelGateway(gateway);
    });
  }

  function replaceWithExclusiveGateway(gateway) {
    const targetElement = {
      type: "bpmn:ExclusiveGateway",
    };
    bpmnReplace.replaceElement(gateway, targetElement);
  }

  function replaceWithParallelGateway(gateway) {
    const targetElement = {
      type: "bpmn:ParallelGateway",
    };
    bpmnReplace.replaceElement(gateway, targetElement);
  }
}
QuickFixOverlays.$inject = [
  "bpmnReplace",
  "elementRegistry",
  "eventBus",
  "overlays",
  "modeling",
  "spaceTool",
];
