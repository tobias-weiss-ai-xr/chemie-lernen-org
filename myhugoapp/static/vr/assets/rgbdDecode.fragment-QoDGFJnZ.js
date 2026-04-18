import { t as e } from "./shaderStore-CADv5V1N.js";
import "./helperFunctions-nfTcYCue.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/rgbdDecode.fragment.js
var t = "rgbdDecodePixelShader", n = "varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;\n#include<helperFunctions>\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
//#endregion

//# sourceMappingURL=rgbdDecode.fragment-QoDGFJnZ.js.map