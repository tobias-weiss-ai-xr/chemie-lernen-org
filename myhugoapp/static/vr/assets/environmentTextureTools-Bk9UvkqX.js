import { A as e } from "./tools.functions-Dgi_rE0R.js";
import { t } from "./logger-B7TbbsLc.js";
import { i as n } from "./math.scalar.functions-_PnMiXiP.js";
import { a as r } from "./math.vector-ByhvsffM.js";
import { r as i } from "./cubemapToSphericalPolynomial-DHpEIj6r.js";
import { h as a, n as o } from "./tools-CES87F86.js";
import { r as s } from "./texture-k-JfmmPT.js";
import "./scene-DjmpfiyH.js";
import { i as c } from "./textureTools-C-mDeuST.js";
import "./rgbdTextureTools-BBx0m4FU.js";
import "./dumpTools-YIQ33Uth.js";
import "./baseTexture.polynomial-CLMXRzd5.js";
//#region node_modules/@babylonjs/core/Misc/environmentTextureTools.js
var l = "image/png", u = 2, d = [
	134,
	22,
	135,
	150,
	246,
	214,
	150,
	54
];
function f(e) {
	let n = new DataView(e.buffer, e.byteOffset, e.byteLength), r = 0;
	for (let e = 0; e < d.length; e++) if (n.getUint8(r++) !== d[e]) return t.Error("Not a babylon environment map"), null;
	let i = "", a;
	for (; a = n.getUint8(r++);) i += String.fromCharCode(a);
	let o = JSON.parse(i);
	return o = p(o), o.binaryDataPosition = r, o.specular && (o.specular.lodGenerationScale = o.specular.lodGenerationScale || .8), o;
}
function p(e) {
	if (e.version > u) throw Error(`Unsupported babylon environment map version "${e.version}". Latest supported version is "${u}".`);
	return e.version === 2 || (e = {
		...e,
		version: 2,
		imageType: l
	}), e;
}
function m(e, t) {
	t = p(t);
	let n = t.specular, r = Math.log2(t.width);
	if (r = Math.round(r) + 1, n.mipmaps.length !== 6 * r) throw Error(`Unsupported specular mipmaps number "${n.mipmaps.length}"`);
	let i = Array(r);
	for (let a = 0; a < r; a++) {
		i[a] = [
			,
			,
			,
			,
			,
			,
		];
		for (let r = 0; r < 6; r++) {
			let o = n.mipmaps[a * 6 + r];
			i[a][r] = new Uint8Array(e.buffer, e.byteOffset + t.binaryDataPosition + o.position, o.length);
		}
	}
	return i;
}
function h(e, t) {
	t = p(t);
	let n = [
		,
		,
		,
		,
		,
		,
	], r = t.irradiance?.irradianceTexture;
	if (r) {
		if (r.faces.length !== 6) throw Error(`Incorrect irradiance texture faces number "${r.faces.length}"`);
		for (let i = 0; i < 6; i++) {
			let a = r.faces[i];
			n[i] = new Uint8Array(e.buffer, e.byteOffset + t.binaryDataPosition + a.position, a.length);
		}
	}
	return n;
}
function g(e, t, n) {
	n = p(n);
	let i = n.specular;
	if (!i) return Promise.resolve([]);
	e._lodGenerationScale = i.lodGenerationScale;
	let a = [], o = m(t, n);
	a.push(v(e, o, n.imageType));
	let s = n.irradiance?.irradianceTexture;
	if (s) {
		let i = h(t, n), o = null;
		n.irradiance?.irradianceTexture?.dominantDirection && (o = r.FromArray(n.irradiance.irradianceTexture.dominantDirection)), a.push(y(e, i, s.size, n.imageType, o));
	}
	return Promise.all(a);
}
async function _(e, t, n, r, i, a, o, s, c, l, u) {
	return await new Promise((d, f) => {
		if (n) {
			let n = t.createTexture(null, !0, !0, null, 1, null, (e) => {
				f(e);
			}, e);
			r?.onEffectCreatedObservable.addOnce((s) => {
				s.executeWhenCompiled(() => {
					r.externalTextureSamplerBinding = !0, r.onApply = (r) => {
						r._bindTexture("textureSampler", n), r.setFloat2("scale", 1, t._features.needsInvertingBitmap && e instanceof ImageBitmap ? -1 : 1);
					}, t.scenes.length && (t.scenes[0].postProcessManager.directRender([r], l, !0, a, o), t.restoreDefaultFramebuffer(), n.dispose(), URL.revokeObjectURL(i), d());
				});
			});
		} else {
			if (t._uploadImageToTexture(u, e, a, o), s) {
				let n = c[o];
				n && t._uploadImageToTexture(n._texture, e, a, 0);
			}
			d();
		}
	});
}
async function v(e, t, n = l) {
	let r = e.getEngine();
	e.format = 5, e.type = 0, e.generateMipMaps = !0, e._cachedAnisotropicFilteringLevel = null, r.updateTextureSamplingMode(3, e), await b(e, t, !0, n), e.isReady = !0;
}
async function y(t, n, r, i = l, a = null) {
	let o = t.getEngine(), c = new e(o, 5), u = new s(o, c);
	t._irradianceTexture = u, u._dominantDirection = a, c.isCube = !0, c.format = 5, c.type = 0, c.generateMipMaps = !0, c._cachedAnisotropicFilteringLevel = null, c.generateMipMaps = !0, c.width = r, c.height = r, o.updateTextureSamplingMode(3, c), await b(c, [n], !1, i), o.generateMipMapsForCubemap(c), c.isReady = !0;
}
async function b(t, r, i, u = l) {
	if (!o.IsExponentOfTwo(t.width)) throw Error("Texture size must be a power of two");
	let d = n(t.width) + 1, f = t.getEngine(), p = !1, m = !1, h = null, g = null, v = null, y = f.getCaps();
	y.textureLOD ? f._features.supportRenderAndCopyToLodForFloatTextures ? y.textureHalfFloatRender && y.textureHalfFloatLinearFiltering ? (p = !0, t.type = 2) : y.textureFloatRender && y.textureFloatLinearFiltering && (p = !0, t.type = 1) : p = !1 : (p = !1, m = i);
	let b = 0;
	if (p) f.isWebGPU ? (b = 1, await import("./rgbdDecode.fragment-QoDGFJnZ.js")) : await import("./rgbdDecode.fragment-CrDNNF5D.js"), h = new c("rgbdDecode", "rgbdDecode", null, null, 1, null, 3, f, !1, void 0, t.type, void 0, null, !1, void 0, b), t._isRGBD = !1, t.invertY = !1, g = f.createRenderTargetCubeTexture(t.width, {
		generateDepthBuffer: !1,
		generateMipMaps: !0,
		generateStencilBuffer: !1,
		samplingMode: 3,
		type: t.type,
		format: 5
	});
	else if (t._isRGBD = !0, t.invertY = !0, m) {
		v = {};
		let n = t._lodGenerationScale, r = t._lodGenerationOffset;
		for (let i = 0; i < 3; i++) {
			let a = 1 - i / 2, o = r, c = (d - 1) * n + r, l = o + (c - o) * a, u = Math.round(Math.min(Math.max(l, 0), c)), p = new e(f, 2);
			p.isCube = !0, p.invertY = !0, p.generateMipMaps = !1, f.updateTextureSamplingMode(2, p);
			let m = new s(null);
			switch (m._isCube = !0, m._texture = p, v[u] = m, i) {
				case 0:
					t._lodTextureLow = m;
					break;
				case 1:
					t._lodTextureMid = m;
					break;
				case 2:
					t._lodTextureHigh = m;
					break;
			}
		}
	}
	let x = [];
	for (let e = 0; e < r.length; e++) for (let n = 0; n < 6; n++) {
		let i = r[e][n], o = a(i), s = new Blob([o], { type: u }), c = URL.createObjectURL(s), l;
		if (f._features.forceBitmapOverHTMLImageElement) l = f.createImageBitmap(s, {
			premultiplyAlpha: "none",
			colorSpaceConversion: "none"
		}).then(async (r) => await _(r, f, p, h, c, n, e, m, v, g, t));
		else {
			let r = new Image();
			r.src = c, l = new Promise((i, a) => {
				r.onload = () => {
					_(r, f, p, h, c, n, e, m, v, g, t).then(() => i()).catch((e) => {
						a(e);
					});
				}, r.onerror = (e) => {
					a(e);
				};
			});
		}
		x.push(l);
	}
	if (await Promise.all(x), r.length < d) {
		let e, n = 2 ** (d - 1 - r.length), i = n * n * 4;
		switch (t.type) {
			case 0:
				e = new Uint8Array(i);
				break;
			case 2:
				e = new Uint16Array(i);
				break;
			case 1:
				e = new Float32Array(i);
				break;
		}
		for (let n = r.length; n < d; n++) for (let r = 0; r < 6; r++) f._uploadArrayBufferViewToTexture(g?.texture || t, e, r, n);
	}
	if (g) {
		let e = t._irradianceTexture;
		t._irradianceTexture = null, f._releaseTexture(t), g._swapAndDie(t), t._irradianceTexture = e;
	}
	h && h.dispose(), m && (t._lodTextureHigh && t._lodTextureHigh._texture && (t._lodTextureHigh._texture.isReady = !0), t._lodTextureMid && t._lodTextureMid._texture && (t._lodTextureMid._texture.isReady = !0), t._lodTextureLow && t._lodTextureLow._texture && (t._lodTextureLow._texture.isReady = !0));
}
function x(e, t) {
	t = p(t);
	let n = t.irradiance;
	if (!n) return;
	let a = new i();
	r.FromArrayToRef(n.x, 0, a.x), r.FromArrayToRef(n.y, 0, a.y), r.FromArrayToRef(n.z, 0, a.z), r.FromArrayToRef(n.xx, 0, a.xx), r.FromArrayToRef(n.yy, 0, a.yy), r.FromArrayToRef(n.zz, 0, a.zz), r.FromArrayToRef(n.yz, 0, a.yz), r.FromArrayToRef(n.zx, 0, a.zx), r.FromArrayToRef(n.xy, 0, a.xy), e._sphericalPolynomial = a;
}
function S(e, t, n, r, i) {
	let a = v(e.getEngine().createRawCubeTexture(null, e.width, e.format, e.type, e.generateMipMaps, e.invertY, e.samplingMode, e._compression), t).then(() => e);
	return e.onRebuildCallback = (e) => ({
		proxy: a,
		isReady: !0,
		isAsync: !0
	}), e._source = 13, e._bufferViewArrayArray = t, e._lodGenerationScale = r, e._lodGenerationOffset = i, e._sphericalPolynomial = n, v(e, t).then(() => (e.isReady = !0, e));
}
//#endregion
export { S as i, g as n, x as r, f as t };

//# sourceMappingURL=environmentTextureTools-Bk9UvkqX.js.map