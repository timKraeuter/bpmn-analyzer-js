import { is, isAny } from "bpmn-js/lib/util/ModelUtil";
import { getMid } from "diagram-js/lib/layout/LayoutUtil";

export default function QuickFixOverlays(
  bpmnReplace,
  elementRegistry,
  eventBus,
  overlays,
  modeling,
) {
  eventBus.on("analysis.done", (result) => {
    for (const propertyResult of result.property_results) {
      if (propertyResult.property === "Safeness") {
        // TODO: Move stuff inside so the injected fields are always accessible.
        addQuickFixUnsafeIfPossible(
          propertyResult.problematic_elements[0],
          propertyResult,
          elementRegistry,
          bpmnReplace,
          overlays,
          modeling,
        );
      } else {
      }
    }
  });
}
QuickFixOverlays.$inject = [
  "bpmnReplace",
  "elementRegistry",
  "eventBus",
  "overlays",
  "modeling",
];

const QUICK_FIX_NOTE_TYPE = "quick-fix-note";
const LIGHT_BULB_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiIGZpbGw9IndoaXRlIj48cGF0aCBkPSJNNDgwLTgwcS0zMyAwLTU2LjUtMjMuNVQ0MDAtMTYwaDE2MHEwIDMzLTIzLjUgNTYuNVQ0ODAtODBaTTMyMC0yMDB2LTgwaDMyMHY4MEgzMjBabTEwLTEyMHEtNjktNDEtMTA5LjUtMTEwVDE4MC01ODBxMC0xMjUgODcuNS0yMTIuNVQ0ODAtODgwcTEyNSAwIDIxMi41IDg3LjVUNzgwLTU4MHEwIDgxLTQwLjUgMTUwVDYzMC0zMjBIMzMwWm0yNC04MGgyNTJxNDUtMzIgNjkuNS03OVQ3MDAtNTgwcTAtOTItNjQtMTU2dC0xNTYtNjRxLTkyIDAtMTU2IDY0dC02NCAxNTZxMCA1NCAyNC41IDEwMXQ2OS41IDc5Wm0xMjYgMFoiLz48L3N2Zz4=";

function noUnsafeIncFlow(source, problematic_elements) {
  return !source.incoming.some((sf) => problematic_elements.includes(sf.id));
}

function findUnsafeMerge(element, problematic_elements) {
  const source = element.source;
  if (
    isAny(source, ["bpmn:ExclusiveGateway", "bpmn:Activity"]) &&
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

function findAllPrecedingParallelGateways(inFlow, pgs) {
  const source = inFlow.source;
  if (source.type === "bpmn:ParallelGateway") {
    pgs.push(source);
  }
  if (source.incoming) {
    for (const inFlow of source.incoming) {
      findAllPrecedingParallelGateways(inFlow, pgs);
    }
  }
  return pgs;
}

function addQuickFixUnsafeIfPossible(
  elementID,
  propertyResult,
  elementRegistry,
  bpmnReplace,
  overlays,
  modeling,
) {
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
    addUnsafeMergeFix(unsafeMerge, overlays, bpmnReplace, modeling);
    const unsafeCause = findUnsafeCause(unsafeMerge, elementRegistry);
    if (unsafeCause) {
      addUnsafeCauseFix(unsafeCause, overlays, bpmnReplace);
    }
  }
}

function addUnsafeMergeFix(unsafeMerge, overlays, bpmnReplace, modeling) {
  if (is(unsafeMerge, "bpmn:ExclusiveGateway")) {
    addExclusiveToParallelGatewayQuickFix(overlays, unsafeMerge, bpmnReplace);
  } else {
    // Must be an activity
    overlays.add(unsafeMerge, QUICK_FIX_NOTE_TYPE, {
      position: {
        top: -45,
        left: 30,
      },
      html: `<div id=${unsafeMerge.id} class="small-note quick-fix-note tooltip">
               <img alt="quick-fix" src="data:image/svg+xml;base64,${LIGHT_BULB_BASE64}"/>
               <span class="tooltiptext">Click to add preceding parallel gateway to fix Safeness.</span>
           </div>`,
    });

    document.getElementById(unsafeMerge.id).addEventListener("click", () => {
      // reposition everything nicely. Maybe implement similar to the lasso tool
      // Move everything at unsafeMerge x + 50 on x.

      // Create parallel gateway
      const pg = modeling.createShape(
        { type: "bpmn:ParallelGateway" },
        {
          x: unsafeMerge.x - 50,
          y: getMid(unsafeMerge).y,
        },
        unsafeMerge.parent,
      );
      // Change incoming sfs
      const inFlows = unsafeMerge.incoming.map((sf) => sf);
      for (const inFlow of inFlows) {
        modeling.reconnectEnd(inFlow, pg, getMid(pg)); // Only reason why we include diagram-js atm.
      }
      // Add new sf between pg and activity.
      modeling.connect(pg, unsafeMerge);
    });
  }
}

function addUnsafeCauseFix(unsafeCause, overlays, bpmnReplace) {
  if (is(unsafeCause, "bpmn:ParallelGateway")) {
    addParallelToExclusiveGatewayQuickFix(overlays, unsafeCause, bpmnReplace);
  } else {
    // Must be an activity
    // TODO: Add fix for task.
  }
}

function addParallelToExclusiveGatewayQuickFix(overlays, gateway, bpmnReplace) {
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
  const preceding_pgs = ex_gateway.incoming.map((inFlow) =>
    findAllPrecedingParallelGateways(inFlow, []),
  );
  return findCommonPG(preceding_pgs);
}

function findCommonPG(preceding_pgs) {
  for (const pg of preceding_pgs[0]) {
    if (preceding_pgs.every((pgs) => pgs.includes(pg))) {
      return pg;
    }
  }
  return undefined;
}

function addExclusiveToParallelGatewayQuickFix(overlays, gateway, bpmnReplace) {
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
    replaceWithParallelGateway(gateway, bpmnReplace);
  });
}

function replaceWithExclusiveGateway(gateway, bpmnReplace) {
  const targetElement = {
    type: "bpmn:ExclusiveGateway",
  };
  bpmnReplace.replaceElement(gateway, targetElement);
}

function replaceWithParallelGateway(gateway, bpmnReplace) {
  const targetElement = {
    type: "bpmn:ParallelGateway",
  };
  bpmnReplace.replaceElement(gateway, targetElement);
}
