import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Audio/flowGraphPauseSoundBlock.js
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
		n.state === 5 ? n.resume() : (n.state === 2 || n.state === 3) && n.pause(), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphPauseSoundBlock";
	}
};
e("FlowGraphPauseSoundBlock", r);
//#endregion
export { r as FlowGraphPauseSoundBlock };

//# sourceMappingURL=flowGraphPauseSoundBlock-BLJPTuob.js.map