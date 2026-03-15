import { START_COUNTER_EXAMPLE_VISUALIZATION } from "../counter-example-visualization/util/EventHelper";
import {
  PROPERTY_NO_DEAD_ACTIVITIES,
  PROPERTY_OPTION_TO_COMPLETE,
  PROPERTY_PROPER_COMPLETION,
  PROPERTY_SAFENESS,
} from "../analysis/PropertyConstants";

export const ANALYSIS_NOTE_TYPE = "analysis-note";

export default function AnalysisOverlays(eventBus, overlays) {
  eventBus.on("analysis.done", handleAnalysis);

  function handleAnalysis(result) {
    overlays.remove({
      type: ANALYSIS_NOTE_TYPE,
    });
    if (!result || !result.property_results) {
      return;
    }

    for (const propertyResult of result.property_results) {
      if (
        propertyResult.property === PROPERTY_SAFENESS &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForUnsafe(propertyResult);
      }
      if (
        propertyResult.property === PROPERTY_PROPER_COMPLETION &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForProperCompletion(propertyResult);
      }
      if (
        propertyResult.property === PROPERTY_NO_DEAD_ACTIVITIES &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForNoDeadActivities(propertyResult);
      }
      if (
        propertyResult.property === PROPERTY_OPTION_TO_COMPLETE &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForOptionToComplete(propertyResult);
      }
    }
  }

  function addOverlaysForUnsafe(propertyResult) {
    addClickableOverlaysForElements(
      propertyResult,
      { bottom: -5, left: 5 },
      "Two or more tokens",
      "small-note",
    );
  }

  function addOverlaysForProperCompletion(propertyResult) {
    addClickableOverlaysForElements(
      propertyResult,
      { bottom: 50, right: -5 },
      "Consumes two or more tokens",
      "big-note",
    );
  }

  function addOverlaysForNoDeadActivities(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        { bottom: -5, left: 17.5 },
        "Dead Activity",
        "big-note",
        false,
      );
    }
  }

  function addOverlaysForOptionToComplete(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      // Remove other overlay from Safeness, otherwise they will clash.
      overlays.remove({
        element: problematicElement,
      });
    }
    addClickableOverlaysForElements(
      propertyResult,
      { bottom: -5, left: 5 },
      "Flow can contain more than 50 tokens.",
      "big-note",
    );
  }

  function addClickableOverlaysForElements(
    propertyResult,
    position,
    text,
    cssClasses,
  ) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(problematicElement, position, text, cssClasses, true);
      const element = document.getElementById(problematicElement + "_counter");
      if (element) {
        element.addEventListener("click", () => {
          eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION, {
            propertyResult,
          });
        });
      }
    }
  }

  function addPropertyOverlay(
    problematicElement,
    position,
    text,
    cssClasses,
    clickable,
  ) {
    overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
      position,
      html: `<div id="${problematicElement}_counter" class="property-note tooltip ${cssClasses}${clickable ? " clickable" : ""}">
               ${text}
               ${
                 clickable
                   ? '<span class="tooltipText">Click to visualize an execution example.</span>'
                   : ""
               }
             </div>`,
    });
  }
}

AnalysisOverlays.$inject = ["eventBus", "overlays"];
