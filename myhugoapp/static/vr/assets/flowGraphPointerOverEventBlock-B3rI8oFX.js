import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { a as r } from "./utils-ChmPBd4C.js";
import { t as i } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphPointerOverEventBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.type = "PointerOver", this.pointerId = this.registerDataOutput("pointerId", t), this.targetMesh = this.registerDataInput("targetMesh", n, e?.targetMesh), this.meshUnderPointer = this.registerDataOutput("meshUnderPointer", n);
	}
	_executeEvent(e, t) {
		let n = this.targetMesh.getValue(e);
		this.meshUnderPointer.setValue(t.mesh, e);
		let i = t.out && r(t.out, n);
		return this.pointerId.setValue(t.pointerId, e), !i && (t.mesh === n || r(t.mesh, n)) ? (this._execute(e), !this.config?.stopPropagation) : !0;
	}
	_preparePendingTasks(e) {}
	_cancelPendingTasks(e) {}
	getClassName() {
		return "FlowGraphPointerOverEventBlock";
	}
};
e("FlowGraphPointerOverEventBlock", a);
//#endregion
export { a as FlowGraphPointerOverEventBlock };

//# sourceMappingURL=flowGraphPointerOverEventBlock-B3rI8oFX.js.map