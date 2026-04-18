import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t, t as n, w as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphAssetsContext-D5U5Q3eA.js";
import { o as a } from "./utils-ChmPBd4C.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphGetAssetBlock.js
var o = class extends n {
	constructor(e) {
		super(e), this.config = e, this.type = this.registerDataInput("type", t, e.type), this.value = this.registerDataOutput("value", t), this.index = this.registerDataInput("index", t, new r(a(e.index ?? -1)));
	}
	_updateOutputs(e) {
		let t = this.type.getValue(e), n = this.index.getValue(e), r = i(e.assetsContext, t, a(n), this.config.useIndexAsUniqueId);
		this.value.setValue(r, e);
	}
	getClassName() {
		return "FlowGraphGetAssetBlock";
	}
};
e("FlowGraphGetAssetBlock", o);
//#endregion
export { o as FlowGraphGetAssetBlock };

//# sourceMappingURL=flowGraphGetAssetBlock-BcWMN5HM.js.map