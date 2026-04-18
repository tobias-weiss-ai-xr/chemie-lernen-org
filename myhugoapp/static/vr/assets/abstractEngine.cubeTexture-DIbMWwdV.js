import { A as e, o as t } from "./tools.functions-Dgi_rE0R.js";
import { t as n } from "./logger-B7TbbsLc.js";
import { t as r } from "./guid-CAqeuNf_.js";
import { u as i } from "./tools-CES87F86.js";
//#region node_modules/@babylonjs/core/Materials/Textures/Loaders/textureLoaderManager.js
var a = /* @__PURE__ */ new Map();
function o(e, t) {
	s(e) && n.Warn(`Extension with the name '${e}' already exists`), a.set(e, t);
}
function s(e) {
	return a.delete(e);
}
function c(e, t) {
	(t === "image/ktx" || t === "image/ktx2") && (e = ".ktx"), a.has(e) || (e.endsWith(".ies") && o(".ies", async () => await import("./iesTextureLoader-BxFyo_rk.js").then((e) => new e._IESTextureLoader())), e.endsWith(".dds") && o(".dds", async () => await import("./ddsTextureLoader-DvS2R7_9.js").then((e) => new e._DDSTextureLoader())), e.endsWith(".basis") && o(".basis", async () => await import("./basisTextureLoader-CjhwLN1G.js").then((e) => new e._BasisTextureLoader())), e.endsWith(".env") && o(".env", async () => await import("./envTextureLoader-DxL-wFRQ.js").then((e) => new e._ENVTextureLoader())), e.endsWith(".hdr") && o(".hdr", async () => await import("./hdrTextureLoader-M7eoDVRb.js").then((e) => new e._HDRTextureLoader())), (e.endsWith(".ktx") || e.endsWith(".ktx2")) && (o(".ktx", async () => await import("./ktxTextureLoader-BxXGD_VW.js").then((e) => new e._KTXTextureLoader())), o(".ktx2", async () => await import("./ktxTextureLoader-BxXGD_VW.js").then((e) => new e._KTXTextureLoader()))), e.endsWith(".tga") && o(".tga", async () => await import("./tgaTextureLoader-ms2suwah.js").then((e) => new e._TGATextureLoader())), e.endsWith(".exr") && o(".exr", async () => await import("./exrTextureLoader-D5BDSM8u.js").then((e) => new e._ExrTextureLoader())));
	let n = a.get(e);
	return n ? Promise.resolve(n(t)) : null;
}
//#endregion
//#region node_modules/@babylonjs/core/Misc/urlTools.js
function l(e) {
	let t = e.split("?")[0], n = t.lastIndexOf(".");
	return n > -1 ? t.substring(n).toLowerCase() : "";
}
t.prototype._partialLoadFile = function(e, t, n, r, i = null) {
	this._loadFile(e, (e) => {
		n[t] = e, n._internalCount++, n._internalCount === 6 && r(n);
	}, void 0, void 0, !0, (e, t) => {
		i && e && i(e.status + " " + e.statusText, t);
	});
}, t.prototype._cascadeLoadFiles = function(e, t, n, r = null) {
	let i = [];
	i._internalCount = 0;
	for (let e = 0; e < 6; e++) this._partialLoadFile(n[e], e, i, t, r);
}, t.prototype._cascadeLoadImgs = function(e, t, n, r, i = null, a) {
	let o = [];
	o._internalCount = 0;
	for (let s = 0; s < 6; s++) this._partialLoadImg(r[s], s, o, e, t, n, i, a);
}, t.prototype._partialLoadImg = function(e, t, n, a, o, s, c = null, l) {
	let u = r();
	i(e, (e) => {
		n[t] = e, n._internalCount++, a && a.removePendingData(u), n._internalCount === 6 && s && s(o, n);
	}, (e, t) => {
		a && a.removePendingData(u), c && c(e, t);
	}, a ? a.offlineProvider : null, l), a && a.addPendingData(u);
}, t.prototype.createCubeTextureBase = function(t, r, i, a, o = null, s = null, u, d = null, f = !1, p = 0, m = 0, h = null, g = null, _ = null, v = !1, y = null) {
	let b = h || new e(this, 7);
	b.isCube = !0, b.url = t, b.generateMipMaps = !a, b._lodGenerationScale = p, b._lodGenerationOffset = m, b._useSRGBBuffer = !!v && this._caps.supportSRGBBuffers && (this.version > 1 || this.isWebGPU || !!a), b !== h && (b.label = t.substring(0, 60)), this._doNotHandleContextLost || (b._extension = d, b._files = i, b._buffer = y);
	let x = t;
	this._transformTextureUrl && !h && (t = this._transformTextureUrl(t));
	let S = c(d ?? l(t)), C = (e, t) => {
		b.dispose(), s ? s(e, t) : e && n.Warn(e);
	}, w = (e, s) => {
		t === x ? e && C(e.status + " " + e.statusText, s) : (n.Warn(`Failed to load ${t}, falling back to the ${x}`), this.createCubeTextureBase(x, r, i, !!a, o, C, u, d, f, p, m, b, g, _, v, y));
	};
	if (S) S.then((e) => {
		let n = (t) => {
			g && g(b, t), e.loadCubeData(t, b, f, o, (e, t) => {
				C(e, t);
			});
		};
		y ? n(y) : i && i.length === 6 ? e.supportCascades ? this._cascadeLoadFiles(r, (e) => n(e.map((e) => new Uint8Array(e))), i, C) : C("Textures type does not support cascades.") : this._loadFile(t, (e) => n(new Uint8Array(e)), void 0, r ? r.offlineProvider || null : void 0, !0, w);
	});
	else {
		if (!i || i.length === 0) throw Error("Cannot load cubemap because files were not defined, or the correct loader was not found.");
		this._cascadeLoadImgs(r, b, (e, t) => {
			_ && _(e, t);
		}, i, C);
	}
	return this._internalTexturesCache.push(b), b;
};
//#endregion
export { c as t };

//# sourceMappingURL=abstractEngine.cubeTexture-DIbMWwdV.js.map