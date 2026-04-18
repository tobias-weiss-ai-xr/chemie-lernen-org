import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/packingFunctions.js
var t = "packingFunctions", n = "fn pack(depth: f32)->vec4f\n{const bit_shift: vec4f= vec4f(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const bit_mask: vec4f= vec4f(0.0,1.0/255.0,1.0/255.0,1.0/255.0);var res: vec4f=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}\nfn unpack(color: vec4f)->f32\n{const bit_shift: vec4f= vec4f(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion

//# sourceMappingURL=packingFunctions-CEOSiSVc.js.map