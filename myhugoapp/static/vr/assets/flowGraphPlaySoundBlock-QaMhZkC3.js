import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n, s as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Audio/flowGraphPlaySoundBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.sound = this.registerDataInput("sound", n), this.volume = this.registerDataInput("volume", t, 1), this.startOffset = this.registerDataInput("startOffset", t, 0), this.loop = this.registerDataInput("loop", r, !1);
	}
	_execute(e, t) {
		let n = this.sound.getValue(e);
		if (!n) {
			this._reportError(e, "No sound provided"), this.out._activateSignal(e);
			return;
		}
		let r = this.volume.getValue(e), i = this.startOffset.getValue(e), a = this.loop.getValue(e);
		n.play({
			volume: r,
			startOffset: i,
			loop: a
		}), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphPlaySoundBlock";
	}
};
e("FlowGraphPlaySoundBlock", a);
//#endregion
export { a as FlowGraphPlaySoundBlock };

//# sourceMappingURL=flowGraphPlaySoundBlock-QaMhZkC3.js.map