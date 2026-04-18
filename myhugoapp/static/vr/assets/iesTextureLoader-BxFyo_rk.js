import { t as e } from "./iesLoader-CDTQsmRc.js";
//#region node_modules/@babylonjs/core/Materials/Textures/Loaders/iesTextureLoader.js
var t = class {
	constructor() {
		this.supportCascades = !1;
	}
	loadCubeData() {
		throw ".ies not supported in Cube.";
	}
	loadData(t, n, r) {
		let i = e(new Uint8Array(t.buffer, t.byteOffset, t.byteLength));
		r(i.width, i.height, !!n.useMipMaps, !1, () => {
			let e = n.getEngine();
			n.type = 1, n.format = 6, n._gammaSpace = !1, e._uploadDataToTextureDirectly(n, i.data);
		});
	}
};
//#endregion
export { t as _IESTextureLoader };

//# sourceMappingURL=iesTextureLoader-BxFyo_rk.js.map