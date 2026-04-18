import { t as e } from "./observable-D7x0jL6J.js";
//#region node_modules/@babylonjs/core/Engines/engineStore.js
var t = class {
	static get LastCreatedEngine() {
		return this.Instances.length === 0 ? null : this.Instances[this.Instances.length - 1];
	}
	static get LastCreatedScene() {
		return this._LastCreatedScene;
	}
};
t.Instances = [], t.OnEnginesDisposedObservable = new e(), t._LastCreatedScene = null, t.UseFallbackTexture = !0, t.FallbackTexture = "";
//#endregion
//#region node_modules/@babylonjs/core/Engines/performanceConfigurator.js
var n = class e {
	static SetMatrixPrecision(t) {
		if (e.MatrixTrackPrecisionChange = !1, t && !e.MatrixUse64Bits && e.MatrixTrackedMatrices) for (let t = 0; t < e.MatrixTrackedMatrices.length; ++t) {
			let n = e.MatrixTrackedMatrices[t], r = n._m;
			n._m = Array(16);
			for (let e = 0; e < 16; ++e) n._m[e] = r[e];
		}
		e.MatrixUse64Bits = t, e.MatrixCurrentType = e.MatrixUse64Bits ? Array : Float32Array, e.MatrixTrackedMatrices = null;
	}
};
n.MatrixUse64Bits = !1, n.MatrixTrackPrecisionChange = !0, n.MatrixCurrentType = Float32Array, n.MatrixTrackedMatrices = [];
//#endregion
export { t as n, n as t };

//# sourceMappingURL=performanceConfigurator-DMA6Ub5Z.js.map