import { n as e } from "./typeStore-Bwo5hkCf.js";
import { a as t } from "./math.vector-ByhvsffM.js";
import { g as n, o as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Physics/flowGraphGetLinearVelocityBlock.js
var a = class extends i {
	constructor(e) {
		super(n, e), this.body = this.registerDataInput("body", r);
	}
	_doOperation(e) {
		let n = this.body.getValue(e);
		if (!n) return;
		let r = e._getExecutionVariable(this, "_cachedVelocity", null);
		return r || (r = new t(), e._setExecutionVariable(this, "_cachedVelocity", r)), n.getLinearVelocityToRef(r), r;
	}
	getClassName() {
		return "FlowGraphGetLinearVelocityBlock";
	}
};
e("FlowGraphGetLinearVelocityBlock", a);
//#endregion
export { a as FlowGraphGetLinearVelocityBlock };

//# sourceMappingURL=flowGraphGetLinearVelocityBlock-aEXpML44.js.map