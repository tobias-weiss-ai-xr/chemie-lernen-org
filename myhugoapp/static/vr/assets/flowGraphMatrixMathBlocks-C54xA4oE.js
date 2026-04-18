import { n as e } from "./typeStore-Bwo5hkCf.js";
import { a as t, n, t as r } from "./math.vector-ByhvsffM.js";
import { b as i, f as a, g as o, l as s, p as c, s as l, t as u } from "./flowGraphBlock-CtJfM_SU.js";
import { t as d } from "./flowGraphBinaryOperationBlock-DyZ8CjaJ.js";
import { t as f } from "./flowGraphUnaryOperationBlock-DMBdLAA0.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Math/flowGraphMatrixMathBlocks.js
var p = class extends f {
	constructor(e) {
		super(i(e?.matrixType || "Matrix"), i(e?.matrixType || "Matrix"), (e) => e.transpose ? e.transpose() : r.Transpose(e), "FlowGraphTransposeBlock", e);
	}
};
e("FlowGraphTransposeBlock", p);
var m = class extends f {
	constructor(e) {
		super(i(e?.matrixType || "Matrix"), a, (e) => e.determinant(), "FlowGraphDeterminantBlock", e);
	}
};
e("FlowGraphDeterminantBlock", m);
var h = class extends f {
	constructor(e) {
		super(i(e?.matrixType || "Matrix"), i(e?.matrixType || "Matrix"), (e) => e.inverse ? e.inverse() : r.Invert(e), "FlowGraphInvertMatrixBlock", e);
	}
};
e("FlowGraphInvertMatrixBlock", h);
var g = class extends d {
	constructor(e) {
		super(i(e?.matrixType || "Matrix"), i(e?.matrixType || "Matrix"), i(e?.matrixType || "Matrix"), (e, t) => t.multiply(e), "FlowGraphMatrixMultiplicationBlock", e);
	}
};
e("FlowGraphMatrixMultiplicationBlock", g);
var _ = class extends u {
	constructor(e) {
		super(e), this.input = this.registerDataInput("input", s), this.position = this.registerDataOutput("position", o), this.rotationQuaternion = this.registerDataOutput("rotationQuaternion", c), this.scaling = this.registerDataOutput("scaling", o), this.isValid = this.registerDataOutput("isValid", l, !1);
	}
	_updateOutputs(e) {
		let r = e._getExecutionVariable(this, "executionId", -1), i = e._getExecutionVariable(this, "cachedPosition", null), a = e._getExecutionVariable(this, "cachedRotation", null), o = e._getExecutionVariable(this, "cachedScaling", null);
		if (r === e.executionId && i && a && o) this.position.setValue(i, e), this.rotationQuaternion.setValue(a, e), this.scaling.setValue(o, e);
		else {
			let r = this.input.getValue(e), s = i || new t(), c = a || new n(), l = o || new t(), u = Math.round(r.m[3] * 1e4) / 1e4, d = Math.round(r.m[7] * 1e4) / 1e4, f = Math.round(r.m[11] * 1e4) / 1e4, p = Math.round(r.m[15] * 1e4) / 1e4;
			if (u !== 0 || d !== 0 || f !== 0 || p !== 1) {
				this.isValid.setValue(!1, e), this.position.setValue(t.Zero(), e), this.rotationQuaternion.setValue(n.Identity(), e), this.scaling.setValue(t.One(), e);
				return;
			}
			let m = r.decompose(l, c, s);
			this.isValid.setValue(m, e), this.position.setValue(s, e), this.rotationQuaternion.setValue(c, e), this.scaling.setValue(l, e), e._setExecutionVariable(this, "cachedPosition", s), e._setExecutionVariable(this, "cachedRotation", c), e._setExecutionVariable(this, "cachedScaling", l), e._setExecutionVariable(this, "executionId", e.executionId);
		}
	}
	getClassName() {
		return "FlowGraphMatrixDecompose";
	}
};
e("FlowGraphMatrixDecompose", _);
var v = class extends u {
	constructor(e) {
		super(e), this.position = this.registerDataInput("position", o), this.rotationQuaternion = this.registerDataInput("rotationQuaternion", c), this.scaling = this.registerDataInput("scaling", o), this.value = this.registerDataOutput("value", s);
	}
	_updateOutputs(e) {
		let t = e._getExecutionVariable(this, "executionId", -1), n = e._getExecutionVariable(this, "cachedMatrix", null);
		if (t === e.executionId && n) this.value.setValue(n, e);
		else {
			let t = r.Compose(this.scaling.getValue(e), this.rotationQuaternion.getValue(e), this.position.getValue(e));
			this.value.setValue(t, e), e._setExecutionVariable(this, "cachedMatrix", t), e._setExecutionVariable(this, "executionId", e.executionId);
		}
	}
	getClassName() {
		return "FlowGraphMatrixCompose";
	}
};
e("FlowGraphMatrixCompose", v);
//#endregion
export { m as FlowGraphDeterminantBlock, h as FlowGraphInvertMatrixBlock, v as FlowGraphMatrixComposeBlock, _ as FlowGraphMatrixDecomposeBlock, g as FlowGraphMatrixMultiplicationBlock, p as FlowGraphTransposeBlock };

//# sourceMappingURL=flowGraphMatrixMathBlocks-C54xA4oE.js.map