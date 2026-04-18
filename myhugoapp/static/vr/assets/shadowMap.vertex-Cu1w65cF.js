import { t as e } from "./shaderStore-CADv5V1N.js";
import "./clipPlaneVertex-BIcu3vQe.js";
import "./morphTargetsVertex-CQzsJNx3.js";
import "./helperFunctions-Bx-0aZur.js";
import "./sceneVertexDeclaration-DTwYXaOu.js";
import "./sceneUboDeclaration-C0KwScB5.js";
import "./meshUboDeclaration-eAARFsgg.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/meshVertexDeclaration.js
var t = "meshVertexDeclaration", n = "uniform mat4 world;uniform float visibility;\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapVertexDeclaration.js
var r = "shadowMapVertexDeclaration", i = "#include<sceneVertexDeclaration>\n#include<meshVertexDeclaration>\n";
e.IncludesShadersStore[r] || (e.IncludesShadersStore[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapUboDeclaration.js
var a = "shadowMapUboDeclaration", o = "layout(std140,column_major) uniform;\n#include<sceneUboDeclaration>\n#include<meshUboDeclaration>\n";
e.IncludesShadersStore[a] || (e.IncludesShadersStore[a] = o);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapVertexExtraDeclaration.js
var s = "shadowMapVertexExtraDeclaration", c = "#if SM_NORMALBIAS==1\nuniform vec3 lightDataSM;\n#endif\nuniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;varying float vDepthMetricSM;\n#if SM_USEDISTANCE==1\nvarying vec3 vPositionWSM;\n#endif\n#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1\nvarying float zSM;\n#endif\n";
e.IncludesShadersStore[s] || (e.IncludesShadersStore[s] = c);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapVertexNormalBias.js
var l = "shadowMapVertexNormalBias", u = "#if SM_NORMALBIAS==1\n#if SM_DIRECTIONINLIGHTDATA==1\nvec3 worldLightDirSM=normalize(-lightDataSM.xyz);\n#else\nvec3 directionToLightSM=lightDataSM.xyz-worldPos.xyz;vec3 worldLightDirSM=normalize(directionToLightSM);\n#endif\nfloat ndlSM=dot(vNormalW,worldLightDirSM);float sinNLSM=sqrt(1.0-ndlSM*ndlSM);float normalBiasSM=biasAndScaleSM.y*sinNLSM;worldPos.xyz-=vNormalW*normalBiasSM;\n#endif\n";
e.IncludesShadersStore[l] || (e.IncludesShadersStore[l] = u);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapVertexMetric.js
var d = "shadowMapVertexMetric", f = "#if SM_USEDISTANCE==1\nvPositionWSM=worldPos.xyz;\n#endif\n#if SM_DEPTHTEXTURE==1\n#ifdef IS_NDC_HALF_ZRANGE\n#define BIASFACTOR 0.5\n#else\n#define BIASFACTOR 1.0\n#endif\n#ifdef USE_REVERSE_DEPTHBUFFER\ngl_Position.z-=biasAndScaleSM.x*gl_Position.w*BIASFACTOR;\n#else\ngl_Position.z+=biasAndScaleSM.x*gl_Position.w*BIASFACTOR;\n#endif\n#endif\n#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1\nzSM=gl_Position.z;gl_Position.z=0.0;\n#elif SM_USEDISTANCE==0\n#ifdef USE_REVERSE_DEPTHBUFFER\nvDepthMetricSM=(-gl_Position.z+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;\n#else\nvDepthMetricSM=(gl_Position.z+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;\n#endif\n#endif\n";
e.IncludesShadersStore[d] || (e.IncludesShadersStore[d] = f);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/shadowMap.vertex.js
var p = "shadowMapVertexShader", m = "attribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#include<bonesDeclaration>\n#include<bakedVertexAnimationDeclaration>\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef INSTANCES\nattribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;\n#endif\n#include<helperFunctions>\n#include<__decl__shadowMapVertex>\n#ifdef ALPHATEXTURE\nvarying vec2 vUV;uniform mat4 diffuseMatrix;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#endif\n#include<shadowMapVertexExtraDeclaration>\n#include<clipPlaneVertexDeclaration>\n#define CUSTOM_VERTEX_DEFINITIONS\nvoid main(void)\n{vec3 positionUpdated=position;\n#ifdef UV1\nvec2 uvUpdated=uv;\n#endif\n#ifdef UV2\nvec2 uv2Updated=uv2;\n#endif\n#ifdef NORMAL\nvec3 normalUpdated=normal;\n#endif\n#include<morphTargetsVertexGlobal>\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#include<instancesVertex>\n#include<bonesVertex>\n#include<bakedVertexAnimation>\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\n#ifdef NORMAL\nmat3 normWorldSM=mat3(finalWorld);\n#if defined(INSTANCES) && defined(THIN_INSTANCES)\nvec3 vNormalW=normalUpdated/vec3(dot(normWorldSM[0],normWorldSM[0]),dot(normWorldSM[1],normWorldSM[1]),dot(normWorldSM[2],normWorldSM[2]));vNormalW=normalize(normWorldSM*vNormalW);\n#else\n#ifdef NONUNIFORMSCALING\nnormWorldSM=transposeMat3(inverseMat3(normWorldSM));\n#endif\nvec3 vNormalW=normalize(normWorldSM*normalUpdated);\n#endif\n#endif\n#include<shadowMapVertexNormalBias>\ngl_Position=viewProjection*worldPos;\n#include<shadowMapVertexMetric>\n#ifdef ALPHATEXTURE\n#ifdef UV1\nvUV=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));\n#endif\n#ifdef UV2\nvUV=vec2(diffuseMatrix*vec4(uv2Updated,1.0,0.0));\n#endif\n#endif\n#include<clipPlaneVertex>\n}";
e.ShadersStore[p] || (e.ShadersStore[p] = m);
var h = {
	name: p,
	shader: m
};
//#endregion
export { h as t };

//# sourceMappingURL=shadowMap.vertex-Cu1w65cF.js.map