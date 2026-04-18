import { t as e } from "./shaderStore-CADv5V1N.js";
import "./kernelBlurVaryingDeclaration-CbDI9i22.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/kernelBlurVertex.js
var t = "kernelBlurVertex", n = "vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/kernelBlur.vertex.js
var r = "kernelBlurVertexShader", i = "attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;\n#include<kernelBlurVaryingDeclaration>[0..varyingCount]\n#define CUSTOM_VERTEX_DEFINITIONS\n@vertex\nfn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);\n#define CUSTOM_VERTEX_MAIN_BEGIN\nvertexOutputs.sampleCenter=(vertexInputs.position*madd+madd);\n#include<kernelBlurVertex>[0..varyingCount]\nvertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);\n#define CUSTOM_VERTEX_MAIN_END\n}";
e.ShadersStoreWGSL[r] || (e.ShadersStoreWGSL[r] = i);
var a = {
	name: r,
	shader: i
};
//#endregion
export { a as kernelBlurVertexShaderWGSL };

//# sourceMappingURL=kernelBlur.vertex-Cf-m3ncu.js.map