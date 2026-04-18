import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t, t as n, w as r } from "./flowGraphBlock-CtJfM_SU.js";
import { o as i } from "./utils-ChmPBd4C.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphArrayIndexBlock.js
var a = class extends n {
	constructor(e) {
		super(e), this.config = e, this.array = this.registerDataInput("array", t), this.index = this.registerDataInput("index", t, new r(-1)), this.value = this.registerDataOutput("value", t);
	}
	_updateOutputs(e) {
		let t = this.array.getValue(e), n = i(this.index.getValue(e));
		t && n >= 0 && n < t.length ? this.value.setValue(t[n], e) : this.value.setValue(null, e);
	}
	serialize(e) {
		super.serialize(e);
	}
	getClassName() {
		return "FlowGraphArrayIndexBlock";
	}
};
e("FlowGraphArrayIndexBlock", a);
//#endregion
export { a as FlowGraphArrayIndexBlock };

//# sourceMappingURL=flowGraphArrayIndexBlock-BMH44ghm.js.map