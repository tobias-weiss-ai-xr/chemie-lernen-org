import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow.js
var t = "shadowMapFragmentSoftTransparentShadow", n = "#if SM_SOFTTRANSPARENTSHADOW==1\nif ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;\n#endif\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as t };

//# sourceMappingURL=shadowMapFragmentSoftTransparentShadow-BAV9zZ0I.js.map