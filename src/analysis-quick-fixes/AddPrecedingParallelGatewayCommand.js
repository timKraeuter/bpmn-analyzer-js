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
  };
  // execute and revert not needed.
}
