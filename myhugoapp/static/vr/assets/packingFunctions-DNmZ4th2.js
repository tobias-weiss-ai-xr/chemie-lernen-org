import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/packingFunctions.js
var t = "packingFunctions", n = "vec4 pack(float depth)\n{const vec4 bit_shift=vec4(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const vec4 bit_mask=vec4(0.0,1.0/255.0,1.0/255.0,1.0/255.0);vec4 res=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}\nfloat unpack(vec4 color)\n{const vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion

//# sourceMappingURL=packingFunctions-DNmZ4th2.js.map