import { n as e } from "./typeStore-Bwo5hkCf.js";
import { m as t, o as n, t as r } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphFunctionReferenceBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.functionName = this.registerDataInput("functionName", t), this.object = this.registerDataInput("object", n), this.context = this.registerDataInput("context", n, null), this.output = this.registerDataOutput("output", n);
	}
	_updateOutputs(e) {
		let t = this.functionName.getValue(e), n = this.object.getValue(e), r = this.context.getValue(e);
		if (n && t) {
			let i = n[t];
			i && typeof i == "function" && this.output.setValue(i.bind(r), e);
		}
	}
	getClassName() {
		return "FlowGraphFunctionReference";
	}
};
e("FlowGraphFunctionReference", i);
//#endregion
export { i as FlowGraphFunctionReferenceBlock };

//# sourceMappingURL=flowGraphFunctionReferenceBlock-tc7yhmlb.js.map