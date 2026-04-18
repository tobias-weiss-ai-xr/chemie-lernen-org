import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t, t as n } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphGetVariableBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.config = e, this.value = this.registerDataOutput("value", t, e.initialValue);
	}
	_updateOutputs(e) {
		let t = this.config.variable;
		e.hasVariable(t) && this.value.setValue(e.getVariable(t), e);
	}
	serialize(e) {
		super.serialize(e), e.config.variable = this.config.variable;
	}
	getClassName() {
		return "FlowGraphGetVariableBlock";
	}
};
e("FlowGraphGetVariableBlock", r);
//#endregion
export { r as FlowGraphGetVariableBlock };

//# sourceMappingURL=flowGraphGetVariableBlock-BmxLuvr0.js.map