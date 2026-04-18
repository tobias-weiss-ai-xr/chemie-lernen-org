import { t as e } from "./observable-D7x0jL6J.js";
import { t } from "./logger-B7TbbsLc.js";
import { n } from "./typeStore-Bwo5hkCf.js";
import { a as r, i, n as a, o, t as s } from "./math.vector-ByhvsffM.js";
import { n as c, t as l } from "./math.color-BS-ZqBtl.js";
import { t as u } from "./guid-CAqeuNf_.js";
//#region node_modules/@babylonjs/core/FlowGraph/CustomTypes/flowGraphInteger.js
var d = class e {
	constructor(e) {
		this.value = this._toInt(e);
	}
	_toInt(e) {
		return e | 0;
	}
	add(t) {
		return new e(this.value + t.value);
	}
	subtract(t) {
		return new e(this.value - t.value);
	}
	multiply(t) {
		return new e(Math.imul(this.value, t.value));
	}
	divide(t) {
		return new e(this.value / t.value);
	}
	getClassName() {
		return e.ClassName;
	}
	equals(e) {
		return this.value === e.value;
	}
	static FromValue(t) {
		return new e(t);
	}
	toString() {
		return this.value.toString();
	}
};
d.ClassName = "FlowGraphInteger", n("FlowGraphInteger", d);
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/CustomTypes/flowGraphMatrix.js
var f = class e {
	constructor(e = [
		1,
		0,
		0,
		1
	]) {
		this._m = e;
	}
	get m() {
		return this._m;
	}
	transformVector(e) {
		return this.transformVectorToRef(e, new i());
	}
	transformVectorToRef(e, t) {
		return t.x = e.x * this._m[0] + e.y * this._m[1], t.y = e.x * this._m[2] + e.y * this._m[3], t;
	}
	asArray() {
		return this.toArray();
	}
	toArray(e = []) {
		for (let t = 0; t < 4; t++) e[t] = this._m[t];
		return e;
	}
	fromArray(e) {
		for (let t = 0; t < 4; t++) this._m[t] = e[t];
		return this;
	}
	multiplyToRef(e, t) {
		let n = e._m, r = this._m, i = t._m;
		return i[0] = n[0] * r[0] + n[1] * r[2], i[1] = n[0] * r[1] + n[1] * r[3], i[2] = n[2] * r[0] + n[3] * r[2], i[3] = n[2] * r[1] + n[3] * r[3], t;
	}
	multiply(t) {
		return this.multiplyToRef(t, new e());
	}
	divideToRef(e, t) {
		let n = this._m, r = e._m, i = t._m;
		return i[0] = n[0] / r[0], i[1] = n[1] / r[1], i[2] = n[2] / r[2], i[3] = n[3] / r[3], t;
	}
	divide(t) {
		return this.divideToRef(t, new e());
	}
	addToRef(e, t) {
		let n = this._m, r = e.m, i = t.m;
		return i[0] = n[0] + r[0], i[1] = n[1] + r[1], i[2] = n[2] + r[2], i[3] = n[3] + r[3], t;
	}
	add(t) {
		return this.addToRef(t, new e());
	}
	subtractToRef(e, t) {
		let n = this._m, r = e.m, i = t.m;
		return i[0] = n[0] - r[0], i[1] = n[1] - r[1], i[2] = n[2] - r[2], i[3] = n[3] - r[3], t;
	}
	subtract(t) {
		return this.subtractToRef(t, new e());
	}
	transpose() {
		let t = this._m;
		return new e([
			t[0],
			t[2],
			t[1],
			t[3]
		]);
	}
	determinant() {
		let e = this._m;
		return e[0] * e[3] - e[1] * e[2];
	}
	inverse() {
		let t = this.determinant();
		if (t === 0) throw Error("Matrix is not invertible");
		let n = this._m, r = 1 / t;
		return new e([
			n[3] * r,
			-n[1] * r,
			-n[2] * r,
			n[0] * r
		]);
	}
	equals(e, t = 0) {
		let n = this._m, r = e.m;
		return t === 0 ? n[0] === r[0] && n[1] === r[1] && n[2] === r[2] && n[3] === r[3] : Math.abs(n[0] - r[0]) < t && Math.abs(n[1] - r[1]) < t && Math.abs(n[2] - r[2]) < t && Math.abs(n[3] - r[3]) < t;
	}
	getClassName() {
		return "FlowGraphMatrix2D";
	}
	toString() {
		return `FlowGraphMatrix2D(${this._m.join(", ")})`;
	}
}, p = class e {
	constructor(e = [
		1,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		1
	]) {
		this._m = e;
	}
	get m() {
		return this._m;
	}
	transformVector(e) {
		return this.transformVectorToRef(e, new r());
	}
	transformVectorToRef(e, t) {
		let n = this._m;
		return t.x = e.x * n[0] + e.y * n[1] + e.z * n[2], t.y = e.x * n[3] + e.y * n[4] + e.z * n[5], t.z = e.x * n[6] + e.y * n[7] + e.z * n[8], t;
	}
	multiplyToRef(e, t) {
		let n = e._m, r = this._m, i = t.m;
		return i[0] = n[0] * r[0] + n[1] * r[3] + n[2] * r[6], i[1] = n[0] * r[1] + n[1] * r[4] + n[2] * r[7], i[2] = n[0] * r[2] + n[1] * r[5] + n[2] * r[8], i[3] = n[3] * r[0] + n[4] * r[3] + n[5] * r[6], i[4] = n[3] * r[1] + n[4] * r[4] + n[5] * r[7], i[5] = n[3] * r[2] + n[4] * r[5] + n[5] * r[8], i[6] = n[6] * r[0] + n[7] * r[3] + n[8] * r[6], i[7] = n[6] * r[1] + n[7] * r[4] + n[8] * r[7], i[8] = n[6] * r[2] + n[7] * r[5] + n[8] * r[8], t;
	}
	multiply(t) {
		return this.multiplyToRef(t, new e());
	}
	divideToRef(e, t) {
		let n = this._m, r = e.m, i = t.m;
		return i[0] = n[0] / r[0], i[1] = n[1] / r[1], i[2] = n[2] / r[2], i[3] = n[3] / r[3], i[4] = n[4] / r[4], i[5] = n[5] / r[5], i[6] = n[6] / r[6], i[7] = n[7] / r[7], i[8] = n[8] / r[8], t;
	}
	divide(t) {
		return this.divideToRef(t, new e());
	}
	addToRef(e, t) {
		let n = this._m, r = e.m, i = t.m;
		return i[0] = n[0] + r[0], i[1] = n[1] + r[1], i[2] = n[2] + r[2], i[3] = n[3] + r[3], i[4] = n[4] + r[4], i[5] = n[5] + r[5], i[6] = n[6] + r[6], i[7] = n[7] + r[7], i[8] = n[8] + r[8], t;
	}
	add(t) {
		return this.addToRef(t, new e());
	}
	subtractToRef(e, t) {
		let n = this._m, r = e.m, i = t.m;
		return i[0] = n[0] - r[0], i[1] = n[1] - r[1], i[2] = n[2] - r[2], i[3] = n[3] - r[3], i[4] = n[4] - r[4], i[5] = n[5] - r[5], i[6] = n[6] - r[6], i[7] = n[7] - r[7], i[8] = n[8] - r[8], t;
	}
	subtract(t) {
		return this.subtractToRef(t, new e());
	}
	toArray(e = []) {
		for (let t = 0; t < 9; t++) e[t] = this._m[t];
		return e;
	}
	asArray() {
		return this.toArray();
	}
	fromArray(e) {
		for (let t = 0; t < 9; t++) this._m[t] = e[t];
		return this;
	}
	transpose() {
		let t = this._m;
		return new e([
			t[0],
			t[3],
			t[6],
			t[1],
			t[4],
			t[7],
			t[2],
			t[5],
			t[8]
		]);
	}
	determinant() {
		let e = this._m;
		return e[0] * (e[4] * e[8] - e[5] * e[7]) - e[1] * (e[3] * e[8] - e[5] * e[6]) + e[2] * (e[3] * e[7] - e[4] * e[6]);
	}
	inverse() {
		let t = this.determinant();
		if (t === 0) throw Error("Matrix is not invertible");
		let n = this._m, r = 1 / t;
		return new e([
			(n[4] * n[8] - n[5] * n[7]) * r,
			(n[2] * n[7] - n[1] * n[8]) * r,
			(n[1] * n[5] - n[2] * n[4]) * r,
			(n[5] * n[6] - n[3] * n[8]) * r,
			(n[0] * n[8] - n[2] * n[6]) * r,
			(n[2] * n[3] - n[0] * n[5]) * r,
			(n[3] * n[7] - n[4] * n[6]) * r,
			(n[1] * n[6] - n[0] * n[7]) * r,
			(n[0] * n[4] - n[1] * n[3]) * r
		]);
	}
	equals(e, t = 0) {
		let n = this._m, r = e.m;
		return t === 0 ? n[0] === r[0] && n[1] === r[1] && n[2] === r[2] && n[3] === r[3] && n[4] === r[4] && n[5] === r[5] && n[6] === r[6] && n[7] === r[7] && n[8] === r[8] : Math.abs(n[0] - r[0]) < t && Math.abs(n[1] - r[1]) < t && Math.abs(n[2] - r[2]) < t && Math.abs(n[3] - r[3]) < t && Math.abs(n[4] - r[4]) < t && Math.abs(n[5] - r[5]) < t && Math.abs(n[6] - r[6]) < t && Math.abs(n[7] - r[7]) < t && Math.abs(n[8] - r[8]) < t;
	}
	getClassName() {
		return "FlowGraphMatrix3D";
	}
	toString() {
		return `FlowGraphMatrix3D(${this._m.join(", ")})`;
	}
}, m;
(function(e) {
	e.Any = "any", e.String = "string", e.Number = "number", e.Boolean = "boolean", e.Object = "object", e.Integer = "FlowGraphInteger", e.Vector2 = "Vector2", e.Vector3 = "Vector3", e.Vector4 = "Vector4", e.Quaternion = "Quaternion", e.Matrix = "Matrix", e.Matrix2D = "Matrix2D", e.Matrix3D = "Matrix3D", e.Color3 = "Color3", e.Color4 = "Color4";
})(m ||= {});
var h = class {
	constructor(e, t, n = -1) {
		this.typeName = e, this.defaultValue = t, this.animationType = n;
	}
	serialize(e) {
		e.typeName = this.typeName, e.defaultValue = this.defaultValue;
	}
}, g = new h("any", void 0), _ = new h("string", ""), v = new h("number", 0, 0), y = new h("boolean", !1), b = new h("Vector2", i.Zero(), 5), x = new h("Vector3", r.Zero(), 1), S = new h("Vector4", o.Zero()), C = new h("Matrix", s.Identity(), 3), w = new h("Matrix2D", new f()), T = new h("Matrix3D", new p()), E = new h("Color3", l.Black(), 4), D = new h("Color4", new c(0, 0, 0, 0), 7), O = new h("Quaternion", a.Identity(), 2);
O.typeTransformer = (e) => {
	if (e.getClassName) {
		if (e.getClassName() === "Vector4") return a.FromArray(e.asArray());
		if (e.getClassName() === "Vector3") return a.FromEulerVector(e);
		if (e.getClassName() === "Matrix") return a.FromRotationMatrix(e);
	}
	return e;
};
var k = new h("FlowGraphInteger", new d(0), 0);
function A(e) {
	let t = e;
	switch (typeof e) {
		case "string": return _;
		case "number": return v;
		case "boolean": return y;
		case "object":
			if (t.getClassName) switch (t.getClassName()) {
				case "Vector2": return b;
				case "Vector3": return x;
				case "Vector4": return S;
				case "Matrix": return C;
				case "Color3": return E;
				case "Color4": return D;
				case "Quaternion": return O;
				case "FlowGraphInteger": return k;
				case "Matrix2D": return w;
				case "Matrix3D": return T;
			}
			return g;
		default: return g;
	}
}
function j(e) {
	switch (e) {
		case "string": return _;
		case "number": return v;
		case "boolean": return y;
		case "Vector2": return b;
		case "Vector3": return x;
		case "Vector4": return S;
		case "Matrix": return C;
		case "Color3": return E;
		case "Color4": return D;
		case "Quaternion": return O;
		case "FlowGraphInteger": return k;
		case "Matrix2D": return w;
		case "Matrix3D": return T;
		default: return g;
	}
}
function M(e) {
	switch (e) {
		case "number": return 0;
		case "Vector2": return 5;
		case "Vector3": return 1;
		case "Matrix": return 3;
		case "Color3": return 4;
		case "Color4": return 7;
		case "Quaternion": return 2;
		default: return 0;
	}
}
function N(e) {
	switch (e) {
		case 0: return v;
		case 5: return b;
		case 1: return x;
		case 3: return C;
		case 4: return E;
		case 7: return D;
		case 2: return O;
		default: return g;
	}
}
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/serialization.js
function P(e) {
	return e === "Mesh" || e === "AbstractMesh" || e === "GroundMesh" || e === "InstanceMesh" || e === "LinesMesh" || e === "GoldbergMesh" || e === "GreasedLineMesh" || e === "TrailMesh";
}
function F(e) {
	return e === "Vector2" || e === "Vector3" || e === "Vector4" || e === "Quaternion" || e === "Color3" || e === "Color4";
}
function I(e) {
	return e === "Matrix" || e === "Matrix2D" || e === "Matrix3D";
}
function L(e) {
	return e === "AnimationGroup";
}
function R(e, t, n = !1) {
	if (e === "Vector2") return i.FromArray(t);
	if (e === "Vector3") return n && (t[2] *= -1), r.FromArray(t);
	if (e === "Vector4") return o.FromArray(t);
	if (e === "Quaternion") return n && (t[2] *= -1, t[3] *= -1), a.FromArray(t);
	if (e === "Color3") return new l(t[0], t[1], t[2]);
	if (e === "Color4") return new c(t[0], t[1], t[2], t[3]);
	throw Error(`Unknown vector class name ${e}`);
}
function z(e, n, r) {
	let i = n?.getClassName?.() ?? "";
	if (F(i) || I(i)) r[e] = {
		value: n.asArray(),
		className: i
	};
	else if (i === "FlowGraphInteger") r[e] = {
		value: n.value,
		className: i
	};
	else if (i && (n.id || n.name)) r[e] = {
		id: n.id,
		name: n.name,
		className: i
	};
	else if (typeof n != "object" || !n) r[e] = n;
	else try {
		r[e] = JSON.parse(JSON.stringify(n));
	} catch {
		t.Warn(`FlowGraph serialization: value for key "${e}" is not JSON-serializable and was skipped.`);
	}
}
function B(e, t, n, r) {
	let i = t[e], a, o = i?.type ?? i?.className;
	if (P(o)) {
		let e = r.meshes.filter((e) => i.id ? e.id === i.id : e.name === i.name);
		e.length === 0 && (e = r.transformNodes.filter((e) => i.id ? e.id === i.id : e.name === i.name)), a = i.uniqueId ? e.find((e) => e.uniqueId === i.uniqueId) : e[0];
	} else if (F(o)) a = R(o, i.value);
	else if (L(o)) {
		let e = r.animationGroups.filter((e) => e.name === i.name);
		a = e.length === 1 ? e[0] : e.find((e) => e.uniqueId === i.uniqueId);
	} else a = o === "Matrix" ? s.FromArray(i.value) : o === "Matrix2D" ? new f(i.value) : o === "Matrix3D" ? new p(i.value) : o === "FlowGraphInteger" ? d.FromValue(i.value) : o === "number" || o === "string" || o === "boolean" ? i.value[0] : i && i.value !== void 0 ? i.value : Array.isArray(i) ? i.reduce((e, t) => t.eventData ? (e[t.id] = { type: j(t.type) }, t.value !== void 0 && (e[t.id].value = B("value", t, n, r)), e) : e, {}) : i;
	return a;
}
function V(e) {
	return e === "FlowGraphJsonPointerParserBlock";
}
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/flowGraphConnection.js
var H;
(function(e) {
	e[e.Input = 0] = "Input", e[e.Output = 1] = "Output";
})(H ||= {});
var U = class {
	constructor(e, t, n) {
		this._ownerBlock = n, this._connectedPoint = [], this.uniqueId = u(), this.connectedPointIds = [], this.name = e, this._connectionType = t;
	}
	get connectionType() {
		return this._connectionType;
	}
	_isSingularConnection() {
		return !0;
	}
	isConnected() {
		return this._connectedPoint.length > 0;
	}
	connectTo(e) {
		if (this._connectionType === e._connectionType) throw Error(`Cannot connect two points of type ${this.connectionType}`);
		if (this._isSingularConnection() && this._connectedPoint.length > 0 || e._isSingularConnection() && e._connectedPoint.length > 0) throw Error("Max number of connections for point reached");
		this._connectedPoint.push(e), e._connectedPoint.push(this);
	}
	disconnectFrom(e, t = !0) {
		let n = this._connectedPoint.indexOf(e), r = e._connectedPoint.indexOf(this);
		n === -1 || r === -1 || (t && this._connectedPoint.splice(n, 1), e._connectedPoint.splice(r, 1));
	}
	disconnectFromAll() {
		for (let e of this._connectedPoint) this.disconnectFrom(e, !1);
		this._connectedPoint.length = 0;
	}
	dispose() {
		for (let e of this._connectedPoint) this.disconnectFrom(e);
	}
	serialize(e = {}) {
		e.uniqueId = this.uniqueId, e.name = this.name, e._connectionType = this._connectionType, e.connectedPointIds = [], e.className = this.getClassName();
		for (let t of this._connectedPoint) e.connectedPointIds.push(t.uniqueId);
	}
	getClassName() {
		return "FGConnection";
	}
	deserialize(e) {
		this.uniqueId = e.uniqueId, this.name = e.name, this._connectionType = e._connectionType, this.connectedPointIds = e.connectedPointIds;
	}
}, W = class extends U {
	constructor(t, n, r, i, a = i.defaultValue, o = !1) {
		super(t, n, r), this.richType = i, this._defaultValue = a, this._optional = o, this._isDisabled = !1, this._lastValue = null, this.dataTransformer = null, this.onValueChangedObservable = new e();
	}
	get optional() {
		return this._optional;
	}
	get isDisabled() {
		return this._isDisabled;
	}
	set isDisabled(e) {
		this._isDisabled !== e && (this._isDisabled = e, this._isDisabled && this.disconnectFromAll());
	}
	_isSingularConnection() {
		return this.connectionType === 0;
	}
	setValue(e, t) {
		t._getConnectionValue(this) !== e && (t._setConnectionValue(this, e), this.onValueChangedObservable.notifyObservers(e));
	}
	resetToDefaultValue(e) {
		e._setConnectionValue(this, this._defaultValue);
	}
	connectTo(e) {
		this._isDisabled || super.connectTo(e);
	}
	_getValueOrDefault(e) {
		let t = e._getConnectionValue(this) ?? this._defaultValue;
		return this.dataTransformer ? this.dataTransformer(t) : t;
	}
	getValue(e) {
		if (this.connectionType === 1) {
			e._notifyExecuteNode(this._ownerBlock), this._ownerBlock._updateOutputs(e);
			let t = this._getValueOrDefault(e);
			return this._lastValue = t, this.richType.typeTransformer ? this.richType.typeTransformer(t) : t;
		}
		let t = this.isConnected() ? this._connectedPoint[0].getValue(e) : this._getValueOrDefault(e);
		return this._lastValue = t, this.richType.typeTransformer ? this.richType.typeTransformer(t) : t;
	}
	_getLastValue() {
		return this._lastValue;
	}
	getClassName() {
		return "FlowGraphDataConnection";
	}
	serialize(e = {}) {
		super.serialize(e), e.richType = {}, this.richType.serialize(e.richType), e.optional = this._optional, z("defaultValue", this._defaultValue, e);
	}
};
n("FlowGraphDataConnection", W);
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/flowGraphBlock.js
var G = class {
	constructor(e) {
		this.config = e, this.uniqueId = u(), this.name = this.config?.name ?? this.getClassName(), this.dataInputs = [], this.dataOutputs = [];
	}
	_updateOutputs(e) {}
	registerDataInput(e, t, n) {
		let r = new W(e, 0, this, t, n);
		return this.dataInputs.push(r), r;
	}
	registerDataOutput(e, t, n) {
		let r = new W(e, 1, this, t, n);
		return this.dataOutputs.push(r), r;
	}
	getDataInput(e) {
		return this.dataInputs.find((t) => t.name === e);
	}
	getDataOutput(e) {
		return this.dataOutputs.find((t) => t.name === e);
	}
	serialize(e = {}, t = z) {
		if (e.uniqueId = this.uniqueId, e.config = {}, this.config) {
			let n = this.config, r = Object.keys(n);
			for (let i of r) t(i, n[i], e.config);
		}
		e.dataInputs = [], e.dataOutputs = [], e.className = this.getClassName();
		for (let t of this.dataInputs) {
			let n = {};
			t.serialize(n), e.dataInputs.push(n);
		}
		for (let t of this.dataOutputs) {
			let n = {};
			t.serialize(n), e.dataOutputs.push(n);
		}
	}
	deserialize(e) {}
	_log(e, t, n) {
		e.logger?.addLogItem({
			action: t,
			payload: n,
			className: this.getClassName(),
			uniqueId: this.uniqueId
		});
	}
	getClassName() {
		return "FlowGraphBlock";
	}
};
//#endregion
export { p as C, f as S, S as _, V as a, j as b, k as c, T as d, v as f, x as g, b as h, z as i, C as l, _ as m, U as n, g as o, O as p, B as r, y as s, G as t, w as u, M as v, d as w, A as x, N as y };

//# sourceMappingURL=flowGraphBlock-CtJfM_SU.js.map