import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t, t as n } from "./flowGraphBlock-CtJfM_SU.js";
import { o as r, s as i } from "./utils-ChmPBd4C.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphDataSwitchBlock.js
var a = class extends n {
	constructor(e) {
		super(e), this.config = e, this._inputCases = /* @__PURE__ */ new Map(), this.case = this.registerDataInput("case", t, NaN), this.default = this.registerDataInput("default", t), this.value = this.registerDataOutput("value", t);
		let n = this.config.cases || [];
		for (let e of n) {
			if (e = r(e), this.config.treatCasesAsIntegers && (e |= 0, this._inputCases.has(e))) return;
			this._inputCases.set(e, this.registerDataInput(`in_${e}`, t));
		}
	}
	_updateOutputs(e) {
		let t = this.case.getValue(e), n;
		i(t) && (n = this._getOutputValueForCase(r(t), e)), n ||= this.default.getValue(e), this.value.setValue(n, e);
	}
	_getOutputValueForCase(e, t) {
		return this._inputCases.get(e)?.getValue(t);
	}
	getClassName() {
		return "FlowGraphDataSwitchBlock";
	}
};
e("FlowGraphDataSwitchBlock", a);
//#endregion
export { a as FlowGraphDataSwitchBlock };

//# sourceMappingURL=flowGraphDataSwitchBlock-Dz4VLh_l.js.map