import AnalysisModule from "./analysis/wasm";
import AnalysisOverlaysModule from "./analysis-overlays";
import QuickFixesModule from "./quick-fixes";
import CounterExampleVisualizationModule from "./counter-example-visualization";
import PropertiesSummaryModule from "./properties-summary";

export default {
  __depends__: [
    AnalysisModule,
    AnalysisOverlaysModule,
    PropertiesSummaryModule,
    QuickFixesModule,
    CounterExampleVisualizationModule,
  ],
};
