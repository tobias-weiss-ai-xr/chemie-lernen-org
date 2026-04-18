import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/passCube.fragment.js
var t = "passCubePixelShader", n = "varying vec2 vUV;uniform samplerCube textureSampler;\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void) \n{vec2 uv=vUV*2.0-1.0;\n#ifdef POSITIVEX\ngl_FragColor=textureCube(textureSampler,vec3(1.001,uv.y,uv.x));\n#endif\n#ifdef NEGATIVEX\ngl_FragColor=textureCube(textureSampler,vec3(-1.001,uv.y,uv.x));\n#endif\n#ifdef POSITIVEY\ngl_FragColor=textureCube(textureSampler,vec3(uv.y,1.001,uv.x));\n#endif\n#ifdef NEGATIVEY\ngl_FragColor=textureCube(textureSampler,vec3(uv.y,-1.001,uv.x));\n#endif\n#ifdef POSITIVEZ\ngl_FragColor=textureCube(textureSampler,vec3(uv,1.001));\n#endif\n#ifdef NEGATIVEZ\ngl_FragColor=textureCube(textureSampler,vec3(uv,-1.001));\n#endif\n}";
e.ShadersStore[t] || (e.ShadersStore[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as passCubePixelShader };

//# sourceMappingURL=passCube.fragment-B3fbixNQ.js.map