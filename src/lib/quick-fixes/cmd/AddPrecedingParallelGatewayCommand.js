import { getMid } from "diagram-js/lib/layout/LayoutUtil";
const xShift = -75;

export function AddPrecedingParallelGatewayCommand(modeling, spaceTool) {
  this.preExecute = function (context) {
    const unsafeMerge = context.unsafeMerge;
    // Create PG
    const pg = modeling.createShape(
      { type: "bpmn:ParallelGateway" },
      {
        x: unsafeMerge.x + xShift,
        y: getMid(unsafeMerge).y,
      },
      unsafeMerge.parent,
    );
    // Move everything before unsafeMerge to make space for the preceding pg.
    const shapesToBeMoved = getAllPrecedingShapes(unsafeMerge, []);
    spaceTool.makeSpace(
      shapesToBeMoved, // Move these elements
      [], // Dont resize anything
      {
        x: xShift, // Shift x by 75
        y: 0,
      },
      "e", // Move east
      0,
    );
    // Change incoming sfs
    const midPG = getMid(pg);
    unsafeMerge.incoming
      .map((inFlow) => inFlow)
      .forEach((inFlow) => modeling.reconnectEnd(inFlow, pg, midPG));
    // Add new sf between pg and activity.
    modeling.connect(pg, unsafeMerge);
  };
  // execute and revert not needed.
}

AddPrecedingParallelGatewayCommand.$inject = ["modeling", "spaceTool"];

export function previewPrecedingParallelGateway(
  unsafeMerge,
  complexPreview,
  elementFactory,
  layouter,
) {
  // Create PG
  const created = [];
  const pg = elementFactory.createShape({
    type: "bpmn:ParallelGateway",
  });
  pg.x = unsafeMerge.x + xShift - pg.width / 2;
  pg.y = getMid(unsafeMerge).y - pg.height / 2;
  created.push(pg);
  // Add new sf between pg and activity.
  const connection = elementFactory.createConnection({
    type: "bpmn:SequenceFlow",
  });
  connection.waypoints = layouter.layoutConnection(connection, {
    source: pg,
    target: unsafeMerge,
  });
  created.push(connection);
  // Change incoming sfs
  unsafeMerge.incoming.forEach((inFlow) => {
    const replaceConnection = elementFactory.createConnection({
      type: "bpmn:SequenceFlow",
    });
    // Workaround: Create bogus shape for now.
    const bogus = elementFactory.createShape({
      type: inFlow.source.type,
    });
    bogus.x = inFlow.source.x + xShift;
    bogus.y = inFlow.source.y;

    const midPG = getMid(pg);
    // Reconnect end
    replaceConnection.waypoints = layouter.layoutConnection(replaceConnection, {
      source: bogus,
      target: pg,
      connectionEnd: midPG,
    });
    created.push(replaceConnection);
  });

  // Move everything before unsafeMerge to make space for the preceding pg.
  const delta = {
    x: xShift,
    y: 0,
  };
  const shapesAndFlows = getAllPrecedingShapes(unsafeMerge, []);
  shapesAndFlows.forEach((shape) =>
    shape.incoming.forEach((inflow) => shapesAndFlows.push(inflow)),
  );
  const moved = shapesAndFlows.map((element) => ({
    element,
    delta,
  }));

  complexPreview.create({
    created,
    moved,
    removed: unsafeMerge.incoming,
  });
}

/**
 * @param {Shape} startShape
 * @param {Element[]} shapes
 */
export function getAllPrecedingShapes(startShape, shapes) {
  startShape.incoming.forEach((sf) => {
    const source = sf.source;
    if (source.x < startShape.x && !shapes.includes(source)) {
      shapes.push(source);
      if (source.label) {
        shapes.push(source.label);
      }
      getAllPrecedingShapes(source, shapes);
    }
  });
  return shapes;
}
