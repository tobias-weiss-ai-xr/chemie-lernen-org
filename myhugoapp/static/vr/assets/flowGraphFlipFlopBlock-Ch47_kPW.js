import { n as e } from "./typeStore-Bwo5hkCf.js";
import { s as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphExecutionBlock-B8lZ_whT.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphFlipFlopBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.onOn = this._registerSignalOutput("onOn"), this.onOff = this._registerSignalOutput("onOff"), this.value = this.registerDataOutput("value", t);
	}
	_execute(e, t) {
		let n = e._getExecutionVariable(this, "value", typeof this.config?.startValue == "boolean" ? !this.config.startValue : !1);
		n = !n, e._setExecutionVariable(this, "value", n), this.value.setValue(n, e), n ? this.onOn._activateSignal(e) : this.onOff._activateSignal(e);
	}
	getClassName() {
		return "FlowGraphFlipFlopBlock";
	}
};
e("FlowGraphFlipFlopBlock", r);
//#endregion
export { r as FlowGraphFlipFlopBlock };

//# sourceMappingURL=flowGraphFlipFlopBlock-Ch47_kPW.js.map