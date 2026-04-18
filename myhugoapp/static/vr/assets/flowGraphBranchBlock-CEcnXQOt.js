import { n as e } from "./typeStore-Bwo5hkCf.js";
import { s as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlock-B8lZ_whT.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphBranchBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.condition = this.registerDataInput("condition", t), this.onTrue = this._registerSignalOutput("onTrue"), this.onFalse = this._registerSignalOutput("onFalse");
	}
	_execute(e) {
		this.condition.getValue(e) ? this.onTrue._activateSignal(e) : this.onFalse._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphBranchBlock";
	}
};
e("FlowGraphBranchBlock", r);
//#endregion
export { r as FlowGraphBranchBlock };

//# sourceMappingURL=flowGraphBranchBlock-CEcnXQOt.js.map