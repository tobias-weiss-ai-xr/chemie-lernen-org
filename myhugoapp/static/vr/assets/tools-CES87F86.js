import { t as e } from "./observable-D7x0jL6J.js";
import { E as t, i as n, l as r, m as i, o as a, r as o } from "./tools.functions-Dgi_rE0R.js";
import { n as s } from "./performanceConfigurator-DMA6Ub5Z.js";
import { t as c } from "./logger-B7TbbsLc.js";
import { a as l, i as u, n as d, t as f } from "./precisionDate-bmQoyfr9.js";
import { t as p } from "./devTools-LMnNz6iC.js";
import { t as m } from "./typeStore-Bwo5hkCf.js";
import { t as h } from "./guid-CAqeuNf_.js";
import { t as g } from "./webRequest-DpJBqzQO.js";
//#region node_modules/@babylonjs/core/Misc/filesInputStore.js
var _ = class {};
_.FilesToLoad = {};
//#endregion
//#region node_modules/@babylonjs/core/Misc/retryStrategy.js
var v = class {
	static ExponentialBackoff(e = 3, t = 500) {
		return (n, r, i) => r.status !== 0 || i >= e || n.indexOf("file:") !== -1 ? -1 : 2 ** i * t;
	}
}, y = class extends Error {};
y._setPrototypeOf = Object.setPrototypeOf || ((e, t) => (e.__proto__ = t, e));
var b = {
	MeshInvalidPositionsError: 0,
	UnsupportedTextureError: 1e3,
	GLTFLoaderUnexpectedMagicError: 2e3,
	SceneLoaderError: 3e3,
	LoadFileError: 4e3,
	RequestFileError: 4001,
	ReadFileError: 4002
}, x = class e extends y {
	constructor(t, n, r) {
		super(t), this.errorCode = n, this.innerError = r, this.name = "RuntimeError", y._setPrototypeOf(this, e.prototype);
	}
}, ee = (e) => {
	if (typeof TextDecoder < "u") return new TextDecoder().decode(e);
	let t = "";
	for (let n = 0; n < e.byteLength; n++) t += String.fromCharCode(e[n]);
	return t;
};
function te(e) {
	let t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", n = "", r, i, a, o, s, c, l, u = 0;
	for (; u < e.length;) r = e[u++], i = u < e.length ? e[u++] : NaN, a = u < e.length ? e[u++] : NaN, o = r >> 2, s = (r & 3) << 4 | i >> 4, c = (i & 15) << 2 | a >> 6, l = a & 63, isNaN(i) ? c = l = 64 : isNaN(a) && (l = 64), n += t.charAt(o) + t.charAt(s) + t.charAt(c) + t.charAt(l);
	return n;
}
function S(e) {
	let t = w(e), n = t.length, r = new Uint8Array(new ArrayBuffer(n));
	for (let e = 0; e < n; e++) r[e] = t.charCodeAt(e);
	return r.buffer;
}
var C = (e) => {
	let t = ArrayBuffer.isView(e) ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : new Uint8Array(e);
	return t.toBase64 ? t.toBase64() : te(t);
}, w = (e) => atob(e), T = (e) => Uint8Array.fromBase64 ? Uint8Array.fromBase64(e).buffer : S(e);
//#endregion
//#region node_modules/@babylonjs/core/Buffers/bufferUtils.js
function E(e, t, n, r) {
	switch (t) {
		case 5120: {
			let t = e.getInt8(n);
			return r && (t = Math.max(t / 127, -1)), t;
		}
		case 5121: {
			let t = e.getUint8(n);
			return r && (t /= 255), t;
		}
		case 5122: {
			let t = e.getInt16(n, !0);
			return r && (t = Math.max(t / 32767, -1)), t;
		}
		case 5123: {
			let t = e.getUint16(n, !0);
			return r && (t /= 65535), t;
		}
		case 5124: return e.getInt32(n, !0);
		case 5125: return e.getUint32(n, !0);
		case 5126: return e.getFloat32(n, !0);
		default: throw Error(`Invalid component type ${t}`);
	}
}
function D(e, t, n, r, i) {
	switch (t) {
		case 5120:
			r && (i = Math.round(i * 127)), e.setInt8(n, i);
			break;
		case 5121:
			r && (i = Math.round(i * 255)), e.setUint8(n, i);
			break;
		case 5122:
			r && (i = Math.round(i * 32767)), e.setInt16(n, i, !0);
			break;
		case 5123:
			r && (i = Math.round(i * 65535)), e.setUint16(n, i, !0);
			break;
		case 5124:
			e.setInt32(n, i, !0);
			break;
		case 5125:
			e.setUint32(n, i, !0);
			break;
		case 5126:
			e.setFloat32(n, i, !0);
			break;
		default: throw Error(`Invalid component type ${t}`);
	}
}
function O(e) {
	switch (e) {
		case 5120:
		case 5121: return 1;
		case 5122:
		case 5123: return 2;
		case 5124:
		case 5125:
		case 5126: return 4;
		default: throw Error(`Invalid type '${e}'`);
	}
}
function k(e) {
	switch (e) {
		case 5120: return Int8Array;
		case 5121: return Uint8Array;
		case 5122: return Int16Array;
		case 5123: return Uint16Array;
		case 5124: return Int32Array;
		case 5125: return Uint32Array;
		case 5126: return Float32Array;
		default: throw Error(`Invalid component type '${e}'`);
	}
}
function A(e, t, n, r, i, a, o, s) {
	let c = Array(r), l = Array(r);
	if (e instanceof Array) {
		let i = t / 4, o = n / 4;
		for (let t = 0; t < a; t += r) {
			for (let t = 0; t < r; t++) c[t] = l[t] = e[i + t];
			s(l, t);
			for (let t = 0; t < r; t++) c[t] !== l[t] && (e[i + t] = l[t]);
			i += o;
		}
	} else {
		let u = ArrayBuffer.isView(e) ? new DataView(e.buffer, e.byteOffset, e.byteLength) : new DataView(e), d = O(i);
		for (let e = 0; e < a; e += r) {
			for (let e = 0, n = t; e < r; e++, n += d) c[e] = l[e] = E(u, i, n, o);
			s(l, e);
			for (let e = 0, n = t; e < r; e++, n += d) c[e] !== l[e] && D(u, i, n, o, l[e]);
			t += n;
		}
	}
}
function ne(e, t, n, r, i, a, o, s) {
	let l = t * O(n), u = o * t;
	if (n !== 5126 || i !== l) {
		let o = new Float32Array(u);
		return A(e, r, i, t, n, u, a, (e, n) => {
			for (let r = 0; r < t; r++) o[n + r] = e[r];
		}), o;
	}
	if (!(e instanceof Array || e instanceof Float32Array) || r !== 0 || e.length !== u) if (e instanceof Array) {
		let t = r / 4;
		return e.slice(t, t + u);
	} else if (ArrayBuffer.isView(e)) {
		let t = e.byteOffset + r;
		return t & 3 && (c.Warn("Float array must be aligned to 4-bytes border"), s = !0), s ? new Float32Array(e.buffer.slice(t, t + u * Float32Array.BYTES_PER_ELEMENT)) : new Float32Array(e.buffer, t, u);
	} else return new Float32Array(e, r, u);
	return s ? e.slice() : e;
}
function re(e, t, n, r, i, a, o) {
	let s = O(n), l = k(n), u = a * t;
	if (Array.isArray(e)) {
		if (r & 3 || i & 3) throw Error("byteOffset and byteStride must be a multiple of 4 for number[] data.");
		let o = r / 4, s = i / 4;
		if (o + (a - 1) * s + t > e.length) throw Error("Last accessed index is out of bounds.");
		if (s < t) throw Error("Data stride cannot be smaller than the component size.");
		if (s !== t) {
			let a = new l(u);
			return A(e, r, i, t, n, u, !1, (e, n) => {
				for (let r = 0; r < t; r++) a[n + r] = e[r];
			}), a;
		}
		return new l(e.slice(o, o + u));
	}
	let d, f = r;
	if (ArrayBuffer.isView(e) ? (d = e.buffer, f += e.byteOffset) : d = e, f + (a - 1) * i + t * s > d.byteLength) throw Error("Last accessed byte is out of bounds.");
	let p = t * s;
	if (i < p) throw Error("Byte stride cannot be smaller than the component's byte size.");
	if (i !== p) {
		let e = new l(u);
		return A(d, f, i, t, n, u, !1, (n, r) => {
			for (let i = 0; i < t; i++) e[r + i] = n[i];
		}), e;
	}
	return s !== 1 && f & s - 1 && (c.Warn("Array must be aligned to border of element size. Data will be copied."), o = !0), o ? new l(d.slice(f, f + u * s)) : new l(d, f, u);
}
function ie(e, t, n, r, i, a, o, s) {
	let l = t * O(n), u = o * t;
	if (s.length !== u) throw Error("Output length is not valid");
	if (n !== 5126 || i !== l) {
		A(e, r, i, t, n, u, a, (e, n) => {
			for (let r = 0; r < t; r++) s[n + r] = e[r];
		});
		return;
	}
	if (e instanceof Array) {
		let t = r / 4;
		s.set(e, t);
	} else if (ArrayBuffer.isView(e)) {
		let t = e.byteOffset + r;
		if (t & 3) {
			c.Warn("Float array must be aligned to 4-bytes border"), s.set(new Float32Array(e.buffer.slice(t, t + u * Float32Array.BYTES_PER_ELEMENT)));
			return;
		}
		let n = new Float32Array(e.buffer, t, u);
		s.set(n);
	} else {
		let t = new Float32Array(e, r, u);
		s.set(t);
	}
}
function j(e) {
	let t = e.buffer;
	if (t instanceof ArrayBuffer) return e;
	let n = new ArrayBuffer(e.byteLength);
	return new Uint8Array(n).set(new Uint8Array(t, e.byteOffset, e.byteLength)), n;
}
//#endregion
//#region node_modules/@babylonjs/core/Misc/fileTools.js
var M = /* @__PURE__ */ new RegExp(/^data:([^,]+\/[^,]+)?;base64,/i), N = class e extends x {
	constructor(t, n) {
		super(t, b.LoadFileError), this.name = "LoadFileError", y._setPrototypeOf(this, e.prototype), n instanceof g ? this.request = n : this.file = n;
	}
}, P = class e extends x {
	constructor(t, n) {
		super(t, b.RequestFileError), this.request = n, this.name = "RequestFileError", y._setPrototypeOf(this, e.prototype);
	}
}, F = class e extends x {
	constructor(t, n) {
		super(t, b.ReadFileError), this.file = n, this.name = "ReadFileError", y._setPrototypeOf(this, e.prototype);
	}
}, I = {
	DefaultRetryStrategy: v.ExponentialBackoff(),
	BaseUrl: "",
	CorsBehavior: "anonymous",
	PreprocessUrl: (e) => e,
	ScriptBaseUrl: "",
	ScriptPreprocessUrl: (e) => e,
	CleanUrl: (e) => (e = e.replace(/#/gm, "%23"), e)
}, L = (e, t) => {
	if (!(e && e.indexOf("data:") === 0) && I.CorsBehavior) if (typeof I.CorsBehavior == "string" || I.CorsBehavior instanceof String) t.crossOrigin = I.CorsBehavior;
	else {
		let n = I.CorsBehavior(e);
		n && (t.crossOrigin = n);
	}
}, R = { getRequiredSize: null }, z = (e, t, n, r, i = "", a, o = s.LastCreatedEngine) => {
	if (typeof HTMLImageElement > "u" && !o?._features.forceBitmapOverHTMLImageElement) return n("LoadImage is only supported in web or BabylonNative environments."), null;
	let c, l = !1;
	if (e instanceof ArrayBuffer || ArrayBuffer.isView(e)) if (typeof Blob < "u" && typeof URL < "u") {
		let t;
		t = e instanceof ArrayBuffer ? e : j(e), c = URL.createObjectURL(new Blob([t], { type: i })), l = !0;
	} else c = `data:${i};base64,` + C(e);
	else e instanceof Blob ? (c = URL.createObjectURL(e), l = !0) : (c = I.CleanUrl(e), c = I.PreprocessUrl(c));
	let u = (t) => {
		if (n) {
			let r = c || e.toString();
			n(`Error while trying to load image: ${r.indexOf("http") === 0 || r.length <= 128 ? r : r.slice(0, 128) + "..."}`, t);
		}
	};
	if (o?._features.forceBitmapOverHTMLImageElement) return V(c, (r) => {
		o.createImageBitmap(new Blob([r], { type: i }), {
			premultiplyAlpha: "none",
			colorSpaceConversion: "none",
			...a
		}).then((e) => {
			t(e), l && URL.revokeObjectURL(c);
		}).catch((t) => {
			n && n("Error while trying to load image: " + e, t);
		});
	}, void 0, r || void 0, !0, (e, t) => {
		u(t);
	}), null;
	let d = new Image();
	if (R.getRequiredSize) {
		let t = R.getRequiredSize(e);
		t.width && (d.width = t.width), t.height && (d.height = t.height);
	}
	L(c, d);
	let f = [], p = () => {
		for (let e of f) e.target.addEventListener(e.name, e.handler);
	}, m = () => {
		for (let e of f) e.target.removeEventListener(e.name, e.handler);
		f.length = 0;
	};
	f.push({
		target: d,
		name: "load",
		handler: () => {
			m(), t(d), l && d.src && URL.revokeObjectURL(d.src);
		}
	}), f.push({
		target: d,
		name: "error",
		handler: (e) => {
			m(), u(e), l && d.src && URL.revokeObjectURL(d.src);
		}
	}), f.push({
		target: document,
		name: "securitypolicyviolation",
		handler: (e) => {
			if (e.blockedURI !== d.src || e.disposition === "report") return;
			m();
			let t = /* @__PURE__ */ Error(`CSP violation of policy ${e.effectiveDirective} ${e.blockedURI}. Current policy is ${e.originalPolicy}`);
			s.UseFallbackTexture = !1, u(t), l && d.src && URL.revokeObjectURL(d.src), d.src = "";
		}
	}), p();
	let h = c.substring(0, 5) === "blob:", v = c.substring(0, 5) === "data:", y = () => {
		h || v || !g.IsCustomRequestAvailable ? d.src = c : V(c, (e, t, n) => {
			let r = new Blob([e], { type: !i && n ? n : i }), a = URL.createObjectURL(r);
			l = !0, d.src = a;
		}, void 0, r || void 0, !0, (e, t) => {
			u(t);
		});
	}, b = () => {
		r && r.loadImage(c, d);
	};
	if (!h && !v && r && r.enableTexturesOffline) r.open(b, y);
	else {
		if (c.indexOf("file:") !== -1) {
			let e = decodeURIComponent(c.substring(5).toLowerCase());
			if (_.FilesToLoad[e] && typeof URL < "u") {
				try {
					let t;
					try {
						t = URL.createObjectURL(_.FilesToLoad[e]);
					} catch {
						t = URL.createObjectURL(_.FilesToLoad[e]);
					}
					d.src = t, l = !0;
				} catch {
					d.src = "";
				}
				return d;
			}
		}
		y();
	}
	return d;
}, B = (t, n, r, i, a) => {
	let o = new FileReader(), s = {
		onCompleteObservable: new e(),
		abort: () => o.abort()
	};
	return o.onloadend = () => s.onCompleteObservable.notifyObservers(s), a && (o.onerror = () => {
		a(new F(`Unable to read ${t.name}`, t));
	}), o.onload = (e) => {
		n(e.target.result);
	}, r && (o.onprogress = r), i ? o.readAsArrayBuffer(t) : o.readAsText(t), s;
}, V = (t, n, i, a, o, s, l) => {
	if (t.name) return B(t, n, i, o, s ? (e) => {
		s(void 0, e);
	} : void 0);
	let u = t;
	if (u.indexOf("file:") !== -1) {
		let e = decodeURIComponent(u.substring(5).toLowerCase());
		e.indexOf("./") === 0 && (e = e.substring(2));
		let t = _.FilesToLoad[e];
		if (t) return B(t, n, i, o, s ? (e) => s(void 0, new N(e.message, e.file)) : void 0);
	}
	let { match: d, type: f } = G(u);
	if (d) {
		let t = {
			onCompleteObservable: new e(),
			abort: () => () => {}
		};
		try {
			n(o ? K(u) : q(u), void 0, f);
		} catch (e) {
			s ? s(void 0, e) : c.Error(e.message || "Failed to parse the Data URL");
		}
		return r.SetImmediate(() => {
			t.onCompleteObservable.notifyObservers(t);
		}), t;
	}
	return H(u, (e, t) => {
		n(e, t?.responseURL, t?.getResponseHeader("content-type"));
	}, i, a, o, s ? (e) => {
		s(e.request, new N(e.message, e.request));
	} : void 0, l);
}, H = (t, n, r, i, a, o, u) => {
	i !== null && (i ??= s.LastCreatedScene?.offlineProvider), t = I.CleanUrl(t), t = I.PreprocessUrl(t);
	let d = I.BaseUrl + t, f = !1, p = {
		onCompleteObservable: new e(),
		abort: () => f = !0
	}, m = () => {
		let e = new g(), t = null, i, s = () => {
			e && (r && e.removeEventListener("progress", r), i && e.removeEventListener("readystatechange", i), e.removeEventListener("loadend", m));
		}, m = () => {
			s(), p.onCompleteObservable.notifyObservers(p), p.onCompleteObservable.clear(), r = void 0, i = null, m = null, o = void 0, u = void 0, n = void 0;
		};
		p.abort = () => {
			f = !0, m && m(), e && e.readyState !== (XMLHttpRequest.DONE || 4) && e.abort(), t !== null && (clearTimeout(t), t = null), e = null;
		};
		let h = (t) => {
			let n = t.message || "Unknown error";
			o && e ? o(new P(n, e)) : c.Error(n);
		}, _ = (c) => {
			if (e) {
				if (e.open("GET", d), u) try {
					u(e);
				} catch (e) {
					h(e);
					return;
				}
				a && (e.responseType = "arraybuffer"), r && e.addEventListener("progress", r), m && e.addEventListener("loadend", m), i = () => {
					if (!(f || !e) && e.readyState === (XMLHttpRequest.DONE || 4)) {
						if (i && e.removeEventListener("readystatechange", i), e.status >= 200 && e.status < 300 || e.status === 0 && (!l() || U())) {
							let t = a ? e.response : e.responseText;
							if (t !== null) {
								try {
									n && n(t, e);
								} catch (e) {
									h(e);
								}
								return;
							}
						}
						let r = I.DefaultRetryStrategy;
						if (r) {
							let n = r(d, e, c);
							if (n !== -1) {
								s(), e = new g(), t = setTimeout(() => _(c + 1), n);
								return;
							}
						}
						let u = new P("Error status: " + e.status + " " + e.statusText + " - Unable to load " + d, e);
						o && o(u);
					}
				}, e.addEventListener("readystatechange", i), e.send();
			}
		};
		_(0);
	};
	if (i && i.enableSceneOffline && !t.startsWith("blob:")) {
		let e = (e) => {
			e && e.status > 400 ? o && o(e) : m();
		};
		i.open(() => {
			i && i.loadFile(I.BaseUrl + t, (e) => {
				!f && n && n(e), p.onCompleteObservable.notifyObservers(p);
			}, r ? (e) => {
				!f && r && r(e);
			} : void 0, e, a);
		}, e);
	} else m();
	return p;
}, ae = (e) => {
	let { match: t, type: n } = G(e);
	if (t) return n || void 0;
	let r = e.lastIndexOf(".");
	switch (e.substring(r + 1).toLowerCase()) {
		case "glb": return "model/gltf-binary";
		case "bin": return "application/octet-stream";
		case "gltf": return "model/gltf+json";
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "png": return "image/png";
		case "webp": return "image/webp";
		case "ktx": return "image/ktx";
		case "ktx2": return "image/ktx2";
		case "avif": return "image/avif";
		default: return;
	}
}, U = () => typeof location < "u" && location.protocol === "file:", W = (e) => M.test(e), G = (e) => {
	let t = M.exec(e);
	return t === null || t.length === 0 ? {
		match: !1,
		type: ""
	} : {
		match: !0,
		type: t[0].replace("data:", "").replace(";base64,", "")
	};
};
function K(e) {
	return T(e.split(",")[1]);
}
var q = (e) => w(e.split(",")[1]);
a._FileToolsLoadImage = z, t.loadFile = V, i.loadFile = V;
var J;
((e, t, n, r, i, a, o, s, c, l) => {
	J = {
		DecodeBase64UrlToBinary: e,
		DecodeBase64UrlToString: t,
		DefaultRetryStrategy: n.DefaultRetryStrategy,
		BaseUrl: n.BaseUrl,
		CorsBehavior: n.CorsBehavior,
		PreprocessUrl: n.PreprocessUrl,
		IsBase64DataUrl: r,
		IsFileURL: i,
		LoadFile: a,
		LoadImage: o,
		ReadFile: s,
		RequestFile: c,
		SetCorsBehavior: l
	}, Object.defineProperty(J, "DefaultRetryStrategy", {
		get: function() {
			return n.DefaultRetryStrategy;
		},
		set: function(e) {
			n.DefaultRetryStrategy = e;
		}
	}), Object.defineProperty(J, "BaseUrl", {
		get: function() {
			return n.BaseUrl;
		},
		set: function(e) {
			n.BaseUrl = e;
		}
	}), Object.defineProperty(J, "PreprocessUrl", {
		get: function() {
			return n.PreprocessUrl;
		},
		set: function(e) {
			n.PreprocessUrl = e;
		}
	}), Object.defineProperty(J, "CorsBehavior", {
		get: function() {
			return n.CorsBehavior;
		},
		set: function(e) {
			n.CorsBehavior = e;
		}
	});
})(K, q, I, W, U, V, z, B, H, L);
//#endregion
//#region node_modules/@babylonjs/core/Misc/deepCopier.js
var Y = (e, t, n) => !e || e.getClassName && e.getClassName() === "Mesh" ? null : e.getClassName && (e.getClassName() === "SubMesh" || e.getClassName() === "PhysicsBody") ? e.clone(t) : e.clone ? e.clone() : Array.isArray(e) ? e.slice() : n && typeof e == "object" ? { ...e } : null;
function oe(e) {
	let t = [];
	do {
		let n = Object.getOwnPropertyNames(e);
		for (let e of n) t.indexOf(e) === -1 && t.push(e);
	} while (e = Object.getPrototypeOf(e));
	return t;
}
var X = class {
	static DeepCopy(e, t, n, r, i = !1) {
		let a = oe(e);
		for (let o of a) {
			if (o[0] === "_" && (!r || r.indexOf(o) === -1) || o.endsWith("Observable") || n && n.indexOf(o) !== -1) continue;
			let a = e[o], s = typeof a;
			if (s !== "function") try {
				if (s === "object") if (a instanceof Uint8Array) t[o] = Uint8Array.from(a);
				else if (a instanceof Array) {
					if (t[o] = [], a.length > 0) if (typeof a[0] == "object") for (let e = 0; e < a.length; e++) {
						let n = Y(a[e], t, i);
						t[o].indexOf(n) === -1 && t[o].push(n);
					}
					else t[o] = a.slice(0);
				} else t[o] = Y(a, t, i);
				else t[o] = a;
			} catch (e) {
				c.Warn(e.message);
			}
		}
	}
}, Z = class {
	static Instantiate(e) {
		if (this.RegisteredExternalClasses && this.RegisteredExternalClasses[e]) return this.RegisteredExternalClasses[e];
		let t = m(e);
		if (t) return t;
		c.Warn(e + " not found, you may have missed an import.");
		let n = e.split("."), r = window || this;
		for (let e = 0, t = n.length; e < t; e++) r = r[n[e]];
		return typeof r == "function" ? r : null;
	}
};
Z.RegisteredExternalClasses = {};
//#endregion
//#region node_modules/@babylonjs/core/Misc/tools.js
var Q, $ = class {
	static get BaseUrl() {
		return I.BaseUrl;
	}
	static set BaseUrl(e) {
		I.BaseUrl = e;
	}
	static get CleanUrl() {
		return I.CleanUrl;
	}
	static set CleanUrl(e) {
		I.CleanUrl = e;
	}
	static IsAbsoluteUrl(e) {
		return e.indexOf("//") === 0 ? !0 : e.indexOf("://") === -1 || e.indexOf(".") === -1 || e.indexOf("/") === -1 || e.indexOf(":") > e.indexOf("/") ? !1 : e.indexOf("://") < e.indexOf(".") || e.indexOf("data:") === 0 || e.indexOf("blob:") === 0;
	}
	static set ScriptBaseUrl(e) {
		I.ScriptBaseUrl = e;
	}
	static get ScriptBaseUrl() {
		return I.ScriptBaseUrl;
	}
	static set CDNBaseUrl(e) {
		Q.ScriptBaseUrl = e, Q.AssetBaseUrl = e;
	}
	static set ScriptPreprocessUrl(e) {
		I.ScriptPreprocessUrl = e;
	}
	static get ScriptPreprocessUrl() {
		return I.ScriptPreprocessUrl;
	}
	static get DefaultRetryStrategy() {
		return I.DefaultRetryStrategy;
	}
	static set DefaultRetryStrategy(e) {
		I.DefaultRetryStrategy = e;
	}
	static get CorsBehavior() {
		return I.CorsBehavior;
	}
	static set CorsBehavior(e) {
		I.CorsBehavior = e;
	}
	static get UseFallbackTexture() {
		return s.UseFallbackTexture;
	}
	static set UseFallbackTexture(e) {
		s.UseFallbackTexture = e;
	}
	static get RegisteredExternalClasses() {
		return Z.RegisteredExternalClasses;
	}
	static set RegisteredExternalClasses(e) {
		Z.RegisteredExternalClasses = e;
	}
	static get fallbackTexture() {
		return s.FallbackTexture;
	}
	static set fallbackTexture(e) {
		s.FallbackTexture = e;
	}
	static FetchToRef(e, t, n, r, i, a) {
		let o = ((Math.abs(e) * n % n | 0) + (Math.abs(t) * r % r | 0) * n) * 4;
		a.r = i[o] / 255, a.g = i[o + 1] / 255, a.b = i[o + 2] / 255, a.a = i[o + 3] / 255;
	}
	static Mix(e, t, n) {
		return 0;
	}
	static Instantiate(e) {
		return Z.Instantiate(e);
	}
	static SetImmediate(e) {
		r.SetImmediate(e);
	}
	static IsExponentOfTwo(e) {
		return !0;
	}
	static FloatRound(e) {
		return Math.fround(e);
	}
	static GetFilename(e) {
		let t = e.lastIndexOf("/");
		return t < 0 ? e : e.substring(t + 1);
	}
	static GetFolderPath(e, t = !1) {
		let n = e.lastIndexOf("/");
		return n < 0 ? t ? e : "" : e.substring(0, n + 1);
	}
	static ToDegrees(e) {
		return e * 180 / Math.PI;
	}
	static ToRadians(e) {
		return e * Math.PI / 180;
	}
	static SmoothAngleChange(e, t, n = .9) {
		let r = this.ToRadians(e), i = this.ToRadians(t);
		return this.ToDegrees(Math.atan2((1 - n) * Math.sin(i) + n * Math.sin(r), (1 - n) * Math.cos(i) + n * Math.cos(r)));
	}
	static MakeArray(e, t) {
		return t !== !0 && (e === void 0 || e == null) ? null : Array.isArray(e) ? e : [e];
	}
	static GetPointerPrefix(e) {
		return l() && !window.PointerEvent ? "mouse" : "pointer";
	}
	static SetCorsBehavior(e, t) {
		L(e, t);
	}
	static SetReferrerPolicyBehavior(e, t) {
		t.referrerPolicy = e;
	}
	static get PreprocessUrl() {
		return I.PreprocessUrl;
	}
	static set PreprocessUrl(e) {
		I.PreprocessUrl = e;
	}
	static LoadImage(e, t, n, r, i, a) {
		return z(e, t, n, r, i, a);
	}
	static LoadFile(e, t, n, r, i, a) {
		return V(e, t, n, r, i, a);
	}
	static async LoadFileAsync(e, t = !0) {
		return await new Promise((n, r) => {
			V(e, (e) => {
				n(e);
			}, void 0, void 0, t, (e, t) => {
				r(t);
			});
		});
	}
	static GetAssetUrl(e) {
		if (!e) return "";
		if (Q.AssetBaseUrl && e.startsWith(Q._DefaultAssetsUrl)) {
			let t = Q.AssetBaseUrl.endsWith("/") ? Q.AssetBaseUrl.slice(0, -1) : Q.AssetBaseUrl;
			return e.replace(Q._DefaultAssetsUrl, t);
		}
		return e;
	}
	static GetBabylonScriptURL(e, t) {
		if (!e) return "";
		if (e.startsWith(Q._DefaultCdnUrl)) {
			if (Q.ScriptBaseUrl) {
				let t = Q.ScriptBaseUrl.endsWith("/") ? Q.ScriptBaseUrl.slice(0, -1) : Q.ScriptBaseUrl;
				e = e.replace(Q._DefaultCdnUrl, t);
			} else if (Q._CdnVersion) {
				let t = `${Q._DefaultCdnUrl}/v${Q._CdnVersion}`;
				e.startsWith(t) || (e = e.replace(Q._DefaultCdnUrl, t));
			}
		}
		return e = Q.ScriptPreprocessUrl(e), t && !Q.IsAbsoluteUrl(e) && (e = Q.GetAbsoluteUrl(e)), e;
	}
	static LoadBabylonScript(e, t, n, r) {
		e = Q.GetBabylonScriptURL(e), Q.LoadScript(e, t, n);
	}
	static async LoadBabylonScriptAsync(e) {
		return e = Q.GetBabylonScriptURL(e), await Q.LoadScriptAsync(e);
	}
	static _LoadScriptNative(e, t, n) {
		_native && Q.LoadFile(e, (e) => {
			Function(e).apply(null), t && t();
		}, void 0, void 0, !1, (e, t) => {
			n && n("LoadScript Error", t);
		});
	}
	static _LoadScriptWeb(e, t, n, r, i = !1) {
		if (typeof importScripts == "function") {
			try {
				importScripts(e), t && t();
			} catch (t) {
				n?.(`Unable to load script '${e}' in worker`, t);
			}
			return;
		} else if (!l()) {
			n?.(`Cannot load script '${e}' outside of a window or a worker`);
			return;
		}
		let a = document.getElementsByTagName("head")[0], o = document.createElement("script");
		i ? (o.setAttribute("type", "module"), o.innerText = e) : (o.setAttribute("type", "text/javascript"), o.setAttribute("src", e)), r && (o.id = r), o.onload = () => {
			t && t();
		}, o.onerror = (t) => {
			n && n(`Unable to load script '${e}'`, t);
		}, a.appendChild(o);
	}
	static async LoadScriptAsync(e, t) {
		return await new Promise((n, r) => {
			this.LoadScript(e, () => {
				n();
			}, (e, t) => {
				r(t || Error(e));
			}, t);
		});
	}
	static ReadFileAsDataURL(t, n, r) {
		let i = new FileReader(), a = {
			onCompleteObservable: new e(),
			abort: () => i.abort()
		};
		return i.onloadend = () => {
			a.onCompleteObservable.notifyObservers(a);
		}, i.onload = (e) => {
			n(e.target.result);
		}, i.onprogress = r, i.readAsDataURL(t), a;
	}
	static ReadFile(e, t, n, r, i) {
		return B(e, t, n, r, i);
	}
	static FileAsURL(e) {
		let t = new Blob([e]);
		return window.URL.createObjectURL(t);
	}
	static Format(e, t = 2) {
		return e.toFixed(t);
	}
	static DeepCopy(e, t, n, r) {
		X.DeepCopy(e, t, n, r);
	}
	static IsEmpty(e) {
		for (let t in e) if (Object.prototype.hasOwnProperty.call(e, t)) return !1;
		return !0;
	}
	static RegisterTopRootEvents(e, t) {
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			e.addEventListener(r.name, r.handler, !1);
			try {
				window.parent && window.parent.addEventListener(r.name, r.handler, !1);
			} catch {}
		}
	}
	static UnregisterTopRootEvents(e, t) {
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			e.removeEventListener(r.name, r.handler);
			try {
				e.parent && e.parent.removeEventListener(r.name, r.handler);
			} catch {}
		}
	}
	static async DumpFramebuffer(e, t, n, r, i = "image/png", a, o) {
		throw p("DumpTools");
	}
	static DumpData(e, t, n, r, i = "image/png", a, o = !1, s = !1, c) {
		throw p("DumpTools");
	}
	static async DumpDataAsync(e, t, n, r = "image/png", i, a = !1, o = !1, s) {
		throw p("DumpTools");
	}
	static _IsOffScreenCanvas(e) {
		return e.convertToBlob !== void 0;
	}
	static ToBlob(e, t, n = "image/png", r) {
		!Q._IsOffScreenCanvas(e) && !e.toBlob && (e.toBlob = function(e, t, n) {
			setTimeout(() => {
				let r = atob(this.toDataURL(t, n).split(",")[1]), i = r.length, a = new Uint8Array(i);
				for (let e = 0; e < i; e++) a[e] = r.charCodeAt(e);
				e(new Blob([a]));
			});
		}), Q._IsOffScreenCanvas(e) ? e.convertToBlob({
			type: n,
			quality: r
		}).then((e) => t(e)) : e.toBlob(function(e) {
			t(e);
		}, n, r);
	}
	static DownloadBlob(e, t) {
		if ("download" in document.createElement("a")) {
			if (!t) {
				let e = /* @__PURE__ */ new Date();
				t = "screenshot_" + ((e.getFullYear() + "-" + (e.getMonth() + 1)).slice(2) + "-" + e.getDate() + "_" + e.getHours() + "-" + ("0" + e.getMinutes()).slice(-2)) + ".png";
			}
			Q.Download(e, t);
		} else if (e && typeof URL < "u") {
			let t = URL.createObjectURL(e), n = window.open("");
			if (!n) return;
			let r = n.document.createElement("img");
			r.onload = function() {
				URL.revokeObjectURL(t);
			}, r.src = t, n.document.body.appendChild(r);
		}
	}
	static EncodeScreenshotCanvasData(e, t, n = "image/png", r, i) {
		if (typeof r == "string" || !t) this.ToBlob(e, function(e) {
			e && Q.DownloadBlob(e, r), t && t("");
		}, n, i);
		else if (t) {
			if (Q._IsOffScreenCanvas(e)) {
				e.convertToBlob({
					type: n,
					quality: i
				}).then((e) => {
					let n = new FileReader();
					n.readAsDataURL(e), n.onloadend = () => {
						let e = n.result;
						t(e);
					};
				});
				return;
			}
			t(e.toDataURL(n, i));
		}
	}
	static Download(e, t) {
		if (typeof URL > "u") return;
		let n = window.URL.createObjectURL(e), r = document.createElement("a");
		document.body.appendChild(r), r.style.display = "none", r.href = n, r.download = t, r.addEventListener("click", () => {
			r.parentElement && r.parentElement.removeChild(r);
		}), r.click(), window.URL.revokeObjectURL(n);
	}
	static BackCompatCameraNoPreventDefault(e) {
		return typeof e[0] == "boolean" ? e[0] : typeof e[1] == "boolean" ? e[1] : !1;
	}
	static CreateScreenshot(e, t, n, r, i = "image/png", a = !1, o) {
		throw p("ScreenshotTools");
	}
	static async CreateScreenshotAsync(e, t, n, r = "image/png", i) {
		throw p("ScreenshotTools");
	}
	static CreateScreenshotUsingRenderTarget(e, t, n, r, i = "image/png", a = 1, o = !1, s, c = !1, l = !1, u = !0, d, f) {
		throw p("ScreenshotTools");
	}
	static async CreateScreenshotUsingRenderTargetAsync(e, t, n, r = "image/png", i = 1, a = !1, o, s = !1, c = !1, l = !0, u, d) {
		throw p("ScreenshotTools");
	}
	static RandomId() {
		return h();
	}
	static IsBase64(e) {
		return W(e);
	}
	static DecodeBase64(e) {
		return K(e);
	}
	static get errorsCount() {
		return c.errorsCount;
	}
	static Log(e) {
		c.Log(e);
	}
	static Warn(e) {
		c.Warn(e);
	}
	static Error(e) {
		c.Error(e);
	}
	static get LogCache() {
		return c.LogCache;
	}
	static ClearLogCache() {
		c.ClearLogCache();
	}
	static set LogLevels(e) {
		c.LogLevels = e;
	}
	static set PerformanceLogLevel(e) {
		if ((e & Q.PerformanceUserMarkLogLevel) === Q.PerformanceUserMarkLogLevel) {
			_native?.enablePerformanceLogging ? (_native.enablePerformanceLogging(1), Q.StartPerformanceCounter = Q._StartMarkNative, Q.EndPerformanceCounter = Q._EndMarkNative) : (Q.StartPerformanceCounter = Q._StartUserMark, Q.EndPerformanceCounter = Q._EndUserMark);
			return;
		}
		if ((e & Q.PerformanceConsoleLogLevel) === Q.PerformanceConsoleLogLevel) {
			_native?.enablePerformanceLogging ? (_native.enablePerformanceLogging(2), Q.StartPerformanceCounter = Q._StartMarkNative, Q.EndPerformanceCounter = Q._EndMarkNative) : (Q.StartPerformanceCounter = Q._StartPerformanceConsole, Q.EndPerformanceCounter = Q._EndPerformanceConsole);
			return;
		}
		Q.StartPerformanceCounter = Q._StartPerformanceCounterDisabled, Q.EndPerformanceCounter = Q._EndPerformanceCounterDisabled, _native?.disablePerformanceLogging?.();
	}
	static _StartPerformanceCounterDisabled(e, t) {}
	static _EndPerformanceCounterDisabled(e, t) {}
	static _StartUserMark(e, t = !0) {
		if (!Q._Performance) {
			if (!l()) return;
			Q._Performance = window.performance;
		}
		!t || !Q._Performance.mark || Q._Performance.mark(e + "-Begin");
	}
	static _EndUserMark(e, t = !0) {
		!t || !Q._Performance.mark || (Q._Performance.mark(e + "-End"), Q._Performance.measure(e, e + "-Begin", e + "-End"));
	}
	static _StartPerformanceConsole(e, t = !0) {
		t && (Q._StartUserMark(e, t), console.time && console.time(e));
	}
	static _EndPerformanceConsole(e, t = !0) {
		t && (Q._EndUserMark(e, t), console.timeEnd(e));
	}
	static _StartMarkNative(e, t = !0) {
		if (t && _native?.startPerformanceCounter) if (Q._NativePerformanceCounterHandles.has(e)) Q.Warn(`Performance counter with name ${e} is already started.`);
		else {
			let t = _native.startPerformanceCounter(e);
			Q._NativePerformanceCounterHandles.set(e, t);
		}
	}
	static _EndMarkNative(e, t = !0) {
		if (t && _native?.endPerformanceCounter) {
			let t = Q._NativePerformanceCounterHandles.get(e);
			t ? (_native.endPerformanceCounter(t), Q._NativePerformanceCounterHandles.delete(e)) : Q.Warn(`Performance counter with name ${e} was not started.`);
		}
	}
	static get Now() {
		return f.Now;
	}
	static GetClassName(e, t = !1) {
		let n = null;
		return !t && e.getClassName ? n = e.getClassName() : (e instanceof Object && (n = (t ? e : Object.getPrototypeOf(e)).constructor.__bjsclassName__), n ||= typeof e), n;
	}
	static First(e, t) {
		for (let n of e) if (t(n)) return n;
		return null;
	}
	static getFullClassName(e, t = !1) {
		let n = null, r = null;
		if (!t && e.getClassName) n = e.getClassName();
		else {
			if (e instanceof Object) {
				let i = t ? e : Object.getPrototypeOf(e);
				n = i.constructor.__bjsclassName__, r = i.constructor.__bjsmoduleName__;
			}
			n ||= typeof e;
		}
		return n ? (r == null ? "" : r + ".") + n : null;
	}
	static async DelayAsync(e) {
		await new Promise((t) => {
			setTimeout(() => {
				t();
			}, e);
		});
	}
	static IsSafari() {
		return u() ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent) : !1;
	}
};
Q = $, $.AssetBaseUrl = "", $.UseCustomRequestHeaders = !1, $.CustomRequestHeaders = g.CustomRequestHeaders, $.GetDOMTextContent = d, $._DefaultCdnUrl = "https://cdn.babylonjs.com", $._CdnVersion = "9.2.1", $._DefaultAssetsUrl = "https://assets.babylonjs.com/core", $.LoadScript = typeof _native > "u" ? Q._LoadScriptWeb : Q._LoadScriptNative, $.GetAbsoluteUrl = typeof document == "object" ? (e) => {
	let t = document.createElement("a");
	return t.href = e, t.href;
} : typeof URL == "function" && typeof location == "object" ? (e) => new URL(e, location.origin).href : () => {
	throw Error("Unable to get absolute URL. Override BABYLON.Tools.GetAbsoluteUrl to a custom implementation for the current context.");
}, $.NoneLogLevel = c.NoneLogLevel, $.MessageLogLevel = c.MessageLogLevel, $.WarningLogLevel = c.WarningLogLevel, $.ErrorLogLevel = c.ErrorLogLevel, $.AllLogLevel = c.AllLogLevel, $.IsWindowObjectExist = l, $.PerformanceNoneLogLevel = 0, $.PerformanceUserMarkLogLevel = 1, $.PerformanceConsoleLogLevel = 2, $._NativePerformanceCounterHandles = /* @__PURE__ */ new Map(), $.StartPerformanceCounter = Q._StartPerformanceCounterDisabled, $.EndPerformanceCounter = Q._EndPerformanceCounterDisabled;
var se = class e {
	constructor(e, t, n, r = 0) {
		this.iterations = e, this.index = r - 1, this._done = !1, this._fn = t, this._successCallback = n;
	}
	executeNext() {
		this._done || (this.index + 1 < this.iterations ? (++this.index, this._fn(this)) : this.breakLoop());
	}
	breakLoop() {
		this._done = !0, this._successCallback();
	}
	static Run(t, n, r, i = 0) {
		let a = new e(t, n, r, i);
		return a.executeNext(), a;
	}
	static SyncAsyncForLoop(t, n, r, i, a, o = 0) {
		return e.Run(Math.ceil(t / n), (e) => {
			a && a() ? e.breakLoop() : setTimeout(() => {
				for (let i = 0; i < n; ++i) {
					let o = e.index * n + i;
					if (o >= t) break;
					if (r(o), a && a()) {
						e.breakLoop();
						break;
					}
				}
				e.executeNext();
			}, o);
		}, i);
	}
};
$.Mix = n, $.IsExponentOfTwo = o, s.FallbackTexture = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";
//#endregion
export { b as C, C as S, O as _, K as a, ee as b, V as c, B as d, H as f, ne as g, j as h, X as i, N as l, A as m, $ as n, ae as o, ie as p, Z as r, W as s, se as t, z as u, k as v, x as w, T as x, re as y };

//# sourceMappingURL=tools-CES87F86.js.map