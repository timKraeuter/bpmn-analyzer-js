import { getMid } from "diagram-js/lib/layout/LayoutUtil";

export function AddEndEventsForEachIncFlowCommand(modeling) {
  this.preExecute = function (context) {
    const problematicEndEvent = context.problematicEndEvent;
    const endEventMid = getMid(problematicEndEvent);
    const inFlows = problematicEndEvent.incoming.slice(1);
    inFlows.forEach((inFlow) => {
      const endEvent = modeling.createShape(
        { type: "bpmn:EndEvent" },
        {
          x: endEventMid.x,
          y: getMid(inFlow.source).y,
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
    });
    // Move the reused end event to align all end events with their sources.
    const source = problematicEndEvent.incoming[0].source;
    const delta = {
      x: 0,
      y:
        getMid(source).y -
        Math.round(problematicEndEvent.height / 2) -
        problematicEndEvent.y,
    }; // Similar to the align elements code.
    modeling.moveShape(problematicEndEvent, delta);
  };
  // execute and revert not needed.
}

AddEndEventsForEachIncFlowCommand.$inject = ["modeling"];

export function previewAddedEndEvents(
  problematicEndEvent,
  complexPreview,
  elementFactory,
  layouter,
) {
  const created = [];
  problematicEndEvent.incoming.forEach((inFlow) => {
    // Add end event preview
    const endEvent = elementFactory.createShape({
      type: "bpmn:EndEvent",
    });
    endEvent.x = problematicEndEvent.x;
    endEvent.y =
      getMid(inFlow.source).y - Math.round(problematicEndEvent.height / 2);
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
    removed: problematicEndEvent.incoming,
  });
}
