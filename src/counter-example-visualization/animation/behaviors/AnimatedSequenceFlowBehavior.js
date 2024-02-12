export default function AnimatedSequenceFlowBehavior(injector, animation) {
  this._animation = animation;
}

AnimatedSequenceFlowBehavior.$inject = ["injector", "animation"];

AnimatedSequenceFlowBehavior.prototype.enter = function (context) {
  const { element, scope } = context;

  this._animation.animate(element, scope, () => {});
};
