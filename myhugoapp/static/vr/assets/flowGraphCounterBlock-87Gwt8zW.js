import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphCounterBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.count = this.registerDataOutput("count", t), this.reset = this._registerSignalInput("reset");
	}
	_execute(e, t) {
		if (t === this.reset) {
			e._setExecutionVariable(this, "count", 0), this.count.setValue(0, e);
			return;
		}
		let n = e._getExecutionVariable(this, "count", 0) + 1;
		e._setExecutionVariable(this, "count", n), this.count.setValue(n, e), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphCallCounterBlock";
	}
};
e("FlowGraphCallCounterBlock", r);
//#endregion
export { r as FlowGraphCallCounterBlock };

//# sourceMappingURL=flowGraphCounterBlock-87Gwt8zW.js.map