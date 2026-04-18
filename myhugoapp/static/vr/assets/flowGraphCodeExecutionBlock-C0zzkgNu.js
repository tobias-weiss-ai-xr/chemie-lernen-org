import { o as e, t } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphCodeExecutionBlock.js
var n = class extends t {
	constructor(t) {
		super(t), this.config = t, this.executionFunction = this.registerDataInput("function", e), this.value = this.registerDataInput("value", e), this.result = this.registerDataOutput("result", e);
	}
	_updateOutputs(e) {
		let t = this.executionFunction.getValue(e), n = this.value.getValue(e);
		t && this.result.setValue(t(n, e), e);
	}
	getClassName() {
		return "FlowGraphCodeExecutionBlock";
	}
};
//#endregion
export { n as FlowGraphCodeExecutionBlock };

//# sourceMappingURL=flowGraphCodeExecutionBlock-C0zzkgNu.js.map