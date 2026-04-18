import { o as e, t } from "./flowGraphBlock-CtJfM_SU.js";
//#region node_modules/@babylonjs/loaders/glTF/2.0/Extensions/KHR_interactivity/flowGraphGLTFDataProvider.js
var n = class extends t {
	constructor(t) {
		super();
		let n = t.glTF, r = n.animations?.map((e) => e._babylonAnimationGroup) || [];
		this.animationGroups = this.registerDataOutput("animationGroups", e, r);
		let i = n.nodes?.map((e) => e._babylonTransformNode) || [];
		this.nodes = this.registerDataOutput("nodes", e, i);
	}
	getClassName() {
		return "FlowGraphGLTFDataProvider";
	}
};
//#endregion
export { n as t };

//# sourceMappingURL=flowGraphGLTFDataProvider-CxX2ELNO.js.map