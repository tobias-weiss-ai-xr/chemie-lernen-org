import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/procedural.vertex.js
var t = "proceduralVertexShader", n = "attribute vec2 position;varying vec2 vPosition;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);\n#define CUSTOM_VERTEX_DEFINITIONS\nvoid main(void) {\n#define CUSTOM_VERTEX_MAIN_BEGIN\nvPosition=position;vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);\n#define CUSTOM_VERTEX_MAIN_END\n}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as proceduralVertexShader };

//# sourceMappingURL=procedural.vertex-DLv_RKP-.js.map