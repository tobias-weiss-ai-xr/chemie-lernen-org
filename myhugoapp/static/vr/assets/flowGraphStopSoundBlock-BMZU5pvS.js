import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Audio/flowGraphStopSoundBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.sound = this.registerDataInput("sound", t);
	}
	_execute(e, t) {
		let n = this.sound.getValue(e);
		if (!n) {
			this._reportError(e, "No sound provided"), this.out._activateSignal(e);
			return;
		}
		n.stop(), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphStopSoundBlock";
	}
};
e("FlowGraphStopSoundBlock", r);
//#endregion
export { r as FlowGraphStopSoundBlock };

//# sourceMappingURL=flowGraphStopSoundBlock-BMZU5pvS.js.map