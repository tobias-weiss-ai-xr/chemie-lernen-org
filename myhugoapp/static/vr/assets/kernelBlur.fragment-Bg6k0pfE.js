import { t as e } from "./shaderStore-CADv5V1N.js";
import "./packingFunctions-DNmZ4th2.js";
import "./kernelBlurVaryingDeclaration-ke5zXCV0.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/kernelBlurFragment.js
var t = "kernelBlurFragment", n = "#ifdef DOF\nfactor=sampleCoC(sampleCoord{X}); \ncomputedWeight=KERNEL_WEIGHT{X}*factor;sumOfWeights+=computedWeight;\n#else\ncomputedWeight=KERNEL_WEIGHT{X};\n#endif\n#ifdef PACKEDFLOAT\nblend+=unpack(texture2D(textureSampler,sampleCoord{X}))*computedWeight;\n#else\nblend+=texture2D(textureSampler,sampleCoord{X})*computedWeight;\n#endif\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/kernelBlurFragment2.js
var r = "kernelBlurFragment2", i = "#ifdef DOF\nfactor=sampleCoC(sampleCenter+delta*KERNEL_DEP_OFFSET{X});computedWeight=KERNEL_DEP_WEIGHT{X}*factor;sumOfWeights+=computedWeight;\n#else\ncomputedWeight=KERNEL_DEP_WEIGHT{X};\n#endif\n#ifdef PACKEDFLOAT\nblend+=unpack(texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X}))*computedWeight;\n#else\nblend+=texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X})*computedWeight;\n#endif\n";
e.IncludesShadersStore[r] || (e.IncludesShadersStore[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/kernelBlur.fragment.js
var a = "kernelBlurPixelShader", o = "uniform sampler2D textureSampler;uniform vec2 delta;varying vec2 sampleCenter;\n#ifdef DOF\nuniform sampler2D circleOfConfusionSampler;float sampleCoC(in vec2 offset) {float coc=texture2D(circleOfConfusionSampler,offset).r;return coc; }\n#endif\n#include<kernelBlurVaryingDeclaration>[0..varyingCount]\n#ifdef PACKEDFLOAT\n#include<packingFunctions>\n#endif\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void)\n{float computedWeight=0.0;\n#ifdef PACKEDFLOAT\nfloat blend=0.;\n#else\nvec4 blend=vec4(0.);\n#endif\n#ifdef DOF\nfloat sumOfWeights=CENTER_WEIGHT; \nfloat factor=0.0;\n#ifdef PACKEDFLOAT\nblend+=unpack(texture2D(textureSampler,sampleCenter))*CENTER_WEIGHT;\n#else\nblend+=texture2D(textureSampler,sampleCenter)*CENTER_WEIGHT;\n#endif\n#endif\n#include<kernelBlurFragment>[0..varyingCount]\n#include<kernelBlurFragment2>[0..depCount]\n#ifdef PACKEDFLOAT\ngl_FragColor=pack(blend);\n#else\ngl_FragColor=blend;\n#endif\n#ifdef DOF\ngl_FragColor/=sumOfWeights;\n#endif\n}";
e.ShadersStore[a] || (e.ShadersStore[a] = o);
var s = {
	name: a,
	shader: o
};
//#endregion
export { s as kernelBlurPixelShader };

//# sourceMappingURL=kernelBlur.fragment-Bg6k0pfE.js.map