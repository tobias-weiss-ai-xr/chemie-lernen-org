import { s as e } from "./arrayTools-Dxcneqm_.js";
import { t } from "./math.scalar.functions-_PnMiXiP.js";
import { a as n, r } from "./math.vector-ByhvsffM.js";
import "./math.axis-DW8_2_EH.js";
import { t as i } from "./math.color-BS-ZqBtl.js";
import "./math.plane-Dtv6vl1q.js";
import "./math.frustum-BkTCs-8G.js";
import "./math.path-C27na1eD.js";
import "./decorators.serialization-C6Hy3Nio.js";
import "./effectRenderer-_mqgM3-a.js";
//#region node_modules/@babylonjs/core/Maths/sphericalPolynomial.js
var a = [
	Math.sqrt(1 / (4 * Math.PI)),
	-Math.sqrt(3 / (4 * Math.PI)),
	Math.sqrt(3 / (4 * Math.PI)),
	-Math.sqrt(3 / (4 * Math.PI)),
	Math.sqrt(15 / (4 * Math.PI)),
	-Math.sqrt(15 / (4 * Math.PI)),
	Math.sqrt(5 / (16 * Math.PI)),
	-Math.sqrt(15 / (4 * Math.PI)),
	Math.sqrt(15 / (16 * Math.PI))
], o = [
	() => 1,
	(e) => e.y,
	(e) => e.z,
	(e) => e.x,
	(e) => e.x * e.y,
	(e) => e.y * e.z,
	(e) => 3 * e.z * e.z - 1,
	(e) => e.x * e.z,
	(e) => e.x * e.x - e.y * e.y
], s = (e, t) => a[e] * o[e](t), c = [
	Math.PI,
	2 * Math.PI / 3,
	2 * Math.PI / 3,
	2 * Math.PI / 3,
	Math.PI / 4,
	Math.PI / 4,
	Math.PI / 4,
	Math.PI / 4,
	Math.PI / 4
], l = class e {
	constructor() {
		this.preScaled = !1, this.l00 = n.Zero(), this.l1_1 = n.Zero(), this.l10 = n.Zero(), this.l11 = n.Zero(), this.l2_2 = n.Zero(), this.l2_1 = n.Zero(), this.l20 = n.Zero(), this.l21 = n.Zero(), this.l22 = n.Zero();
	}
	addLight(e, t, n) {
		r.Vector3[0].set(t.r, t.g, t.b);
		let i = r.Vector3[0], a = r.Vector3[1];
		i.scaleToRef(n, a), a.scaleToRef(s(0, e), r.Vector3[2]), this.l00.addInPlace(r.Vector3[2]), a.scaleToRef(s(1, e), r.Vector3[2]), this.l1_1.addInPlace(r.Vector3[2]), a.scaleToRef(s(2, e), r.Vector3[2]), this.l10.addInPlace(r.Vector3[2]), a.scaleToRef(s(3, e), r.Vector3[2]), this.l11.addInPlace(r.Vector3[2]), a.scaleToRef(s(4, e), r.Vector3[2]), this.l2_2.addInPlace(r.Vector3[2]), a.scaleToRef(s(5, e), r.Vector3[2]), this.l2_1.addInPlace(r.Vector3[2]), a.scaleToRef(s(6, e), r.Vector3[2]), this.l20.addInPlace(r.Vector3[2]), a.scaleToRef(s(7, e), r.Vector3[2]), this.l21.addInPlace(r.Vector3[2]), a.scaleToRef(s(8, e), r.Vector3[2]), this.l22.addInPlace(r.Vector3[2]);
	}
	scaleInPlace(e) {
		this.l00.scaleInPlace(e), this.l1_1.scaleInPlace(e), this.l10.scaleInPlace(e), this.l11.scaleInPlace(e), this.l2_2.scaleInPlace(e), this.l2_1.scaleInPlace(e), this.l20.scaleInPlace(e), this.l21.scaleInPlace(e), this.l22.scaleInPlace(e);
	}
	convertIncidentRadianceToIrradiance() {
		this.l00.scaleInPlace(c[0]), this.l1_1.scaleInPlace(c[1]), this.l10.scaleInPlace(c[2]), this.l11.scaleInPlace(c[3]), this.l2_2.scaleInPlace(c[4]), this.l2_1.scaleInPlace(c[5]), this.l20.scaleInPlace(c[6]), this.l21.scaleInPlace(c[7]), this.l22.scaleInPlace(c[8]);
	}
	convertIrradianceToLambertianRadiance() {
		this.scaleInPlace(1 / Math.PI);
	}
	preScaleForRendering() {
		this.preScaled = !0, this.l00.scaleInPlace(a[0]), this.l1_1.scaleInPlace(a[1]), this.l10.scaleInPlace(a[2]), this.l11.scaleInPlace(a[3]), this.l2_2.scaleInPlace(a[4]), this.l2_1.scaleInPlace(a[5]), this.l20.scaleInPlace(a[6]), this.l21.scaleInPlace(a[7]), this.l22.scaleInPlace(a[8]);
	}
	updateFromArray(e) {
		return n.FromArrayToRef(e[0], 0, this.l00), n.FromArrayToRef(e[1], 0, this.l1_1), n.FromArrayToRef(e[2], 0, this.l10), n.FromArrayToRef(e[3], 0, this.l11), n.FromArrayToRef(e[4], 0, this.l2_2), n.FromArrayToRef(e[5], 0, this.l2_1), n.FromArrayToRef(e[6], 0, this.l20), n.FromArrayToRef(e[7], 0, this.l21), n.FromArrayToRef(e[8], 0, this.l22), this;
	}
	updateFromFloatsArray(e) {
		return n.FromFloatsToRef(e[0], e[1], e[2], this.l00), n.FromFloatsToRef(e[3], e[4], e[5], this.l1_1), n.FromFloatsToRef(e[6], e[7], e[8], this.l10), n.FromFloatsToRef(e[9], e[10], e[11], this.l11), n.FromFloatsToRef(e[12], e[13], e[14], this.l2_2), n.FromFloatsToRef(e[15], e[16], e[17], this.l2_1), n.FromFloatsToRef(e[18], e[19], e[20], this.l20), n.FromFloatsToRef(e[21], e[22], e[23], this.l21), n.FromFloatsToRef(e[24], e[25], e[26], this.l22), this;
	}
	static FromArray(t) {
		return new e().updateFromArray(t);
	}
	static FromPolynomial(t) {
		let n = new e();
		return n.l00 = t.xx.scale(.376127).add(t.yy.scale(.376127)).add(t.zz.scale(.376126)), n.l1_1 = t.y.scale(.977204), n.l10 = t.z.scale(.977204), n.l11 = t.x.scale(.977204), n.l2_2 = t.xy.scale(1.16538), n.l2_1 = t.yz.scale(1.16538), n.l20 = t.zz.scale(1.34567).subtract(t.xx.scale(.672834)).subtract(t.yy.scale(.672834)), n.l21 = t.zx.scale(1.16538), n.l22 = t.xx.scale(1.16538).subtract(t.yy.scale(1.16538)), n.l1_1.scaleInPlace(-1), n.l11.scaleInPlace(-1), n.l2_1.scaleInPlace(-1), n.l21.scaleInPlace(-1), n.scaleInPlace(Math.PI), n;
	}
}, u = class e {
	constructor() {
		this.x = n.Zero(), this.y = n.Zero(), this.z = n.Zero(), this.xx = n.Zero(), this.yy = n.Zero(), this.zz = n.Zero(), this.xy = n.Zero(), this.yz = n.Zero(), this.zx = n.Zero();
	}
	get preScaledHarmonics() {
		return this._harmonics ||= l.FromPolynomial(this), this._harmonics.preScaled || this._harmonics.preScaleForRendering(), this._harmonics;
	}
	addAmbient(e) {
		r.Vector3[0].copyFromFloats(e.r, e.g, e.b);
		let t = r.Vector3[0];
		this.xx.addInPlace(t), this.yy.addInPlace(t), this.zz.addInPlace(t);
	}
	scaleInPlace(e) {
		this.x.scaleInPlace(e), this.y.scaleInPlace(e), this.z.scaleInPlace(e), this.xx.scaleInPlace(e), this.yy.scaleInPlace(e), this.zz.scaleInPlace(e), this.yz.scaleInPlace(e), this.zx.scaleInPlace(e), this.xy.scaleInPlace(e);
	}
	updateFromHarmonics(e) {
		return this._harmonics = e, this.x.copyFrom(e.l11), this.x.scaleInPlace(1.02333).scaleInPlace(-1), this.y.copyFrom(e.l1_1), this.y.scaleInPlace(1.02333).scaleInPlace(-1), this.z.copyFrom(e.l10), this.z.scaleInPlace(1.02333), this.xx.copyFrom(e.l00), r.Vector3[0].copyFrom(e.l20).scaleInPlace(.247708), r.Vector3[1].copyFrom(e.l22).scaleInPlace(.429043), this.xx.scaleInPlace(.886277).subtractInPlace(r.Vector3[0]).addInPlace(r.Vector3[1]), this.yy.copyFrom(e.l00), this.yy.scaleInPlace(.886277).subtractInPlace(r.Vector3[0]).subtractInPlace(r.Vector3[1]), this.zz.copyFrom(e.l00), r.Vector3[0].copyFrom(e.l20).scaleInPlace(.495417), this.zz.scaleInPlace(.886277).addInPlace(r.Vector3[0]), this.yz.copyFrom(e.l2_1), this.yz.scaleInPlace(.858086).scaleInPlace(-1), this.zx.copyFrom(e.l21), this.zx.scaleInPlace(.858086).scaleInPlace(-1), this.xy.copyFrom(e.l2_2), this.xy.scaleInPlace(.858086), this.scaleInPlace(1 / Math.PI), this;
	}
	static FromHarmonics(t) {
		return new e().updateFromHarmonics(t);
	}
	static FromArray(t) {
		let r = new e();
		return n.FromArrayToRef(t[0], 0, r.x), n.FromArrayToRef(t[1], 0, r.y), n.FromArrayToRef(t[2], 0, r.z), n.FromArrayToRef(t[3], 0, r.xx), n.FromArrayToRef(t[4], 0, r.yy), n.FromArrayToRef(t[5], 0, r.zz), n.FromArrayToRef(t[6], 0, r.yz), n.FromArrayToRef(t[7], 0, r.zx), n.FromArrayToRef(t[8], 0, r.xy), r;
	}
}, d = class {
	constructor(e, t, n, r) {
		this.name = e, this.worldAxisForNormal = t, this.worldAxisForFileX = n, this.worldAxisForFileY = r;
	}
}, f = class {
	static _NearestPow2Floor(e) {
		return e <= 1 ? 1 : 1 << Math.floor(Math.log2(e));
	}
	static ConvertCubeMapTextureToSphericalPolynomial(e) {
		if (!e.isCube) return null;
		e.getScene()?.getEngine().flushFramebuffer();
		let t = e.getSize().width, n = e._sphericalPolynomialTargetSize, r = n > 0 ? this._NearestPow2Floor(n) : 0, i = !e.noMipmap && e._texture?.generateMipMaps === !0, a = r > 0 && r < t && i, o = a ? Math.max(0, Math.round(Math.log2(t / r))) : 0, s = a ? Math.max(1, Math.floor(t / 2 ** o)) : t, c = e.readPixels(0, o, void 0, !1), l = e.readPixels(1, o, void 0, !1), u, d;
		e.isRenderTarget ? (u = e.readPixels(3, o, void 0, !1), d = e.readPixels(2, o, void 0, !1)) : (u = e.readPixels(2, o, void 0, !1), d = e.readPixels(3, o, void 0, !1));
		let f = e.readPixels(4, o, void 0, !1), p = e.readPixels(5, o, void 0, !1), m = e.gammaSpace, h = r > 0 && r < t && !a;
		return new Promise((e) => {
			Promise.all([
				l,
				c,
				u,
				d,
				f,
				p
			]).then(([n, i, a, o, c, l]) => {
				let u = s;
				h && (n = this._DownsampleFace(n, t, r, 4), i = this._DownsampleFace(i, t, r, 4), a = this._DownsampleFace(a, t, r, 4), o = this._DownsampleFace(o, t, r, 4), c = this._DownsampleFace(c, t, r, 4), l = this._DownsampleFace(l, t, r, 4), u = r);
				let d = {
					size: u,
					right: i,
					left: n,
					up: a,
					down: o,
					front: c,
					back: l,
					format: 5,
					type: +(n instanceof Float32Array),
					gammaSpace: m
				};
				e(this.ConvertCubeMapToSphericalPolynomial(d));
			});
		});
	}
	static _AreaElement(e, t) {
		return Math.atan2(e * t, Math.sqrt(e * e + t * t + 1));
	}
	static _DownsampleFace(e, t, n, r) {
		let i = e instanceof Float32Array ? e : Float32Array.from(e), a = n * n * r, o = new Float32Array(a), s = t / n, c = 1 / (s * s);
		for (let e = 0; e < n; e++) {
			let a = Math.floor(e * s), l = Math.floor((e + 1) * s);
			for (let u = 0; u < n; u++) {
				let d = Math.floor(u * s), f = Math.floor((u + 1) * s), p = (e * n + u) * r;
				for (let e = 0; e < r; e++) {
					let n = 0;
					for (let o = a; o < l; o++) for (let a = d; a < f; a++) n += i[(o * t + a) * r + e];
					o[p + e] = n * c;
				}
			}
		}
		if (e instanceof Float32Array) return o;
		let l = e.constructor, u = new l(a);
		for (let e = 0; e < a; e++) u[e] = o[e] + .5 | 0;
		return u;
	}
	static ConvertCubeMapToSphericalPolynomial(n, r = 0) {
		let a = r > 0 ? this._NearestPow2Floor(r) : 0;
		if (a > 0 && n.size > a) {
			let e = n.format === 5 ? 4 : 3, t = [
				"right",
				"left",
				"up",
				"down",
				"front",
				"back"
			], r = {};
			for (let i of t) r[i] = this._DownsampleFace(n[i], n.size, a, e);
			n = {
				...n,
				...r,
				size: a
			};
		}
		let o = new l(), s = 0, c = 2 / n.size, d = c, f = .5 * c, p = f - 1;
		for (let r = 0; r < 6; r++) {
			let a = this._FileFaces[r], l = n[a.name], u = p, m = n.format === 5 ? 4 : 3;
			for (let r = 0; r < n.size; r++) {
				let h = p;
				for (let d = 0; d < n.size; d++) {
					let p = a.worldAxisForFileX.scale(h).add(a.worldAxisForFileY.scale(u)).add(a.worldAxisForNormal);
					p.normalize();
					let g = this._AreaElement(h - f, u - f) - this._AreaElement(h - f, u + f) - this._AreaElement(h + f, u - f) + this._AreaElement(h + f, u + f), _ = l[r * n.size * m + d * m + 0], v = l[r * n.size * m + d * m + 1], y = l[r * n.size * m + d * m + 2];
					isNaN(_) && (_ = 0), isNaN(v) && (v = 0), isNaN(y) && (y = 0), n.type === 0 && (_ /= 255, v /= 255, y /= 255), n.gammaSpace && (_ = t(_) ** +e, v = t(v) ** +e, y = t(y) ** +e);
					let b = this.MAX_HDRI_VALUE;
					if (this.PRESERVE_CLAMPED_COLORS) {
						let e = Math.max(_, v, y);
						if (e > b) {
							let t = b / e;
							_ *= t, v *= t, y *= t;
						}
					} else _ = t(_, 0, b), v = t(v, 0, b), y = t(y, 0, b);
					let x = new i(_, v, y);
					o.addLight(p, x, g), s += g, h += c;
				}
				u += d;
			}
		}
		let m = 4 * Math.PI * 6 / 6 / s;
		return o.scaleInPlace(m), o.convertIncidentRadianceToIrradiance(), o.convertIrradianceToLambertianRadiance(), u.FromHarmonics(o);
	}
};
f._FileFaces = [
	new d("right", new n(1, 0, 0), new n(0, 0, -1), new n(0, -1, 0)),
	new d("left", new n(-1, 0, 0), new n(0, 0, 1), new n(0, -1, 0)),
	new d("up", new n(0, 1, 0), new n(1, 0, 0), new n(0, 0, 1)),
	new d("down", new n(0, -1, 0), new n(1, 0, 0), new n(0, 0, -1)),
	new d("front", new n(0, 0, 1), new n(1, 0, 0), new n(0, -1, 0)),
	new d("back", new n(0, 0, -1), new n(-1, 0, 0), new n(0, -1, 0))
], f.MAX_HDRI_VALUE = 4096, f.PRESERVE_CLAMPED_COLORS = !1;
//#endregion
export { l as n, u as r, f as t };

//# sourceMappingURL=cubemapToSphericalPolynomial-DHpEIj6r.js.map