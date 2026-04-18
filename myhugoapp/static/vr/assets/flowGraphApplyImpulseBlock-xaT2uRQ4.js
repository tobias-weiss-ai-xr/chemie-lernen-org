import { n as e } from "./typeStore-Bwo5hkCf.js";
import { g as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Physics/flowGraphApplyImpulseBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.body = this.registerDataInput("body", n), this.impulse = this.registerDataInput("impulse", t), this.location = this.registerDataInput("location", t);
	}
	_execute(e, t) {
		let n = this.body.getValue(e);
		if (!n) {
			this._reportError(e, "No physics body provided"), this.out._activateSignal(e);
			return;
		}
		let r = this.impulse.getValue(e), i = this.location.getValue(e);
		n.applyImpulse(r, i), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphApplyImpulseBlock";
	}
};
e("FlowGraphApplyImpulseBlock", i);
//#endregion
export { i as FlowGraphApplyImpulseBlock };

//# sourceMappingURL=flowGraphApplyImpulseBlock-xaT2uRQ4.js.map