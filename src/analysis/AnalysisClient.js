const websocket_url = "ws://localhost:8071/debug";
export default function AnalysisClient(eventBus) {
  console.log("analysis client constructed!");

  eventBus.on(["commandStack.changed", "import.done"], (event) => {
    console.log("commandStack.changed");
  });

}

AnalysisClient.prototype.$inject = ["eventBus"];