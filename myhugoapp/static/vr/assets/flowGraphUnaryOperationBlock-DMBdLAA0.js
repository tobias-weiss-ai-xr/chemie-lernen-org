import { t as e } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphUnaryOperationBlock.js
var t = class extends e {
	constructor(e, t, n, r, i) {
		super(t, i), this._operation = n, this._className = r, this.a = this.registerDataInput("a", e);
	}
	_doOperation(e) {
		return this._operation(this.a.getValue(e));
	}
	getClassName() {
		return this._className;
	}
};
//#endregion
export { t };

//# sourceMappingURL=flowGraphUnaryOperationBlock-DMBdLAA0.js.map