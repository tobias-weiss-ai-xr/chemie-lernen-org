import { t as e } from "./logger-B7TbbsLc.js";
import { n as t } from "./typeStore-Bwo5hkCf.js";
import { f as n, o as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphAsyncExecutionBlock-C3ToWL9g.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Animation/flowGraphStopAnimationBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.animationGroup = this.registerDataInput("animationGroup", r), this.stopAtFrame = this.registerDataInput("stopAtFrame", n, -1);
	}
	_preparePendingTasks(e) {
		let t = this.animationGroup.getValue(e), n = this.stopAtFrame.getValue(e) ?? -1, r = e._getGlobalContextVariable("pendingStopAnimations", []);
		r.push({
			uniqueId: t.uniqueId,
			stopAtFrame: n
		}), e._setGlobalContextVariable("pendingStopAnimations", r);
	}
	_cancelPendingTasks(e) {
		let t = this.animationGroup.getValue(e), n = e._getGlobalContextVariable("pendingStopAnimations", []);
		for (let r = 0; r < n.length; r++) if (n[r].uniqueId === t.uniqueId) {
			n.splice(r, 1), e._setGlobalContextVariable("pendingStopAnimations", n);
			break;
		}
	}
	_execute(t) {
		let n = this.animationGroup.getValue(t), r = this.stopAtFrame.getValue(t) ?? -1;
		if (!n) return e.Warn("No animation group provided to stop."), this._reportError(t, "No animation group provided to stop.");
		if (isNaN(r)) return this._reportError(t, "Invalid stop time.");
		r > 0 ? this._startPendingTasks(t) : this._stopAnimation(n, t), this.out._activateSignal(t);
	}
	_executeOnTick(e) {
		let t = this.animationGroup.getValue(e), n = e._getGlobalContextVariable("pendingStopAnimations", []);
		for (let r = 0; r < n.length; r++) if (n[r].uniqueId === t.uniqueId && t.getCurrentFrame() >= n[r].stopAtFrame) {
			this._stopAnimation(t, e), n.splice(r, 1), e._setGlobalContextVariable("pendingStopAnimations", n), this.done._activateSignal(e), e._removePendingBlock(this);
			break;
		}
	}
	getClassName() {
		return "FlowGraphStopAnimationBlock";
	}
	_stopAnimation(e, t) {
		let n = t._getGlobalContextVariable("currentlyRunningAnimationGroups", []), r = n.indexOf(e.uniqueId);
		r !== -1 && (e.stop(), n.splice(r, 1), t._setGlobalContextVariable("currentlyRunningAnimationGroups", n));
	}
};
t("FlowGraphStopAnimationBlock", a);
//#endregion
export { a as FlowGraphStopAnimationBlock };

//# sourceMappingURL=flowGraphStopAnimationBlock-C36ZgbFA.js.map