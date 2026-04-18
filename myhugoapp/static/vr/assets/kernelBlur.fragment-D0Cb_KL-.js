import { t as e } from "./shaderStore-CADv5V1N.js";
import "./packingFunctions-CEOSiSVc.js";
import "./kernelBlurVaryingDeclaration-CbDI9i22.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/kernelBlurFragment.js
var t = "kernelBlurFragment", n = "#ifdef DOF\nfactor=sampleCoC(fragmentInputs.sampleCoord{X}); \ncomputedWeight=KERNEL_WEIGHT{X}*factor;sumOfWeights+=computedWeight;\n#else\ncomputedWeight=KERNEL_WEIGHT{X};\n#endif\n#ifdef PACKEDFLOAT\nblend+=unpack(textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCoord{X}))*computedWeight;\n#else\nblend+=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCoord{X})*computedWeight;\n#endif\n";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/kernelBlurFragment2.js
var r = "kernelBlurFragment2", i = "#ifdef DOF\nfactor=sampleCoC(fragmentInputs.sampleCenter+uniforms.delta*KERNEL_DEP_OFFSET{X});computedWeight=KERNEL_DEP_WEIGHT{X}*factor;sumOfWeights+=computedWeight;\n#else\ncomputedWeight=KERNEL_DEP_WEIGHT{X};\n#endif\n#ifdef PACKEDFLOAT\nblend+=unpack(textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCenter+uniforms.delta*KERNEL_DEP_OFFSET{X}))*computedWeight;\n#else\nblend+=textureSample(textureSampler,textureSamplerSampler,fragmentInputs.sampleCenter+uniforms.delta*KERNEL_DEP_OFFSET{X})*computedWeight;\n#endif\n";
e.IncludesShadersStoreWGSL[r] || (e.IncludesShadersStoreWGSL[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/kernelBlur.fragment.js
var a = "kernelBlurPixelShader", o = "var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform delta: vec2f;varying sampleCenter: vec2f;\n#ifdef DOF\nvar circleOfConfusionSamplerSampler: sampler;var circleOfConfusionSampler: texture_2d<f32>;fn sampleCoC(offset: vec2f)->f32 {var coc: f32=textureSample(circleOfConfusionSampler,circleOfConfusionSamplerSampler,offset).r;return coc; }\n#endif\n#include<kernelBlurVaryingDeclaration>[0..varyingCount]\n#ifdef PACKEDFLOAT\n#include<packingFunctions>\n#endif\n#define CUSTOM_FRAGMENT_DEFINITIONS\n@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {var computedWeight: f32=0.0;\n#ifdef PACKEDFLOAT\nvar blend: f32=0.;\n#else\nvar blend: vec4f= vec4f(0.);\n#endif\n#ifdef DOF\nvar sumOfWeights: f32=CENTER_WEIGHT; \nvar factor: f32=0.0;\n#ifdef PACKEDFLOAT\nblend+=unpack(textureSample(textureSampler,textureSamplerSampler,input.sampleCenter))*CENTER_WEIGHT;\n#else\nblend+=textureSample(textureSampler,textureSamplerSampler,input.sampleCenter)*CENTER_WEIGHT;\n#endif\n#endif\n#include<kernelBlurFragment>[0..varyingCount]\n#include<kernelBlurFragment2>[0..depCount]\n#ifdef PACKEDFLOAT\nfragmentOutputs.color=pack(blend);\n#else\nfragmentOutputs.color=blend;\n#endif\n#ifdef DOF\nfragmentOutputs.color/=sumOfWeights;\n#endif\n}";
e.ShadersStoreWGSL[a] || (e.ShadersStoreWGSL[a] = o);
var s = {
	name: a,
	shader: o
};
//#endregion
export { s as kernelBlurPixelShaderWGSL };

//# sourceMappingURL=kernelBlur.fragment-D0Cb_KL-.js.map