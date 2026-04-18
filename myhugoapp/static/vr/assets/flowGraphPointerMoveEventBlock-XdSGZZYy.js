import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { a as r } from "./utils-ChmPBd4C.js";
import { t as i } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphPointerMoveEventBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.type = "PointerMove", this.targetMesh = this.registerDataInput("targetMesh", n, e?.targetMesh), this.pointerId = this.registerDataOutput("pointerId", t), this.meshUnderPointer = this.registerDataOutput("meshUnderPointer", n), this.pickedPoint = this.registerDataOutput("pickedPoint", n);
	}
	_executeEvent(e, t) {
		let n = this.targetMesh.getValue(e), i = t.pickInfo?.pickedMesh;
		return n && !(i === n || i && r(i, n)) ? !0 : (this.pointerId.setValue(t.event.pointerId, e), this.meshUnderPointer.setValue(i ?? null, e), this.pickedPoint.setValue(t.pickInfo?.pickedPoint ?? null, e), this._execute(e), !this.config?.stopPropagation);
	}
	_preparePendingTasks(e) {}
	_cancelPendingTasks(e) {}
	getClassName() {
		return "FlowGraphPointerMoveEventBlock";
	}
};
e("FlowGraphPointerMoveEventBlock", a);
//#endregion
export { a as FlowGraphPointerMoveEventBlock };

//# sourceMappingURL=flowGraphPointerMoveEventBlock-XdSGZZYy.js.map