import { n as e } from "./typeStore-Bwo5hkCf.js";
import { g as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Physics/flowGraphSetAngularVelocityBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.body = this.registerDataInput("body", n), this.velocity = this.registerDataInput("velocity", t);
	}
	_execute(e, t) {
		let n = this.body.getValue(e);
		if (!n) {
			this._reportError(e, "No physics body provided"), this.out._activateSignal(e);
			return;
		}
		n.setAngularVelocity(this.velocity.getValue(e)), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphSetAngularVelocityBlock";
	}
};
e("FlowGraphSetAngularVelocityBlock", i);
//#endregion
export { i as FlowGraphSetAngularVelocityBlock };

//# sourceMappingURL=flowGraphSetAngularVelocityBlock-cw_v7hjf.js.map