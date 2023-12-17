export default function QuickFixProvider(eventBus) {
  console.log("quickfix injected");
}

QuickFixProvider.$inject = ["eventBus"];
