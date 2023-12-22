import { getMid } from "diagram-js/lib/layout/LayoutUtil";

export function AddEndEventsForEachIncFlowCommand(modeling) {
  this.preExecute = function (context) {
    const problematicEndEvent = context.problematicEndEvent;
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
  };
  // execute and revert not needed.
}
