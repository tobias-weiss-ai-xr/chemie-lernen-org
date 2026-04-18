import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertexDeclaration.js
var t = "fogVertexDeclaration", n = "#ifdef FOG\nvarying vFogDistance: vec3f;\n#endif\n";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertex.js
var r = "fogVertex", i = "#ifdef FOG\n#ifdef SCENE_UBO\nvertexOutputs.vFogDistance=(scene.view*worldPos).xyz;\n#else\nvertexOutputs.vFogDistance=(uniforms.view*worldPos).xyz;\n#endif\n#endif\n";
e.IncludesShadersStoreWGSL[r] || (e.IncludesShadersStoreWGSL[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/vertexColorMixing.js
var a = "vertexColorMixing", o = "#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)\nvertexOutputs.vColor=vec4f(1.0);\n#ifdef VERTEXCOLOR\n#ifdef VERTEXALPHA\nvertexOutputs.vColor*=colorUpdated;\n#else\nvertexOutputs.vColor=vec4f(vertexOutputs.vColor.rgb*colorUpdated.rgb,vertexOutputs.vColor.a);\n#endif\n#endif\n#ifdef INSTANCESCOLOR\nvertexOutputs.vColor*=vertexInputs.instanceColor;\n#endif\n#endif\n";
e.IncludesShadersStoreWGSL[a] || (e.IncludesShadersStoreWGSL[a] = o);
//#endregion

//# sourceMappingURL=vertexColorMixing-D2ruUGep.js.map