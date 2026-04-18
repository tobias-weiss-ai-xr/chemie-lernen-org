import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/layer.vertex.js
var t = "layerVertexShader", n = "attribute vec2 position;uniform vec2 scale;uniform vec2 offset;uniform mat4 textureMatrix;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);\n#define CUSTOM_VERTEX_DEFINITIONS\nvoid main(void) {\n#define CUSTOM_VERTEX_MAIN_BEGIN\nvec2 shiftedPosition=position*scale+offset;vUV=vec2(textureMatrix*vec4(shiftedPosition*madd+madd,1.0,0.0));gl_Position=vec4(shiftedPosition,0.0,1.0);\n#define CUSTOM_VERTEX_MAIN_END\n}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as layerVertexShader };

//# sourceMappingURL=layer.vertex-mDZOKx-i.js.map