import { i as e, t } from "./textureTools-C-mDeuST.js";
//#region node_modules/@babylonjs/core/Misc/rgbdTextureTools.js
var n = class {
	static ExpandRGBDTexture(t) {
		let n = t._texture;
		if (!n || !t.isRGBD) return;
		let r = n.getEngine(), i = r.getCaps(), a = n.isReady, o = !1;
		i.textureHalfFloatRender && i.textureHalfFloatLinearFiltering ? (o = !0, n.type = 2) : i.textureFloatRender && i.textureFloatLinearFiltering && (o = !0, n.type = 1), o && (n.isReady = !1, n._isRGBD = !1, n.invertY = !1);
		let s = async () => {
			let i = r.isWebGPU, a = +!!i;
			n.isReady = !1, i ? await import("./rgbdDecode.fragment-QoDGFJnZ.js") : await import("./rgbdDecode.fragment-CrDNNF5D.js");
			let o = new e("rgbdDecode", "rgbdDecode", null, null, 1, null, 3, r, !1, void 0, n.type, void 0, null, !1, void 0, a);
			o.externalTextureSamplerBinding = !0;
			let s = r.createRenderTargetTexture(n.width, {
				generateDepthBuffer: !1,
				generateMipMaps: !1,
				generateStencilBuffer: !1,
				samplingMode: n.samplingMode,
				type: n.type,
				format: 5
			});
			o.onEffectCreatedObservable.addOnce((e) => {
				e.executeWhenCompiled(() => {
					o.onApply = (e) => {
						e._bindTexture("textureSampler", n), e.setFloat2("scale", 1, 1);
					}, t.getScene().postProcessManager.directRender([o], s, !0), r.restoreDefaultFramebuffer(), r._releaseTexture(n), o && o.dispose(), s._swapAndDie(n), n.isReady = !0;
				});
			});
		};
		o && (a ? s() : t.onLoadObservable.addOnce(s));
	}
	static async EncodeTextureToRGBD(e, n, r = 0) {
		return n.getEngine().isWebGPU ? await import("./rgbdEncode.fragment-B-wOEa-S.js") : await import("./rgbdEncode.fragment-CPwXbaVI.js"), await t("rgbdEncode", e, n, r, 1, 5);
	}
};
//#endregion
export { n as t };

//# sourceMappingURL=rgbdTextureTools-BBx0m4FU.js.map