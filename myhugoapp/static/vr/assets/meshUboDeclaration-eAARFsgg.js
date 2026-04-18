import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/meshUboDeclaration.js
var t = "meshUboDeclaration", n = "#ifdef WEBGL2\nuniform mat4 world;uniform float visibility;\n#else\nlayout(std140,column_major) uniform;uniform Mesh\n{mat4 world;float visibility;};\n#endif\n#define WORLD_UBO\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion

//# sourceMappingURL=meshUboDeclaration-eAARFsgg.js.map