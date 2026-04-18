import { t as e } from "./shaderStore-CADv5V1N.js";
import "./helperFunctions-nfTcYCue.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/rgbdEncode.fragment.js
var t = "rgbdEncodePixelShader", n = "varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;\n#include<helperFunctions>\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
//#endregion

//# sourceMappingURL=rgbdEncode.fragment-B-wOEa-S.js.map