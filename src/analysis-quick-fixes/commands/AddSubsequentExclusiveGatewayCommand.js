import { getMid } from "diagram-js/lib/layout/LayoutUtil";

export function AddSubsequentExclusiveGatewayCommand(modeling, spaceTool) {
  this.preExecute = function (context) {
    const unsafeCause = context.unsafeCause;
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
  };
  // execute and revert not needed.
}

/**
 * @param {Shape} startShape
 * @param {Shape[]} shapes
 */
export function getAllFollowingShapes(startShape, shapes) {
  startShape.outgoing.forEach((sf) => {
    const target = sf.target;
    if (target.x > startShape.x && !shapes.includes(target)) {
      shapes.push(target);
      getAllFollowingShapes(target, shapes);
    }
  });
  return shapes;
}

export function previewSubsequentExclusiveGateway(
  unsafeCause,
  complexPreview,
  elementFactory,
  layouter,
) {
  const created = [];
  const exG = elementFactory.createShape({
    type: "bpmn:ExclusiveGateway",
  });
  const xShift = 75;
  exG.x = unsafeCause.x + unsafeCause.width + xShift - exG.width / 2;
  exG.y = getMid(unsafeCause).y - exG.height / 2;
  created.push(exG);
  // New connection from the gateway
  const connection = elementFactory.createConnection({
    type: "bpmn:SequenceFlow",
  });
  connection.waypoints = layouter.layoutConnection(connection, {
    source: unsafeCause,
    target: exG,
  });
  created.push(connection);
  // for each incoming
  // TODO: do it like reconnect layout so we dont have to do layout arithmetic
  unsafeCause.outgoing.forEach((outFlow) => {
    const replaceConnection = elementFactory.createConnection({
      type: "bpmn:SequenceFlow",
    });

    replaceConnection.waypoints = outFlow.waypoints.map((waypoint) => {
      if (waypoint.x === getMid(unsafeCause).x) {
        if (waypoint.y === unsafeCause.y + unsafeCause.height) {
          return {
            x: waypoint.x + unsafeCause.width - exG.width + xShift,
            y: exG.y + exG.height,
          };
        }
        return {
          x: waypoint.x + unsafeCause.width - exG.width + xShift,
          y: waypoint.y,
        };
      }
      return {
        x: waypoint.x + xShift,
        y: waypoint.y,
      };
    });
    created.push(replaceConnection);
  });

  const delta = {
    x: +xShift,
    y: 0,
  };
  const shapesAndFlows = getAllFollowingShapes(unsafeCause, []);
  shapesAndFlows.forEach((shape) =>
    shape.outgoing.forEach((inflow) => shapesAndFlows.push(inflow)),
  );
  const moved = shapesAndFlows.map((element) => ({
    element,
    delta,
  }));

  complexPreview.create({
    created,
    moved,
    removed: unsafeCause.outgoing,
  });
}
