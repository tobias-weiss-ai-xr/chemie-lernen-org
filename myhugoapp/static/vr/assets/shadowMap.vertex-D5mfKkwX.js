import { t as e } from "./shaderStore-CADv5V1N.js";
import "./clipPlaneVertex-C5MG3fwG.js";
import "./morphTargetsVertex-D9V7BviE.js";
import "./helperFunctions-nfTcYCue.js";
import "./sceneUboDeclaration-sxot4Eho.js";
import "./meshUboDeclaration-BLLDyT4H.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/shadowMapVertexExtraDeclaration.js
var t = "shadowMapVertexExtraDeclaration", n = "#if SM_NORMALBIAS==1\nuniform lightDataSM: vec3f;\n#endif\nuniform biasAndScaleSM: vec3f;uniform depthValuesSM: vec2f;varying vDepthMetricSM: f32;\n#if SM_USEDISTANCE==1\nvarying vPositionWSM: vec3f;\n#endif\n#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1\nvarying zSM: f32;\n#endif\n";
e.IncludesShadersStoreWGSL[t] || (e.IncludesShadersStoreWGSL[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/shadowMapVertexNormalBias.js
var r = "shadowMapVertexNormalBias", i = "#if SM_NORMALBIAS==1\n#if SM_DIRECTIONINLIGHTDATA==1\nvar worldLightDirSM: vec3f=normalize(-uniforms.lightDataSM.xyz);\n#else\nvar directionToLightSM: vec3f=uniforms.lightDataSM.xyz-worldPos.xyz;var worldLightDirSM: vec3f=normalize(directionToLightSM);\n#endif\nvar ndlSM: f32=dot(vNormalW,worldLightDirSM);var sinNLSM: f32=sqrt(1.0-ndlSM*ndlSM);var normalBiasSM: f32=uniforms.biasAndScaleSM.y*sinNLSM;worldPos=vec4f(worldPos.xyz-vNormalW*normalBiasSM,worldPos.w);\n#endif\n";
e.IncludesShadersStoreWGSL[r] || (e.IncludesShadersStoreWGSL[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/ShadersInclude/shadowMapVertexMetric.js
var a = "shadowMapVertexMetric", o = "#if SM_USEDISTANCE==1\nvertexOutputs.vPositionWSM=worldPos.xyz;\n#endif\n#if SM_DEPTHTEXTURE==1\n#ifdef IS_NDC_HALF_ZRANGE\n#define BIASFACTOR 0.5\n#else\n#define BIASFACTOR 1.0\n#endif\n#ifdef USE_REVERSE_DEPTHBUFFER\nvertexOutputs.position.z-=uniforms.biasAndScaleSM.x*vertexOutputs.position.w*BIASFACTOR;\n#else\nvertexOutputs.position.z+=uniforms.biasAndScaleSM.x*vertexOutputs.position.w*BIASFACTOR;\n#endif\n#endif\n#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1\nvertexOutputs.zSM=vertexOutputs.position.z;vertexOutputs.position.z=0.0;\n#elif SM_USEDISTANCE==0\n#ifdef USE_REVERSE_DEPTHBUFFER\nvertexOutputs.vDepthMetricSM=(-vertexOutputs.position.z+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;\n#else\nvertexOutputs.vDepthMetricSM=(vertexOutputs.position.z+uniforms.depthValuesSM.x)/uniforms.depthValuesSM.y+uniforms.biasAndScaleSM.x;\n#endif\n#endif\n";
e.IncludesShadersStoreWGSL[a] || (e.IncludesShadersStoreWGSL[a] = o);
//#endregion
//#region node_modules/@babylonjs/core/ShadersWGSL/shadowMap.vertex.js
var s = "shadowMapVertexShader", c = "attribute position: vec3f;\n#ifdef NORMAL\nattribute normal: vec3f;\n#endif\n#include<bonesDeclaration>\n#include<bakedVertexAnimationDeclaration>\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef INSTANCES\nattribute world0: vec4f;attribute world1: vec4f;attribute world2: vec4f;attribute world3: vec4f;\n#endif\n#include<helperFunctions>\n#include<sceneUboDeclaration>\n#include<meshUboDeclaration>\n#ifdef ALPHATEXTURE\nvarying vUV: vec2f;uniform diffuseMatrix: mat4x4f;\n#ifdef UV1\nattribute uv: vec2f;\n#endif\n#ifdef UV2\nattribute uv2: vec2f;\n#endif\n#endif\n#include<shadowMapVertexExtraDeclaration>\n#include<clipPlaneVertexDeclaration>\n#define CUSTOM_VERTEX_DEFINITIONS\n@vertex\nfn main(input : VertexInputs)->FragmentInputs {var positionUpdated: vec3f=vertexInputs.position;\n#ifdef UV1\nvar uvUpdated: vec2f=vertexInputs.uv;\n#endif\n#ifdef UV2\nvar uv2Updated: vec2f=vertexInputs.uv2;\n#endif\n#ifdef NORMAL\nvar normalUpdated: vec3f=vertexInputs.normal;\n#endif\n#include<morphTargetsVertexGlobal>\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#include<instancesVertex>\n#include<bonesVertex>\n#include<bakedVertexAnimation>\nvar worldPos: vec4f=finalWorld* vec4f(positionUpdated,1.0);\n#ifdef NORMAL\nvar normWorldSM: mat3x3f= mat3x3f(finalWorld[0].xyz,finalWorld[1].xyz,finalWorld[2].xyz);\n#if defined(INSTANCES) && defined(THIN_INSTANCES)\nvar vNormalW: vec3f=normalUpdated/ vec3f(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);\n#else\n#ifdef NONUNIFORMSCALING\nnormWorldSM=transposeMat3(inverseMat3(normWorldSM));\n#endif\nvar vNormalW: vec3f=normalize(normWorldSM*normalUpdated);\n#endif\n#endif\n#include<shadowMapVertexNormalBias>\nvertexOutputs.position=scene.viewProjection*worldPos;\n#include<shadowMapVertexMetric>\n#ifdef ALPHATEXTURE\n#ifdef UV1\nvertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uvUpdated,1.0,0.0)).xy;\n#endif\n#ifdef UV2\nvertexOutputs.vUV= (uniforms.diffuseMatrix* vec4f(uv2Updated,1.0,0.0)).xy;\n#endif\n#endif\n#include<clipPlaneVertex>\n}";
e.ShadersStoreWGSL[s] || (e.ShadersStoreWGSL[s] = c);
var l = {
	name: s,
	shader: c
};
//#endregion
export { l as t };

//# sourceMappingURL=shadowMap.vertex-D5mfKkwX.js.map