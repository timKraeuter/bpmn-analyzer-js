import { getMid } from "diagram-js/lib/layout/LayoutUtil";

export function AddEndEventsForEachIncFlowCommand(modeling) {
  this.preExecute = function (context) {
    const problematicEndEvent = context.problematicEndEvent;
    let oldMid = getMid(problematicEndEvent);
    const inFlows = problematicEndEvent.incoming.slice(1);
    modeling.setColor(inFlows, {
      stroke: "green",
    });
    inFlows.forEach((inFlow) => {
      const endEvent = modeling.createShape(
        { type: "bpmn:EndEvent" },
        {
          x: oldMid.x,
          y: oldMid.y + 110, // Same as auto append
        },
        problematicEndEvent.parent,
      );
      modeling.setColor([endEvent], {
        stroke: "green",
      });
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

export function previewAddedEndEvents(
  problematicEndEvent,
  complexPreview,
  elementFactory,
  layouter,
) {
  let previousEndEvent = problematicEndEvent;
  const inFlows = problematicEndEvent.incoming.slice(1);
  const created = [];
  inFlows.forEach((inFlow) => {
    // Add end event preview
    const endEvent = elementFactory.createShape({
      type: "bpmn:EndEvent",
    });
    endEvent.x = previousEndEvent.x;
    endEvent.y = previousEndEvent.y + 110;
    previousEndEvent = endEvent;
    created.push(endEvent);
    // Add connection preview
    const connection = elementFactory.createConnection({
      type: "bpmn:SequenceFlow",
    });
    connection.waypoints = layouter.layoutConnection(connection, {
      source: inFlow.source,
      target: endEvent,
    });
    created.push(connection);
  });

  complexPreview.create({
    created,
    removed: inFlows,
  });
}
