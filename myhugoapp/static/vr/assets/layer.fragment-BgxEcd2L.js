import { t as e } from "./shaderStore-CADv5V1N.js";
import "./helperFunctions-nfTcYCue.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/layer.fragment.js
var t = "layerPixelShader", n = "varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform color: vec4f;\n#include<helperFunctions>\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {\n#define CUSTOM_FRAGMENT_MAIN_BEGIN\nvar baseColor: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);\n#if defined(CONVERT_TO_GAMMA)\nbaseColor=toGammaSpace(baseColor);\n#elif defined(CONVERT_TO_LINEAR)\nbaseColor=toLinearSpaceVec4(baseColor);\n#endif\n#ifdef ALPHATEST\nif (baseColor.a<0.4) {discard;}\n#endif\nfragmentOutputs.color=baseColor*uniforms.color;\n#define CUSTOM_FRAGMENT_MAIN_END\n}";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as layerPixelShaderWGSL };

//# sourceMappingURL=layer.fragment-BgxEcd2L.js.map