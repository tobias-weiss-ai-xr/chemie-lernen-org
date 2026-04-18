import { n as e } from "./typeStore-Bwo5hkCf.js";
import { c as t, w as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphExecutionBlock-B8lZ_whT.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphMultiGateBlock.js
var i = class extends r {
	constructor(e) {
		super(e), this.config = e, this.outputSignals = [], this.reset = this._registerSignalInput("reset"), this.lastIndex = this.registerDataOutput("lastIndex", t, new n(-1)), this.setNumberOfOutputSignals(e?.outputSignalCount);
	}
	_getNextIndex(e) {
		if (e.includes(!1) || this.config.isLoop && e.fill(!1), this.config.isRandom) {
			let t = e.map((e, t) => e ? -1 : t).filter((e) => e !== -1);
			return t.length ? t[Math.floor(Math.random() * t.length)] : -1;
		} else return e.indexOf(!1);
	}
	setNumberOfOutputSignals(e = 1) {
		for (; this.outputSignals.length > e;) {
			let e = this.outputSignals.pop();
			e && (e.disconnectFromAll(), this._unregisterSignalOutput(e.name));
		}
		for (; this.outputSignals.length < e;) this.outputSignals.push(this._registerSignalOutput(`out_${this.outputSignals.length}`));
	}
	_execute(e, t) {
		if (e._hasExecutionVariable(this, "indexesUsed") || e._setExecutionVariable(this, "indexesUsed", this.outputSignals.map(() => !1)), t === this.reset) {
			e._deleteExecutionVariable(this, "indexesUsed"), this.lastIndex.setValue(new n(-1), e);
			return;
		}
		let r = e._getExecutionVariable(this, "indexesUsed", []), i = this._getNextIndex(r);
		i > -1 && (this.lastIndex.setValue(new n(i), e), r[i] = !0, e._setExecutionVariable(this, "indexesUsed", r), this.outputSignals[i]._activateSignal(e));
	}
	getClassName() {
		return "FlowGraphMultiGateBlock";
	}
	serialize(e) {
		super.serialize(e), e.config.outputSignalCount = this.config.outputSignalCount, e.config.isRandom = this.config.isRandom, e.config.loop = this.config.isLoop, e.config.startIndex = this.config.startIndex;
	}
};
e("FlowGraphMultiGateBlock", i);
//#endregion
export { i as FlowGraphMultiGateBlock };

//# sourceMappingURL=flowGraphMultiGateBlock-BW54Bs7U.js.map