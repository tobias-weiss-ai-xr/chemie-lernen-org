import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Animation/flowGraphPauseAnimationBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.animationToPause = this.registerDataInput("animationToPause", t);
	}
	_execute(e) {
		this.animationToPause.getValue(e).pause(), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphPauseAnimationBlock";
	}
};
e("FlowGraphPauseAnimationBlock", r);
//#endregion
export { r as FlowGraphPauseAnimationBlock };

//# sourceMappingURL=flowGraphPauseAnimationBlock-D6bvluow.js.map