import { t as e } from "./shaderStore-CADv5V1N.js";
import "./helperFunctions-Bx-0aZur.js";
//#region node_modules/@babylonjs/core/Shaders/rgbdEncode.fragment.js
var t = "rgbdEncodePixelShader", n = "varying vec2 vUV;uniform sampler2D textureSampler;\n#include<helperFunctions>\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void) \n{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
//#endregion

//# sourceMappingURL=rgbdEncode.fragment-CPwXbaVI.js.map