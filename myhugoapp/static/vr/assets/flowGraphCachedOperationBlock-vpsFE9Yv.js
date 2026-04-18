import { s as e, t } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphCachedOperationBlock.js
var n = "cachedOperationValue", r = "cachedExecutionId", i = class extends t {
	constructor(t, n) {
		super(n), this.value = this.registerDataOutput("value", t), this.isValid = this.registerDataOutput("isValid", e);
	}
	_updateOutputs(e) {
		let t = e._getExecutionVariable(this, r, -1), i = e._getExecutionVariable(this, n, null);
		if (i != null && t === e.executionId) this.isValid.setValue(!0, e), this.value.setValue(i, e);
		else try {
			let t = this._doOperation(e);
			if (t == null) {
				this.isValid.setValue(!1, e);
				return;
			}
			e._setExecutionVariable(this, n, t), e._setExecutionVariable(this, r, e.executionId), this.value.setValue(t, e), this.isValid.setValue(!0, e);
		} catch {
			this.isValid.setValue(!1, e);
		}
	}
};
//#endregion
export { i as t };

//# sourceMappingURL=flowGraphCachedOperationBlock-vpsFE9Yv.js.map