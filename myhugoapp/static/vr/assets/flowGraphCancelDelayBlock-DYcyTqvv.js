import { n as e } from "./typeStore-Bwo5hkCf.js";
import { c as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
import { o as r } from "./utils-ChmPBd4C.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphCancelDelayBlock.js
var i = class extends n {
	constructor(e) {
		super(e), this.delayIndex = this.registerDataInput("delayIndex", t);
	}
	_execute(e, t) {
		let n = r(this.delayIndex.getValue(e));
		if (n <= 0 || isNaN(n) || !isFinite(n)) return this._reportError(e, "Invalid delay index");
		let i = e._getGlobalContextVariable("pendingDelays", [])[n];
		i && i.dispose(), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphCancelDelayBlock";
	}
};
e("FlowGraphCancelDelayBlock", i);
//#endregion
export { i as FlowGraphCancelDelayBlock };

//# sourceMappingURL=flowGraphCancelDelayBlock-DYcyTqvv.js.map