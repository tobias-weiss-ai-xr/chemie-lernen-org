import { n as e } from "./typeStore-Bwo5hkCf.js";
import { b as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSendCustomEventBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.config = e;
		for (let e in this.config.eventData) {
			let n = this.config.eventData[e], r = typeof n.type == "string" ? n.type : n.type?.typeName, i = typeof n.type?.serialize == "function" ? n.type : t(r);
			n.type = i, this.registerDataInput(e, i, n.value);
		}
	}
	_execute(e) {
		let t = this.config.eventId, n = {};
		for (let t of this.dataInputs) n[t.name] = t.getValue(e);
		e.configuration.coordinator.notifyCustomEvent(t, n), this.out._activateSignal(e);
	}
	serialize(e = {}) {
		super.serialize(e);
		let t = {};
		for (let e in this.config.eventData) {
			let n = this.config.eventData[e];
			t[e] = { type: n.type.typeName }, n.value !== void 0 && (t[e].value = n.value);
		}
		e.config.eventData = t;
	}
	getClassName() {
		return "FlowGraphSendCustomEventBlock";
	}
};
e("FlowGraphSendCustomEventBlock", r);
//#endregion
export { r as FlowGraphSendCustomEventBlock };

//# sourceMappingURL=flowGraphSendCustomEventBlock-D4NjGi1p.js.map