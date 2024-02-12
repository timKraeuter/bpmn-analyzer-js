export default function AnimatedMessageFlowBehavior(injector, animation) {
  this._animation = animation;
}

AnimatedMessageFlowBehavior.$inject = ["injector", "animation"];

AnimatedMessageFlowBehavior.prototype.signal = function (context) {
  const { element, scope } = context;

  this._animation.animate(element, scope, () => {});
};
