import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration.js
var t = "instancesDeclaration", n = "#ifdef INSTANCES\nattribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;\n#ifdef INSTANCESCOLOR\nattribute vec4 instanceColor;\n#endif\n#if defined(THIN_INSTANCES) && !defined(WORLD_UBO)\nuniform mat4 world;\n#endif\n#if defined(VELOCITY) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)\nattribute vec4 previousWorld0;attribute vec4 previousWorld1;attribute vec4 previousWorld2;attribute vec4 previousWorld3;\n#ifdef THIN_INSTANCES\nuniform mat4 previousWorld;\n#endif\n#endif\n#else\n#if !defined(WORLD_UBO)\nuniform mat4 world;\n#endif\n#if defined(VELOCITY) || defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR) || defined(VELOCITY_LINEAR)\nuniform mat4 previousWorld;\n#endif\n#endif\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion

//# sourceMappingURL=instancesDeclaration-DEbk9I6o.js.map