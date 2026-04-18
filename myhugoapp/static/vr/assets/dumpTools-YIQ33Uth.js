import { n as e } from "./performanceConfigurator-DMA6Ub5Z.js";
import { t } from "./logger-B7TbbsLc.js";
import { t as n } from "./math.scalar.functions-_PnMiXiP.js";
import { n as r, t as i } from "./effectRenderer-_mqgM3-a.js";
import { _ as a, r as o } from "./decorators-Dkc3uIc_.js";
import { S as s, n as c } from "./tools-CES87F86.js";
//#region node_modules/@babylonjs/core/Misc/dumpTools.js
var l = null;
async function u() {
	let n = e.LastCreatedEngine?.createCanvas(100, 100) ?? new OffscreenCanvas(100, 100);
	n instanceof OffscreenCanvas && t.Warn("DumpData: OffscreenCanvas will be used for dumping data. This may result in lossy alpha values.");
	let { ThinEngine: a } = await import("./thinEngine-BoCZ-uR-.js");
	if (!a.IsSupported) throw Error("DumpData: No WebGL context available. Cannot dump data.");
	let o = new a(n, !1, {
		preserveDrawingBuffer: !0,
		depth: !1,
		stencil: !1,
		alpha: !0,
		premultipliedAlpha: !1,
		antialias: !1,
		failIfMajorPerformanceCaveat: !1
	});
	e.Instances.pop(), e.OnEnginesDisposedObservable.add((t) => {
		o && t !== o && !o.isDisposed && e.Instances.length === 0 && _();
	}), o.getCaps().parallelShaderCompile = void 0;
	let s = new i(o), { passPixelShader: c } = await import("./pass.fragment-BoC4dZe-.js");
	return {
		canvas: n,
		dumpEngine: {
			engine: o,
			renderer: s,
			wrapper: new r({
				engine: o,
				name: c.name,
				fragmentShader: c.shader,
				samplerNames: ["textureSampler"]
			})
		}
	};
}
async function d() {
	return l ||= u(), await l;
}
var f = class {
	static async EncodeImageAsync(e, t, n, r, i, a) {
		let o = await d(), s = o.dumpEngine;
		s.engine.setSize(t, n, !0);
		let l = s.engine.createRawTexture(e, t, n, 5, !1, !i, 1);
		return s.renderer.setViewport(), s.renderer.applyEffectWrapper(s.wrapper), s.wrapper.effect._bindTexture("textureSampler", l), s.renderer.draw(), l.dispose(), await new Promise((e, t) => {
			c.ToBlob(o.canvas, (n) => {
				n ? e(n) : t(/* @__PURE__ */ Error("EncodeImageAsync: Failed to convert canvas to blob."));
			}, r, a);
		});
	}
};
a([o], f, "EncodeImageAsync", null);
var p = f.EncodeImageAsync;
async function m(e, t, n, r, i = "image/png", a, o) {
	let s = await n.readPixels(0, 0, e, t);
	g(e, t, new Uint8Array(s.buffer), r, i, a, !0, void 0, o);
}
async function h(e, r, i, a = "image/png", o, l = !1, u = !1, d) {
	if (i instanceof Float32Array) {
		let e = new Uint8Array(i.length), t = i.length;
		for (; t--;) {
			let r = i[t];
			e[t] = Math.round(n(r) * 255);
		}
		i = e;
	}
	let p = await f.EncodeImageAsync(i, e, r, a, l, d);
	o !== void 0 && c.DownloadBlob(p, o), p.type !== a && t.Warn(`DumpData: The requested mimeType '${a}' is not supported. The result has mimeType '${p.type}' instead.`);
	let m = await p.arrayBuffer();
	return u ? m : `data:${a};base64,${s(m)}`;
}
function g(e, t, n, r, i = "image/png", a, o = !1, s = !1, c) {
	a === void 0 && !r && (a = ""), h(e, t, n, i, a, o, s, c).then((e) => {
		r && r(e);
	});
}
function _() {
	l &&= (l?.then((e) => {
		e.canvas instanceof HTMLCanvasElement && e.canvas.remove(), e.dumpEngine && (e.dumpEngine.engine.dispose(), e.dumpEngine.renderer.dispose(), e.dumpEngine.wrapper.dispose());
	}), null);
}
var v = {
	DumpData: g,
	DumpDataAsync: h,
	DumpFramebuffer: m,
	Dispose: _
};
c.DumpData = g, c.DumpDataAsync = h, c.DumpFramebuffer = m;
//#endregion
export { v as a, m as i, g as n, p as o, h as r, _ as t };

//# sourceMappingURL=dumpTools-YIQ33Uth.js.map