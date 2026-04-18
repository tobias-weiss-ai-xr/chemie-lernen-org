import { n as e } from "./typeStore-Bwo5hkCf.js";
import { c as t, o as n, t as r, w as i } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphIndexOfBlock.js
var a = class extends r {
	constructor(e) {
		super(e), this.config = e, this.object = this.registerDataInput("object", n), this.array = this.registerDataInput("array", n), this.index = this.registerDataOutput("index", t, new i(-1));
	}
	_updateOutputs(e) {
		let t = this.object.getValue(e), n = this.array.getValue(e);
		n && this.index.setValue(new i(n.indexOf(t)), e);
	}
	serialize(e) {
		super.serialize(e);
	}
	getClassName() {
		return "FlowGraphIndexOfBlock";
	}
};
e("FlowGraphIndexOfBlock", a);
//#endregion
export { a as FlowGraphIndexOfBlock };

//# sourceMappingURL=flowGraphIndexOfBlock-DcjaMtm0.js.map