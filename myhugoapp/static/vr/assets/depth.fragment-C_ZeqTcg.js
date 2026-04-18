import { t as e } from "./shaderStore-CADv5V1N.js";
import "./packingFunctions-CEOSiSVc.js";
import "./clipPlaneFragment-CLblWoXL.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/depth.fragment.js
var t = "depthPixelShader", n = "#ifdef ALPHATEST\nvarying vUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;\n#endif\n#include<clipPlaneFragmentDeclaration>\nvarying vDepthMetric: f32;\n#ifdef PACKED\n#include<packingFunctions>\n#endif\n#ifdef STORE_CAMERASPACE_Z\nvarying vViewPos: vec4f;\n#endif\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {\n#include<clipPlaneFragment>\n#ifdef ALPHATEST\nif (textureSample(diffuseSampler,diffuseSamplerSampler,input.vUV).a<0.4) {discard;}\n#endif\n#ifdef STORE_CAMERASPACE_Z\n#ifdef PACKED\nfragmentOutputs.color=pack(input.vViewPos.z);\n#else\nfragmentOutputs.color= vec4f(input.vViewPos.z,0.0,0.0,1.0);\n#endif\n#else\n#ifdef NONLINEARDEPTH\n#ifdef PACKED\nfragmentOutputs.color=pack(input.position.z);\n#else\nfragmentOutputs.color= vec4f(input.position.z,0.0,0.0,0.0);\n#endif\n#else\n#ifdef PACKED\nfragmentOutputs.color=pack(input.vDepthMetric);\n#else\nfragmentOutputs.color= vec4f(input.vDepthMetric,0.0,0.0,1.0);\n#endif\n#endif\n#endif\n}";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as depthPixelShaderWGSL };

//# sourceMappingURL=depth.fragment-C_ZeqTcg.js.map