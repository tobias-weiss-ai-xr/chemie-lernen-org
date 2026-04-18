import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/pass.fragment.js
var t = "passPixelShader", n = "varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as passPixelShaderWGSL };

//# sourceMappingURL=pass.fragment-D0CFF7RN.js.map