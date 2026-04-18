import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/clusteredLightingFunctions.js
var t = "clusteredLightingFunctions", n = "struct ClusteredLight {vec4 vLightData;vec4 vLightDiffuse;vec4 vLightSpecular;vec4 vLightDirection;vec4 vLightFalloff;};\n#define inline\nClusteredLight getClusteredLight(sampler2D lightDataTexture,int index) {return ClusteredLight(\ntexelFetch(lightDataTexture,ivec2(0,index),0),\ntexelFetch(lightDataTexture,ivec2(1,index),0),\ntexelFetch(lightDataTexture,ivec2(2,index),0),\ntexelFetch(lightDataTexture,ivec2(3,index),0),\ntexelFetch(lightDataTexture,ivec2(4,index),0)\n);}\nint getClusteredSliceIndex(vec2 sliceData,float viewDepth) {return int(log(viewDepth)*sliceData.x+sliceData.y);}\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion

//# sourceMappingURL=clusteredLightingFunctions-C-2T80k3.js.map