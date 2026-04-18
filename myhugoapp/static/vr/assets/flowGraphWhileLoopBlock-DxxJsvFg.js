import { t as e } from "./logger-B7TbbsLc.js";
import { n as t } from "./typeStore-Bwo5hkCf.js";
import { s as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphWhileLoopBlock.js
var i = class t extends r {
	constructor(e) {
		super(e), this.config = e, this.condition = this.registerDataInput("condition", n), this.executionFlow = this._registerSignalOutput("executionFlow"), this.completed = this._registerSignalOutput("completed"), this._unregisterSignalOutput("out");
	}
	_execute(n, r) {
		let i = this.condition.getValue(n);
		this.config?.doWhile && !i && this.executionFlow._activateSignal(n);
		let a = 0;
		for (; i;) {
			if (this.executionFlow._activateSignal(n), ++a, a >= t.MaxLoopCount) {
				e.Warn("FlowGraphWhileLoopBlock: Max loop count reached. Breaking.");
				break;
			}
			i = this.condition.getValue(n);
		}
		this.completed._activateSignal(n);
	}
	getClassName() {
		return "FlowGraphWhileLoopBlock";
	}
};
i.MaxLoopCount = 1e3, t("FlowGraphWhileLoopBlock", i);
//#endregion
export { i as FlowGraphWhileLoopBlock };

//# sourceMappingURL=flowGraphWhileLoopBlock-DxxJsvFg.js.map