import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/clusteredLightingFunctions.js
var t = "clusteredLightingFunctions", n = "struct ClusteredLight {vLightData: vec4f,\nvLightDiffuse: vec4f,\nvLightSpecular: vec4f,\nvLightDirection: vec4f,\nvLightFalloff: vec4f,}\nfn getClusteredLight(lightDataTexture: texture_2d<f32>,index: u32)->ClusteredLight {return ClusteredLight(\ntextureLoad(lightDataTexture,vec2u(0,index),0),\ntextureLoad(lightDataTexture,vec2u(1,index),0),\ntextureLoad(lightDataTexture,vec2u(2,index),0),\ntextureLoad(lightDataTexture,vec2u(3,index),0),\ntextureLoad(lightDataTexture,vec2u(4,index),0)\n);}\nfn getClusteredSliceIndex(sliceData: vec2f,viewDepth: f32)->i32 {return i32(log(viewDepth)*sliceData.x+sliceData.y);}\n";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion

//# sourceMappingURL=clusteredLightingFunctions-BI88RM-W.js.map