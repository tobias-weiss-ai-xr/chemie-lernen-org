import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Physics/flowGraphSetPhysicsMotionTypeBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.body = this.registerDataInput("body", n), this.motionType = this.registerDataInput("motionType", t, 2);
	}
	_execute(e, t) {
		let n = this.body.getValue(e);
		if (!n) {
			this._reportError(e, "No physics body provided"), this.out._activateSignal(e);
			return;
		}
		n.setMotionType(this.motionType.getValue(e)), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphSetPhysicsMotionTypeBlock";
	}
};
e("FlowGraphSetPhysicsMotionTypeBlock", i);
//#endregion
export { i as FlowGraphSetPhysicsMotionTypeBlock };

//# sourceMappingURL=flowGraphSetPhysicsMotionTypeBlock-Ct48COZi.js.map