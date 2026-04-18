import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n, t as r } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphContextBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.userVariables = this.registerDataOutput("userVariables", n), this.executionId = this.registerDataOutput("executionId", t);
	}
	_updateOutputs(e) {
		this.userVariables.setValue(e.userVariables, e), this.executionId.setValue(e.executionId, e);
	}
	serialize(e) {
		super.serialize(e);
	}
	getClassName() {
		return "FlowGraphContextBlock";
	}
};
e("FlowGraphContextBlock", i);
//#endregion
export { i as FlowGraphContextBlock };

//# sourceMappingURL=flowGraphContextBlock-D1LteYrX.js.map