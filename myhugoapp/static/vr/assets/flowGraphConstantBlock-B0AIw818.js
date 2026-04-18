import { n as e } from "./typeStore-Bwo5hkCf.js";
import { i as t, t as n, x as r } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphConstantBlock.js
var i = class extends n {
	constructor(e) {
		super(e), this.config = e, this.output = this.registerDataOutput("output", r(e.value));
	}
	_updateOutputs(e) {
		this.output.setValue(this.config.value, e);
	}
	getClassName() {
		return "FlowGraphConstantBlock";
	}
	serialize(e = {}, n = t) {
		super.serialize(e), n("value", this.config.value, e.config);
	}
};
e("FlowGraphConstantBlock", i);
//#endregion
export { i as FlowGraphConstantBlock };

//# sourceMappingURL=flowGraphConstantBlock-B0AIw818.js.map