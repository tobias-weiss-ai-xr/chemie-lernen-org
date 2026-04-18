import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/mainUVVaryingDeclaration.js
var t = "mainUVVaryingDeclaration", n = "#ifdef MAINUV{X}\nvarying vMainUV{X}: vec2f;\n#endif\n";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthDeclaration.js
var r = "logDepthDeclaration", i = "#ifdef LOGARITHMICDEPTH\nuniform logarithmicDepthConstant: f32;varying vFragmentDepth: f32;\n#endif\n";
e.IncludesShadersStoreWGSL[r] || (e.IncludesShadersStoreWGSL[r] = i);
//#endregion

//# sourceMappingURL=logDepthDeclaration-DT8l9iza.js.map