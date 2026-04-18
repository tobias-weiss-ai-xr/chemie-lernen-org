import { n as e } from "./typeStore-Bwo5hkCf.js";
import { n as t } from "./tools-CES87F86.js";
import { b as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphCoordinator-BQfno_qB.js";
import { t as i } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphReceiveCustomEventBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.config = e, this.initPriority = 1;
		for (let e in this.config.eventData) {
			let t = this.config.eventData[e], r = typeof t.type == "string" ? t.type : t.type?.typeName, i = typeof t.type?.serialize == "function" ? t.type : n(r);
			t.type = i, this.registerDataOutput(e, i);
		}
	}
	_preparePendingTasks(e) {
		let t = e.configuration.coordinator.getCustomEventObservable(this.config.eventId);
		if (t && t.hasObservers() && t.observers.length > r.MaxEventsPerType) {
			this._reportError(e, `FlowGraphReceiveCustomEventBlock: Too many observers for event ${this.config.eventId}. Max is ${r.MaxEventsPerType}.`);
			return;
		}
		let n = t.add((t) => {
			let n = Object.keys(t);
			for (let r of n) this.getDataOutput(r)?.setValue(t[r], e);
			this._execute(e);
		});
		e._setExecutionVariable(this, "_eventObserver", n);
	}
	_cancelPendingTasks(e) {
		let n = e.configuration.coordinator.getCustomEventObservable(this.config.eventId);
		if (n) {
			let t = e._getExecutionVariable(this, "_eventObserver", null);
			n.remove(t);
		} else t.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
	}
	_executeEvent(e, t) {
		return !0;
	}
	serialize(e = {}) {
		super.serialize(e);
		let t = {};
		for (let e in this.config.eventData) t[e] = { type: this.config.eventData[e].type.typeName };
		e.config.eventData = t;
	}
	getClassName() {
		return "FlowGraphReceiveCustomEventBlock";
	}
};
e("FlowGraphReceiveCustomEventBlock", a);
//#endregion
export { a as FlowGraphReceiveCustomEventBlock };

//# sourceMappingURL=flowGraphReceiveCustomEventBlock-C_wcglr2.js.map