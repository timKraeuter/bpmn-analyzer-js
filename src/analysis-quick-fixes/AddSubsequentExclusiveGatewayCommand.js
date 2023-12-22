import { getMid } from "diagram-js/lib/layout/LayoutUtil";

export function AddSubsequentExclusiveGatewayCommand(modeling, spaceTool) {
  let eg;
  this.preExecute = function (context) {
    const unsafeCause = context.unsafeCause;
    // Create exclusive gateway
    eg = modeling.createShape(
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
