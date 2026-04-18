import { n as e } from "./typeStore-Bwo5hkCf.js";
import { t } from "./math.scalar.functions-_PnMiXiP.js";
import { a as n, n as r, o as i } from "./math.vector-ByhvsffM.js";
import { b as a, f as o, g as s, h as c, l, o as u, p as d, s as f, t as p } from "./flowGraphBlock-CtJfM_SU.js";
import { i as m } from "./utils-ChmPBd4C.js";
import { t as h } from "./flowGraphBinaryOperationBlock-DyZ8CjaJ.js";
import { t as g } from "./flowGraphUnaryOperationBlock-DMBdLAA0.js";
//#region node_modules/@babylonjs/core/Maths/math.vector.functions.js
function _(e, t) {
	return e.x * t.x + e.y * t.y + e.z * t.z;
}
function v(e, t) {
	return e.x * t.x + e.y * t.y + e.z * t.z + e.w * t.w;
}
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/flowGraphMath.js
function y(e, n) {
	return Math.acos(t(v(e, n), -1, 1)) * 2;
}
function b(e, t) {
	let n = new r();
	return x(e, t, n), n;
}
function x(e, i, a) {
	let o = n.Cross(e, i), s = Math.acos(t(_(e, i), -1, 1));
	return r.RotationAxisToRef(o, s, a), a;
}
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Math/flowGraphVectorMathBlocks.js
var S = "cachedOperationAxis", C = "cachedOperationAngle", w = "cachedExecutionId", T = class extends g {
	constructor(e) {
		super(u, o, (e) => this._polymorphicLength(e), "FlowGraphLengthBlock", e);
	}
	_polymorphicLength(e) {
		switch (m(e)) {
			case "Vector2":
			case "Vector3":
			case "Vector4":
			case "Quaternion": return e.length();
			default: throw Error(`Cannot compute length of value ${e}`);
		}
	}
};
e("FlowGraphLengthBlock", T);
var E = class extends g {
	constructor(e) {
		super(u, u, (e) => this._polymorphicNormalize(e), "FlowGraphNormalizeBlock", e);
	}
	_polymorphicNormalize(e) {
		let t = m(e), n;
		switch (t) {
			case "Vector2":
			case "Vector3":
			case "Vector4":
			case "Quaternion": return n = e.normalizeToNew(), this.config?.nanOnZeroLength && e.length() === 0 && n.setAll(NaN), n;
			default: throw Error(`Cannot normalize value ${e}`);
		}
	}
};
e("FlowGraphNormalizeBlock", E);
var D = class extends h {
	constructor(e) {
		super(u, u, o, (e, t) => this._polymorphicDot(e, t), "FlowGraphDotBlock", e);
	}
	_polymorphicDot(e, t) {
		switch (m(e)) {
			case "Vector2":
			case "Vector3":
			case "Vector4":
			case "Quaternion": return e.dot(t);
			default: throw Error(`Cannot get dot product of ${e} and ${t}`);
		}
	}
};
e("FlowGraphDotBlock", D);
var O = class extends h {
	constructor(e) {
		super(s, s, s, (e, t) => n.Cross(e, t), "FlowGraphCrossBlock", e);
	}
};
e("FlowGraphCrossBlock", O);
var k = class extends h {
	constructor(e) {
		super(c, o, c, (e, t) => e.rotate(t), "FlowGraphRotate2DBlock", e);
	}
};
e("FlowGraphRotate2DBlock", k);
var A = class extends h {
	constructor(e) {
		super(s, d, s, (e, t) => e.applyRotationQuaternion(t), "FlowGraphRotate3DBlock", e);
	}
};
e("FlowGraphRotate3DBlock", A);
function j(e, t) {
	switch (m(e)) {
		case "Vector2": return t.transformVector(e);
		case "Vector3": return t.transformVector(e);
		case "Vector4": return e = e, new i(e.x * t.m[0] + e.y * t.m[1] + e.z * t.m[2] + e.w * t.m[3], e.x * t.m[4] + e.y * t.m[5] + e.z * t.m[6] + e.w * t.m[7], e.x * t.m[8] + e.y * t.m[9] + e.z * t.m[10] + e.w * t.m[11], e.x * t.m[12] + e.y * t.m[13] + e.z * t.m[14] + e.w * t.m[15]);
		default: throw Error(`Cannot transform value ${e}`);
	}
}
var M = class extends h {
	constructor(e) {
		let t = e?.vectorType || "Vector3", n = t === "Vector2" ? "Matrix2D" : t === "Vector3" ? "Matrix3D" : "Matrix";
		super(a(t), a(n), a(t), j, "FlowGraphTransformVectorBlock", e);
	}
};
e("FlowGraphTransformVectorBlock", M);
var N = class extends h {
	constructor(e) {
		super(s, l, s, (e, t) => n.TransformCoordinates(e, t), "FlowGraphTransformCoordinatesBlock", e);
	}
};
e("FlowGraphTransformCoordinatesBlock", N);
var P = class extends g {
	constructor(e) {
		super(d, d, (e) => e.conjugate(), "FlowGraphConjugateBlock", e);
	}
};
e("FlowGraphConjugateBlock", P);
var F = class extends h {
	constructor(e) {
		super(d, d, o, (e, t) => y(e, t), "FlowGraphAngleBetweenBlock", e);
	}
};
e("FlowGraphAngleBetweenBlock", F);
var I = class extends h {
	constructor(e) {
		super(s, o, d, (e, t) => r.RotationAxis(e, t), "FlowGraphQuaternionFromAxisAngleBlock", e);
	}
};
e("FlowGraphQuaternionFromAxisAngleBlock", I);
var L = class extends p {
	constructor(e) {
		super(e), this.a = this.registerDataInput("a", d), this.axis = this.registerDataOutput("axis", s), this.angle = this.registerDataOutput("angle", o), this.isValid = this.registerDataOutput("isValid", f);
	}
	_updateOutputs(e) {
		let t = e._getExecutionVariable(this, w, -1), n = e._getExecutionVariable(this, S, null), r = e._getExecutionVariable(this, C, null);
		if (n != null && r != null && t === e.executionId) this.axis.setValue(n, e), this.angle.setValue(r, e);
		else try {
			let { axis: t, angle: n } = this.a.getValue(e).toAxisAngle();
			e._setExecutionVariable(this, S, t), e._setExecutionVariable(this, C, n), e._setExecutionVariable(this, w, e.executionId), this.axis.setValue(t, e), this.angle.setValue(n, e), this.isValid.setValue(!0, e);
		} catch {
			this.isValid.setValue(!1, e);
		}
	}
	getClassName() {
		return "FlowGraphAxisAngleFromQuaternionBlock";
	}
};
e("FlowGraphAxisAngleFromQuaternionBlock", L);
var R = class extends h {
	constructor(e) {
		super(s, s, d, (e, t) => b(e, t), "FlowGraphQuaternionFromDirectionsBlock", e);
	}
};
//#endregion
export { F as FlowGraphAngleBetweenBlock, L as FlowGraphAxisAngleFromQuaternionBlock, P as FlowGraphConjugateBlock, O as FlowGraphCrossBlock, D as FlowGraphDotBlock, T as FlowGraphLengthBlock, E as FlowGraphNormalizeBlock, I as FlowGraphQuaternionFromAxisAngleBlock, R as FlowGraphQuaternionFromDirectionsBlock, k as FlowGraphRotate2DBlock, A as FlowGraphRotate3DBlock, M as FlowGraphTransformBlock, N as FlowGraphTransformCoordinatesBlock };

//# sourceMappingURL=flowGraphVectorMathBlocks-CP53FcaL.js.map