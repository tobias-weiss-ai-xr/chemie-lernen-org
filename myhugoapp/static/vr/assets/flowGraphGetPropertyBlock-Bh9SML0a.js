import { n as e } from "./typeStore-Bwo5hkCf.js";
import { m as t, o as n } from "./flowGraphBlock-CtJfM_SU.js";
import { t as r } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphGetPropertyBlock.js
var i = class extends r {
	constructor(e) {
		super(n, e), this.config = e, this.object = this.registerDataInput("object", n, e.object), this.propertyName = this.registerDataInput("propertyName", t, e.propertyName), this.customGetFunction = this.registerDataInput("customGetFunction", n);
	}
	_doOperation(e) {
		let t = this.customGetFunction.getValue(e), n;
		if (t) n = t(this.object.getValue(e), this.propertyName.getValue(e), e);
		else {
			let t = this.object.getValue(e), r = this.propertyName.getValue(e);
			n = t && r ? this._getPropertyValue(t, r) : void 0;
		}
		return n;
	}
	_getPropertyValue(e, t) {
		let n = t.split("."), r = e;
		for (let e of n) if (r = r[e], r === void 0) return;
		return r;
	}
	getClassName() {
		return "FlowGraphGetPropertyBlock";
	}
};
e("FlowGraphGetPropertyBlock", i);
//#endregion
export { i as FlowGraphGetPropertyBlock };

//# sourceMappingURL=flowGraphGetPropertyBlock-Bh9SML0a.js.map