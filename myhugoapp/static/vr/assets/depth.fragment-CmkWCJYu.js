import { t as e } from "./shaderStore-CADv5V1N.js";
import "./clipPlaneFragment-CTx-m5Va.js";
import "./packingFunctions-DNmZ4th2.js";
//#region node_modules/@babylonjs/core/Shaders/depth.fragment.js
var t = "depthPixelShader", n = "#ifdef ALPHATEST\nvarying vec2 vUV;uniform sampler2D diffuseSampler;\n#endif\n#include<clipPlaneFragmentDeclaration>\nvarying float vDepthMetric;\n#ifdef PACKED\n#include<packingFunctions>\n#endif\n#ifdef STORE_CAMERASPACE_Z\nvarying vec4 vViewPos;\n#endif\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void)\n{\n#include<clipPlaneFragment>\n#ifdef ALPHATEST\nif (texture2D(diffuseSampler,vUV).a<0.4)\ndiscard;\n#endif\n#ifdef STORE_CAMERASPACE_Z\n#ifdef PACKED\ngl_FragColor=pack(vViewPos.z);\n#else\ngl_FragColor=vec4(vViewPos.z,0.0,0.0,1.0);\n#endif\n#else\n#ifdef NONLINEARDEPTH\n#ifdef PACKED\ngl_FragColor=pack(gl_FragCoord.z);\n#else\ngl_FragColor=vec4(gl_FragCoord.z,0.0,0.0,0.0);\n#endif\n#else\n#ifdef PACKED\ngl_FragColor=pack(vDepthMetric);\n#else\ngl_FragColor=vec4(vDepthMetric,0.0,0.0,1.0);\n#endif\n#endif\n#endif\n}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as t };

//# sourceMappingURL=depth.fragment-CmkWCJYu.js.map