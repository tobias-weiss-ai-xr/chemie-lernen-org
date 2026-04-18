import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration.js
var t = "fogVertexDeclaration", n = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/fogVertex.js
var r = "fogVertex", i = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif\n";
e.IncludesShadersStore[r] || (e.IncludesShadersStore[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/vertexColorMixing.js
var a = "vertexColorMixing", o = "#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)\nvColor=vec4(1.0);\n#ifdef VERTEXCOLOR\n#ifdef VERTEXALPHA\nvColor*=colorUpdated;\n#else\nvColor.rgb*=colorUpdated.rgb;\n#endif\n#endif\n#ifdef INSTANCESCOLOR\nvColor*=instanceColor;\n#endif\n#endif\n";
e.IncludesShadersStore[a] || (e.IncludesShadersStore[a] = o);
//#endregion

//# sourceMappingURL=vertexColorMixing-BWk0dMFC.js.map