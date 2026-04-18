import { n as e } from "./typeStore-Bwo5hkCf.js";
import { t } from "./animation-BZ-Lo6NO.js";
import { b as n, f as r, m as i, o as a, t as o, y as s } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Animation/flowGraphInterpolationBlock.js
var c = class extends o {
	constructor(e = {}) {
		super(e), this.keyFrames = [];
		let t = typeof e?.animationType == "string" ? n(e.animationType) : s(e?.animationType ?? 0), o = e?.keyFramesCount ?? 1, c = this.registerDataInput("duration_0", r, 0), l = this.registerDataInput("value_0", t);
		this.keyFrames.push({
			duration: c,
			value: l
		});
		for (let n = 1; n < o + 1; n++) {
			let i = this.registerDataInput(`duration_${n}`, r, n === o ? e.duration : void 0), a = this.registerDataInput(`value_${n}`, t);
			this.keyFrames.push({
				duration: i,
				value: a
			});
		}
		this.initialValue = this.keyFrames[0].value, this.endValue = this.keyFrames[o].value, this.easingFunction = this.registerDataInput("easingFunction", a), this.animation = this.registerDataOutput("animation", a), this.propertyName = this.registerDataInput("propertyName", i, e?.propertyName), this.customBuildAnimation = this.registerDataInput("customBuildAnimation", a);
	}
	_updateOutputs(e) {
		let t = e._getGlobalContextVariable("interpolationAnimations", []), n = this.propertyName.getValue(e), r = this.easingFunction.getValue(e), i = this._createAnimation(e, n, r);
		if (this.animation.setValue(i, e), Array.isArray(i)) for (let e of i) t.push(e.uniqueId);
		else t.push(i.uniqueId);
		e._setGlobalContextVariable("interpolationAnimations", t);
	}
	_createAnimation(e, n, r) {
		let i = this.initialValue.richType, a = [], o = this.initialValue.getValue(e) || i.defaultValue;
		a.push({
			frame: 0,
			value: o
		});
		let s = this.config?.numberOfKeyFrames ?? 1;
		for (let t = 1; t < s + 1; t++) {
			let n = this.keyFrames[t].duration?.getValue(e), r = this.keyFrames[t].value?.getValue(e);
			t === s - 1 && (r ||= i.defaultValue), n !== void 0 && r && a.push({
				frame: n * 60,
				value: r
			});
		}
		let c = this.customBuildAnimation.getValue(e);
		if (c) return c(null, null, e)(a, 60, i.animationType, r);
		if (typeof n == "string") {
			let e = t.CreateAnimation(n, i.animationType, 60, r);
			return e.setKeys(a), [e];
		} else return n.map((e) => {
			let n = t.CreateAnimation(e, i.animationType, 60, r);
			return n.setKeys(a), n;
		});
	}
	getClassName() {
		return "FlowGraphInterpolationBlock";
	}
};
e("FlowGraphInterpolationBlock", c);
//#endregion
export { c as FlowGraphInterpolationBlock };

//# sourceMappingURL=flowGraphInterpolationBlock-Ny4043gF.js.map