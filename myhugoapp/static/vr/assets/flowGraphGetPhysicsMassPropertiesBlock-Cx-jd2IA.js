import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, g as n, o as r, t as i } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Physics/flowGraphGetPhysicsMassPropertiesBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.body = this.registerDataInput("body", r), this.mass = this.registerDataOutput("mass", t), this.centerOfMass = this.registerDataOutput("centerOfMass", n), this.inertia = this.registerDataOutput("inertia", n);
	}
	_updateOutputs(e) {
		let t = this.body.getValue(e);
		if (!t) return;
		let n = t.getMassProperties();
		n.mass !== void 0 && this.mass.setValue(n.mass, e), n.centerOfMass && this.centerOfMass.setValue(n.centerOfMass, e), n.inertia && this.inertia.setValue(n.inertia, e);
	}
	getClassName() {
		return "FlowGraphGetPhysicsMassPropertiesBlock";
	}
};
e("FlowGraphGetPhysicsMassPropertiesBlock", a);
//#endregion
export { a as FlowGraphGetPhysicsMassPropertiesBlock };

//# sourceMappingURL=flowGraphGetPhysicsMassPropertiesBlock-Cx-jd2IA.js.map