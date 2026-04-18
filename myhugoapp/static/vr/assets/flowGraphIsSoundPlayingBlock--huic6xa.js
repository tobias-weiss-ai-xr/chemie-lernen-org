import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t, s as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Audio/flowGraphIsSoundPlayingBlock.js
var i = class extends r {
	constructor(e) {
		super(n, e), this.sound = this.registerDataInput("sound", t);
	}
	_doOperation(e) {
		let t = this.sound.getValue(e);
		if (t) return t.state === 3 || t.state === 2;
	}
	getClassName() {
		return "FlowGraphIsSoundPlayingBlock";
	}
};
e("FlowGraphIsSoundPlayingBlock", i);
//#endregion
export { i as FlowGraphIsSoundPlayingBlock };

//# sourceMappingURL=flowGraphIsSoundPlayingBlock--huic6xa.js.map