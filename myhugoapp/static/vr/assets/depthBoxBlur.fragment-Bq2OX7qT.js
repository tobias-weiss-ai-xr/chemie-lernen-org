import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/depthBoxBlur.fragment.js
var t = "depthBoxBlurPixelShader", n = "varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void)\n{vec4 colorDepth=vec4(0.0);for (int x=-OFFSET; x<=OFFSET; x++)\nfor (int y=-OFFSET; y<=OFFSET; y++)\ncolorDepth+=texture2D(textureSampler,vUV+vec2(x,y)/screenSize);gl_FragColor=(colorDepth/float((OFFSET*2+1)*(OFFSET*2+1)));}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as t };

//# sourceMappingURL=depthBoxBlur.fragment-Bq2OX7qT.js.map