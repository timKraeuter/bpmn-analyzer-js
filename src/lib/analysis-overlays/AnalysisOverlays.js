import { START_COUNTER_EXAMPLE_VISUALIZATION } from "../counter-example-visualization/util/EventHelper";

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
      if (propertyResult.property === "Safeness" && !propertyResult.fulfilled) {
        addOverlaysForUnsafe(propertyResult);
      }
      if (
        propertyResult.property === "ProperCompletion" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForProperCompletion(propertyResult);
      }
      if (
        propertyResult.property === "NoDeadActivities" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForNoDeadActivities(propertyResult);
      }
      if (
        propertyResult.property === "OptionToComplete" &&
        !propertyResult.fulfilled
      ) {
        addOverlaysForOptionToComplete(propertyResult);
      }
    }
  }

  function addOverlaysForUnsafe(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 5,
        },
        "Two or more tokens",
        "small-note clickable",
      );
      document
        .getElementById(problematicElement + "_counter")
        .addEventListener("click", () => {
          eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION, {
            propertyResult,
          });
        });
    }
  }

  function addOverlaysForProperCompletion(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        {
          bottom: 50,
          right: -5,
        },
        "Consumes two or more tokens",
        "big-note clickable",
      );
      document
        .getElementById(problematicElement + "_counter")
        .addEventListener("click", () => {
          eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION, {
            propertyResult,
          });
        });
    }
  }

  function addOverlaysForNoDeadActivities(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addPropertyOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 17.5,
        },
        "Dead Activity",
        "big-note",
      );
    }
  }

  function addOverlaysForOptionToComplete(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      // Remove other overlay from Safeness, otherwise they will clash.
      overlays.remove({
        element: problematicElement,
      });
      addPropertyOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 5,
        },
        "Flow can contain more than 50 tokens.",
        "big-note clickable",
      );
      document
        .getElementById(problematicElement + "_counter")
        .addEventListener("click", () => {
          eventBus.fire(START_COUNTER_EXAMPLE_VISUALIZATION, {
            propertyResult,
          });
        });
    }
  }

  function addPropertyOverlay(problematicElement, position, text, cssClasses) {
    overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
      position,
      html: `<div id="${problematicElement}_counter" class="property-note tooltip ${cssClasses}">
               ${text}
               ${
                 cssClasses.includes("clickable")
                   ? '<span class="tooltipText">Click to visualize an execution example.</span>'
                   : ""
               }
             </div>`,
    });
  }
}

AnalysisOverlays.$inject = ["eventBus", "overlays"];
