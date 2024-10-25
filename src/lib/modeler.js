// src/AdditionalModules.js
import AnalysisModule from "./analysis/wasm"; // Analysis using WASM
// import AnalysisModule from "./analysis/webclient"; // Analysis using a webservice (requires a running server on port 3001)
import AnalysisOverlaysModule from "./analysis-overlays";
import QuickFixesModule from "./quick-fixes";
import CounterExampleVisualizationModule from "./counter-example-visualization";
import AnalysisExamplesModule from "./analysis-examples";
import PropertiesSummaryModule from "./properties-summary";

export default {
  __depends__: [
    AnalysisModule,
    AnalysisOverlaysModule,
    PropertiesSummaryModule,
    QuickFixesModule,
    AnalysisExamplesModule,
    CounterExampleVisualizationModule,
  ],
};
