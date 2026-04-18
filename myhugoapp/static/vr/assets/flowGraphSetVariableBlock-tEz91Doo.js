import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock.js
var r = class extends n {
	constructor(e) {
		if (super(e), e.variables && e.variable) throw Error("FlowGraphSetVariableBlock: variable and variables are both defined");
		if (e.variables) for (let n of e.variables) this.registerDataInput(n, t);
		else this.registerDataInput("value", t);
	}
	_execute(e, t) {
		if (this.config?.variables) for (let t of this.config.variables) this._saveVariable(e, t);
		else this._saveVariable(e, this.config?.variable, "value");
		this.out._activateSignal(e);
	}
	_saveVariable(e, t, n) {
		let r = e._getGlobalContextVariable("currentlyRunningAnimationGroups", []);
		for (let n of r) {
			let i = e.assetsContext.animationGroups.find((e) => e.uniqueId == n);
			if (i) {
				for (let a of i.targetedAnimations) if (a.target === e && a.animation.targetProperty === t) {
					i.stop();
					let t = r.indexOf(n);
					t > -1 && r.splice(t, 1), e._setGlobalContextVariable("currentlyRunningAnimationGroups", r);
					break;
				}
			}
		}
		let i = this.getDataInput(n || t)?.getValue(e);
		e.setVariable(t, i);
	}
	getClassName() {
		return "FlowGraphSetVariableBlock";
	}
	serialize(e) {
		super.serialize(e), e.config.variable = this.config?.variable;
	}
};
e("FlowGraphSetVariableBlock", r);
//#endregion
export { r as FlowGraphSetVariableBlock };

//# sourceMappingURL=flowGraphSetVariableBlock-tEz91Doo.js.map