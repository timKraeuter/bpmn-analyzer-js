import { getMid } from "diagram-js/lib/layout/LayoutUtil";
const xShift = 75;

export function AddSubsequentExclusiveGatewayCommand(modeling, spaceTool) {
  this.preExecute = function (context) {
    const unsafeCause = context.unsafeCause;
    // Create exclusive gateway
    const eg = modeling.createShape(
      { type: "bpmn:ExclusiveGateway" },
      {
        x: unsafeCause.x + unsafeCause.width + xShift,
        y: getMid(unsafeCause).y,
      },
      unsafeCause.parent,
    );
    // Move everything after unsafeCause to make space for the ex g
    const shapesToBeMoved = getAllFollowingShapes(unsafeCause, []);
    spaceTool.makeSpace(
      shapesToBeMoved,
      [], // Dont resize anything
      {
        x: xShift,
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

AddSubsequentExclusiveGatewayCommand.$inject = ["modeling", "spaceTool"];

/**
 * @param {Shape} startShape
 * @param {Element[]} shapes
 */
export function getAllFollowingShapes(startShape, shapes) {
  startShape.outgoing.forEach((sf) => {
    const target = sf.target;
    if (target.x > startShape.x && !shapes.includes(target)) {
      shapes.push(target);
      if (target.label) {
        shapes.push(target.label);
      }
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
  // Create exclusive gateway
  const created = [];
  const exG = elementFactory.createShape({
    type: "bpmn:ExclusiveGateway",
  });
  exG.x = unsafeCause.x + unsafeCause.width + xShift - exG.width / 2;
  exG.y = getMid(unsafeCause).y - exG.height / 2;
  created.push(exG);
  // Add new sf between ex g and flow node.
  const connection = elementFactory.createConnection({
    type: "bpmn:SequenceFlow",
  });
  connection.waypoints = layouter.layoutConnection(connection, {
    source: unsafeCause,
    target: exG,
  });
  created.push(connection);
  // Change outgoing sfs
  unsafeCause.outgoing.forEach((outFlow) => {
    const replaceConnection = elementFactory.createConnection({
      type: "bpmn:SequenceFlow",
    });
    // Workaround: Create bogus shape for now.
    const bogus = elementFactory.createShape({
      type: outFlow.target.type,
    });
    bogus.x = outFlow.target.x + xShift;
    bogus.y = outFlow.target.y;

    const midEG = getMid(exG);
    // Reconnect end
    replaceConnection.waypoints = layouter.layoutConnection(replaceConnection, {
      source: exG,
      target: bogus,
      connectionStart: midEG,
    });
    created.push(replaceConnection);
  });

  // Move everything after unsafeCause to make space for the ex g
  const delta = {
    x: xShift,
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
