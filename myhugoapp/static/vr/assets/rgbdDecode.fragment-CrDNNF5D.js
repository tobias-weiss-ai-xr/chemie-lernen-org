import { t as e } from "./shaderStore-CADv5V1N.js";
import "./helperFunctions-Bx-0aZur.js";
//#region node_modules/@babylonjs/core/Shaders/rgbdDecode.fragment.js
var t = "rgbdDecodePixelShader", n = "varying vec2 vUV;uniform sampler2D textureSampler;\n#include<helperFunctions>\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void) \n{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
//#endregion

//# sourceMappingURL=rgbdDecode.fragment-CrDNNF5D.js.map