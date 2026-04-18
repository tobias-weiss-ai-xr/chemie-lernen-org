import { n as e } from "./typeStore-Bwo5hkCf.js";
import { a as t } from "./math.vector-ByhvsffM.js";
import { g as n, o as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Physics/flowGraphGetAngularVelocityBlock.js
var a = class extends i {
	constructor(e) {
		super(n, e), this.body = this.registerDataInput("body", r);
	}
	_doOperation(e) {
		let n = this.body.getValue(e);
		if (!n) return;
		let r = e._getExecutionVariable(this, "_cachedVelocity", null);
		return r || (r = new t(), e._setExecutionVariable(this, "_cachedVelocity", r)), n.getAngularVelocityToRef(r), r;
	}
	getClassName() {
		return "FlowGraphGetAngularVelocityBlock";
	}
};
e("FlowGraphGetAngularVelocityBlock", a);
//#endregion
export { a as FlowGraphGetAngularVelocityBlock };

//# sourceMappingURL=flowGraphGetAngularVelocityBlock-C-zpSQoq.js.map