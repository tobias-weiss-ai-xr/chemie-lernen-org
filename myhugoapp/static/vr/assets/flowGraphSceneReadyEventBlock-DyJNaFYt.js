import { n as e } from "./typeStore-Bwo5hkCf.js";
import { t } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock.js
var n = class extends t {
	constructor() {
		super(...arguments), this.initPriority = -1, this.type = "SceneReady";
	}
	_executeEvent(e, t) {
		return this._execute(e), !0;
	}
	_preparePendingTasks(e) {}
	_cancelPendingTasks(e) {}
	getClassName() {
		return "FlowGraphSceneReadyEventBlock";
	}
};
e("FlowGraphSceneReadyEventBlock", n);
//#endregion
export { n as FlowGraphSceneReadyEventBlock };

//# sourceMappingURL=flowGraphSceneReadyEventBlock-DyJNaFYt.js.map