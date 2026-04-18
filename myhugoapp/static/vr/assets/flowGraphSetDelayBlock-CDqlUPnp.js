import { t as e } from "./logger-B7TbbsLc.js";
import { n as t } from "./typeStore-Bwo5hkCf.js";
import { c as n, f as r, w as i } from "./flowGraphBlock-CtJfM_SU.js";
import { t as a } from "./flowGraphAsyncExecutionBlock-C3ToWL9g.js";
import { t as o } from "./timer-BNwwhc1r.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSetDelayBlock.js
var s = class t extends a {
	constructor(e) {
		super(e), this.cancel = this._registerSignalInput("cancel"), this.duration = this.registerDataInput("duration", r), this.lastDelayIndex = this.registerDataOutput("lastDelayIndex", n, new i(-1));
	}
	_preparePendingTasks(e) {
		let n = this.duration.getValue(e);
		if (n < 0 || isNaN(n) || !isFinite(n)) return this._reportError(e, "Invalid duration in SetDelay block");
		if (e._getGlobalContextVariable("activeDelays", 0) >= t.MaxParallelDelayCount) return this._reportError(e, "Max parallel delays reached");
		let r = e._getGlobalContextVariable("lastDelayIndex", -1), a = e._getExecutionVariable(this, "pendingDelays", []), s = e.configuration.scene, c = new o({
			timeout: n * 1e3,
			contextObservable: s.onBeforeRenderObservable,
			onEnded: () => this._onEnded(c, e)
		});
		c.start();
		let l = r + 1;
		this.lastDelayIndex.setValue(new i(l), e), e._setGlobalContextVariable("lastDelayIndex", l), a[l] = c, e._setExecutionVariable(this, "pendingDelays", a), this._updateGlobalTimers(e);
	}
	_cancelPendingTasks(e) {
		let t = e._getExecutionVariable(this, "pendingDelays", []);
		for (let e of t) e?.dispose();
		e._deleteExecutionVariable(this, "pendingDelays"), this.lastDelayIndex.setValue(new i(-1), e), this._updateGlobalTimers(e);
	}
	_execute(e, t) {
		if (t === this.cancel) {
			this._cancelPendingTasks(e);
			return;
		} else this._preparePendingTasks(e), this.out._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphSetDelayBlock";
	}
	_onEnded(t, n) {
		let r = n._getExecutionVariable(this, "pendingDelays", []), i = r.indexOf(t);
		i === -1 ? e.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list") : r.splice(i, 1), n._removePendingBlock(this), this.done._activateSignal(n), this._updateGlobalTimers(n);
	}
	_updateGlobalTimers(t) {
		let n = t._getExecutionVariable(this, "pendingDelays", []), r = t._getGlobalContextVariable("pendingDelays", []);
		for (let t = 0; t < n.length; t++) {
			if (!n[t]) continue;
			let i = n[t];
			r[t] && r[t] !== i ? e.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list") : r[t] = i;
		}
		t._setGlobalContextVariable("pendingDelays", r);
	}
};
s.MaxParallelDelayCount = 100, t("FlowGraphSetDelayBlock", s);
//#endregion
export { s as FlowGraphSetDelayBlock };

//# sourceMappingURL=flowGraphSetDelayBlock-CDqlUPnp.js.map