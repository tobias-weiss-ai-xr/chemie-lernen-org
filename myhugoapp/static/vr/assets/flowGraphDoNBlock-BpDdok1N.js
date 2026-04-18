import { n as e } from "./typeStore-Bwo5hkCf.js";
import { c as t, w as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphDoNBlock.js
var i = class extends r {
	constructor(e = {}) {
		super(e), this.config = e, this.config.startIndex = e.startIndex ?? new n(0), this.reset = this._registerSignalInput("reset"), this.maxExecutions = this.registerDataInput("maxExecutions", t), this.executionCount = this.registerDataOutput("executionCount", t, new n(0));
	}
	_execute(e, t) {
		if (t === this.reset) this.executionCount.setValue(this.config.startIndex, e);
		else {
			let t = this.executionCount.getValue(e);
			t.value < this.maxExecutions.getValue(e).value && (this.executionCount.setValue(new n(t.value + 1), e), this.out._activateSignal(e));
		}
	}
	getClassName() {
		return "FlowGraphDoNBlock";
	}
};
e("FlowGraphDoNBlock", i);
//#endregion
export { i as FlowGraphDoNBlock };

//# sourceMappingURL=flowGraphDoNBlock-BpDdok1N.js.map