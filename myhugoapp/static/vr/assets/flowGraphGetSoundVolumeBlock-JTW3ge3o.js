import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Audio/flowGraphGetSoundVolumeBlock.js
var i = class extends r {
	constructor(e) {
		super(t, e), this.sound = this.registerDataInput("sound", n);
	}
	_doOperation(e) {
		let t = this.sound.getValue(e);
		if (t) return t.volume;
	}
	getClassName() {
		return "FlowGraphGetSoundVolumeBlock";
	}
};
e("FlowGraphGetSoundVolumeBlock", i);
//#endregion
export { i as FlowGraphGetSoundVolumeBlock };

//# sourceMappingURL=flowGraphGetSoundVolumeBlock-JTW3ge3o.js.map