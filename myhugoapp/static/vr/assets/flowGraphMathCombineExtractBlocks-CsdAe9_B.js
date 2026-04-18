import { n as e } from "./typeStore-Bwo5hkCf.js";
import { a as t, i as n, o as r, t as i } from "./math.vector-ByhvsffM.js";
import { C as a, S as o, _ as s, d as c, f as l, g as u, h as d, l as f, t as p, u as m } from "./flowGraphBlock-CtJfM_SU.js";
import { t as h } from "./flowGraphCachedOperationBlock-vpsFE9Yv.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Math/flowGraphMathCombineExtractBlocks.js
var g = class extends h {
	constructor(e, t, n) {
		super(t, n);
		for (let t = 0; t < e; t++) this.registerDataInput(`input_${t}`, l, 0);
	}
}, _ = class extends p {
	constructor(e, t, n) {
		super(n), this.registerDataInput("input", t);
		for (let t = 0; t < e; t++) this.registerDataOutput(`output_${t}`, l, 0);
	}
}, v = class extends g {
	constructor(e) {
		super(2, d, e);
	}
	_doOperation(e) {
		e._hasExecutionVariable(this, "cachedVector") || e._setExecutionVariable(this, "cachedVector", new n());
		let t = e._getExecutionVariable(this, "cachedVector", null);
		return t.set(this.getDataInput("input_0").getValue(e), this.getDataInput("input_1").getValue(e)), t;
	}
	getClassName() {
		return "FlowGraphCombineVector2Block";
	}
};
e("FlowGraphCombineVector2Block", v);
var y = class extends g {
	constructor(e) {
		super(3, u, e);
	}
	_doOperation(e) {
		e._hasExecutionVariable(this, "cachedVector") || e._setExecutionVariable(this, "cachedVector", new t());
		let n = e._getExecutionVariable(this, "cachedVector", null);
		return n.set(this.getDataInput("input_0").getValue(e), this.getDataInput("input_1").getValue(e), this.getDataInput("input_2").getValue(e)), n;
	}
	getClassName() {
		return "FlowGraphCombineVector3Block";
	}
};
e("FlowGraphCombineVector3Block", y);
var b = class extends g {
	constructor(e) {
		super(4, s, e);
	}
	_doOperation(e) {
		e._hasExecutionVariable(this, "cachedVector") || e._setExecutionVariable(this, "cachedVector", new r());
		let t = e._getExecutionVariable(this, "cachedVector", null);
		return t.set(this.getDataInput("input_0").getValue(e), this.getDataInput("input_1").getValue(e), this.getDataInput("input_2").getValue(e), this.getDataInput("input_3").getValue(e)), t;
	}
	getClassName() {
		return "FlowGraphCombineVector4Block";
	}
};
e("FlowGraphCombineVector4Block", b);
var x = class extends g {
	constructor(e) {
		super(16, f, e);
	}
	_doOperation(e) {
		e._hasExecutionVariable(this, "cachedMatrix") || e._setExecutionVariable(this, "cachedMatrix", new i());
		let t = e._getExecutionVariable(this, "cachedMatrix", null);
		return this.config?.inputIsColumnMajor ? t.set(this.getDataInput("input_0").getValue(e), this.getDataInput("input_4").getValue(e), this.getDataInput("input_8").getValue(e), this.getDataInput("input_12").getValue(e), this.getDataInput("input_1").getValue(e), this.getDataInput("input_5").getValue(e), this.getDataInput("input_9").getValue(e), this.getDataInput("input_13").getValue(e), this.getDataInput("input_2").getValue(e), this.getDataInput("input_6").getValue(e), this.getDataInput("input_10").getValue(e), this.getDataInput("input_14").getValue(e), this.getDataInput("input_3").getValue(e), this.getDataInput("input_7").getValue(e), this.getDataInput("input_11").getValue(e), this.getDataInput("input_15").getValue(e)) : t.set(this.getDataInput("input_0").getValue(e), this.getDataInput("input_1").getValue(e), this.getDataInput("input_2").getValue(e), this.getDataInput("input_3").getValue(e), this.getDataInput("input_4").getValue(e), this.getDataInput("input_5").getValue(e), this.getDataInput("input_6").getValue(e), this.getDataInput("input_7").getValue(e), this.getDataInput("input_8").getValue(e), this.getDataInput("input_9").getValue(e), this.getDataInput("input_10").getValue(e), this.getDataInput("input_11").getValue(e), this.getDataInput("input_12").getValue(e), this.getDataInput("input_13").getValue(e), this.getDataInput("input_14").getValue(e), this.getDataInput("input_15").getValue(e)), t;
	}
	getClassName() {
		return "FlowGraphCombineMatrixBlock";
	}
};
e("FlowGraphCombineMatrixBlock", x);
var S = class extends g {
	constructor(e) {
		super(4, m, e);
	}
	_doOperation(e) {
		e._hasExecutionVariable(this, "cachedMatrix") || e._setExecutionVariable(this, "cachedMatrix", new o());
		let t = e._getExecutionVariable(this, "cachedMatrix", null), n = this.config?.inputIsColumnMajor ? [
			this.getDataInput("input_0").getValue(e),
			this.getDataInput("input_2").getValue(e),
			this.getDataInput("input_1").getValue(e),
			this.getDataInput("input_3").getValue(e)
		] : [
			this.getDataInput("input_0").getValue(e),
			this.getDataInput("input_1").getValue(e),
			this.getDataInput("input_2").getValue(e),
			this.getDataInput("input_3").getValue(e)
		];
		return t.fromArray(n), t;
	}
	getClassName() {
		return "FlowGraphCombineMatrix2DBlock";
	}
};
e("FlowGraphCombineMatrix2DBlock", S);
var C = class extends g {
	constructor(e) {
		super(9, c, e);
	}
	_doOperation(e) {
		e._hasExecutionVariable(this, "cachedMatrix") || e._setExecutionVariable(this, "cachedMatrix", new a());
		let t = e._getExecutionVariable(this, "cachedMatrix", null), n = this.config?.inputIsColumnMajor ? [
			this.getDataInput("input_0").getValue(e),
			this.getDataInput("input_3").getValue(e),
			this.getDataInput("input_6").getValue(e),
			this.getDataInput("input_1").getValue(e),
			this.getDataInput("input_4").getValue(e),
			this.getDataInput("input_7").getValue(e),
			this.getDataInput("input_2").getValue(e),
			this.getDataInput("input_5").getValue(e),
			this.getDataInput("input_8").getValue(e)
		] : [
			this.getDataInput("input_0").getValue(e),
			this.getDataInput("input_1").getValue(e),
			this.getDataInput("input_2").getValue(e),
			this.getDataInput("input_3").getValue(e),
			this.getDataInput("input_4").getValue(e),
			this.getDataInput("input_5").getValue(e),
			this.getDataInput("input_6").getValue(e),
			this.getDataInput("input_7").getValue(e),
			this.getDataInput("input_8").getValue(e)
		];
		return t.fromArray(n), t;
	}
	getClassName() {
		return "FlowGraphCombineMatrix3DBlock";
	}
};
e("FlowGraphCombineMatrix3DBlock", C);
var w = class extends _ {
	constructor(e) {
		super(2, d, e);
	}
	_updateOutputs(e) {
		let t = this.getDataInput("input")?.getValue(e);
		t || (t = n.Zero(), this.getDataInput("input").setValue(t, e)), this.getDataOutput("output_0").setValue(t.x, e), this.getDataOutput("output_1").setValue(t.y, e);
	}
	getClassName() {
		return "FlowGraphExtractVector2Block";
	}
};
e("FlowGraphExtractVector2Block", w);
var T = class extends _ {
	constructor(e) {
		super(3, u, e);
	}
	_updateOutputs(e) {
		let n = this.getDataInput("input")?.getValue(e);
		n || (n = t.Zero(), this.getDataInput("input").setValue(n, e)), this.getDataOutput("output_0").setValue(n.x, e), this.getDataOutput("output_1").setValue(n.y, e), this.getDataOutput("output_2").setValue(n.z, e);
	}
	getClassName() {
		return "FlowGraphExtractVector3Block";
	}
};
e("FlowGraphExtractVector3Block", T);
var E = class extends _ {
	constructor(e) {
		super(4, s, e);
	}
	_updateOutputs(e) {
		let t = this.getDataInput("input")?.getValue(e);
		t || (t = r.Zero(), this.getDataInput("input").setValue(t, e)), this.getDataOutput("output_0").setValue(t.x, e), this.getDataOutput("output_1").setValue(t.y, e), this.getDataOutput("output_2").setValue(t.z, e), this.getDataOutput("output_3").setValue(t.w, e);
	}
	getClassName() {
		return "FlowGraphExtractVector4Block";
	}
};
e("FlowGraphExtractVector4Block", E);
var D = class extends _ {
	constructor(e) {
		super(16, f, e);
	}
	_updateOutputs(e) {
		let t = this.getDataInput("input")?.getValue(e);
		t || (t = i.Identity(), this.getDataInput("input").setValue(t, e));
		for (let n = 0; n < 16; n++) this.getDataOutput(`output_${n}`).setValue(t.m[n], e);
	}
	getClassName() {
		return "FlowGraphExtractMatrixBlock";
	}
};
e("FlowGraphExtractMatrixBlock", D);
var O = class extends _ {
	constructor(e) {
		super(4, m, e);
	}
	_updateOutputs(e) {
		let t = this.getDataInput("input")?.getValue(e);
		t || (t = new o(), this.getDataInput("input").setValue(t, e));
		for (let n = 0; n < 4; n++) this.getDataOutput(`output_${n}`).setValue(t.m[n], e);
	}
	getClassName() {
		return "FlowGraphExtractMatrix2DBlock";
	}
};
e("FlowGraphExtractMatrix2DBlock", O);
var k = class extends _ {
	constructor(e) {
		super(9, c, e);
	}
	_updateOutputs(e) {
		let t = this.getDataInput("input")?.getValue(e);
		t || (t = new a(), this.getDataInput("input").setValue(t, e));
		for (let n = 0; n < 9; n++) this.getDataOutput(`output_${n}`).setValue(t.m[n], e);
	}
	getClassName() {
		return "FlowGraphExtractMatrix3DBlock";
	}
};
e("FlowGraphExtractMatrix3DBlock", k);
//#endregion
export { S as FlowGraphCombineMatrix2DBlock, C as FlowGraphCombineMatrix3DBlock, x as FlowGraphCombineMatrixBlock, v as FlowGraphCombineVector2Block, y as FlowGraphCombineVector3Block, b as FlowGraphCombineVector4Block, O as FlowGraphExtractMatrix2DBlock, k as FlowGraphExtractMatrix3DBlock, D as FlowGraphExtractMatrixBlock, w as FlowGraphExtractVector2Block, T as FlowGraphExtractVector3Block, E as FlowGraphExtractVector4Block };

//# sourceMappingURL=flowGraphMathCombineExtractBlocks-CsdAe9_B.js.map