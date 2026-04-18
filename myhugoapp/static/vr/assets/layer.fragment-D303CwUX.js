import { t as e } from "./shaderStore-CADv5V1N.js";
import "./helperFunctions-Bx-0aZur.js";
//#region node_modules/@babylonjs/core/Shaders/layer.fragment.js
var t = "layerPixelShader", n = "varying vec2 vUV;uniform sampler2D textureSampler;uniform vec4 color;\n#include<helperFunctions>\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void) {\n#define CUSTOM_FRAGMENT_MAIN_BEGIN\nvec4 baseColor=texture2D(textureSampler,vUV);\n#if defined(CONVERT_TO_GAMMA)\nbaseColor.rgb=toGammaSpace(baseColor.rgb);\n#elif defined(CONVERT_TO_LINEAR)\nbaseColor.rgb=toLinearSpace(baseColor.rgb);\n#endif\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\ngl_FragColor=baseColor*color;\n#define CUSTOM_FRAGMENT_MAIN_END\n}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as layerPixelShader };

//# sourceMappingURL=layer.fragment-D303CwUX.js.map