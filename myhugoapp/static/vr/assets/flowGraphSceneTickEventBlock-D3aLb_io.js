import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSceneTickEventBlock.js
var r = class extends n {
	constructor() {
		super(), this.type = "SceneBeforeRender", this.timeSinceStart = this.registerDataOutput("timeSinceStart", t), this.deltaTime = this.registerDataOutput("deltaTime", t);
	}
	_preparePendingTasks(e) {}
	_executeEvent(e, t) {
		return this.timeSinceStart.setValue(t.timeSinceStart, e), this.deltaTime.setValue(t.deltaTime, e), this._execute(e), !0;
	}
	_cancelPendingTasks(e) {}
	getClassName() {
		return "FlowGraphSceneTickEventBlock";
	}
};
e("FlowGraphSceneTickEventBlock", r);
//#endregion
export { r as FlowGraphSceneTickEventBlock };

//# sourceMappingURL=flowGraphSceneTickEventBlock-D3aLb_io.js.map