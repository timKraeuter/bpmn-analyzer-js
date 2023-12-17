export default function QuickFixProvider(
  bpmnReplace,
  elementRegistry,
  eventBus,
) {
  const pgType = "bpmn:ParallelGateway";
  eventBus.on("analysis.done", () => {
    const gateway = elementRegistry.get("Gateway_0g0wslj");
    const targetElement = {
      type: pgType,
    };
    if (gateway.type !== pgType) {
      bpmnReplace.replaceElement(gateway, targetElement);
    }
  });
}
QuickFixProvider.$inject = ["bpmnReplace", "elementRegistry", "eventBus"];
