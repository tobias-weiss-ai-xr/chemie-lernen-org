import { n as e } from "./typeStore-Bwo5hkCf.js";
import { a as t, r as n } from "./math.vector-ByhvsffM.js";
import { g as r, o as i, t as a } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphTransformCoordinatesSystemBlock.js
var o = class extends a {
	constructor(e) {
		super(e), this.sourceSystem = this.registerDataInput("sourceSystem", i), this.destinationSystem = this.registerDataInput("destinationSystem", i), this.inputCoordinates = this.registerDataInput("inputCoordinates", r), this.outputCoordinates = this.registerDataOutput("outputCoordinates", r);
	}
	_updateOutputs(e) {
		let r = this.sourceSystem.getValue(e), i = this.destinationSystem.getValue(e), a = this.inputCoordinates.getValue(e), o = r.getWorldMatrix(), s = i.getWorldMatrix(), c = n.Matrix[0].copyFrom(s);
		c.invert();
		let l = n.Matrix[1];
		c.multiplyToRef(o, l);
		let u = this.outputCoordinates.getValue(e);
		t.TransformCoordinatesToRef(a, l, u);
	}
	getClassName() {
		return "FlowGraphTransformCoordinatesSystemBlock";
	}
};
e("FlowGraphTransformCoordinatesSystemBlock", o);
//#endregion
export { o as FlowGraphTransformCoordinatesSystemBlock };

//# sourceMappingURL=flowGraphTransformCoordinatesSystemBlock-dB_hSnV-.js.map