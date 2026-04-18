import { t as e } from "./shaderStore-CADv5V1N.js";
import "./kernelBlurVaryingDeclaration-ke5zXCV0.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/kernelBlurVertex.js
var t = "kernelBlurVertex", n = "sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/kernelBlur.vertex.js
var r = "kernelBlurVertexShader", i = "attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;\n#include<kernelBlurVaryingDeclaration>[0..varyingCount]\nconst vec2 madd=vec2(0.5,0.5);\n#define CUSTOM_VERTEX_DEFINITIONS\nvoid main(void) {\n#define CUSTOM_VERTEX_MAIN_BEGIN\nsampleCenter=(position*madd+madd);\n#include<kernelBlurVertex>[0..varyingCount]\ngl_Position=vec4(position,0.0,1.0);\n#define CUSTOM_VERTEX_MAIN_END\n}";
e.ShadersStore[r] || (e.ShadersStore[r] = i);
var a = {
	name: r,
	shader: i
};
//#endregion
export { a as kernelBlurVertexShader };

//# sourceMappingURL=kernelBlur.vertex-C76c0q8A.js.map