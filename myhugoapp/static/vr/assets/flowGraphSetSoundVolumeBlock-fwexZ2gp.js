import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Audio/flowGraphSetSoundVolumeBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.sound = this.registerDataInput("sound", n), this.volume = this.registerDataInput("volume", t, 1);
	}
	_execute(e, t) {
		let n = this.sound.getValue(e);
		if (!n) {
			this._reportError(e, "No sound provided"), this.out._activateSignal(e);
			return;
		}
		n.volume = this.volume.getValue(e), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphSetSoundVolumeBlock";
	}
};
e("FlowGraphSetSoundVolumeBlock", i);
//#endregion
export { i as FlowGraphSetSoundVolumeBlock };

//# sourceMappingURL=flowGraphSetSoundVolumeBlock-fwexZ2gp.js.map