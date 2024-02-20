import { START_COUNTER_EXAMPLE_VISUALIZATION } from "../counter-example-visualization/util/EventHelper";
import { domify } from "min-dom";

const ANALYSIS_NOTE_TYPE = "analysis-note";

export default function AnalysisOverlays(eventBus, overlays, canvas) {
  eventBus.on("analysis.done", handleAnalysis);
  this._canvas = canvas;

  this._init();

  function handleAnalysis(result) {
    overlays.remove({
      type: ANALYSIS_NOTE_TYPE,
    });
    if (!result) {
      console.error("Should reset all properties");
      return;
    }

    for (const propertyResult of result.property_results) {
      setPropertyColorAndIcon(propertyResult);

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
    }
  }

  function setPropertyColorAndIcon(propertyResult) {
    // Set the property somehow with jquery
    let elementById = document.getElementById(`${propertyResult.property}`);
    let elementIconById = document.getElementById(
      `${propertyResult.property}-icon`,
    );
    if (propertyResult.fulfilled) {
      elementById.classList.remove("violated");
      elementById.classList.add("fulfilled");

      elementIconById.classList.remove(
        "icon-question",
        "icon-xmark",
        "violated",
      );
      elementIconById.classList.add("icon-check", "fulfilled");
    } else {
      elementById.classList.remove("fulfilled");
      elementById.classList.add("violated");

      elementIconById.classList.remove(
        "icon-question",
        "icon-check",
        "fulfilled",
      );
      elementIconById.classList.add("icon-xmark", "violated");
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
        "Unsafe",
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

  function addPropertyOverlay(problematicElement, position, text, cssClasses) {
    overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
      position,
      html: `<div id="${problematicElement}_counter" class="property-note tooltip ${cssClasses}">
               ${text}
               ${cssClasses.includes("clickable") ? '<span class="tooltipText">Click to show counter example.</span>' : ""}
             </div>`,
    });
  }
}

AnalysisOverlays.prototype._init = function () {
  const html = domify(`
    <div class="properties">
      <div id="Safeness">Safeness</div>
      <div id="Safeness-icon" class="icon-question general-icon"></div>
      <div id="OptionToComplete">Option to complete</div>
      <div id="OptionToComplete-icon" class="icon-question general-icon"></div>
      <div id="ProperCompletion">Proper completion</div>
      <div id="ProperCompletion-icon" class="icon-question general-icon"></div>
      <div id="NoDeadActivities">No dead activities</div>
      <div id="NoDeadActivities-icon" class="icon-question general-icon"></div>
    </div>
  `);

  this._canvas.getContainer().appendChild(html);
};

AnalysisOverlays.$inject = ["eventBus", "overlays", "canvas"];
