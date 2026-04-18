import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/passCube.fragment.js
var t = "passCubePixelShader", n = "varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_cube<f32>;\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {var uv: vec2f=input.vUV*2.0-1.0;\n#ifdef POSITIVEX\nfragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(1.001,uv.y,uv.x));\n#endif\n#ifdef NEGATIVEX\nfragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(-1.001,uv.y,uv.x));\n#endif\n#ifdef POSITIVEY\nfragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv.y,1.001,uv.x));\n#endif\n#ifdef NEGATIVEY\nfragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv.y,-1.001,uv.x));\n#endif\n#ifdef POSITIVEZ\nfragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv,1.001));\n#endif\n#ifdef NEGATIVEZ\nfragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,vec3f(uv,-1.001));\n#endif\n}";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as passCubePixelShaderWGSL };

//# sourceMappingURL=passCube.fragment-Bc4-s72g.js.map