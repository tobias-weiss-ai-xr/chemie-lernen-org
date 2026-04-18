import { t as e } from "./shaderStore-CADv5V1N.js";
import "./clipPlaneVertex-C5MG3fwG.js";
import "./morphTargetsVertex-D9V7BviE.js";
import "./instancesDeclaration-JpzfpAR2.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/depth.vertex.js
var t = "depthVertexShader", n = "attribute position: vec3f;\n#include<bonesDeclaration>\n#include<bakedVertexAnimationDeclaration>\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#include<clipPlaneVertexDeclaration>\n#include<instancesDeclaration>\nuniform viewProjection: mat4x4f;uniform depthValues: vec2f;\n#if defined(ALPHATEST) || defined(NEED_UV)\nvarying vUV: vec2f;uniform diffuseMatrix: mat4x4f;\n#ifdef UV1\nattribute uv: vec2f;\n#endif\n#ifdef UV2\nattribute uv2: vec2f;\n#endif\n#endif\n#ifdef STORE_CAMERASPACE_Z\nuniform view: mat4x4f;varying vViewPos: vec4f;\n#endif\nvarying vDepthMetric: f32;\n#define CUSTOM_VERTEX_DEFINITIONS\n@vertex\nfn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;\n#ifdef UV1\nvar uvUpdated: vec2f=vertexInputs.uv;\n#endif\n#ifdef UV2\nvar uv2Updated: vec2f=vertexInputs.uv2;\n#endif\n#include<morphTargetsVertexGlobal>\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#include<instancesVertex>\n#include<bonesVertex>\n#include<bakedVertexAnimation>\nvar worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);\n#include<clipPlaneVertex>\nvertexOutputs.position=uniforms.viewProjection*worldPos;\n#ifdef STORE_CAMERASPACE_Z\nvertexOutputs.vViewPos=uniforms.view*worldPos;\n#else\n#ifdef USE_REVERSE_DEPTHBUFFER\nvertexOutputs.vDepthMetric=((-vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));\n#else\nvertexOutputs.vDepthMetric=((vertexOutputs.position.z+uniforms.depthValues.x)/(uniforms.depthValues.y));\n#endif\n#endif\n#if defined(ALPHATEST) || defined(BASIC_RENDER)\n#ifdef UV1\nvertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;\n#endif\n#ifdef UV2\nvertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;\n#endif\n#endif\n}\n";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as depthVertexShaderWGSL };

//# sourceMappingURL=depth.vertex-BG94hlYS.js.map