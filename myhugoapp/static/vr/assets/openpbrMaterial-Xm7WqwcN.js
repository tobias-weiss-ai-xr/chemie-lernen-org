import { A as e } from "./tools.functions-Dgi_rE0R.js";
import { t } from "./logger-B7TbbsLc.js";
import { t as n } from "./devTools-LMnNz6iC.js";
import { t as r } from "./thinEngine-BsMcatLj.js";
import { n as i } from "./typeStore-Bwo5hkCf.js";
import { i as a, o, r as s, t as c } from "./math.vector-ByhvsffM.js";
import { n as l, t as u } from "./math.color-BS-ZqBtl.js";
import { t as d } from "./decorators.serialization-C6Hy3Nio.js";
import { _ as f, i as p, n as m, t as h } from "./decorators-Dkc3uIc_.js";
import { n as g } from "./tools-CES87F86.js";
import { t as _ } from "./texture-k-JfmmPT.js";
import { r as v } from "./renderingManager-rSXBHAtT.js";
import { o as y } from "./floatingOriginMatrixOverrides-BJnyEKBF.js";
import { n as b } from "./buffer-CS0VqOwx.js";
import { A as x, B as S, C, D as w, E as T, F as E, G as D, H as O, I as k, J as A, K as j, L as ee, M as te, N as M, O as ne, P as re, R as ie, S as ae, T as N, U as oe, V as P, W as F, _ as se, a as ce, b as le, c as ue, d as de, f as fe, g as pe, h as I, i as L, k as R, l as z, m as me, n as B, o as V, p as he, q as H, r as ge, t as _e, u as U, v as ve, w as ye, x as W, y as be, z as xe } from "./brdfTextureTools-1-JHDL51.js";
import { a as Se } from "./textureTools-C-mDeuST.js";
import "./geometry.fragment-DSmT0E3r.js";
import "./geometry.vertex-CdmNvjUf.js";
//#region node_modules/@babylonjs/core/Materials/environmentLighting.defines.js
function Ce(e) {
	return class extends e {
		constructor() {
			super(...arguments), this.REFLECTION = !1, this.REFLECTIONMAP_3D = !1, this.REFLECTIONMAP_SPHERICAL = !1, this.REFLECTIONMAP_PLANAR = !1, this.REFLECTIONMAP_CUBIC = !1, this.USE_LOCAL_REFLECTIONMAP_CUBIC = !1, this.REFLECTIONMAP_PROJECTION = !1, this.REFLECTIONMAP_SKYBOX = !1, this.REFLECTIONMAP_EXPLICIT = !1, this.REFLECTIONMAP_EQUIRECTANGULAR = !1, this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = !1, this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = !1, this.INVERTCUBICMAP = !1, this.USESPHERICALFROMREFLECTIONMAP = !1, this.USEIRRADIANCEMAP = !1, this.USE_IRRADIANCE_DOMINANT_DIRECTION = !1, this.USESPHERICALINVERTEX = !1, this.REFLECTIONMAP_OPPOSITEZ = !1, this.LODINREFLECTIONALPHA = !1, this.GAMMAREFLECTION = !1, this.RGBDREFLECTION = !1;
		}
	};
}
r.prototype.restoreSingleAttachment = function() {
	let e = this._gl;
	this.bindAttachments([e.BACK]);
}, r.prototype.restoreSingleAttachmentForRenderTarget = function() {
	let e = this._gl;
	this.bindAttachments([e.COLOR_ATTACHMENT0]);
}, r.prototype.buildTextureLayout = function(e, t = !1) {
	let n = this._gl, r = [];
	if (t) r.push(n.BACK);
	else for (let t = 0; t < e.length; t++) e[t] ? r.push(n["COLOR_ATTACHMENT" + t]) : r.push(n.NONE);
	return r;
}, r.prototype.bindAttachments = function(e) {
	this._gl.drawBuffers(e);
}, r.prototype.unBindMultiColorAttachmentFramebuffer = function(e, t = !1, n) {
	this._currentRenderTarget = null, e.disableAutomaticMSAAResolve || this.resolveMultiFramebuffer(e), t || this.generateMipMapsMultiFramebuffer(e), n && (e._MSAAFramebuffer && this._bindUnboundFramebuffer(e._framebuffer), n()), this._bindUnboundFramebuffer(null);
}, r.prototype.createMultipleRenderTarget = function(n, r, i = !0) {
	let a = !1, o = !0, s = !1, c = !1, l, u = 1, d = 1, f = [], p = [], m = [], h = [], g = [], _ = [], v = [], y = [], b = [], x = !1, S = this._createHardwareRenderTargetWrapper(!0, !1, n);
	r !== void 0 && (a = r.generateMipMaps === void 0 ? !1 : r.generateMipMaps, o = r.generateDepthBuffer === void 0 ? !0 : r.generateDepthBuffer, s = r.generateStencilBuffer === void 0 ? !1 : r.generateStencilBuffer, c = r.generateDepthTexture === void 0 ? !1 : r.generateDepthTexture, u = r.textureCount ?? 1, d = r.samples ?? d, f = r.types || f, p = r.samplingModes || p, m = r.useSRGBBuffers || m, h = r.formats || h, g = r.targetTypes || g, _ = r.faceIndex || _, v = r.layerIndex || v, y = r.layerCounts || y, b = r.labels || b, x = r.dontCreateTextures ?? !1, this.webGLVersion > 1 && (r.depthTextureFormat === 13 || r.depthTextureFormat === 17 || r.depthTextureFormat === 16 || r.depthTextureFormat === 14 || r.depthTextureFormat === 18) && (l = r.depthTextureFormat)), l === void 0 && (l = s ? 13 : 14);
	let C = this._gl, w = this._currentFramebuffer, T = C.createFramebuffer();
	this._bindUnboundFramebuffer(T);
	let E = n.width ?? n, D = n.height ?? n, O = [], k = [], A = this.webGLVersion > 1 && (l === 13 || l === 17 || l === 18);
	S.label = r?.label ?? "MultiRenderTargetWrapper", S._framebuffer = T, S._generateDepthBuffer = c || o, S._generateStencilBuffer = c ? A : s, S._depthStencilBuffer = this._setupFramebufferDepthAttachments(S._generateStencilBuffer, S._generateDepthBuffer, E, D, 1, l), S._attachments = k;
	for (let n = 0; n < u; n++) {
		let r = p[n] || 3, i = f[n] || 0, o = m[n] || !1, s = h[n] || 5, c = g[n] || 3553, l = y[n] ?? 1;
		(i === 1 && !this._caps.textureFloatLinearFiltering || i === 2 && !this._caps.textureHalfFloatLinearFiltering) && (r = 1);
		let u = this._getSamplingParameters(r, a);
		i === 1 && !this._caps.textureFloat && (i = 0, t.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type")), o = o && this._caps.supportSRGBBuffers && (this.webGLVersion > 1 || this.isWebGPU);
		let d = this.webGLVersion > 1, _ = C[d ? "COLOR_ATTACHMENT" + n : "COLOR_ATTACHMENT" + n + "_WEBGL"];
		if (k.push(_), c === -1 || x) continue;
		let v = new e(this, 6);
		O[n] = v, C.activeTexture(C["TEXTURE" + n]), C.bindTexture(c, v._hardwareTexture.underlyingResource), C.texParameteri(c, C.TEXTURE_MAG_FILTER, u.mag), C.texParameteri(c, C.TEXTURE_MIN_FILTER, u.min), C.texParameteri(c, C.TEXTURE_WRAP_S, C.CLAMP_TO_EDGE), C.texParameteri(c, C.TEXTURE_WRAP_T, C.CLAMP_TO_EDGE);
		let w = this._getRGBABufferInternalSizedFormat(i, s, o), T = this._getInternalFormat(s), A = this._getWebGLTextureType(i);
		if (d && (c === 35866 || c === 32879)) c === 35866 ? v.is2DArray = !0 : v.is3D = !0, v.baseDepth = v.depth = l, C.texImage3D(c, 0, w, E, D, l, 0, T, A, null);
		else if (c === 34067) {
			for (let e = 0; e < 6; e++) C.texImage2D(C.TEXTURE_CUBE_MAP_POSITIVE_X + e, 0, w, E, D, 0, T, A, null);
			v.isCube = !0;
		} else C.texImage2D(C.TEXTURE_2D, 0, w, E, D, 0, T, A, null);
		a && C.generateMipmap(c), this._bindTextureDirectly(c, null), v.baseWidth = E, v.baseHeight = D, v.width = E, v.height = D, v.isReady = !0, v.samples = 1, v.generateMipMaps = a, v.samplingMode = r, v.type = i, v._useSRGBBuffer = o, v.format = s, v.label = b[n] ?? S.label + "-Texture" + n, this._internalTexturesCache.push(v);
	}
	if (c && this._caps.depthTextureExtension && !x) {
		let t = new e(this, 14), n = 5, r = C.DEPTH_COMPONENT16, i = C.DEPTH_COMPONENT, o = C.UNSIGNED_SHORT, s = C.DEPTH_ATTACHMENT;
		this.webGLVersion < 2 ? r = C.DEPTH_COMPONENT : l === 14 ? (n = 1, o = C.FLOAT, r = C.DEPTH_COMPONENT32F) : l === 18 ? (n = 0, o = C.FLOAT_32_UNSIGNED_INT_24_8_REV, r = C.DEPTH32F_STENCIL8, i = C.DEPTH_STENCIL, s = C.DEPTH_STENCIL_ATTACHMENT) : l === 16 ? (n = 0, o = C.UNSIGNED_INT, r = C.DEPTH_COMPONENT24, s = C.DEPTH_ATTACHMENT) : (l === 13 || l === 17) && (n = 12, o = C.UNSIGNED_INT_24_8, r = C.DEPTH24_STENCIL8, i = C.DEPTH_STENCIL, s = C.DEPTH_STENCIL_ATTACHMENT), this._bindTextureDirectly(C.TEXTURE_2D, t, !0), C.texParameteri(C.TEXTURE_2D, C.TEXTURE_MAG_FILTER, C.NEAREST), C.texParameteri(C.TEXTURE_2D, C.TEXTURE_MIN_FILTER, C.NEAREST), C.texParameteri(C.TEXTURE_2D, C.TEXTURE_WRAP_S, C.CLAMP_TO_EDGE), C.texParameteri(C.TEXTURE_2D, C.TEXTURE_WRAP_T, C.CLAMP_TO_EDGE), C.texImage2D(C.TEXTURE_2D, 0, r, E, D, 0, i, o, null), C.framebufferTexture2D(C.FRAMEBUFFER, s, C.TEXTURE_2D, t._hardwareTexture.underlyingResource, 0), this._bindTextureDirectly(C.TEXTURE_2D, null), S._depthStencilTexture = t, S._depthStencilTextureWithStencil = A, t.baseWidth = E, t.baseHeight = D, t.width = E, t.height = D, t.isReady = !0, t.samples = 1, t.generateMipMaps = a, t.samplingMode = 1, t.format = l, t.type = n, t.label = S.label + "-DepthStencil", O[u] = t, this._internalTexturesCache.push(t);
	}
	if (S.setTextures(O), i && C.drawBuffers(k), this._bindUnboundFramebuffer(w), S.setLayerAndFaceIndices(v, _), this.resetTextureCache(), !x) this.updateMultipleRenderTargetTextureSampleCount(S, d, i);
	else if (d > 1) {
		let e = C.createFramebuffer();
		if (!e) throw Error("Unable to create multi sampled framebuffer");
		S._samples = d, S._MSAAFramebuffer = e, u > 0 && i && (this._bindUnboundFramebuffer(e), C.drawBuffers(k), this._bindUnboundFramebuffer(w));
	}
	return S;
}, r.prototype.updateMultipleRenderTargetTextureSampleCount = function(e, t, n = !0) {
	if (this.webGLVersion < 2 || !e) return 1;
	if (e.samples === t) return t;
	let r = this._gl;
	t = Math.min(t, this.getCaps().maxMSAASamples), e._depthStencilBuffer &&= (r.deleteRenderbuffer(e._depthStencilBuffer), null), e._MSAAFramebuffer &&= (r.deleteFramebuffer(e._MSAAFramebuffer), null);
	let i = e._attachments.length;
	for (let t = 0; t < i; t++) e.textures[t]._hardwareTexture?.releaseMSAARenderBuffers();
	if (t > 1 && typeof r.renderbufferStorageMultisample == "function") {
		let a = r.createFramebuffer();
		if (!a) throw Error("Unable to create multi sampled framebuffer");
		e._MSAAFramebuffer = a, this._bindUnboundFramebuffer(a);
		let o = [];
		for (let n = 0; n < i; n++) {
			let i = e.textures[n], a = i._hardwareTexture, s = r[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + n : "COLOR_ATTACHMENT" + n + "_WEBGL"], c = this._createRenderBuffer(i.width, i.height, t, -1, this._getRGBABufferInternalSizedFormat(i.type, i.format, i._useSRGBBuffer), s);
			if (!c) throw Error("Unable to create multi sampled framebuffer");
			a.addMSAARenderBuffer(c), i.samples = t, o.push(s);
		}
		n && r.drawBuffers(o);
	} else this._bindUnboundFramebuffer(e._framebuffer);
	let a = e._depthStencilTexture ? e._depthStencilTexture.format : void 0;
	return e._depthStencilBuffer = this._setupFramebufferDepthAttachments(e._generateStencilBuffer, e._generateDepthBuffer, e.width, e.height, t, a), this._bindUnboundFramebuffer(null), e._samples = t, t;
}, r.prototype.generateMipMapsMultiFramebuffer = function(e) {
	let t = e, n = this._gl;
	if (t.isMulti) for (let e = 0; e < t._attachments.length; e++) {
		let r = t.textures[e];
		r?.generateMipMaps && !r?.isCube && !r?.is3D && (this._bindTextureDirectly(n.TEXTURE_2D, r, !0), n.generateMipmap(n.TEXTURE_2D), this._bindTextureDirectly(n.TEXTURE_2D, null));
	}
}, r.prototype.resolveMultiFramebuffer = function(e) {
	let t = e, n = this._gl;
	if (!t._MSAAFramebuffer || !t.isMulti) return;
	let r = t.resolveMSAAColors ? n.COLOR_BUFFER_BIT : 0;
	r |= t._generateDepthBuffer && t.resolveMSAADepth ? n.DEPTH_BUFFER_BIT : 0, r |= t._generateStencilBuffer && t.resolveMSAAStencil ? n.STENCIL_BUFFER_BIT : 0;
	let i = t._attachments, a = i.length;
	n.bindFramebuffer(n.READ_FRAMEBUFFER, t._MSAAFramebuffer), n.bindFramebuffer(n.DRAW_FRAMEBUFFER, t._framebuffer);
	for (let e = 0; e < a; e++) {
		let o = t.textures[e];
		for (let e = 0; e < a; e++) i[e] = n.NONE;
		i[e] = n[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + e : "COLOR_ATTACHMENT" + e + "_WEBGL"], n.readBuffer(i[e]), n.drawBuffers(i), n.blitFramebuffer(0, 0, o.width, o.height, 0, 0, o.width, o.height, r, n.NEAREST);
	}
	for (let e = 0; e < a; e++) i[e] = n[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + e : "COLOR_ATTACHMENT" + e + "_WEBGL"];
	n.drawBuffers(i), n.bindFramebuffer(this._gl.FRAMEBUFFER, t._MSAAFramebuffer);
};
//#endregion
//#region node_modules/@babylonjs/core/Materials/Textures/multiRenderTarget.js
var we = class extends Se {
	get isSupported() {
		return this._engine?.getCaps().drawBuffersExtension ?? !1;
	}
	get textures() {
		return this._textures;
	}
	get count() {
		return this._count;
	}
	get depthTexture() {
		return this._textures[this._textures.length - 1];
	}
	set wrapU(e) {
		if (this._textures) for (let t = 0; t < this._textures.length; t++) this._textures[t].wrapU = e;
	}
	set wrapV(e) {
		if (this._textures) for (let t = 0; t < this._textures.length; t++) this._textures[t].wrapV = e;
	}
	constructor(e, t, n, r, i, a) {
		let o = i && i.generateMipMaps ? i.generateMipMaps : !1, s = i && i.generateDepthTexture ? i.generateDepthTexture : !1, c = i && i.depthTextureFormat ? i.depthTextureFormat : 15, l = !i || i.doNotChangeAspectRatio === void 0 ? !0 : i.doNotChangeAspectRatio, u = i && i.drawOnlyOnFirstAttachmentByDefault ? i.drawOnlyOnFirstAttachmentByDefault : !1;
		if (super(e, t, r, o, l, void 0, void 0, void 0, void 0, void 0, void 0, void 0, !0), !this.isSupported) {
			this.dispose();
			return;
		}
		this._textureNames = a;
		let d = [], f = [], p = [], m = [], h = [], g = [], _ = [], v = [];
		this._initTypes(n, d, f, p, m, h, g, _, v, i), this._multiRenderTargetOptions = {
			samplingModes: f,
			generateMipMaps: o,
			generateDepthBuffer: !i || i.generateDepthBuffer === void 0 ? !0 : i.generateDepthBuffer,
			generateStencilBuffer: !i || i.generateStencilBuffer === void 0 ? !1 : i.generateStencilBuffer,
			generateDepthTexture: s,
			depthTextureFormat: c,
			types: d,
			textureCount: n,
			useSRGBBuffers: p,
			samples: i && i.samples ? i.samples : 1,
			formats: m,
			targetTypes: h,
			faceIndex: g,
			layerIndex: _,
			layerCounts: v,
			labels: a,
			label: e
		}, this._count = n, this._drawOnlyOnFirstAttachmentByDefault = u, n > 0 && (this._createInternalTextures(), this._createTextures(a));
	}
	_initTypes(e, t, n, r, i, a, o, s, c, l) {
		for (let u = 0; u < e; u++) l && l.types && l.types[u] !== void 0 ? t.push(l.types[u]) : t.push(l && l.defaultType ? l.defaultType : 0), l && l.samplingModes && l.samplingModes[u] !== void 0 ? n.push(l.samplingModes[u]) : n.push(_.BILINEAR_SAMPLINGMODE), l && l.useSRGBBuffers && l.useSRGBBuffers[u] !== void 0 ? r.push(l.useSRGBBuffers[u]) : r.push(!1), l && l.formats && l.formats[u] !== void 0 ? i.push(l.formats[u]) : i.push(5), l && l.targetTypes && l.targetTypes[u] !== void 0 ? a.push(l.targetTypes[u]) : a.push(3553), l && l.faceIndex && l.faceIndex[u] !== void 0 ? o.push(l.faceIndex[u]) : o.push(0), l && l.layerIndex && l.layerIndex[u] !== void 0 ? s.push(l.layerIndex[u]) : s.push(0), l && l.layerCounts && l.layerCounts[u] !== void 0 ? c.push(l.layerCounts[u]) : c.push(1);
	}
	_createInternaTextureIndexMapping() {
		let e = {}, t = [];
		if (!this._renderTarget) return t;
		let n = this._renderTarget.textures;
		for (let r = 0; r < n.length; r++) {
			let i = n[r];
			if (!i) continue;
			let a = e[i.uniqueId];
			a === void 0 ? e[i.uniqueId] = r : t[r] = a;
		}
		return t;
	}
	_rebuild(e = !1, t = !1, n) {
		if (this._count < 1 || e) return;
		let r = this._createInternaTextureIndexMapping();
		this.releaseInternalTextures(), this._createInternalTextures(), t && (this._releaseTextures(), this._createTextures(n));
		let i = this._renderTarget.textures;
		for (let e = 0; e < i.length; e++) {
			let t = this._textures[e];
			r[e] !== void 0 && this._renderTarget.setTexture(i[r[e]], e), t._texture = i[e], t._texture && (t._noMipmap = !t._texture.useMipMaps, t._useSRGBBuffer = t._texture._useSRGBBuffer);
		}
		this.samples !== 1 && this._renderTarget.setSamples(this.samples, !this._drawOnlyOnFirstAttachmentByDefault, !0);
	}
	_createInternalTextures() {
		this._renderTarget = this._getEngine().createMultipleRenderTarget(this._size, this._multiRenderTargetOptions, !this._drawOnlyOnFirstAttachmentByDefault), this._texture = this._renderTarget.texture;
	}
	_releaseTextures() {
		if (this._textures) for (let e = 0; e < this._textures.length; e++) this._textures[e]._texture = null, this._textures[e].dispose();
	}
	_createTextures(e) {
		let t = this._renderTarget.textures;
		this._textures = [];
		for (let n = 0; n < t.length; n++) {
			let r = new _(null, this.getScene());
			e?.[n] && (r.name = e[n]), r._texture = t[n], r._texture && (r._noMipmap = !r._texture.useMipMaps, r._useSRGBBuffer = r._texture._useSRGBBuffer), this._textures.push(r);
		}
	}
	setInternalTexture(e, t, n = !0) {
		if (this.renderTarget && (t === 0 && (this._texture = e), this.renderTarget.setTexture(e, t, n), this.textures[t] || (this.textures[t] = new _(null, this.getScene()), this.textures[t].name = this._textureNames?.[t] ?? this.textures[t].name), this.textures[t]._texture = e, this.textures[t]._noMipmap = !e.useMipMaps, this.textures[t]._useSRGBBuffer = e._useSRGBBuffer, this._count = this.renderTarget.textures ? this.renderTarget.textures.length : 0, this._multiRenderTargetOptions.types && (this._multiRenderTargetOptions.types[t] = e.type), this._multiRenderTargetOptions.samplingModes && (this._multiRenderTargetOptions.samplingModes[t] = e.samplingMode), this._multiRenderTargetOptions.useSRGBBuffers && (this._multiRenderTargetOptions.useSRGBBuffers[t] = e._useSRGBBuffer), this._multiRenderTargetOptions.targetTypes && this._multiRenderTargetOptions.targetTypes[t] !== -1)) {
			let n;
			n = e.is2DArray ? 35866 : e.isCube ? 34067 : e.is3D ? 32879 : 3553, this._multiRenderTargetOptions.targetTypes[t] = n;
		}
	}
	setLayerAndFaceIndex(e, t = -1, n = -1) {
		!this.textures[e] || !this.renderTarget || (this._multiRenderTargetOptions.layerIndex && (this._multiRenderTargetOptions.layerIndex[e] = t), this._multiRenderTargetOptions.faceIndex && (this._multiRenderTargetOptions.faceIndex[e] = n), this.renderTarget.setLayerAndFaceIndex(e, t, n));
	}
	setLayerAndFaceIndices(e, t) {
		this.renderTarget && (this._multiRenderTargetOptions.layerIndex = e, this._multiRenderTargetOptions.faceIndex = t, this.renderTarget.setLayerAndFaceIndices(e, t));
	}
	get samples() {
		return this._samples;
	}
	set samples(e) {
		this._renderTarget ? this._samples = this._renderTarget.setSamples(e) : this._samples = e;
	}
	resize(e) {
		this._processSizeParameter(e), this._rebuild(!1, void 0, this._textureNames);
	}
	updateCount(e, t, n) {
		this._multiRenderTargetOptions.textureCount = e, this._count = e;
		let r = [], i = [], a = [], o = [], s = [], c = [], l = [], u = [];
		this._textureNames = n, this._initTypes(e, r, i, a, o, s, c, l, u, t), this._multiRenderTargetOptions.types = r, this._multiRenderTargetOptions.samplingModes = i, this._multiRenderTargetOptions.useSRGBBuffers = a, this._multiRenderTargetOptions.formats = o, this._multiRenderTargetOptions.targetTypes = s, this._multiRenderTargetOptions.faceIndex = c, this._multiRenderTargetOptions.layerIndex = l, this._multiRenderTargetOptions.layerCounts = u, this._multiRenderTargetOptions.labels = n, this._rebuild(!1, !0, n);
	}
	_unbindFrameBuffer(e, t) {
		this._renderTarget && e.unBindMultiColorAttachmentFramebuffer(this._renderTarget, this.isCube, () => {
			this.onAfterRenderObservable.notifyObservers(t);
		});
	}
	dispose(e = !1) {
		this._releaseTextures(), e ? this._texture = null : this.releaseInternalTextures(), super.dispose();
	}
	releaseInternalTextures() {
		let e = this._renderTarget?.textures;
		if (e) {
			for (let t = e.length - 1; t >= 0; t--) this._textures[t]._texture = null;
			this._renderTarget?.dispose(), this._renderTarget = null;
		}
	}
}, G = [
	"diffuseSampler",
	"bumpSampler",
	"reflectivitySampler",
	"albedoSampler",
	"morphTargets",
	"boneSampler",
	"transmissionWeightSampler",
	"subsurfaceWeightSampler",
	"iblShadowSampler"
], K = /* @__PURE__ */ "world.mBones.viewProjection.diffuseMatrix.view.previousWorld.previousViewProjection.mPreviousBones.bumpMatrix.reflectivityMatrix.albedoMatrix.reflectivityColor.albedoColor.reflectionMatrix.vTransmissionWeight.vSubsurfaceWeight.vEyePosition.vTransmissionScatterAnisotropy.vSubsurfaceScatterAnisotropy.shadowTextureSize.metallic.glossiness.vTangentSpaceParams.vBumpInfos.morphTargetInfluences.morphTargetCount.morphTargetTextureInfo.morphTargetTextureIndices.boneTextureInfo".split(".");
P(K, G, !0), j(K);
var q = class e {
	get normalsAreUnsigned() {
		return this._normalsAreUnsigned;
	}
	_linkPrePassRenderer(e) {
		this._linkedWithPrePass = !0, this._prePassRenderer = e, this._multiRenderTarget && (this._multiRenderTarget.onClearObservable.clear(), this._multiRenderTarget.onClearObservable.add(() => {}));
	}
	_unlinkPrePassRenderer() {
		this._linkedWithPrePass = !1, this._createRenderTargets();
	}
	_resetLayout() {
		this._enableDepth = !0, this._enableNormal = !0, this._enablePosition = !1, this._enableReflectivity = !1, this._enableVelocity = !1, this._enableVelocityLinear = !1, this._enableScreenspaceDepth = !1, this._enableIrradiance = !1, this._attachmentsFromPrePass = [];
	}
	_forceTextureType(t, n) {
		t === e.POSITION_TEXTURE_TYPE ? (this._positionIndex = n, this._enablePosition = !0) : t === e.VELOCITY_TEXTURE_TYPE ? (this._velocityIndex = n, this._enableVelocity = !0) : t === e.VELOCITY_LINEAR_TEXTURE_TYPE ? (this._velocityLinearIndex = n, this._enableVelocityLinear = !0) : t === e.REFLECTIVITY_TEXTURE_TYPE ? (this._reflectivityIndex = n, this._enableReflectivity = !0) : t === e.DEPTH_TEXTURE_TYPE ? (this._depthIndex = n, this._enableDepth = !0) : t === e.NORMAL_TEXTURE_TYPE ? (this._normalIndex = n, this._enableNormal = !0) : t === e.SCREENSPACE_DEPTH_TEXTURE_TYPE ? (this._screenspaceDepthIndex = n, this._enableScreenspaceDepth = !0) : t === e.IRRADIANCE_TEXTURE_TYPE && (this._irradianceIndex = n, this._enableIrradiance = !0);
	}
	_setAttachments(e) {
		this._attachmentsFromPrePass = e;
	}
	_linkInternalTexture(e) {
		this._multiRenderTarget.setInternalTexture(e, 0, !1);
	}
	get renderList() {
		return this._multiRenderTarget.renderList;
	}
	set renderList(e) {
		this._multiRenderTarget.renderList = e;
	}
	get isSupported() {
		return this._multiRenderTarget.isSupported;
	}
	getTextureIndex(t) {
		switch (t) {
			case e.POSITION_TEXTURE_TYPE: return this._positionIndex;
			case e.VELOCITY_TEXTURE_TYPE: return this._velocityIndex;
			case e.VELOCITY_LINEAR_TEXTURE_TYPE: return this._velocityLinearIndex;
			case e.REFLECTIVITY_TEXTURE_TYPE: return this._reflectivityIndex;
			case e.DEPTH_TEXTURE_TYPE: return this._depthIndex;
			case e.NORMAL_TEXTURE_TYPE: return this._normalIndex;
			case e.SCREENSPACE_DEPTH_TEXTURE_TYPE: return this._screenspaceDepthIndex;
			case e.IRRADIANCE_TEXTURE_TYPE: return this._irradianceIndex;
			default: return -1;
		}
	}
	get enableDepth() {
		return this._enableDepth;
	}
	set enableDepth(e) {
		this._enableDepth = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get enableNormal() {
		return this._enableNormal;
	}
	set enableNormal(e) {
		this._enableNormal = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get enablePosition() {
		return this._enablePosition;
	}
	set enablePosition(e) {
		this._enablePosition = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get enableVelocity() {
		return this._enableVelocity;
	}
	set enableVelocity(e) {
		this._enableVelocity = e, e || (this._previousTransformationMatrices = {}), this._linkedWithPrePass || (this.dispose(), this._createRenderTargets()), this._scene.needsPreviousWorldMatrices = e;
	}
	get enableVelocityLinear() {
		return this._enableVelocityLinear;
	}
	set enableVelocityLinear(e) {
		this._enableVelocityLinear = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get enableReflectivity() {
		return this._enableReflectivity;
	}
	set enableReflectivity(e) {
		this._enableReflectivity = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get enableScreenspaceDepth() {
		return this._enableScreenspaceDepth;
	}
	set enableScreenspaceDepth(e) {
		this._enableScreenspaceDepth = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get enableIrradiance() {
		return this._enableIrradiance;
	}
	set enableIrradiance(e) {
		this._enableIrradiance = e, this._linkedWithPrePass || (this.dispose(), this._createRenderTargets());
	}
	get scene() {
		return this._scene;
	}
	get ratio() {
		return typeof this._ratioOrDimensions == "object" ? 1 : this._ratioOrDimensions;
	}
	get shaderLanguage() {
		return this._shaderLanguage;
	}
	constructor(t, n = 1, r = 15, i) {
		this._previousTransformationMatrices = {}, this._previousBonesTransformationMatrices = {}, this.excludedSkinnedMeshesFromVelocity = [], this.renderTransparentMeshes = !0, this.generateNormalsInWorldSpace = !1, this._normalsAreUnsigned = !1, this._resizeObserver = null, this._enableDepth = !0, this._enableNormal = !0, this._enablePosition = !1, this._enableVelocity = !1, this._enableVelocityLinear = !1, this._enableReflectivity = !1, this._enableScreenspaceDepth = !1, this._enableIrradiance = !1, this._clearColor = new l(0, 0, 0, 0), this._clearDepthColor = new l(0, 0, 0, 1), this._positionIndex = -1, this._velocityIndex = -1, this._velocityLinearIndex = -1, this._reflectivityIndex = -1, this._depthIndex = -1, this._normalIndex = -1, this._screenspaceDepthIndex = -1, this._irradianceIndex = -1, this._linkedWithPrePass = !1, this.generateIrradianceWithScatterMask = !1, this.useSpecificClearForDepthTexture = !1, this._shaderLanguage = 0, this._shadersLoaded = !1, this._scene = t, this._ratioOrDimensions = n, this._useUbo = t.getEngine().supportsUniformBuffers, this._depthFormat = r, this._textureTypesAndFormats = i || {}, this._initShaderSourceAsync(), e._SceneComponentInitialization(this._scene), this._createRenderTargets();
	}
	async _initShaderSourceAsync() {
		this._scene.getEngine().isWebGPU && !e.ForceGLSL ? (this._shaderLanguage = 1, await Promise.all([import("./geometry.vertex-DA5Ti8i8.js"), import("./geometry.fragment-CVJt2rVl.js")])) : await Promise.all([import("./geometry.vertex-CdmNvjUf.js").then((e) => e.t), import("./geometry.fragment-DSmT0E3r.js").then((e) => e.t)]), this._shadersLoaded = !0;
	}
	isReady(e, t) {
		if (!this._shadersLoaded) return !1;
		let n = e.getMaterial();
		if (n && n.disableDepthWrite) return !1;
		let r = [], i = [b.PositionKind], a = e.getMesh();
		a.isVerticesDataPresent(b.NormalKind) && (r.push("#define HAS_NORMAL_ATTRIBUTE"), i.push(b.NormalKind));
		let o = !1, s = !1;
		if (n) {
			let e = !1;
			if (n.needAlphaTestingForMesh(a) && n.getAlphaTestTexture() && (r.push("#define ALPHATEST"), r.push(`#define ALPHATEST_UV${n.getAlphaTestTexture().coordinatesIndex + 1}`), e = !0), (n.bumpTexture || n.normalTexture || n.geometryNormalTexture) && D.BumpTextureEnabled) {
				let t = n.bumpTexture || n.normalTexture || n.geometryNormalTexture;
				r.push("#define BUMP"), r.push(`#define BUMP_UV${t.coordinatesIndex + 1}`), e = !0;
			}
			if (this._enableReflectivity) {
				let t = !1;
				if (n.getClassName() === "PBRMetallicRoughnessMaterial") n.metallicRoughnessTexture && (r.push("#define ORMTEXTURE"), r.push(`#define REFLECTIVITY_UV${n.metallicRoughnessTexture.coordinatesIndex + 1}`), r.push("#define METALLICWORKFLOW"), e = !0, t = !0), n.metallic != null && (r.push("#define METALLIC"), r.push("#define METALLICWORKFLOW"), t = !0), n.roughness != null && (r.push("#define ROUGHNESS"), r.push("#define METALLICWORKFLOW"), t = !0), t && (n.baseTexture && (r.push("#define ALBEDOTEXTURE"), r.push(`#define ALBEDO_UV${n.baseTexture.coordinatesIndex + 1}`), n.baseTexture.gammaSpace && r.push("#define GAMMAALBEDO"), e = !0), n.baseColor && r.push("#define ALBEDOCOLOR"));
				else if (n.getClassName() === "PBRSpecularGlossinessMaterial") n.specularGlossinessTexture ? (r.push("#define SPECULARGLOSSINESSTEXTURE"), r.push(`#define REFLECTIVITY_UV${n.specularGlossinessTexture.coordinatesIndex + 1}`), e = !0, n.specularGlossinessTexture.gammaSpace && r.push("#define GAMMAREFLECTIVITYTEXTURE")) : n.specularColor && r.push("#define REFLECTIVITYCOLOR"), n.glossiness != null && r.push("#define GLOSSINESS");
				else if (n.getClassName() === "PBRMaterial") n.metallicTexture && (r.push("#define ORMTEXTURE"), r.push(`#define REFLECTIVITY_UV${n.metallicTexture.coordinatesIndex + 1}`), r.push("#define METALLICWORKFLOW"), e = !0, t = !0), n.metallic != null && (r.push("#define METALLIC"), r.push("#define METALLICWORKFLOW"), t = !0), n.roughness != null && (r.push("#define ROUGHNESS"), r.push("#define METALLICWORKFLOW"), t = !0), t ? (n.albedoTexture && (r.push("#define ALBEDOTEXTURE"), r.push(`#define ALBEDO_UV${n.albedoTexture.coordinatesIndex + 1}`), n.albedoTexture.gammaSpace && r.push("#define GAMMAALBEDO"), e = !0), n.albedoColor && r.push("#define ALBEDOCOLOR")) : (n.reflectivityTexture ? (r.push("#define SPECULARGLOSSINESSTEXTURE"), r.push(`#define REFLECTIVITY_UV${n.reflectivityTexture.coordinatesIndex + 1}`), n.reflectivityTexture.gammaSpace && r.push("#define GAMMAREFLECTIVITYTEXTURE"), e = !0) : n.reflectivityColor && r.push("#define REFLECTIVITYCOLOR"), n.microSurface != null && r.push("#define GLOSSINESS"));
				else if (n.getClassName() === "StandardMaterial") n.specularTexture && (r.push("#define REFLECTIVITYTEXTURE"), r.push(`#define REFLECTIVITY_UV${n.specularTexture.coordinatesIndex + 1}`), n.specularTexture.gammaSpace && r.push("#define GAMMAREFLECTIVITYTEXTURE"), e = !0), n.specularColor && r.push("#define REFLECTIVITYCOLOR");
				else if (n.getClassName() === "OpenPBRMaterial") {
					let t = n;
					r.push("#define METALLIC"), r.push("#define ROUGHNESS"), t._useRoughnessFromMetallicTextureGreen && t.baseMetalnessTexture ? (r.push("#define ORMTEXTURE"), r.push(`#define REFLECTIVITY_UV${t.baseMetalnessTexture.coordinatesIndex + 1}`), e = !0) : t.baseMetalnessTexture ? (r.push("#define METALLIC_TEXTURE"), r.push(`#define METALLIC_UV${t.baseMetalnessTexture.coordinatesIndex + 1}`), e = !0) : t.specularRoughnessTexture && (r.push("#define ROUGHNESS_TEXTURE"), r.push(`#define ROUGHNESS_UV${t.specularRoughnessTexture.coordinatesIndex + 1}`), e = !0), t.baseColorTexture && (r.push("#define ALBEDOTEXTURE"), r.push(`#define ALBEDO_UV${t.baseColorTexture.coordinatesIndex + 1}`), t.baseColorTexture.gammaSpace && r.push("#define GAMMAALBEDO"), e = !0), t.baseColor && r.push("#define ALBEDOCOLOR");
				}
			}
			if (this._enableIrradiance && this.generateIrradianceWithScatterMask && (r.push("#define IRRADIANCE_SCATTER_MASK"), n.getClassName() === "OpenPBRMaterial")) {
				let t = n;
				t.subsurfaceWeight > 0 && t.subsurfaceWeightTexture && (r.push("#define SUBSURFACE_WEIGHT"), r.push(`#define SUBSURFACEWEIGHT_UV${t.subsurfaceWeightTexture.coordinatesIndex + 1}`), e = !0), t.transmissionWeight > 0 && t.transmissionWeightTexture && (r.push("#define TRANSMISSION_WEIGHT"), r.push(`#define TRANSMISSIONWEIGHT_UV${t.transmissionWeightTexture.coordinatesIndex + 1}`), e = !0);
			}
			e && (r.push("#define NEED_UV"), a.isVerticesDataPresent(b.UVKind) && (i.push(b.UVKind), r.push("#define UV1"), o = !0), a.isVerticesDataPresent(b.UV2Kind) && (i.push(b.UV2Kind), r.push("#define UV2"), s = !0));
		}
		if (this._enableDepth && (r.push("#define DEPTH"), r.push("#define DEPTH_INDEX " + this._depthIndex)), this._enableNormal && (r.push("#define NORMAL"), r.push("#define NORMAL_INDEX " + this._normalIndex)), this._enablePosition && (r.push("#define POSITION"), r.push("#define POSITION_INDEX " + this._positionIndex)), this._enableVelocity && (r.push("#define VELOCITY"), r.push("#define VELOCITY_INDEX " + this._velocityIndex), this.excludedSkinnedMeshesFromVelocity.indexOf(a) === -1 && r.push("#define BONES_VELOCITY_ENABLED")), this._enableVelocityLinear && (r.push("#define VELOCITY_LINEAR"), r.push("#define VELOCITY_LINEAR_INDEX " + this._velocityLinearIndex), this.excludedSkinnedMeshesFromVelocity.indexOf(a) === -1 && r.push("#define BONES_VELOCITY_ENABLED")), this._enableReflectivity && (r.push("#define REFLECTIVITY"), r.push("#define REFLECTIVITY_INDEX " + this._reflectivityIndex)), this._enableScreenspaceDepth && this._screenspaceDepthIndex !== -1 && (r.push("#define SCREENSPACE_DEPTH_INDEX " + this._screenspaceDepthIndex), r.push("#define SCREENSPACE_DEPTH")), this._enableIrradiance && this._irradianceIndex !== -1) {
			r.push("#define IRRADIANCE_INDEX " + this._irradianceIndex), r.push("#define IRRADIANCE");
			let e = this._scene;
			if (e.environmentTexture) {
				let t = {}, i = !1, a = 0;
				(n.getClassName() === "OpenPBRMaterial" || n.getClassName() === "StandardMaterial" || n.getClassName() === "PBRMetallicRoughnessMaterial" || n.getClassName() === "PBRSpecularGlossinessMaterial" || n.getClassName() === "PBRMaterial") && (i = !!n.realtimeFiltering, a = n.realtimeFilteringQuality || 0), M(e, e.environmentTexture, t, i, a, !0);
				for (let e in t) t[e] && r.push("#define " + e);
				t.USEIRRADIANCEMAP || r.push("#define SPHERICAL_HARMONICS");
				let o = e.postProcessRenderPipelineManager.supportedPipelines.find((e) => e.getClassName() === "IBLShadowsRenderPipeline");
				if (o) {
					let e = o;
					e._getAccumulatedTexture() && (r.push("#define IBL_SHADOW_TEXTURE"), e.coloredShadows && r.push("#define COLORED_IBL_SHADOWS"));
				}
			}
		}
		this.generateNormalsInWorldSpace && r.push("#define NORMAL_WORLDSPACE"), this._normalsAreUnsigned && r.push("#define ENCODE_NORMAL"), a.useBones && a.computeBonesUsingShaders && a.skeleton ? (i.push(b.MatricesIndicesKind), i.push(b.MatricesWeightsKind), a.numBoneInfluencers > 4 && (i.push(b.MatricesIndicesExtraKind), i.push(b.MatricesWeightsExtraKind)), r.push("#define NUM_BONE_INFLUENCERS " + a.numBoneInfluencers), r.push("#define BONETEXTURE " + a.skeleton.isUsingTextureForMatrices), r.push("#define BonesPerMesh " + (a.skeleton.bones.length + 1))) : (r.push("#define NUM_BONE_INFLUENCERS 0"), r.push("#define BONETEXTURE false"), r.push("#define BonesPerMesh 0"));
		let c = a.morphTargetManager ? R(a.morphTargetManager, r, i, a, !0, !0, !1, o, s, !1) : 0;
		t && (r.push("#define INSTANCES"), oe(i, this._enableVelocity || this._enableVelocityLinear), e.getRenderingMesh().hasThinInstances && r.push("#define THIN_INSTANCES")), this._linkedWithPrePass ? r.push("#define SCENE_MRT_COUNT " + this._attachmentsFromPrePass.length) : r.push("#define SCENE_MRT_COUNT " + this._multiRenderTarget.textures.length), A(n, this._scene, r);
		let l = this._scene.getEngine(), u = e._getDrawWrapper(void 0, !0), d = u.defines, f = r.join("\n");
		return d !== f && u.setEffect(l.createEffect("geometry", {
			attributes: i,
			uniformsNames: K,
			samplers: G,
			defines: f,
			onCompiled: null,
			fallbacks: null,
			onError: null,
			uniformBuffersNames: ["Scene"],
			indexParameters: {
				buffersCount: this._multiRenderTarget.textures.length - 1,
				maxSimultaneousMorphTargets: c
			},
			shaderLanguage: this.shaderLanguage
		}, l), f), u.effect.isReady();
	}
	getGBuffer() {
		return this._multiRenderTarget;
	}
	get samples() {
		return this._multiRenderTarget.samples;
	}
	set samples(e) {
		this._multiRenderTarget.samples = e;
	}
	dispose() {
		this._resizeObserver &&= (this._scene.getEngine().onResizeObservable.remove(this._resizeObserver), null), this._multiRenderTarget?.renderTarget && this.scene.getEngine()._currentRenderTarget === this._multiRenderTarget.renderTarget && this.scene.getEngine().unBindFramebuffer(this._multiRenderTarget?.renderTarget), this.getGBuffer().dispose();
	}
	_assignRenderTargetIndices() {
		let t = [], n = [], r = 0;
		return this._enableDepth && (this._depthIndex = r, r++, t.push("gBuffer_Depth"), n.push(this._textureTypesAndFormats[e.DEPTH_TEXTURE_TYPE])), this._enableNormal && (this._normalIndex = r, r++, t.push("gBuffer_Normal"), n.push(this._textureTypesAndFormats[e.NORMAL_TEXTURE_TYPE])), this._enablePosition && (this._positionIndex = r, r++, t.push("gBuffer_Position"), n.push(this._textureTypesAndFormats[e.POSITION_TEXTURE_TYPE])), this._enableVelocity && (this._velocityIndex = r, r++, t.push("gBuffer_Velocity"), n.push(this._textureTypesAndFormats[e.VELOCITY_TEXTURE_TYPE])), this._enableVelocityLinear && (this._velocityLinearIndex = r, r++, t.push("gBuffer_VelocityLinear"), n.push(this._textureTypesAndFormats[e.VELOCITY_LINEAR_TEXTURE_TYPE])), this._enableReflectivity && (this._reflectivityIndex = r, r++, t.push("gBuffer_Reflectivity"), n.push(this._textureTypesAndFormats[e.REFLECTIVITY_TEXTURE_TYPE])), this._enableScreenspaceDepth && (this._screenspaceDepthIndex = r, r++, t.push("gBuffer_ScreenspaceDepth"), n.push(this._textureTypesAndFormats[e.SCREENSPACE_DEPTH_TEXTURE_TYPE])), this._enableIrradiance && (this._irradianceIndex = r, r++, t.push("gBuffer_Irradiance"), n.push(this._textureTypesAndFormats[e.IRRADIANCE_TEXTURE_TYPE])), [
			r,
			t,
			n
		];
	}
	_createRenderTargets() {
		let t = this._scene.getEngine(), [n, r, i] = this._assignRenderTargetIndices(), a = 0;
		t._caps.textureFloat && t._caps.textureFloatLinearFiltering ? a = 1 : t._caps.textureHalfFloat && t._caps.textureHalfFloatLinearFiltering && (a = 2);
		let o = this._ratioOrDimensions.width === void 0 ? {
			width: t.getRenderWidth() * this._ratioOrDimensions,
			height: t.getRenderHeight() * this._ratioOrDimensions
		} : this._ratioOrDimensions, s = [], l = [], u = [];
		for (let e of i) e ? (s.push(e.textureType), l.push(e.textureFormat), u.push(e.samplingMode ?? 2)) : (s.push(a), l.push(5), u.push(2));
		if (this._normalsAreUnsigned = s[e.NORMAL_TEXTURE_TYPE] === 11 || s[e.NORMAL_TEXTURE_TYPE] === 13, this._multiRenderTarget = new we("gBuffer", o, n, this._scene, {
			generateMipMaps: !1,
			generateDepthTexture: !0,
			types: s,
			formats: l,
			samplingModes: u,
			depthTextureFormat: this._depthFormat
		}, r.concat("gBuffer_DepthBuffer")), !this.isSupported) return;
		this._multiRenderTarget.wrapU = _.CLAMP_ADDRESSMODE, this._multiRenderTarget.wrapV = _.CLAMP_ADDRESSMODE, this._multiRenderTarget.refreshRate = 1, this._multiRenderTarget.renderParticles = !1, this._multiRenderTarget.renderList = null;
		let d = [!0], f = [!1], p = [!0];
		for (let e = 1; e < n; ++e) d.push(!0), p.push(!1), f.push(!0);
		let m = t.buildTextureLayout(d), h = t.buildTextureLayout(f), g = t.buildTextureLayout(p);
		this._multiRenderTarget.onClearObservable.add((e) => {
			e.bindAttachments(this.useSpecificClearForDepthTexture ? h : m), e.clear(this._clearColor, !0, !0, !0), this.useSpecificClearForDepthTexture && (e.bindAttachments(g), e.clear(this._clearDepthColor, !0, !0, !0)), e.bindAttachments(m);
		}), this._resizeObserver = t.onResizeObservable.add(() => {
			if (this._multiRenderTarget) {
				let e = this._ratioOrDimensions.width === void 0 ? {
					width: t.getRenderWidth() * this._ratioOrDimensions,
					height: t.getRenderHeight() * this._ratioOrDimensions
				} : this._ratioOrDimensions;
				this._multiRenderTarget.resize(e);
			}
		});
		let v = (e) => {
			let t = e.getRenderingMesh(), n = e.getEffectiveMesh(), r = this._scene, i = r.getEngine(), a = e.getMaterial();
			if (!a) return;
			if (n._internalAbstractMeshDataInfo._isActiveIntermediate = !1, (this._enableVelocity || this._enableVelocityLinear) && !this._previousTransformationMatrices[n.uniqueId] && (this._previousTransformationMatrices[n.uniqueId] = {
				world: c.Identity(),
				viewProjection: r.getTransformMatrix()
			}, t.skeleton)) {
				let e = t.skeleton.getTransformMatrices(t);
				this._previousBonesTransformationMatrices[t.uniqueId] = this._copyBonesTransformationMatrices(e, new Float32Array(e.length));
			}
			let o = t._getInstancesRenderList(e._id, !!e.getReplacementMesh());
			if (o.mustReturn) return;
			let s = i.getCaps().instancedArrays && (o.visibleInstances[e._id] !== null || t.hasThinInstances), l = n.getWorldMatrix();
			if (this.isReady(e, s)) {
				let c = e._getDrawWrapper();
				if (!c) return;
				let u = c.effect;
				i.enableEffect(c), s || t._bind(e, u, a.fillMode), this._useUbo ? (ae(u, this._scene.getSceneUniformBuffer()), this._scene.finalizeSceneUbo()) : (u.setMatrix("viewProjection", r.getTransformMatrix()), u.setMatrix("view", r.getViewMatrix()), this._scene.bindEyePosition(u, "vEyePosition"));
				let d;
				if (!t._instanceDataStorage.isFrozen && (a.backFaceCulling || a.sideOrientation !== null)) {
					let e = n._getWorldMatrixDeterminant();
					d = a._getEffectiveOrientation(t), e < 0 && (d = d === I.ClockWiseSideOrientation ? I.CounterClockWiseSideOrientation : I.ClockWiseSideOrientation);
				} else d = t._effectiveSideOrientation;
				if (a._preBind(c, d), a.needAlphaTestingForMesh(n)) {
					let e = a.getAlphaTestTexture();
					e && (u.setTexture("diffuseSampler", e), u.setMatrix("diffuseMatrix", e.getTextureMatrix()));
				}
				if ((a.bumpTexture || a.normalTexture || a.geometryNormalTexture) && r.getEngine().getCaps().standardDerivatives && D.BumpTextureEnabled) {
					let e = a.bumpTexture || a.normalTexture || a.geometryNormalTexture;
					u.setFloat3("vBumpInfos", e.coordinatesIndex, 1 / e.level, a.parallaxScaleBias), u.setMatrix("bumpMatrix", e.getTextureMatrix()), u.setTexture("bumpSampler", e), u.setFloat2("vTangentSpaceParams", a.invertNormalMapX ? -1 : 1, a.invertNormalMapY ? -1 : 1);
				}
				if (this._enableReflectivity) {
					if (a.getClassName() === "PBRMetallicRoughnessMaterial") a.metallicRoughnessTexture !== null && (u.setTexture("reflectivitySampler", a.metallicRoughnessTexture), u.setMatrix("reflectivityMatrix", a.metallicRoughnessTexture.getTextureMatrix())), a.metallic !== null && u.setFloat("metallic", a.metallic), a.roughness !== null && u.setFloat("glossiness", 1 - a.roughness), a.baseTexture !== null && (u.setTexture("albedoSampler", a.baseTexture), u.setMatrix("albedoMatrix", a.baseTexture.getTextureMatrix())), a.baseColor !== null && u.setColor3("albedoColor", a.baseColor);
					else if (a.getClassName() === "PBRSpecularGlossinessMaterial") a.specularGlossinessTexture === null ? a.specularColor !== null && u.setColor3("reflectivityColor", a.specularColor) : (u.setTexture("reflectivitySampler", a.specularGlossinessTexture), u.setMatrix("reflectivityMatrix", a.specularGlossinessTexture.getTextureMatrix())), a.glossiness !== null && u.setFloat("glossiness", a.glossiness);
					else if (a.getClassName() === "PBRMaterial") a.metallicTexture !== null && (u.setTexture("reflectivitySampler", a.metallicTexture), u.setMatrix("reflectivityMatrix", a.metallicTexture.getTextureMatrix())), a.metallic !== null && u.setFloat("metallic", a.metallic), a.roughness !== null && u.setFloat("glossiness", 1 - a.roughness), a.roughness !== null || a.metallic !== null || a.metallicTexture !== null ? (a.albedoTexture !== null && (u.setTexture("albedoSampler", a.albedoTexture), u.setMatrix("albedoMatrix", a.albedoTexture.getTextureMatrix())), a.albedoColor !== null && u.setColor3("albedoColor", a.albedoColor)) : (a.reflectivityTexture === null ? a.reflectivityColor !== null && u.setColor3("reflectivityColor", a.reflectivityColor) : (u.setTexture("reflectivitySampler", a.reflectivityTexture), u.setMatrix("reflectivityMatrix", a.reflectivityTexture.getTextureMatrix())), a.microSurface !== null && u.setFloat("glossiness", a.microSurface));
					else if (a.getClassName() === "StandardMaterial") a.specularTexture !== null && (u.setTexture("reflectivitySampler", a.specularTexture), u.setMatrix("reflectivityMatrix", a.specularTexture.getTextureMatrix())), a.specularColor !== null && u.setColor3("reflectivityColor", a.specularColor);
					else if (a.getClassName() === "OpenPBRMaterial") {
						let e = a;
						e._useRoughnessFromMetallicTextureGreen && e.baseMetalnessTexture ? (u.setTexture("reflectivitySampler", e.baseMetalnessTexture), u.setMatrix("reflectivityMatrix", e.baseMetalnessTexture.getTextureMatrix())) : e.baseMetalnessTexture ? (u.setTexture("metallicSampler", e.baseMetalnessTexture), u.setMatrix("metallicMatrix", e.baseMetalnessTexture.getTextureMatrix())) : e.specularRoughnessTexture && (u.setTexture("roughnessSampler", e.specularRoughnessTexture), u.setMatrix("roughnessMatrix", e.specularRoughnessTexture.getTextureMatrix())), u.setFloat("metallic", e.baseMetalness), u.setFloat("glossiness", 1 - e.specularRoughness), e.baseColorTexture !== null && (u.setTexture("albedoSampler", e.baseColorTexture), u.setMatrix("albedoMatrix", e.baseColorTexture.getTextureMatrix())), e.baseColor !== null && u.setColor3("albedoColor", e.baseColor);
					}
				}
				if (this._enableIrradiance && r.environmentTexture) {
					let e = r.environmentTexture, t = r.postProcessRenderPipelineManager.supportedPipelines.find((e) => e.getClassName() === "IBLShadowsRenderPipeline");
					if (t) {
						let e = t._getAccumulatedTexture();
						e && (u.setTexture("iblShadowSampler", e), u.setFloat2("shadowTextureSize", e.getSize().width, e.getSize().height));
					}
					if (u.setMatrix("reflectionMatrix", e.getReflectionTextureMatrix()), u.setFloat2("vReflectionInfos", e.level * r.iblIntensity, 0), u.setTexture("reflectionSampler", e), e.irradianceTexture && (u.setTexture("irradianceSampler", e.irradianceTexture), e.irradianceTexture._dominantDirection && u.setVector3("vReflectionDominantDirection", e.irradianceTexture._dominantDirection)), e.sphericalPolynomial) {
						let t = e.sphericalPolynomial;
						if (t.preScaledHarmonics) {
							let e = t.preScaledHarmonics;
							u.setVector3("vSphericalL00", e.l00), u.setVector3("vSphericalL1_1", e.l1_1), u.setVector3("vSphericalL10", e.l10), u.setVector3("vSphericalL11", e.l11), u.setVector3("vSphericalL2_2", e.l2_2), u.setVector3("vSphericalL2_1", e.l2_1), u.setVector3("vSphericalL20", e.l20), u.setVector3("vSphericalL21", e.l21), u.setVector3("vSphericalL22", e.l22);
						} else u.setFloat3("vSphericalX", t.x.x, t.x.y, t.x.z), u.setFloat3("vSphericalY", t.y.x, t.y.y, t.y.z), u.setFloat3("vSphericalZ", t.z.x, t.z.y, t.z.z), u.setFloat3("vSphericalXX_ZZ", t.xx.x - t.zz.x, t.xx.y - t.zz.y, t.xx.z - t.zz.z), u.setFloat3("vSphericalYY_ZZ", t.yy.x - t.zz.x, t.yy.y - t.zz.y, t.yy.z - t.zz.z), u.setFloat3("vSphericalZZ", t.zz.x, t.zz.y, t.zz.z), u.setFloat3("vSphericalXY", t.xy.x, t.xy.y, t.xy.z), u.setFloat3("vSphericalYZ", t.yz.x, t.yz.y, t.yz.z), u.setFloat3("vSphericalZX", t.zx.x, t.zx.y, t.zx.z);
					}
					if (this.generateIrradianceWithScatterMask && a.getClassName() === "OpenPBRMaterial") {
						let e = a;
						u.setFloat("vSubsurfaceWeight", e.subsurfaceWeight), e.subsurfaceWeightTexture && (u.setTexture("subsurfaceWeightSampler", e.subsurfaceWeightTexture), u.setMatrix("subsurfaceWeightMatrix", e.subsurfaceWeightTexture.getTextureMatrix())), u.setFloat("vTransmissionWeight", e.transmissionWeight), e.transmissionWeightTexture && (u.setTexture("transmissionWeightSampler", e.transmissionWeightTexture), u.setMatrix("transmissionWeightMatrix", e.transmissionWeightTexture.getTextureMatrix())), u.setFloat("vTransmissionScatterAnisotropy", e.transmissionScatterAnisotropy), u.setFloat("vSubsurfaceScatterAnisotropy", e.subsurfaceScatterAnisotropy);
					}
				}
				if (H(u, a, this._scene), t.useBones && t.computeBonesUsingShaders && t.skeleton) {
					let e = t.skeleton;
					if (e.isUsingTextureForMatrices && u.getUniformIndex("boneTextureInfo") > -1) {
						let n = e.getTransformMatrixTexture(t);
						u.setTexture("boneSampler", n), u.setFloat2("boneTextureInfo", e._textureWidth, e._textureHeight);
					} else u.setMatrices("mBones", t.skeleton.getTransformMatrices(t));
					(this._enableVelocity || this._enableVelocityLinear) && u.setMatrices("mPreviousBones", this._previousBonesTransformationMatrices[t.uniqueId]);
				}
				W(t, u), t.morphTargetManager && t.morphTargetManager.isUsingTextureForTargets && t.morphTargetManager._bind(u), (this._enableVelocity || this._enableVelocityLinear) && (u.setMatrix("previousWorld", this._previousTransformationMatrices[n.uniqueId].world), u.setMatrix("previousViewProjection", this._previousTransformationMatrices[n.uniqueId].viewProjection)), s && t.hasThinInstances && u.setMatrix("world", l), t._processRendering(n, e, u, a.fillMode, o, s, (e, t) => {
					e || u.setMatrix("world", t);
				});
			}
			(this._enableVelocity || this._enableVelocityLinear) && (this._previousTransformationMatrices[n.uniqueId].world = l.clone(), this._previousTransformationMatrices[n.uniqueId].viewProjection = this._scene.getTransformMatrix().clone(), t.skeleton && this._copyBonesTransformationMatrices(t.skeleton.getTransformMatrices(t), this._previousBonesTransformationMatrices[n.uniqueId]));
		};
		this._multiRenderTarget.customIsReadyFunction = (e, n, r) => {
			if ((r || n === 0) && e.subMeshes) for (let n = 0; n < e.subMeshes.length; ++n) {
				let r = e.subMeshes[n], i = r.getMaterial(), a = r.getRenderingMesh();
				if (!i) continue;
				let o = a._getInstancesRenderList(r._id, !!r.getReplacementMesh()), s = t.getCaps().instancedArrays && (o.visibleInstances[r._id] !== null || a.hasThinInstances);
				if (!this.isReady(r, s)) return !1;
			}
			return !0;
		}, this._multiRenderTarget.customRenderFunction = (e, n, r, i) => {
			let a;
			if (this._linkedWithPrePass) {
				if (!this._prePassRenderer.enabled) return;
				this._scene.getEngine().bindAttachments(this._attachmentsFromPrePass);
			}
			if (i.length) {
				for (t.setColorWrite(!1), a = 0; a < i.length; a++) v(i.data[a]);
				t.setColorWrite(!0);
			}
			for (a = 0; a < e.length; a++) v(e.data[a]);
			for (t.setDepthWrite(!1), a = 0; a < n.length; a++) v(n.data[a]);
			if (this.renderTransparentMeshes) for (a = 0; a < r.length; a++) v(r.data[a]);
			t.setDepthWrite(!0);
		};
	}
	_copyBonesTransformationMatrices(e, t) {
		for (let n = 0; n < e.length; n++) t[n] = e[n];
		return t;
	}
};
q.ForceGLSL = !1, q.DEPTH_TEXTURE_TYPE = 0, q.NORMAL_TEXTURE_TYPE = 1, q.POSITION_TEXTURE_TYPE = 2, q.VELOCITY_TEXTURE_TYPE = 3, q.REFLECTIVITY_TEXTURE_TYPE = 4, q.SCREENSPACE_DEPTH_TEXTURE_TYPE = 5, q.VELOCITY_LINEAR_TEXTURE_TYPE = 6, q.IRRADIANCE_TEXTURE_TYPE = 7, q._SceneComponentInitialization = (e) => {
	throw n("GeometryBufferRendererSceneComponent");
};
//#endregion
//#region node_modules/@babylonjs/core/Materials/PBR/openpbrMaterial.js
var J = {
	effect: null,
	subMesh: null
}, Y = class e {
	populateVectorFromLinkedProperties(n) {
		let r = n.dimension[0];
		for (let n in this.linkedProperties) {
			let i = this.linkedProperties[n], a = i.numComponents;
			if (r < a || i.targetUniformComponentOffset > r - a) {
				a == 1 ? t.Error(`Float property ${i.name} has an offset that is too large.`) : t.Error(`Vector${a} property ${i.name} won't fit in Vector${r} or has an offset that is too large.`);
				return;
			}
			typeof i.value == "number" ? e._tmpArray[i.targetUniformComponentOffset] = i.value : i.value.toArray(e._tmpArray, i.targetUniformComponentOffset);
		}
		n.fromArray(e._tmpArray);
	}
	constructor(e, t) {
		this.linkedProperties = {}, this.name = e, this.numComponents = t;
	}
};
Y._tmpArray = [
	0,
	0,
	0,
	0
];
var X = class {
	constructor(e, t, n, r, i = 0) {
		this.targetUniformComponentNum = 4, this.targetUniformComponentOffset = 0, this.name = e, this.targetUniformName = n, this.defaultValue = t, this.value = t, this.targetUniformComponentNum = r, this.targetUniformComponentOffset = i;
	}
	get numComponents() {
		return typeof this.defaultValue == "number" ? 1 : this.defaultValue.dimension[0];
	}
}, Z = class {
	get samplerName() {
		return this.samplerPrefix + "Sampler";
	}
	get samplerInfoName() {
		return "v" + this.samplerPrefix.charAt(0).toUpperCase() + this.samplerPrefix.slice(1) + "Infos";
	}
	get samplerMatrixName() {
		return this.samplerPrefix + "Matrix";
	}
	constructor(e, t, n) {
		this.value = null, this.samplerPrefix = "", this.textureDefine = "", this.name = e, this.samplerPrefix = t, this.textureDefine = n;
	}
}, Te = class extends L(ce(z)) {}, Ee = class extends Ce(Te) {}, Q = class extends ue(Ee) {
	constructor(e) {
		super(e), this.NUM_SAMPLES = "0", this.REALTIME_FILTERING = !1, this.IBL_CDF_FILTERING = !1, this.LIGHTCOUNT = 0, this.VERTEXCOLOR = !1, this.BAKED_VERTEX_ANIMATION_TEXTURE = !1, this.VERTEXALPHA = !1, this.ALPHATEST = !1, this.DEPTHPREPASS = !1, this.ALPHABLEND = !1, this.ALPHA_FROM_BASE_COLOR_TEXTURE = !1, this.ALPHATESTVALUE = "0.5", this.PREMULTIPLYALPHA = !1, this.REFLECTIVITY_GAMMA = !1, this.REFLECTIVITYDIRECTUV = 0, this.SPECULARTERM = !1, this.LODBASEDMICROSFURACE = !0, this.SPECULAR_ROUGHNESS_FROM_METALNESS_TEXTURE_GREEN = !1, this.BASE_METALNESS_FROM_METALNESS_TEXTURE_BLUE = !1, this.AOSTOREINMETALMAPRED = !1, this.SPECULAR_WEIGHT_IN_ALPHA = !1, this.SPECULAR_WEIGHT_FROM_SPECULAR_COLOR_TEXTURE = !1, this.SPECULAR_ROUGHNESS_ANISOTROPY_FROM_TANGENT_TEXTURE = !1, this.COAT_ROUGHNESS_FROM_GREEN_CHANNEL = !1, this.COAT_ROUGHNESS_ANISOTROPY_FROM_TANGENT_TEXTURE = !1, this.USE_GLTF_STYLE_ANISOTROPY = !1, this.THIN_FILM_THICKNESS_FROM_THIN_FILM_TEXTURE = !1, this.FUZZ_ROUGHNESS_FROM_TEXTURE_ALPHA = !1, this.GEOMETRY_THICKNESS_FROM_GREEN_CHANNEL = !1, this.ENVIRONMENTBRDF = !1, this.ENVIRONMENTBRDF_RGBD = !1, this.FUZZENVIRONMENTBRDF = !1, this.NORMAL = !1, this.TANGENT = !1, this.OBJECTSPACE_NORMALMAP = !1, this.PARALLAX = !1, this.PARALLAX_RHS = !1, this.PARALLAXOCCLUSION = !1, this.NORMALXYSCALE = !0, this.ANISOTROPIC = !1, this.ANISOTROPIC_OPENPBR = !0, this.ANISOTROPIC_BASE = !1, this.ANISOTROPIC_COAT = !1, this.FUZZ_IBL_SAMPLES = 6, this.FUZZ = !1, this.THIN_FILM = !1, this.IRIDESCENCE = !1, this.DISPERSION = !1, this.SCATTERING = !1, this.USE_IRRADIANCE_TEXTURE_FOR_SCATTERING = !1, this.TRANSMISSION_SLAB = !1, this.TRANSMISSION_SLAB_VOLUME = !1, this.SUBSURFACE_SLAB = !1, this.GEOMETRY_THIN_WALLED = !1, this.REFRACTED_BACKGROUND = !1, this.REFRACTED_LIGHTS = !1, this.REFRACTED_ENVIRONMENT = !1, this.REFRACTED_ENVIRONMENT_OPPOSITEZ = !1, this.REFRACTED_ENVIRONMENT_LOCAL_CUBE = !1, this.RADIANCEOCCLUSION = !1, this.HORIZONOCCLUSION = !1, this.INSTANCES = !1, this.THIN_INSTANCES = !1, this.INSTANCESCOLOR = !1, this.NUM_BONE_INFLUENCERS = 0, this.BonesPerMesh = 0, this.BONETEXTURE = !1, this.BONES_VELOCITY_ENABLED = !1, this.NONUNIFORMSCALING = !1, this.MORPHTARGETS = !1, this.MORPHTARGETS_POSITION = !1, this.MORPHTARGETS_NORMAL = !1, this.MORPHTARGETS_TANGENT = !1, this.MORPHTARGETS_UV = !1, this.MORPHTARGETS_UV2 = !1, this.MORPHTARGETS_COLOR = !1, this.MORPHTARGETTEXTURE_HASPOSITIONS = !1, this.MORPHTARGETTEXTURE_HASNORMALS = !1, this.MORPHTARGETTEXTURE_HASTANGENTS = !1, this.MORPHTARGETTEXTURE_HASUVS = !1, this.MORPHTARGETTEXTURE_HASUV2S = !1, this.MORPHTARGETTEXTURE_HASCOLORS = !1, this.NUM_MORPH_INFLUENCERS = 0, this.MORPHTARGETS_TEXTURE = !1, this.USEPHYSICALLIGHTFALLOFF = !1, this.USEGLTFLIGHTFALLOFF = !1, this.TWOSIDEDLIGHTING = !1, this.MIRRORED = !1, this.SHADOWFLOAT = !1, this.CLIPPLANE = !1, this.CLIPPLANE2 = !1, this.CLIPPLANE3 = !1, this.CLIPPLANE4 = !1, this.CLIPPLANE5 = !1, this.CLIPPLANE6 = !1, this.POINTSIZE = !1, this.FOG = !1, this.LOGARITHMICDEPTH = !1, this.CAMERA_ORTHOGRAPHIC = !1, this.CAMERA_PERSPECTIVE = !1, this.AREALIGHTSUPPORTED = !0, this.FORCENORMALFORWARD = !1, this.SPECULARAA = !1, this.UNLIT = !1, this.DECAL_AFTER_DETAIL = !1, this.DEBUGMODE = 0, this.USE_VERTEX_PULLING = !1, this.VERTEX_PULLING_USE_INDEX_BUFFER = !1, this.VERTEX_PULLING_INDEX_BUFFER_32BITS = !1, this.RIGHT_HANDED = !1, this.CLUSTLIGHT_SLICES = 0, this.CLUSTLIGHT_BATCH = 0, this.BRDF_V_HEIGHT_CORRELATED = !0, this.MS_BRDF_ENERGY_CONSERVATION = !0, this.SPHERICAL_HARMONICS = !0, this.SPECULAR_GLOSSINESS_ENERGY_CONSERVATION = !0, this.MIX_IBL_RADIANCE_WITH_IRRADIANCE = !0, this.LEGACY_SPECULAR_ENERGY_CONSERVATION = !1, this.BASE_DIFFUSE_MODEL = 0, this.DIELECTRIC_SPECULAR_MODEL = 1, this.CONDUCTOR_SPECULAR_MODEL = 1, this.rebuild();
	}
	reset() {
		super.reset(), this.ALPHATESTVALUE = "0.5", this.NORMALXYSCALE = !0;
	}
}, De = class extends ge(he) {}, $ = class e extends De {
	get geometryTangentAngle() {
		return Math.atan2(this.geometryTangent.y, this.geometryTangent.x);
	}
	set geometryTangentAngle(e) {
		this.geometryTangent = new a(Math.cos(e), Math.sin(e));
	}
	get geometryCoatTangentAngle() {
		return Math.atan2(this.geometryCoatTangent.y, this.geometryCoatTangent.x);
	}
	set geometryCoatTangentAngle(e) {
		this.geometryCoatTangent = new a(Math.cos(e), Math.sin(e));
	}
	get sssIrradianceTexture() {
		return this._sssIrradianceTexture;
	}
	set sssIrradianceTexture(e) {
		this._sssIrradianceTexture !== e && (this._sssIrradianceTexture = e, this._markAllSubMeshesAsTexturesDirty());
	}
	get sssDepthTexture() {
		return this._sssDepthTexture;
	}
	set sssDepthTexture(e) {
		this._sssDepthTexture !== e && (this._sssDepthTexture = e, this._markAllSubMeshesAsTexturesDirty());
	}
	get hasTransparency() {
		return this.subsurfaceWeight > 0 || this.transmissionWeight > 0;
	}
	get hasScattering() {
		return this.transmissionWeight > 0 && this.transmissionDepth > 0 && !this.transmissionScatter.equals(u.BlackReadOnly) || this.subsurfaceWeight > 0;
	}
	get usePhysicalLightFalloff() {
		return this._lightFalloff === I.LIGHTFALLOFF_PHYSICAL;
	}
	set usePhysicalLightFalloff(e) {
		e !== this.usePhysicalLightFalloff && (this._markAllSubMeshesAsTexturesDirty(), e ? this._lightFalloff = I.LIGHTFALLOFF_PHYSICAL : this._lightFalloff = I.LIGHTFALLOFF_STANDARD);
	}
	get useGLTFLightFalloff() {
		return this._lightFalloff === I.LIGHTFALLOFF_GLTF;
	}
	set useGLTFLightFalloff(e) {
		e !== this.useGLTFLightFalloff && (this._markAllSubMeshesAsTexturesDirty(), e ? this._lightFalloff = I.LIGHTFALLOFF_GLTF : this._lightFalloff = I.LIGHTFALLOFF_STANDARD);
	}
	get backgroundRefractionTexture() {
		return this._backgroundRefractionTexture;
	}
	set backgroundRefractionTexture(e) {
		this._backgroundRefractionTexture = e, this._markAllSubMeshesAsTexturesDirty();
	}
	get realTimeFiltering() {
		return this._realTimeFiltering;
	}
	set realTimeFiltering(e) {
		this._realTimeFiltering = e, this.markAsDirty(1);
	}
	get realTimeFilteringQuality() {
		return this._realTimeFilteringQuality;
	}
	set realTimeFilteringQuality(e) {
		this._realTimeFilteringQuality = e, this.markAsDirty(1);
	}
	get fuzzSampleNumber() {
		return this._fuzzSampleNumber;
	}
	set fuzzSampleNumber(e) {
		this._fuzzSampleNumber = e, this.markAsDirty(1);
	}
	get canRenderToMRT() {
		return !0;
	}
	constructor(n, r, i = !1) {
		super(n, r, void 0, i || e.ForceGLSL), this._baseWeight = new X("base_weight", 1, "vBaseWeight", 1), this._baseWeightTexture = new Z("base_weight", "baseWeight", "BASE_WEIGHT"), this._baseColor = new X("base_color", u.White(), "vBaseColor", 4), this._baseColorTexture = new Z("base_color", "baseColor", "BASE_COLOR"), this._baseDiffuseRoughness = new X("base_diffuse_roughness", 0, "vBaseDiffuseRoughness", 1), this._baseDiffuseRoughnessTexture = new Z("base_diffuse_roughness", "baseDiffuseRoughness", "BASE_DIFFUSE_ROUGHNESS"), this._baseMetalness = new X("base_metalness", 0, "vReflectanceInfo", 4, 0), this._baseMetalnessTexture = new Z("base_metalness", "baseMetalness", "BASE_METALNESS"), this._specularWeight = new X("specular_weight", 1, "vReflectanceInfo", 4, 3), this._specularWeightTexture = new Z("specular_weight", "specularWeight", "SPECULAR_WEIGHT"), this._specularColor = new X("specular_color", u.White(), "vSpecularColor", 4), this._specularColorTexture = new Z("specular_color", "specularColor", "SPECULAR_COLOR"), this._specularRoughness = new X("specular_roughness", .3, "vReflectanceInfo", 4, 1), this._specularRoughnessTexture = new Z("specular_roughness", "specularRoughness", "SPECULAR_ROUGHNESS"), this._specularRoughnessAnisotropy = new X("specular_roughness_anisotropy", 0, "vSpecularAnisotropy", 3, 2), this._specularRoughnessAnisotropyTexture = new Z("specular_roughness_anisotropy", "specularRoughnessAnisotropy", "SPECULAR_ROUGHNESS_ANISOTROPY"), this._specularIor = new X("specular_ior", 1.5, "vReflectanceInfo", 4, 2), this._transmissionWeight = new X("transmission_weight", 0, "vTransmissionWeight", 1), this._transmissionWeightTexture = new Z("transmission_weight", "transmissionWeight", "TRANSMISSION_WEIGHT"), this._transmissionColor = new X("transmission_color", u.White(), "vTransmissionColor", 3, 0), this._transmissionColorTexture = new Z("transmission_color", "transmissionColor", "TRANSMISSION_COLOR"), this._transmissionDepth = new X("transmission_depth", 0, "vTransmissionDepth", 1, 0), this._transmissionDepthTexture = new Z("transmission_depth", "transmissionDepth", "TRANSMISSION_DEPTH"), this._transmissionScatter = new X("transmission_scatter", u.Black(), "vTransmissionScatter", 3, 0), this._transmissionScatterTexture = new Z("transmission_scatter", "transmissionScatter", "TRANSMISSION_SCATTER"), this._transmissionScatterAnisotropy = new X("transmission_scatter_anisotropy", 0, "vTransmissionScatterAnisotropy", 1, 0), this._transmissionDispersionScale = new X("transmission_dispersion_scale", 0, "vTransmissionDispersionScale", 1, 0), this._transmissionDispersionScaleTexture = new Z("transmission_dispersion_scale", "transmissionDispersionScale", "TRANSMISSION_DISPERSION_SCALE"), this._transmissionDispersionAbbeNumber = new X("transmission_dispersion_abbe_number", 20, "vTransmissionDispersionAbbeNumber", 1, 0), this._subsurfaceWeight = new X("subsurface_weight", 0, "vSubsurfaceWeight", 1, 0), this._subsurfaceWeightTexture = new Z("subsurface_weight", "subsurfaceWeight", "SUBSURFACE_WEIGHT"), this._subsurfaceColor = new X("subsurface_color", new u(.8, .8, .8), "vSubsurfaceColor", 3, 0), this._subsurfaceColorTexture = new Z("subsurface_color", "subsurfaceColor", "SUBSURFACE_COLOR"), this._subsurfaceRadius = new X("subsurface_radius", 1, "vSubsurfaceRadius", 1, 0), this._subsurfaceRadiusScale = new X("subsurface_radius_scale", new u(1, .5, .25), "vSubsurfaceRadiusScale", 3, 0), this._subsurfaceRadiusScaleTexture = new Z("subsurface_radius_scale", "subsurfaceRadiusScale", "SUBSURFACE_RADIUS_SCALE"), this._subsurfaceScatterAnisotropy = new X("subsurface_scatter_anisotropy", 0, "vSubsurfaceScatterAnisotropy", 1, 0), this._coatWeight = new X("coat_weight", 0, "vCoatWeight", 1, 0), this._coatWeightTexture = new Z("coat_weight", "coatWeight", "COAT_WEIGHT"), this._coatColor = new X("coat_color", u.White(), "vCoatColor", 3, 0), this._coatColorTexture = new Z("coat_color", "coatColor", "COAT_COLOR"), this._coatRoughness = new X("coat_roughness", 0, "vCoatRoughness", 1, 0), this._coatRoughnessTexture = new Z("coat_roughness", "coatRoughness", "COAT_ROUGHNESS"), this._coatRoughnessAnisotropy = new X("coat_roughness_anisotropy", 0, "vCoatRoughnessAnisotropy", 1), this._coatRoughnessAnisotropyTexture = new Z("coat_roughness_anisotropy", "coatRoughnessAnisotropy", "COAT_ROUGHNESS_ANISOTROPY"), this._coatIor = new X("coat_ior", 1.5, "vCoatIor", 1, 0), this._coatDarkening = new X("coat_darkening", 1, "vCoatDarkening", 1, 0), this._coatDarkeningTexture = new Z("coat_darkening", "coatDarkening", "COAT_DARKENING"), this.useCoatRoughnessFromWeightTexture = !1, this._fuzzWeight = new X("fuzz_weight", 0, "vFuzzWeight", 1, 0), this._fuzzWeightTexture = new Z("fuzz_weight", "fuzzWeight", "FUZZ_WEIGHT"), this._fuzzColor = new X("fuzz_color", u.White(), "vFuzzColor", 3, 0), this._fuzzColorTexture = new Z("fuzz_color", "fuzzColor", "FUZZ_COLOR"), this._fuzzRoughness = new X("fuzz_roughness", .5, "vFuzzRoughness", 1, 0), this._fuzzRoughnessTexture = new Z("fuzz_roughness", "fuzzRoughness", "FUZZ_ROUGHNESS"), this._geometryThinWalled = new X("geometry_thin_walled", 0, "vGeometryThinWalled", 1, 0), this._geometryNormalTexture = new Z("geometry_normal", "geometryNormal", "GEOMETRY_NORMAL"), this._geometryTangent = new X("geometry_tangent", new a(1, 0), "vSpecularAnisotropy", 3, 0), this._geometryTangentTexture = new Z("geometry_tangent", "geometryTangent", "GEOMETRY_TANGENT"), this._geometryCoatNormalTexture = new Z("geometry_coat_normal", "geometryCoatNormal", "GEOMETRY_COAT_NORMAL"), this._geometryCoatTangent = new X("geometry_coat_tangent", new a(1, 0), "vGeometryCoatTangent", 2, 0), this._geometryCoatTangentTexture = new Z("geometry_coat_tangent", "geometryCoatTangent", "GEOMETRY_COAT_TANGENT"), this._geometryOpacity = new X("geometry_opacity", 1, "vBaseColor", 4, 3), this._geometryOpacityTexture = new Z("geometry_opacity", "geometryOpacity", "GEOMETRY_OPACITY"), this._geometryThickness = new X("geometry_thickness", 0, "vGeometryThickness", 1, 0), this._geometryThicknessTexture = new Z("geometry_thickness", "geometryThickness", "GEOMETRY_THICKNESS"), this._emissionLuminance = new X("emission_luminance", 1, "vLightingIntensity", 4, 1), this._emissionColor = new X("emission_color", u.Black(), "vEmissionColor", 3), this._emissionColorTexture = new Z("emission_color", "emissionColor", "EMISSION_COLOR"), this._thinFilmWeight = new X("thin_film_weight", 0, "vThinFilmWeight", 1, 0), this._thinFilmWeightTexture = new Z("thin_film_weight", "thinFilmWeight", "THIN_FILM_WEIGHT"), this._thinFilmThickness = new X("thin_film_thickness", .5, "vThinFilmThickness", 2, 0), this._thinFilmThicknessMin = new X("thin_film_thickness_min", 0, "vThinFilmThickness", 2, 1), this._thinFilmThicknessTexture = new Z("thin_film_thickness", "thinFilmThickness", "THIN_FILM_THICKNESS"), this._thinFilmIor = new X("thin_film_ior", 1.4, "vThinFilmIor", 1, 0), this._ambientOcclusionTexture = new Z("ambient_occlusion", "ambientOcclusion", "AMBIENT_OCCLUSION"), this._sssIrradianceTexture = null, this._sssDepthTexture = null, this._uniformsList = {}, this._samplersList = {}, this._samplerDefines = {}, this.directIntensity = 1, this.environmentIntensity = 1, this.useSpecularWeightFromTextureAlpha = !1, this.forceAlphaTest = !1, this.alphaCutOff = .4, this.useAmbientOcclusionFromMetallicTextureRed = !1, this.useAmbientInGrayScale = !1, this.useObjectSpaceNormalMap = !1, this.useParallax = !1, this.useParallaxOcclusion = !1, this.parallaxScaleBias = .05, this.disableLighting = !1, this.forceIrradianceInFragment = !1, this.maxSimultaneousLights = 4, this.invertNormalMapX = !1, this.invertNormalMapY = !1, this.twoSidedLighting = !1, this.useAlphaFresnel = !1, this.useLinearAlphaFresnel = !1, this.environmentBRDFTexture = null, this.forceNormalForward = !1, this.enableSpecularAntiAliasing = !1, this.useHorizonOcclusion = !0, this.useRadianceOcclusion = !0, this.unlit = !1, this.applyDecalMapAfterDetailMap = !1, this._lightingInfos = new o(this.directIntensity, 1, this.environmentIntensity, 1), this._radianceTexture = null, this._useSpecularWeightFromAlpha = !1, this._useSpecularWeightFromSpecularColorTexture = !1, this._useSpecularRoughnessAnisotropyFromTangentTexture = !1, this._useCoatRoughnessAnisotropyFromTangentTexture = !1, this._useCoatRoughnessFromGreenChannel = !1, this._useGltfStyleAnisotropy = !1, this._useFuzzRoughnessFromTextureAlpha = !1, this._useHorizonOcclusion = !0, this._useRadianceOcclusion = !0, this._useAlphaFromBaseColorTexture = !1, this._useAmbientOcclusionFromMetallicTextureRed = !1, this._useRoughnessFromMetallicTextureGreen = !1, this._useMetallicFromMetallicTextureBlue = !1, this._useThinFilmThicknessFromTextureGreen = !1, this._useGeometryThicknessFromGreenChannel = !1, this._lightFalloff = I.LIGHTFALLOFF_PHYSICAL, this._useObjectSpaceNormalMap = !1, this._useParallax = !1, this._useParallaxOcclusion = !1, this._parallaxScaleBias = .05, this._disableLighting = !1, this._maxSimultaneousLights = 4, this._invertNormalMapX = !1, this._invertNormalMapY = !1, this._twoSidedLighting = !1, this._alphaCutOff = .4, this._useAlphaFresnel = !1, this._useLinearAlphaFresnel = !1, this._environmentBRDFTexture = null, this._environmentFuzzBRDFTexture = null, this._backgroundRefractionTexture = null, this._forceIrradianceInFragment = !1, this._realTimeFiltering = !1, this._realTimeFilteringQuality = 8, this._fuzzSampleNumber = 4, this._forceNormalForward = !1, this._enableSpecularAntiAliasing = !1, this._renderTargets = new v(16), this._unlit = !1, this._applyDecalMapAfterDetailMap = !1, this._debugMode = 0, this._shadersLoaded = !1, this._breakShaderLoadedCheck = !1, this._vertexPullingMetadata = null, this.debugMode = 0, this.debugLimit = -1, this.debugFactor = 1, this._cacheHasRenderTargetTextures = !1, this._transparencyMode = I.MATERIAL_OPAQUE, this.getScene() && !this.getScene()?.getEngine().isWebGPU && this.getScene().getEngine().webGLVersion < 2 && t.Error("OpenPBRMaterial: WebGL 2.0 or above is required for this material."), e._noiseTextures[this.getScene().uniqueId] || (e._noiseTextures[this.getScene().uniqueId] = new _(g.GetAssetUrl("https://assets.babylonjs.com/core/blue_noise/blue_noise_rgb.png"), this.getScene(), !1, !0, 1), this.getScene().onDisposeObservable.addOnce(() => {
			e._noiseTextures[this.getScene().uniqueId]?.dispose(), delete e._noiseTextures[this.getScene().uniqueId];
		})), this._attachImageProcessingConfiguration(null), this.getRenderTargetTextures = () => (this._renderTargets.reset(), D.ReflectionTextureEnabled && this._radianceTexture && this._radianceTexture.isRenderTarget && this._renderTargets.push(this._radianceTexture), D.RefractionTextureEnabled && this._backgroundRefractionTexture && this._backgroundRefractionTexture.isRenderTarget && this._renderTargets.push(this._backgroundRefractionTexture), this._eventInfo.renderTargets = this._renderTargets, this._callbackPluginEventFillRenderTargetTextures(this._eventInfo), this._renderTargets), this._environmentBRDFTexture = _e(this.getScene()), this._environmentFuzzBRDFTexture = B(this.getScene()), this.prePassConfiguration = new U(), this._propertyList = {};
		for (let e of Object.getOwnPropertyNames(this)) {
			let t = this[e];
			t instanceof X && (this._propertyList[e] = t);
		}
		Object.keys(this._propertyList).forEach((e) => {
			let n = this._propertyList[e], r = this._uniformsList[n.targetUniformName];
			r ? r.numComponents !== n.targetUniformComponentNum && t.Error(`Uniform ${n.targetUniformName} already exists of size ${r.numComponents}, but trying to set it to ${n.targetUniformComponentNum}.`) : (r = new Y(n.targetUniformName, n.targetUniformComponentNum), this._uniformsList[n.targetUniformName] = r), r.linkedProperties[n.name] = n;
		}), this._samplersList = {};
		for (let e of Object.getOwnPropertyNames(this)) {
			let t = this[e];
			t instanceof Z && (this._samplersList[e] = t);
		}
		for (let e in this._samplersList) {
			let t = this._samplersList[e].textureDefine;
			this._samplerDefines[t] = {
				type: "boolean",
				default: !1
			}, this._samplerDefines[t + "DIRECTUV"] = {
				type: "number",
				default: 0
			}, this._samplerDefines[t + "_GAMMA"] = {
				type: "boolean",
				default: !1
			};
		}
		this._baseWeight, this._baseWeightTexture, this._baseColor, this._baseColorTexture, this._baseDiffuseRoughness, this._baseDiffuseRoughnessTexture, this._baseMetalness, this._baseMetalnessTexture, this._specularWeight, this._specularWeightTexture, this._specularColor, this._specularColorTexture, this._specularRoughness, this._specularIor, this._specularRoughnessTexture, this._specularRoughnessAnisotropy, this._specularRoughnessAnisotropyTexture, this._transmissionWeight, this._transmissionWeightTexture, this._transmissionColor, this._transmissionColorTexture, this._transmissionDepth, this._transmissionDepthTexture, this._transmissionScatter, this._transmissionScatterTexture, this._transmissionScatterAnisotropy, this._transmissionDispersionScale, this._transmissionDispersionScaleTexture, this._transmissionDispersionAbbeNumber, this._subsurfaceWeight, this._subsurfaceWeightTexture, this._subsurfaceColor, this._subsurfaceColorTexture, this._subsurfaceRadius, this._subsurfaceRadiusScale, this._subsurfaceRadiusScaleTexture, this._subsurfaceScatterAnisotropy, this._coatWeight, this._coatWeightTexture, this._coatColor, this._coatColorTexture, this._coatRoughness, this._coatRoughnessTexture, this._coatRoughnessAnisotropy, this._coatRoughnessAnisotropyTexture, this._coatIor, this._coatDarkening, this._coatDarkeningTexture, this._fuzzWeight, this._fuzzWeightTexture, this._fuzzColor, this._fuzzColorTexture, this._fuzzRoughness, this._fuzzRoughnessTexture, this._geometryThinWalled, this._geometryNormalTexture, this._geometryTangent, this._geometryTangentTexture, this._geometryCoatNormalTexture, this._geometryCoatTangent, this._geometryCoatTangentTexture, this._geometryOpacity, this._geometryOpacityTexture, this._geometryThickness, this._geometryThicknessTexture, this._thinFilmWeight, this._thinFilmWeightTexture, this._thinFilmThickness, this._thinFilmThicknessMin, this._thinFilmThicknessTexture, this._thinFilmIor, this._emissionLuminance, this._emissionColor, this._emissionColorTexture, this._ambientOcclusionTexture;
	}
	get hasRenderTargetTextures() {
		return D.ReflectionTextureEnabled && this._radianceTexture && this._radianceTexture.isRenderTarget || D.RefractionTextureEnabled && this._backgroundRefractionTexture && this._backgroundRefractionTexture.isRenderTarget ? !0 : this._cacheHasRenderTargetTextures;
	}
	get isPrePassCapable() {
		return !this.disableDepthWrite;
	}
	getClassName() {
		return "OpenPBRMaterial";
	}
	get transparencyMode() {
		return this._transparencyMode;
	}
	set transparencyMode(e) {
		this._transparencyMode !== e && (this._transparencyMode = e, this._markAllSubMeshesAsTexturesAndMiscDirty());
	}
	_shouldUseAlphaFromBaseColorTexture() {
		return this._hasAlphaChannel() && this._transparencyMode !== I.MATERIAL_OPAQUE && !this.geometryOpacityTexture;
	}
	_hasAlphaChannel() {
		return this.baseColorTexture != null && this.baseColorTexture.hasAlpha && this._useAlphaFromBaseColorTexture || this.geometryOpacityTexture != null;
	}
	clone(t, n = !0, r = "") {
		let i = d.Clone(() => new e(t, this.getScene()), this, { cloneTexturesOnlyOnce: n });
		return i.id = t, i.name = t, this.stencil.copyTo(i.stencil), this._clonePlugins(i, r), i;
	}
	serialize() {
		let e = super.serialize();
		return e.customType = "BABYLON.OpenPBRMaterial", e;
	}
	static Parse(t, n, r) {
		let i = d.Parse(() => new e(t.name, n), t, n, r);
		return t.stencil && i.stencil.parse(t.stencil, n, r), I._ParsePlugins(t, i, n, r), i;
	}
	forceCompilation(e, t, n) {
		let r = {
			clipPlane: !1,
			useInstances: !1,
			...n
		};
		this._uniformBufferLayoutBuilt || this.buildUniformLayout(), this._callbackPluginEventGeneric(4, this._eventInfo), (() => {
			if (this._breakShaderLoadedCheck) return;
			let n = new Q({
				...this._eventInfo.defineNames || {},
				...this._samplerDefines || {}
			}), i = this._prepareEffect(e, e, n, void 0, void 0, r.useInstances, r.clipPlane);
			this._onEffectCreatedObservable && (J.effect = i, J.subMesh = null, this._onEffectCreatedObservable.notifyObservers(J)), i.isReady() ? t && t(this) : i.onCompileObservable.add(() => {
				t && t(this);
			});
		})();
	}
	isReadyForSubMesh(n, r, i) {
		this._uniformBufferLayoutBuilt || this.buildUniformLayout();
		let a = r._drawWrapper;
		if (a.effect && this.isFrozen && a._wasPreviouslyReady && a._wasPreviouslyUsingInstances === i) return !0;
		r.materialDefines ||= (this._callbackPluginEventGeneric(4, this._eventInfo), new Q({
			...this._eventInfo.defineNames || {},
			...this._samplerDefines || {}
		}));
		let o = r.materialDefines;
		if (this._isReadyForSubMesh(r)) return !0;
		let s = this.getScene(), c = s.getEngine();
		if (o._areTexturesDirty && (this._eventInfo.hasRenderTargetTextures = !1, this._callbackPluginEventHasRenderTargetTextures(this._eventInfo), this._cacheHasRenderTargetTextures = this._eventInfo.hasRenderTargetTextures, s.texturesEnabled)) {
			for (let e in this._samplersList) {
				let t = this._samplersList[e];
				if (t.value && !t.value.isReadyOrNotBlocking()) return !1;
			}
			let t = this._getRadianceTexture();
			if (t && D.ReflectionTextureEnabled) {
				if (!t.isReadyOrNotBlocking()) return !1;
				if (t.irradianceTexture) {
					if (!t.irradianceTexture.isReadyOrNotBlocking()) return !1;
				} else if (!t.sphericalPolynomial && t.getInternalTexture()?._sphericalPolynomialPromise) return !1;
			}
			if (this._environmentBRDFTexture && D.ReflectionTextureEnabled && !this._environmentBRDFTexture.isReady() || this._environmentFuzzBRDFTexture && D.ReflectionTextureEnabled && !this._environmentFuzzBRDFTexture.isReady() || this._backgroundRefractionTexture && D.RefractionTextureEnabled && !this._backgroundRefractionTexture.isReadyOrNotBlocking() || e._noiseTextures[s.uniqueId] && !e._noiseTextures[s.uniqueId].isReady() || this._sssIrradianceTexture && this._sssDepthTexture && (!this._sssIrradianceTexture.isReady() || !this._sssDepthTexture.isReady())) return !1;
		}
		if (this._eventInfo.isReadyForSubMesh = !0, this._eventInfo.defines = o, this._eventInfo.subMesh = r, this._callbackPluginEventIsReadyForSubMesh(this._eventInfo), !this._eventInfo.isReadyForSubMesh || o._areImageProcessingDirty && this._imageProcessingConfiguration && !this._imageProcessingConfiguration.isReady()) return !1;
		if (o.AREALIGHTUSED) {
			for (let e = 0; e < n.lightSources.length; e++) if (!n.lightSources[e]._isReady()) return !1;
		}
		!c.getCaps().standardDerivatives && !n.isVerticesDataPresent(b.NormalKind) && (n.createNormals(!0), t.Warn("OpenPBRMaterial: Normals have been created for the mesh: " + n.name));
		let l = r.effect, u = o._areLightsDisposed, d = this._prepareEffect(n, r.getRenderingMesh(), o, this.onCompiled, this.onError, i, null), f = !1;
		if (d) if (this._onEffectCreatedObservable && (J.effect = d, J.subMesh = r, this._onEffectCreatedObservable.notifyObservers(J)), this.allowShaderHotSwapping && l && !d.isReady()) {
			if (o.markAsUnprocessed(), f = this.isFrozen, u) return o._areLightsDisposed = !0, !1;
		} else s.resetCachedMaterial(), r.setEffect(d, o, this._materialContext);
		return !r.effect || !r.effect.isReady() ? !1 : (o._renderId = s.getRenderId(), a._wasPreviouslyReady = !f, a._wasPreviouslyUsingInstances = !!i, this._checkScenePerformancePriority(), !0);
	}
	buildUniformLayout() {
		let e = this._uniformBuffer;
		e.addUniform("vTangentSpaceParams", 2), e.addUniform("vLightingIntensity", 4), e.addUniform("pointSize", 1), e.addUniform("vDebugMode", 2), e.addUniform("renderTargetSize", 2), e.addUniform("cameraInfo", 4), e.addUniform("backgroundRefractionMatrix", 16), e.addUniform("vBackgroundRefractionInfos", 3), S(e, !0, !0, !0, !0, !0), Object.values(this._uniformsList).forEach((t) => {
			e.addUniform(t.name, t.numComponents);
		}), Object.values(this._samplersList).forEach((t) => {
			e.addUniform(t.samplerInfoName, 2), e.addUniform(t.samplerMatrixName, 16);
		}), super.buildUniformLayout();
	}
	bindPropertiesForSubMesh(e, t, n, r) {
		if (this.geometryThickness === 0) e.updateFloat("vGeometryThickness", 0);
		else {
			r.getRenderingMesh().getWorldMatrix().decompose(s.Vector3[0]);
			let t = Math.max(Math.abs(s.Vector3[0].x), Math.abs(s.Vector3[0].y), Math.abs(s.Vector3[0].z));
			e.updateFloat("vGeometryThickness", this.geometryThickness * t);
		}
	}
	bindForSubMesh(t, n, r) {
		let i = this.getScene(), a = r.materialDefines;
		if (!a) return;
		let o = r.effect;
		if (!o) return;
		this._activeEffect = o, n.getMeshUniformBuffer().bindToEffect(o, "Mesh"), n.transferToEffect(t);
		let c = i.getEngine();
		this._uniformBuffer.bindToEffect(o, "Material"), this.prePassConfiguration.bindForSubMesh(this._activeEffect, i, n, t, this.isFrozen), V.Bind(c.currentRenderPassId, this._activeEffect, n, t, this);
		let l = i.activeCamera;
		l ? this._uniformBuffer.updateFloat4("cameraInfo", l.minZ, l.maxZ, 0, 0) : this._uniformBuffer.updateFloat4("cameraInfo", 0, 0, 0, 0), this._eventInfo.subMesh = r, this._callbackPluginEventHardBindForSubMesh(this._eventInfo), a.OBJECTSPACE_NORMALMAP && (t.toNormalMatrix(this._normalMatrix), this.bindOnlyNormalMatrix(this._normalMatrix));
		let d = this._mustRebind(i, o, r, n.visibility);
		pe(n, this._activeEffect, this.prePassConfiguration), this._vertexPullingMetadata && de(this._activeEffect, this._vertexPullingMetadata);
		let f = this._uniformBuffer;
		if (d) {
			this.bindViewProjection(o);
			let t = this._getRadianceTexture();
			if (!f.useUbo || !this.isFrozen || !f.isSync || r._drawWrapper._forceRebindOnNextCall) {
				if (i.texturesEnabled) {
					for (let e in this._samplersList) {
						let t = this._samplersList[e];
						t.value && (f.updateFloat2(t.samplerInfoName, t.value.coordinatesIndex, t.value.level), C(t.value, f, t.samplerPrefix));
					}
					this.geometryNormalTexture && (i._mirroredCameraPosition ? f.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1 : -1, this._invertNormalMapY ? 1 : -1) : f.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1 : 1, this._invertNormalMapY ? -1 : 1)), ve(i, a, f, u.White(), t, this.realTimeFiltering, !0, !0, !0, !0, !0);
				}
				this.pointsCloud && f.updateFloat("pointSize", this.pointSize), Object.values(this._uniformsList).forEach((e) => {
					e.numComponents === 4 ? (e.populateVectorFromLinkedProperties(s.Vector4[0]), f.updateVector4(e.name, s.Vector4[0])) : e.numComponents === 3 ? (e.populateVectorFromLinkedProperties(s.Vector3[0]), f.updateVector3(e.name, s.Vector3[0])) : e.numComponents === 2 ? (e.populateVectorFromLinkedProperties(s.Vector2[0]), f.updateFloat2(e.name, s.Vector2[0].x, s.Vector2[0].y)) : e.numComponents === 1 && f.updateFloat(e.name, e.linkedProperties[Object.keys(e.linkedProperties)[0]].value);
				}), this._lightingInfos.x = this.directIntensity, this._lightingInfos.y = this.emissionLuminance, this._lightingInfos.z = this.environmentIntensity * i.environmentIntensity, this._lightingInfos.w = 1, f.updateVector4("vLightingIntensity", this._lightingInfos), f.updateFloat2("vDebugMode", this.debugLimit, this.debugFactor);
			}
			if (i.texturesEnabled) {
				for (let e in this._samplersList) {
					let t = this._samplersList[e];
					t.value && f.setTexture(t.samplerName, t.value);
				}
				if (be(i, a, f, t, this.realTimeFiltering), a.ENVIRONMENTBRDF && f.setTexture("environmentBrdfSampler", this._environmentBRDFTexture), a.FUZZENVIRONMENTBRDF && f.setTexture("environmentFuzzBrdfSampler", this._environmentFuzzBRDFTexture), a.REFRACTED_BACKGROUND && (f.setTexture("backgroundRefractionSampler", this._backgroundRefractionTexture), f.updateMatrix("backgroundRefractionMatrix", this._backgroundRefractionTexture.getReflectionTextureMatrix()), s.Vector3[1].set(Math.log2(this._backgroundRefractionTexture.getSize().width), 0, 0), f.updateVector3("vBackgroundRefractionInfos", s.Vector3[1])), (a.ANISOTROPIC || a.FUZZ || a.REFRACTED_BACKGROUND || a.USE_IRRADIANCE_TEXTURE_FOR_SCATTERING) && f.setTexture("blueNoiseSampler", e._noiseTextures[this.getScene().uniqueId]), a.USE_IRRADIANCE_TEXTURE_FOR_SCATTERING && this.sssIrradianceTexture && this.sssDepthTexture) {
					let e = this.sssIrradianceTexture.getSize().width, t = this.sssIrradianceTexture.getSize().height;
					f.setTexture("sceneIrradianceSampler", this.sssIrradianceTexture), f.setTexture("sceneDepthSampler", this.sssDepthTexture), f.updateFloat2("renderTargetSize", e, t);
				}
			}
			this.getScene().useOrderIndependentTransparency && this.needAlphaBlendingForMesh(n) && this.getScene().depthPeelingRenderer.bind(o), this._eventInfo.subMesh = r, this._callbackPluginEventBindForSubMesh(this._eventInfo), H(this._activeEffect, this, i), this.bindEyePosition(o);
		} else i.getEngine()._features.needToAlwaysBindUniformBuffers && (this._needToBindSceneUbo = !0);
		this.bindPropertiesForSubMesh(this._uniformBuffer, i, i.getEngine(), r), (d || !this.isFrozen) && (i.lightsEnabled && !this._disableLighting && le(i, n, this._activeEffect, a, this._maxSimultaneousLights), this.bindView(o), se(i, n, this._activeEffect, !0), a.NUM_MORPH_INFLUENCERS && W(n, this._activeEffect), a.BAKED_VERTEX_ANIMATION_TEXTURE && n.bakedVertexAnimationManager?.bind(o, a.INSTANCES), this._imageProcessingConfiguration.bind(this._activeEffect), F(a, this._activeEffect, i)), this._afterBind(n, this._activeEffect, r), f.update();
	}
	getAnimatables() {
		let e = super.getAnimatables();
		for (let t in this._samplersList) {
			let n = this._samplersList[t];
			n.value && n.value.animations && n.value.animations.length > 0 && e.push(n.value);
		}
		return this._radianceTexture && this._radianceTexture.animations && this._radianceTexture.animations.length > 0 && e.push(this._radianceTexture), e;
	}
	getActiveTextures() {
		let e = super.getActiveTextures();
		for (let t in this._samplersList) {
			let n = this._samplersList[t];
			n.value && e.push(n.value);
		}
		return this._radianceTexture && e.push(this._radianceTexture), e;
	}
	hasTexture(e) {
		if (super.hasTexture(e)) return !0;
		for (let t in this._samplersList) if (this._samplersList[t].value === e) return !0;
		return this._radianceTexture === e;
	}
	setPrePassRenderer() {
		return !1;
	}
	dispose(e, t) {
		if (this._breakShaderLoadedCheck = !0, t) {
			this._environmentBRDFTexture && this.getScene().environmentBRDFTexture !== this._environmentBRDFTexture && this._environmentBRDFTexture.dispose(), this._environmentFuzzBRDFTexture && this.getScene().environmentFuzzBRDFTexture !== this._environmentFuzzBRDFTexture && this._environmentFuzzBRDFTexture.dispose(), this._backgroundRefractionTexture = null;
			for (let e in this._samplersList) this._samplersList[e].value?.dispose();
			this._radianceTexture?.dispose();
		}
		this._renderTargets.dispose(), this._imageProcessingConfiguration && this._imageProcessingObserver && this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), super.dispose(e, t);
	}
	_getRadianceTexture() {
		return this._radianceTexture ? this._radianceTexture : this.getScene().environmentTexture;
	}
	_prepareEffect(e, t, n, r = null, i = null, a = null, o = null) {
		if (this._prepareDefines(e, t, n, a, o), !n.isDirty) return null;
		n.markAsProcessed();
		let s = this.getScene().getEngine(), c = new me(), l = 0;
		n.USESPHERICALINVERTEX && c.addFallback(l++, "USESPHERICALINVERTEX"), n.FOG && c.addFallback(l, "FOG"), n.SPECULARAA && c.addFallback(l, "SPECULARAA"), n.POINTSIZE && c.addFallback(l, "POINTSIZE"), n.LOGARITHMICDEPTH && c.addFallback(l, "LOGARITHMICDEPTH"), n.PARALLAX && c.addFallback(l, "PARALLAX"), n.PARALLAX_RHS && c.addFallback(l, "PARALLAX_RHS"), n.PARALLAXOCCLUSION && c.addFallback(l++, "PARALLAXOCCLUSION"), n.ENVIRONMENTBRDF && c.addFallback(l++, "ENVIRONMENTBRDF"), n.TANGENT && c.addFallback(l++, "TANGENT"), l = ye(n, c, this._maxSimultaneousLights, l), n.SPECULARTERM && c.addFallback(l++, "SPECULARTERM"), n.USESPHERICALFROMREFLECTIONMAP && c.addFallback(l++, "USESPHERICALFROMREFLECTIONMAP"), n.USEIRRADIANCEMAP && c.addFallback(l++, "USEIRRADIANCEMAP"), n.NORMAL && c.addFallback(l++, "NORMAL"), n.VERTEXCOLOR && c.addFallback(l++, "VERTEXCOLOR"), n.MORPHTARGETS && c.addFallback(l++, "MORPHTARGETS"), n.MULTIVIEW && c.addFallback(0, "MULTIVIEW");
		let u = [b.PositionKind];
		n.NORMAL && u.push(b.NormalKind), n.TANGENT && u.push(b.TangentKind);
		for (let e = 1; e <= 6; ++e) n["UV" + e] && u.push(`uv${e === 1 ? "" : e}`);
		n.VERTEXCOLOR && u.push(b.ColorKind), T(u, e, n, c), w(u, n), ne(u, e, n), N(u, e, n);
		let d = "openpbr", f = [
			"world",
			"view",
			"viewProjection",
			"projection",
			"vEyePosition",
			"inverseProjection",
			"renderTargetSize",
			"vLightsType",
			"visibility",
			"vFogInfos",
			"vFogColor",
			"pointSize",
			"mBones",
			"normalMatrix",
			"vLightingIntensity",
			"logarithmicDepthConstant",
			"vTangentSpaceParams",
			"boneTextureInfo",
			"vDebugMode",
			"morphTargetTextureInfo",
			"morphTargetTextureIndices",
			"cameraInfo",
			"backgroundRefractionMatrix",
			"vBackgroundRefractionInfos"
		];
		for (let e in this._uniformsList) f.push(e);
		let p = [
			"environmentBrdfSampler",
			"boneSampler",
			"morphTargets",
			"oitDepthSampler",
			"oitFrontColorSampler",
			"areaLightsLTC1Sampler",
			"areaLightsLTC2Sampler"
		];
		n.FUZZENVIRONMENTBRDF && p.push("environmentFuzzBrdfSampler"), n.REFRACTED_BACKGROUND && p.push("backgroundRefractionSampler"), (n.ANISOTROPIC || n.FUZZ || n.REFRACTED_BACKGROUND || n.USE_IRRADIANCE_TEXTURE_FOR_SCATTERING) && p.push("blueNoiseSampler"), n.USE_IRRADIANCE_TEXTURE_FOR_SCATTERING && (p.push("sceneIrradianceSampler"), p.push("sceneDepthSampler"));
		for (let e in this._samplersList) {
			let t = this._samplersList[e];
			p.push(t.samplerName), f.push(t.samplerInfoName), f.push(t.samplerMatrixName);
		}
		P(f, p, !0);
		let m = [
			"Material",
			"Scene",
			"Mesh"
		], h = {
			maxSimultaneousLights: this._maxSimultaneousLights,
			maxSimultaneousMorphTargets: n.NUM_MORPH_INFLUENCERS
		};
		if (this._eventInfo.fallbacks = c, this._eventInfo.fallbackRank = l, this._eventInfo.defines = n, this._eventInfo.uniforms = f, this._eventInfo.attributes = u, this._eventInfo.samplers = p, this._eventInfo.uniformBuffersNames = m, this._eventInfo.customCode = void 0, this._eventInfo.mesh = e, this._eventInfo.indexParameters = h, this._callbackPluginEventGeneric(128, this._eventInfo), V.AddUniformsAndSamplers(f, p), U.AddUniforms(f), U.AddSamplers(p), j(f), this._useVertexPulling) {
			let e = t?.geometry;
			e && (this._vertexPullingMetadata = fe(e), this._vertexPullingMetadata && this._vertexPullingMetadata.forEach((e, t) => {
				f.push(`vp_${t}_info`);
			}));
		} else this._vertexPullingMetadata = null;
		y && (y.PrepareUniforms(f, n), y.PrepareSamplers(p, n)), O({
			uniformsNames: f,
			uniformBuffersNames: m,
			samplers: p,
			defines: n,
			maxSimultaneousLights: this._maxSimultaneousLights
		});
		let g = {};
		this.customShaderNameResolve && (d = this.customShaderNameResolve(d, f, m, p, n, u, g));
		let _ = n.toString(), v = s.createEffect(d, {
			attributes: u,
			uniformsNames: f,
			uniformBuffersNames: m,
			samplers: p,
			defines: _,
			fallbacks: c,
			onCompiled: r,
			onError: i,
			indexParameters: h,
			processFinalCode: g.processFinalCode,
			processCodeAfterIncludes: this._eventInfo.customCode,
			multiTarget: n.PREPASS,
			shaderLanguage: this._shaderLanguage,
			extraInitializationsAsync: this._shadersLoaded ? void 0 : async () => {
				this.shaderLanguage === 1 ? await Promise.all([import("./openpbr.vertex-DkTwAzdG.js"), import("./openpbr.fragment-BIJq2Zru.js")]) : await Promise.all([import("./openpbr.vertex-DsJs5VpW.js"), import("./openpbr.fragment-B4JG2K8y.js")]), this._shadersLoaded = !0;
			}
		}, s);
		return this._eventInfo.customCode = void 0, v;
	}
	_prepareDefines(t, n, r, i = null, a = null) {
		let o = n.hasThinInstances, s = this.getScene(), c = s.getEngine();
		re(s, t, r, !0, this._maxSimultaneousLights, this._disableLighting), r._needNormals = !0, ee(s, r);
		let l = this.needAlphaBlendingForMesh(t) && this.getScene().useOrderIndependentTransparency;
		if (xe(s, r, this.canRenderToMRT && !l), ie(s, r, l), V.PrepareDefines(c.currentRenderPassId, t, r), r._areTexturesDirty) {
			r._needUVs = !1;
			for (let e = 1; e <= 6; ++e) r["MAINUV" + e] = !1;
			if (s.texturesEnabled) {
				for (let e in this._samplersList) {
					let t = this._samplersList[e];
					t.value ? (E(t.value, r, t.textureDefine), r[t.textureDefine + "_GAMMA"] = t.value.gammaSpace) : r[t.textureDefine] = !1;
				}
				let e = this._getRadianceTexture(), t = this._forceIrradianceInFragment || this.realTimeFiltering || this._twoSidedLighting || c.getCaps().maxVaryingVectors <= 8 || this._baseDiffuseRoughnessTexture != null;
				if (M(s, e, r, this.realTimeFiltering, this.realTimeFilteringQuality, !t), this._baseMetalnessTexture && (r.AOSTOREINMETALMAPRED = this._useAmbientOcclusionFromMetallicTextureRed), r.SPECULAR_WEIGHT_IN_ALPHA = this._useSpecularWeightFromAlpha, r.SPECULAR_WEIGHT_FROM_SPECULAR_COLOR_TEXTURE = this._useSpecularWeightFromSpecularColorTexture, r.SPECULAR_ROUGHNESS_ANISOTROPY_FROM_TANGENT_TEXTURE = this._useSpecularRoughnessAnisotropyFromTangentTexture, r.COAT_ROUGHNESS_ANISOTROPY_FROM_TANGENT_TEXTURE = this._useCoatRoughnessAnisotropyFromTangentTexture, r.COAT_ROUGHNESS_FROM_GREEN_CHANNEL = this._useCoatRoughnessFromGreenChannel, r.SPECULAR_ROUGHNESS_FROM_METALNESS_TEXTURE_GREEN = this._useRoughnessFromMetallicTextureGreen, r.FUZZ_ROUGHNESS_FROM_TEXTURE_ALPHA = this._useFuzzRoughnessFromTextureAlpha, r.BASE_METALNESS_FROM_METALNESS_TEXTURE_BLUE = this._useMetallicFromMetallicTextureBlue, r.THIN_FILM_THICKNESS_FROM_THIN_FILM_TEXTURE = this._useThinFilmThicknessFromTextureGreen, r.GEOMETRY_THICKNESS_FROM_GREEN_CHANNEL = this._useGeometryThicknessFromGreenChannel, this.geometryNormalTexture ? (this._useParallax && this.baseColorTexture && D.DiffuseTextureEnabled ? (r.PARALLAX = !0, r.PARALLAX_RHS = s.useRightHandedSystem, r.PARALLAXOCCLUSION = !!this._useParallaxOcclusion) : r.PARALLAX = !1, r.OBJECTSPACE_NORMALMAP = this._useObjectSpaceNormalMap) : (r.PARALLAX = !1, r.PARALLAX_RHS = !1, r.PARALLAXOCCLUSION = !1, r.OBJECTSPACE_NORMALMAP = !1), this._environmentBRDFTexture && D.ReflectionTextureEnabled ? (r.ENVIRONMENTBRDF = !0, r.ENVIRONMENTBRDF_RGBD = this._environmentBRDFTexture.isRGBD) : (r.ENVIRONMENTBRDF = !1, r.ENVIRONMENTBRDF_RGBD = !1), this._environmentFuzzBRDFTexture ? r.FUZZENVIRONMENTBRDF = !0 : r.FUZZENVIRONMENTBRDF = !1, this.hasTransparency) {
					r.REFRACTED_BACKGROUND = !!this._backgroundRefractionTexture && D.RefractionTextureEnabled, r.REFRACTED_LIGHTS = !0;
					let e = this._getRadianceTexture();
					e ? (r.REFRACTED_ENVIRONMENT = D.RefractionTextureEnabled, r.REFRACTED_ENVIRONMENT_OPPOSITEZ = this.getScene().useRightHandedSystem ? !e.invertZ : e.invertZ, r.REFRACTED_ENVIRONMENT_LOCAL_CUBE = e.isCube && e.boundingBoxSize) : r.REFRACTED_ENVIRONMENT = !1;
				} else r.REFRACTED_BACKGROUND = !1, r.REFRACTED_LIGHTS = !1, r.REFRACTED_ENVIRONMENT = !1;
				this._shouldUseAlphaFromBaseColorTexture() ? r.ALPHA_FROM_BASE_COLOR_TEXTURE = !0 : r.ALPHA_FROM_BASE_COLOR_TEXTURE = !1;
			}
			this._lightFalloff === I.LIGHTFALLOFF_STANDARD ? (r.USEPHYSICALLIGHTFALLOFF = !1, r.USEGLTFLIGHTFALLOFF = !1) : this._lightFalloff === I.LIGHTFALLOFF_GLTF ? (r.USEPHYSICALLIGHTFALLOFF = !1, r.USEGLTFLIGHTFALLOFF = !0) : (r.USEPHYSICALLIGHTFALLOFF = !0, r.USEGLTFLIGHTFALLOFF = !1), !this.backFaceCulling && this._twoSidedLighting ? r.TWOSIDEDLIGHTING = !0 : r.TWOSIDEDLIGHTING = !1, r.MIRRORED = !!s._mirroredCameraPosition, r.SPECULARAA = c.getCaps().standardDerivatives && this._enableSpecularAntiAliasing;
		}
		if ((r._areTexturesDirty || r._areMiscDirty) && (r.ALPHATESTVALUE = `${this._alphaCutOff}${this._alphaCutOff % 1 == 0 ? "." : ""}`, r.PREMULTIPLYALPHA = this.alphaMode === 7 || this.alphaMode === 8, r.ALPHABLEND = this.needAlphaBlendingForMesh(t)), r._areImageProcessingDirty && this._imageProcessingConfiguration && this._imageProcessingConfiguration.prepareDefines(r), r.FORCENORMALFORWARD = this._forceNormalForward, r.RADIANCEOCCLUSION = this._useRadianceOcclusion, r.HORIZONOCCLUSION = this._useHorizonOcclusion, (this.specularRoughnessAnisotropy > 0 || this.coatRoughnessAnisotropy > 0) && e._noiseTextures[s.uniqueId] && D.ReflectionTextureEnabled ? (r.ANISOTROPIC = !0, t.isVerticesDataPresent(b.TangentKind) || (r._needUVs = !0, r.MAINUV1 = !0), this._useGltfStyleAnisotropy && (r.USE_GLTF_STYLE_ANISOTROPY = !0), r.ANISOTROPIC_BASE = this.specularRoughnessAnisotropy > 0, r.ANISOTROPIC_COAT = this.coatRoughnessAnisotropy > 0) : (r.ANISOTROPIC = !1, r.USE_GLTF_STYLE_ANISOTROPY = !1, r.ANISOTROPIC_BASE = !1, r.ANISOTROPIC_COAT = !1), r.THIN_FILM = this.thinFilmWeight > 0, r.IRIDESCENCE = this.thinFilmWeight > 0, r.DISPERSION = this.transmissionDispersionScale > 0, r.SCATTERING = this.hasScattering, r.TRANSMISSION_SLAB = this.transmissionWeight > 0, r.TRANSMISSION_SLAB_VOLUME = this.transmissionWeight > 0 && this.transmissionDepth > 0, r.SUBSURFACE_SLAB = this.subsurfaceWeight > 0, !r.PREPASS && (r.SUBSURFACE_SLAB || r.TRANSMISSION_SLAB_VOLUME)) {
			if (!this.sssIrradianceTexture && s.geometryBufferRenderer) {
				let e = s.geometryBufferRenderer.getTextureIndex(q.IRRADIANCE_TEXTURE_TYPE);
				this.sssIrradianceTexture = s.geometryBufferRenderer.getGBuffer().textures[e];
			}
			if (!this.sssDepthTexture && s.geometryBufferRenderer) {
				let e = s.geometryBufferRenderer.getTextureIndex(q.SCREENSPACE_DEPTH_TEXTURE_TYPE);
				this.sssDepthTexture = s.geometryBufferRenderer.getGBuffer().textures[e];
			}
			this.sssIrradianceTexture && this.sssDepthTexture && (r.USE_IRRADIANCE_TEXTURE_FOR_SCATTERING = !0);
		}
		r.FUZZ = this.fuzzWeight > 0 && D.ReflectionTextureEnabled, r.GEOMETRY_THIN_WALLED = this.geometryThinWalled != 0, r.FUZZ ? (t.isVerticesDataPresent(b.TangentKind) || (r._needUVs = !0, r.MAINUV1 = !0), this._environmentFuzzBRDFTexture = B(this.getScene()), r.FUZZ_IBL_SAMPLES = this.fuzzSampleNumber) : (this._environmentFuzzBRDFTexture = null, r.FUZZENVIRONMENTBRDF = !1, r.FUZZ_IBL_SAMPLES = 0), r._areMiscDirty && (k(t, s, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this.needAlphaTestingForMesh(t), r, this._applyDecalMapAfterDetailMap, this._useVertexPulling, n, this._isVertexOutputInvariant), r.UNLIT = this._unlit || (this.pointsCloud || this.wireframe) && !t.isVerticesDataPresent(b.NormalKind), r.DEBUGMODE = this._debugMode), te(s, c, this, r, !!i, a, o), this._eventInfo.defines = r, this._eventInfo.mesh = t, this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo), x(t, r, !0, !0, !0, this._transparencyMode !== I.MATERIAL_OPAQUE), this._callbackPluginEventPrepareDefines(this._eventInfo);
	}
};
$._noiseTextures = {}, $.ForceGLSL = !1, f([h("_markAllSubMeshesAsTexturesDirty", "baseWeight")], $.prototype, "_baseWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseWeightTexture")], $.prototype, "_baseWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseColor")], $.prototype, "_baseColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseColorTexture")], $.prototype, "_baseColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseDiffuseRoughness")], $.prototype, "_baseDiffuseRoughness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseDiffuseRoughnessTexture")], $.prototype, "_baseDiffuseRoughnessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseMetalness")], $.prototype, "_baseMetalness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "baseMetalnessTexture")], $.prototype, "_baseMetalnessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularWeight")], $.prototype, "_specularWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularWeightTexture")], $.prototype, "_specularWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularColor")], $.prototype, "_specularColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularColorTexture")], $.prototype, "_specularColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularRoughness")], $.prototype, "_specularRoughness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularRoughnessTexture")], $.prototype, "_specularRoughnessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularRoughnessAnisotropy")], $.prototype, "_specularRoughnessAnisotropy", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularRoughnessAnisotropyTexture")], $.prototype, "_specularRoughnessAnisotropyTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "specularIor")], $.prototype, "_specularIor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionWeight")], $.prototype, "_transmissionWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionWeightTexture")], $.prototype, "_transmissionWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionColor")], $.prototype, "_transmissionColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionColorTexture")], $.prototype, "_transmissionColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionDepth")], $.prototype, "_transmissionDepth", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionDepthTexture")], $.prototype, "_transmissionDepthTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionScatter")], $.prototype, "_transmissionScatter", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionScatterTexture")], $.prototype, "_transmissionScatterTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionScatterAnisotropy")], $.prototype, "_transmissionScatterAnisotropy", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionDispersionScale")], $.prototype, "_transmissionDispersionScale", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionDispersionScaleTexture")], $.prototype, "_transmissionDispersionScaleTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "transmissionDispersionAbbeNumber")], $.prototype, "_transmissionDispersionAbbeNumber", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceWeight")], $.prototype, "_subsurfaceWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceWeightTexture")], $.prototype, "_subsurfaceWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceColor")], $.prototype, "_subsurfaceColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceColorTexture")], $.prototype, "_subsurfaceColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceRadius")], $.prototype, "_subsurfaceRadius", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceRadiusScale")], $.prototype, "_subsurfaceRadiusScale", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceRadiusScaleTexture")], $.prototype, "_subsurfaceRadiusScaleTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "subsurfaceScatterAnisotropy")], $.prototype, "_subsurfaceScatterAnisotropy", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatWeight")], $.prototype, "_coatWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatWeightTexture")], $.prototype, "_coatWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatColor")], $.prototype, "_coatColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatColorTexture")], $.prototype, "_coatColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatRoughness")], $.prototype, "_coatRoughness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatRoughnessTexture")], $.prototype, "_coatRoughnessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatRoughnessAnisotropy")], $.prototype, "_coatRoughnessAnisotropy", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatRoughnessAnisotropyTexture")], $.prototype, "_coatRoughnessAnisotropyTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatIor")], $.prototype, "_coatIor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatDarkening")], $.prototype, "_coatDarkening", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "coatDarkeningTexture")], $.prototype, "_coatDarkeningTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "fuzzWeight")], $.prototype, "_fuzzWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "fuzzWeightTexture")], $.prototype, "_fuzzWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "fuzzColor")], $.prototype, "_fuzzColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "fuzzColorTexture")], $.prototype, "_fuzzColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "fuzzRoughness")], $.prototype, "_fuzzRoughness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "fuzzRoughnessTexture")], $.prototype, "_fuzzRoughnessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryThinWalled")], $.prototype, "_geometryThinWalled", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryNormalTexture")], $.prototype, "_geometryNormalTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryTangent")], $.prototype, "_geometryTangent", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryTangentTexture")], $.prototype, "_geometryTangentTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryCoatNormalTexture")], $.prototype, "_geometryCoatNormalTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryCoatTangent")], $.prototype, "_geometryCoatTangent", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryCoatTangentTexture")], $.prototype, "_geometryCoatTangentTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryOpacity")], $.prototype, "_geometryOpacity", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryOpacityTexture")], $.prototype, "_geometryOpacityTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryThickness")], $.prototype, "_geometryThickness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "geometryThicknessTexture")], $.prototype, "_geometryThicknessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "emissionLuminance")], $.prototype, "_emissionLuminance", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "emissionColor")], $.prototype, "_emissionColor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "emissionColorTexture")], $.prototype, "_emissionColorTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "thinFilmWeight")], $.prototype, "_thinFilmWeight", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "thinFilmWeightTexture")], $.prototype, "_thinFilmWeightTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "thinFilmThickness")], $.prototype, "_thinFilmThickness", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "thinFilmThicknessMin")], $.prototype, "_thinFilmThicknessMin", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "thinFilmThicknessTexture")], $.prototype, "_thinFilmThicknessTexture", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "thinFilmIor")], $.prototype, "_thinFilmIor", void 0), f([h("_markAllSubMeshesAsTexturesDirty", "ambientOcclusionTexture")], $.prototype, "_ambientOcclusionTexture", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "directIntensity", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "environmentIntensity", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useSpecularWeightFromTextureAlpha", void 0), f([p(), m("_markAllSubMeshesAsTexturesAndMiscDirty")], $.prototype, "forceAlphaTest", void 0), f([p(), m("_markAllSubMeshesAsTexturesAndMiscDirty")], $.prototype, "alphaCutOff", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useAmbientOcclusionFromMetallicTextureRed", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useAmbientInGrayScale", void 0), f([p()], $.prototype, "usePhysicalLightFalloff", null), f([p()], $.prototype, "useGLTFLightFalloff", null), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useObjectSpaceNormalMap", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useParallax", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useParallaxOcclusion", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "parallaxScaleBias", void 0), f([p(), m("_markAllSubMeshesAsLightsDirty")], $.prototype, "disableLighting", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "forceIrradianceInFragment", void 0), f([p(), m("_markAllSubMeshesAsLightsDirty")], $.prototype, "maxSimultaneousLights", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "invertNormalMapX", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "invertNormalMapY", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "twoSidedLighting", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useAlphaFresnel", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useLinearAlphaFresnel", void 0), f([m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "environmentBRDFTexture", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "forceNormalForward", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "enableSpecularAntiAliasing", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useHorizonOcclusion", void 0), f([p(), m("_markAllSubMeshesAsTexturesDirty")], $.prototype, "useRadianceOcclusion", void 0), f([p(), m("_markAllSubMeshesAsMiscDirty")], $.prototype, "unlit", void 0), f([p(), m("_markAllSubMeshesAsMiscDirty")], $.prototype, "applyDecalMapAfterDetailMap", void 0), f([m("_markAllSubMeshesAsMiscDirty")], $.prototype, "debugMode", void 0), f([p()], $.prototype, "transparencyMode", null), i("BABYLON.OpenPBRMaterial", $);
//#endregion
export { $ as OpenPBRMaterial };

//# sourceMappingURL=openpbrMaterial-Xm7WqwcN.js.map