import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlock-B8lZ_whT.js";
import { o as r, s as i } from "./utils-ChmPBd4C.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSwitchBlock.js
var a = class extends n {
	constructor(e) {
		super(e), this.config = e, this.default = this._registerSignalOutput("default"), this._caseToOutputFlow = /* @__PURE__ */ new Map(), this.case = this.registerDataInput("case", t);
		let n = this.config.cases || [];
		for (let e of n) this._caseToOutputFlow.set(e, this._registerSignalOutput(`out_${e}`));
	}
	_execute(e, t) {
		let n = this.case.getValue(e), a;
		a = i(n) ? this._getOutputFlowForCase(r(n)) : this._getOutputFlowForCase(n), a ? a._activateSignal(e) : this.default._activateSignal(e);
	}
	addCase(e) {
		this.config.cases.includes(e) || (this.config.cases.push(e), this._caseToOutputFlow.set(e, this._registerSignalOutput(`out_${e}`)));
	}
	removeCase(e) {
		if (!this.config.cases.includes(e)) return;
		let t = this.config.cases.indexOf(e);
		this.config.cases.splice(t, 1), this._caseToOutputFlow.delete(e);
	}
	_getOutputFlowForCase(e) {
		return this._caseToOutputFlow.get(e);
	}
	getClassName() {
		return "FlowGraphSwitchBlock";
	}
	serialize(e) {
		super.serialize(e), e.cases = this.config.cases;
	}
};
e("FlowGraphSwitchBlock", a);
//#endregion
export { a as FlowGraphSwitchBlock };

//# sourceMappingURL=flowGraphSwitchBlock-evbyIusT.js.map