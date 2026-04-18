import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t, s as n, t as r } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphConditionalDataBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.condition = this.registerDataInput("condition", n), this.onTrue = this.registerDataInput("onTrue", t), this.onFalse = this.registerDataInput("onFalse", t), this.output = this.registerDataOutput("output", t);
	}
	_updateOutputs(e) {
		let t = this.condition.getValue(e);
		this.output.setValue(t ? this.onTrue.getValue(e) : this.onFalse.getValue(e), e);
	}
	getClassName() {
		return "FlowGraphConditionalBlock";
	}
};
e("FlowGraphConditionalBlock", i);
//#endregion
export { i as FlowGraphConditionalDataBlock };

//# sourceMappingURL=flowGraphConditionalDataBlock-DAMvqTTa.js.map