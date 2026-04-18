import { t as e } from "./logger-B7TbbsLc.js";
import { t } from "./math.scalar.functions-_PnMiXiP.js";
import { t as n } from "./cubemapToSphericalPolynomial-DHpEIj6r.js";
import "./abstractEngine.cubeTexture-DIbMWwdV.js";
import { n as r, r as i } from "./textureTools-C-mDeuST.js";
//#region node_modules/@babylonjs/core/Misc/dds.js
var a = 542327876, o = 131072, s = 512, c = 4, l = 64, u = 131072;
function d(e) {
	return e.charCodeAt(0) + (e.charCodeAt(1) << 8) + (e.charCodeAt(2) << 16) + (e.charCodeAt(3) << 24);
}
function f(e) {
	return String.fromCharCode(e & 255, e >> 8 & 255, e >> 16 & 255, e >> 24 & 255);
}
var p = d("DXT1"), m = d("DXT3"), h = d("DXT5"), g = d("DX10"), _ = 113, v = 116, y = 2, b = 10, x = 88, S = 31, ee = 0, te = 1, C = 2, w = 3, T = 4, E = 7, D = 20, O = 21, k = 22, A = 23, j = 24, M = 25, N = 26, P = 28, F = 32, I = class d {
	static GetDDSInfo(e) {
		let t = new Int32Array(e.buffer, e.byteOffset, S), n = new Int32Array(e.buffer, e.byteOffset, S + 4), r = 1;
		t[C] & o && (r = Math.max(1, t[E]));
		let i = t[O], a = i === g ? n[F] : 0, d = 0;
		switch (i) {
			case _:
				d = 2;
				break;
			case v:
				d = 1;
				break;
			case g:
				if (a === b) {
					d = 2;
					break;
				}
				if (a === y) {
					d = 1;
					break;
				}
		}
		return {
			width: t[T],
			height: t[w],
			mipmapCount: r,
			isFourCC: (t[D] & c) === c,
			isRGB: (t[D] & l) === l,
			isLuminance: (t[D] & u) === u,
			isCube: (t[P] & s) === s,
			isCompressed: i === p || i === m || i === h,
			dxgiFormat: a,
			textureType: d
		};
	}
	static _GetHalfFloatAsFloatRGBAArrayBuffer(e, t, n, i, a, o) {
		let s = new Float32Array(i), c = new Uint16Array(a, n), l = 0;
		for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) {
			let i = (t + n * e) * 4;
			s[l] = r(c[i]), s[l + 1] = r(c[i + 1]), s[l + 2] = r(c[i + 2]), d.StoreLODInAlphaChannel ? s[l + 3] = o : s[l + 3] = r(c[i + 3]), l += 4;
		}
		return s;
	}
	static _GetHalfFloatRGBAArrayBuffer(e, t, n, r, a, o) {
		if (d.StoreLODInAlphaChannel) {
			let s = new Uint16Array(r), c = new Uint16Array(a, n), l = 0;
			for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) {
				let r = (t + n * e) * 4;
				s[l] = c[r], s[l + 1] = c[r + 1], s[l + 2] = c[r + 2], s[l + 3] = i(o), l += 4;
			}
			return s;
		}
		return new Uint16Array(a, n, r);
	}
	static _GetFloatRGBAArrayBuffer(e, t, n, r, i, a) {
		if (d.StoreLODInAlphaChannel) {
			let o = new Float32Array(r), s = new Float32Array(i, n), c = 0;
			for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) {
				let r = (t + n * e) * 4;
				o[c] = s[r], o[c + 1] = s[r + 1], o[c + 2] = s[r + 2], o[c + 3] = a, c += 4;
			}
			return o;
		}
		return new Float32Array(i, n, r);
	}
	static _GetFloatAsHalfFloatRGBAArrayBuffer(e, t, n, r, a, o) {
		let s = new Uint16Array(r), c = new Float32Array(a, n), l = 0;
		for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) s[l] = i(c[l]), s[l + 1] = i(c[l + 1]), s[l + 2] = i(c[l + 2]), d.StoreLODInAlphaChannel ? s[l + 3] = i(o) : s[l + 3] = i(c[l + 3]), l += 4;
		return s;
	}
	static _GetFloatAsUIntRGBAArrayBuffer(e, n, r, i, a, o) {
		let s = new Uint8Array(i), c = new Float32Array(a, r), l = 0;
		for (let r = 0; r < n; r++) for (let n = 0; n < e; n++) {
			let i = (n + r * e) * 4;
			s[l] = t(c[i]) * 255, s[l + 1] = t(c[i + 1]) * 255, s[l + 2] = t(c[i + 2]) * 255, d.StoreLODInAlphaChannel ? s[l + 3] = o : s[l + 3] = t(c[i + 3]) * 255, l += 4;
		}
		return s;
	}
	static _GetHalfFloatAsUIntRGBAArrayBuffer(e, n, i, a, o, s) {
		let c = new Uint8Array(a), l = new Uint16Array(o, i), u = 0;
		for (let i = 0; i < n; i++) for (let n = 0; n < e; n++) {
			let a = (n + i * e) * 4;
			c[u] = t(r(l[a])) * 255, c[u + 1] = t(r(l[a + 1])) * 255, c[u + 2] = t(r(l[a + 2])) * 255, d.StoreLODInAlphaChannel ? c[u + 3] = s : c[u + 3] = t(r(l[a + 3])) * 255, u += 4;
		}
		return c;
	}
	static _GetRGBAArrayBuffer(e, t, n, r, i, a, o, s, c) {
		let l = new Uint8Array(r), u = new Uint8Array(i, n), d = 0;
		for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) {
			let r = (t + n * e) * 4;
			l[d] = u[r + a], l[d + 1] = u[r + o], l[d + 2] = u[r + s], l[d + 3] = u[r + c], d += 4;
		}
		return l;
	}
	static _ExtractLongWordOrder(e) {
		return e === 0 || e === 255 || e === -16777216 ? 0 : 1 + d._ExtractLongWordOrder(e >> 8);
	}
	static _GetRGBArrayBuffer(e, t, n, r, i, a, o, s) {
		let c = new Uint8Array(r), l = new Uint8Array(i, n), u = 0;
		for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) {
			let r = (t + n * e) * 3;
			c[u] = l[r + a], c[u + 1] = l[r + o], c[u + 2] = l[r + s], u += 3;
		}
		return c;
	}
	static _GetLuminanceArrayBuffer(e, t, n, r, i) {
		let a = new Uint8Array(r), o = new Uint8Array(i, n), s = 0;
		for (let n = 0; n < t; n++) for (let t = 0; t < e; t++) a[s] = o[t + n * e], s++;
		return a;
	}
	static UploadDDSLevels(t, r, i, s, c, l, u = -1, D, P = !0) {
		let F = null;
		s.sphericalPolynomial && (F = []);
		let I = !!t.getCaps().s3tc;
		r.generateMipMaps = c;
		let L = new Int32Array(i.buffer, i.byteOffset, S), R, z, B, V = 0, H, U, W, G, K = 0, q = 1;
		if (L[ee] !== a) {
			e.Error("Invalid magic number in DDS header");
			return;
		}
		if (!s.isFourCC && !s.isRGB && !s.isLuminance) {
			e.Error("Unsupported format, must contain a FourCC, RGB or LUMINANCE code");
			return;
		}
		if (s.isCompressed && !I) {
			e.Error("Compressed textures are not supported on this platform.");
			return;
		}
		let J = L[k];
		H = L[te] + 4;
		let Y = !1;
		if (s.isFourCC) switch (R = L[O], R) {
			case p:
				q = 8, K = 33777;
				break;
			case m:
				q = 16, K = 33778;
				break;
			case h:
				q = 16, K = 33779;
				break;
			case _:
				Y = !0, J = 64;
				break;
			case v:
				Y = !0, J = 128;
				break;
			case g: {
				H += 20;
				let e = !1;
				switch (s.dxgiFormat) {
					case b:
						Y = !0, J = 64, e = !0;
						break;
					case y:
						Y = !0, J = 128, e = !0;
						break;
					case x:
						s.isRGB = !0, s.isFourCC = !1, J = 32, e = !0;
						break;
				}
				if (e) break;
			}
			default:
				e.Error(["Unsupported FourCC code:", f(R)]);
				return;
		}
		let X = d._ExtractLongWordOrder(L[A]), Z = d._ExtractLongWordOrder(L[j]), Q = d._ExtractLongWordOrder(L[M]), ne = d._ExtractLongWordOrder(L[N]);
		Y && (K = t._getRGBABufferInternalSizedFormat(s.textureType)), W = 1, L[C] & o && c !== !1 && (W = Math.max(1, L[E]));
		let re = D || 0, $ = t.getCaps();
		for (let e = re; e < l; e++) {
			for (z = L[T], B = L[w], G = 0; G < W; ++G) {
				if (u === -1 || u === G) {
					let n = u === -1 ? G : 0;
					if (!s.isCompressed && s.isFourCC) {
						r.format = 5, V = z * B * 4;
						let a = null;
						if (t._badOS || t._badDesktopOS || !$.textureHalfFloat && !$.textureFloat) J === 128 ? (a = d._GetFloatAsUIntRGBAArrayBuffer(z, B, i.byteOffset + H, V, i.buffer, n), F && n == 0 && F.push(d._GetFloatRGBAArrayBuffer(z, B, i.byteOffset + H, V, i.buffer, n))) : J === 64 && (a = d._GetHalfFloatAsUIntRGBAArrayBuffer(z, B, i.byteOffset + H, V, i.buffer, n), F && n == 0 && F.push(d._GetHalfFloatAsFloatRGBAArrayBuffer(z, B, i.byteOffset + H, V, i.buffer, n))), r.type = 0;
						else {
							let e = $.textureFloat && (P && $.textureFloatLinearFiltering || !P), t = $.textureHalfFloat && (P && $.textureHalfFloatLinearFiltering || !P), o = (J === 128 || J === 64 && !t) && e ? 1 : (J === 64 || J === 128 && !e) && t ? 2 : 0, s, c = null;
							switch (J) {
								case 128:
									switch (o) {
										case 1:
											s = d._GetFloatRGBAArrayBuffer, c = null;
											break;
										case 2:
											s = d._GetFloatAsHalfFloatRGBAArrayBuffer, c = d._GetFloatRGBAArrayBuffer;
											break;
										case 0:
											s = d._GetFloatAsUIntRGBAArrayBuffer, c = d._GetFloatRGBAArrayBuffer;
											break;
									}
									break;
								default:
									switch (o) {
										case 1:
											s = d._GetHalfFloatAsFloatRGBAArrayBuffer, c = null;
											break;
										case 2:
											s = d._GetHalfFloatRGBAArrayBuffer, c = d._GetHalfFloatAsFloatRGBAArrayBuffer;
											break;
										case 0:
											s = d._GetHalfFloatAsUIntRGBAArrayBuffer, c = d._GetHalfFloatAsFloatRGBAArrayBuffer;
											break;
									}
									break;
							}
							r.type = o, a = s(z, B, i.byteOffset + H, V, i.buffer, n), F && n == 0 && F.push(c ? c(z, B, i.byteOffset + H, V, i.buffer, n) : a);
						}
						a && t._uploadDataToTextureDirectly(r, a, e, n);
					} else if (s.isRGB) r.type = 0, J === 24 ? (r.format = 4, V = z * B * 3, U = d._GetRGBArrayBuffer(z, B, i.byteOffset + H, V, i.buffer, X, Z, Q), t._uploadDataToTextureDirectly(r, U, e, n)) : (r.format = 5, V = z * B * 4, U = d._GetRGBAArrayBuffer(z, B, i.byteOffset + H, V, i.buffer, X, Z, Q, ne), t._uploadDataToTextureDirectly(r, U, e, n));
					else if (s.isLuminance) {
						let a = t._getUnpackAlignement(), o = z;
						V = Math.floor((z + a - 1) / a) * a * (B - 1) + o, U = d._GetLuminanceArrayBuffer(z, B, i.byteOffset + H, V, i.buffer), r.format = 1, r.type = 0, t._uploadDataToTextureDirectly(r, U, e, n);
					} else V = Math.max(4, z) / 4 * Math.max(4, B) / 4 * q, U = new Uint8Array(i.buffer, i.byteOffset + H, V), r.type = 0, t._uploadCompressedDataToTextureDirectly(r, K, z, B, U, e, n);
				}
				H += J ? z * B * (J / 8) : V, z *= .5, B *= .5, z = Math.max(1, z), B = Math.max(1, B);
			}
			if (D !== void 0) break;
		}
		F && F.length > 0 ? s.sphericalPolynomial = n.ConvertCubeMapToSphericalPolynomial({
			size: L[T],
			right: F[0],
			left: F[1],
			up: F[2],
			down: F[3],
			front: F[4],
			back: F[5],
			format: 5,
			type: 1,
			gammaSpace: !1
		}) : s.sphericalPolynomial = void 0;
	}
};
I.StoreLODInAlphaChannel = !1;
//#endregion
export { I as DDSTools };

//# sourceMappingURL=dds-CDpm3Lw7.js.map