const ANALYSIS_NOTE_TYPE = "analysis-note";

export default function AnalysisOverlays(eventBus, overlays) {
  eventBus.on("analysis.done", handleAnalysis);

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
      elementById.classList.remove("red");
      elementById.classList.add("green");

      elementIconById.classList.remove("icon-question", "icon-xmark", "red");
      elementIconById.classList.add("icon-check", "green");
    } else {
      elementById.classList.remove("green");
      elementById.classList.add("red");

      elementIconById.classList.remove("icon-question", "icon-check", "green");
      elementIconById.classList.add("icon-xmark", "red");
    }
  }

  function addOverlaysForUnsafe(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addSmallOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 5,
        },
        "Unsafe",
      );
    }
  }

  function addOverlaysForProperCompletion(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addBigOverlay(
        problematicElement,
        {
          bottom: 50,
          right: -5,
        },
        "Consumes two or more tokens",
      );
    }
  }

  function addOverlaysForNoDeadActivities(propertyResult) {
    for (const problematicElement of propertyResult.problematic_elements) {
      addBigOverlay(
        problematicElement,
        {
          bottom: -5,
          left: 17.5,
        },
        "Dead Activity",
      );
    }
  }

  function addSmallOverlay(problematicElement, position, text) {
    addPropertyOverlay(problematicElement, position, text, "small-note");
  }

  function addBigOverlay(problematicElement, position, text) {
    addPropertyOverlay(problematicElement, position, text, "big-note");
  }

  function addPropertyOverlay(problematicElement, position, text, cssClass) {
    overlays.add(problematicElement, ANALYSIS_NOTE_TYPE, {
      position,
      html: `<div class="property-note ${cssClass}">${text}</div>`,
    });
  }
}

AnalysisOverlays.$inject = ["eventBus", "overlays"];
