import { getMid } from "diagram-js/lib/layout/LayoutUtil";
import { getAllFollowingShapes } from "./AddSubsequentExclusiveGatewayCommand";

export function AddPrecedingParallelGatewayCommand(modeling, spaceTool) {
  this.preExecute = function (context) {
    const unsafeMerge = context.unsafeMerge;
    // TODO: Undo should undo all these commands.
    // Create parallel gateway
    const pg = modeling.createShape(
      { type: "bpmn:ParallelGateway" },
      {
        x: unsafeMerge.x - 75,
        y: getMid(unsafeMerge).y,
      },
      unsafeMerge.parent,
    );
    // Move everything after unsafeMerge to the right to make space for the pg.
    const shapesToBeMoved = getAllPrecedingShapes(unsafeMerge, []);
    spaceTool.makeSpace(
      shapesToBeMoved, // Move these elements
      [], // Dont resize anything
      {
        x: -75, // Shift x by 75
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
  };
  // execute and revert not needed.
}

export function previewPrecedingParallelGateway(
  unsafeMerge,
  complexPreview,
  elementFactory,
  layouter,
) {
  const created = [];
  const pg = elementFactory.createShape({
    type: "bpmn:ParallelGateway",
  });
  const xShift = 75;
  pg.x = unsafeMerge.x - xShift - pg.width / 2;
  pg.y = getMid(unsafeMerge).y - pg.height / 2;
  created.push(pg);
  // New connection from the gateway
  const connection = elementFactory.createConnection({
    type: "bpmn:SequenceFlow",
  });
  connection.waypoints = layouter.layoutConnection(connection, {
    source: pg,
    target: unsafeMerge,
  });
  created.push(connection);
  // for each incoming
  unsafeMerge.incoming.forEach((inFlow) => {
    const replaceConnection = elementFactory.createConnection({
      type: "bpmn:SequenceFlow",
    });
    // Workaround: Create bogus shape for now.
    const bogus = elementFactory.createShape({
      type: inFlow.source.type,
    });
    const xShift = 75;
    bogus.x = inFlow.source.x - xShift;
    bogus.y = inFlow.source.y;

    replaceConnection.waypoints = layouter.layoutConnection(replaceConnection, {
      source: bogus,
      target: pg,
    });
    created.push(replaceConnection);
  });

  const delta = {
    x: -xShift, // TODO: slightly off here and above at -75
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
 * @param {Shape[]} shapes
 */
export function getAllPrecedingShapes(startShape, shapes) {
  startShape.incoming.forEach((sf) => {
    const source = sf.source;
    if (source.x < startShape.x && !shapes.includes(source)) {
      shapes.push(source);
      getAllPrecedingShapes(source, shapes);
    }
  });
  return shapes;
}
