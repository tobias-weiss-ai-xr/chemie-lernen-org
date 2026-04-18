import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphDebounceBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.count = this.registerDataInput("count", t), this.reset = this._registerSignalInput("reset"), this.currentCount = this.registerDataOutput("currentCount", t);
	}
	_execute(e, t) {
		if (t === this.reset) {
			e._setExecutionVariable(this, "debounceCount", 0);
			return;
		}
		let n = this.count.getValue(e), r = e._getExecutionVariable(this, "debounceCount", 0) + 1;
		this.currentCount.setValue(r, e), e._setExecutionVariable(this, "debounceCount", r), r >= n && (this.out._activateSignal(e), e._setExecutionVariable(this, "debounceCount", 0));
	}
	getClassName() {
		return "FlowGraphDebounceBlock";
	}
};
e("FlowGraphDebounceBlock", r);
//#endregion
export { r as FlowGraphDebounceBlock };

//# sourceMappingURL=flowGraphDebounceBlock-DXnYX2iU.js.map