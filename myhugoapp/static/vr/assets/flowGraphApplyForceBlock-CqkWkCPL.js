import { n as e } from "./typeStore-Bwo5hkCf.js";
import { g as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Physics/flowGraphApplyForceBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.body = this.registerDataInput("body", n), this.force = this.registerDataInput("force", t), this.location = this.registerDataInput("location", t);
	}
	_execute(e, t) {
		let n = this.body.getValue(e);
		if (!n) {
			this._reportError(e, "No physics body provided"), this.out._activateSignal(e);
			return;
		}
		let r = this.force.getValue(e), i = this.location.getValue(e);
		n.applyForce(r, i), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphApplyForceBlock";
	}
};
e("FlowGraphApplyForceBlock", i);
//#endregion
export { i as FlowGraphApplyForceBlock };

//# sourceMappingURL=flowGraphApplyForceBlock-CqkWkCPL.js.map