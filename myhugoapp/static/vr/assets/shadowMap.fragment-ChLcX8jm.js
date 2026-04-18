import { t as e } from "./shaderStore-CADv5V1N.js";
import "./clipPlaneFragment-CTx-m5Va.js";
import "./packingFunctions-DNmZ4th2.js";
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/bayerDitherFunctions.js
var t = "bayerDitherFunctions", n = "float bayerDither2(vec2 _P) {return mod(2.0*_P.y+_P.x+1.0,4.0);}\nfloat bayerDither4(vec2 _P) {vec2 P1=mod(_P,2.0); \nvec2 P2=floor(0.5*mod(_P,4.0)); \nreturn 4.0*bayerDither2(P1)+bayerDither2(P2);}\nfloat bayerDither8(vec2 _P) {vec2 P1=mod(_P,2.0); \nvec2 P2=floor(0.5 *mod(_P,4.0)); \nvec2 P4=floor(0.25*mod(_P,8.0)); \nreturn 4.0*(4.0*bayerDither2(P1)+bayerDither2(P2))+bayerDither2(P4);}\n";
e.IncludesShadersStore[t] || (e.IncludesShadersStore[t] = n);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapFragmentExtraDeclaration.js
var r = "shadowMapFragmentExtraDeclaration", i = "#if SM_FLOAT==0\n#include<packingFunctions>\n#endif\n#if SM_SOFTTRANSPARENTSHADOW==1\n#include<bayerDitherFunctions>\nuniform vec2 softTransparentShadowSM;\n#endif\nvarying float vDepthMetricSM;\n#if SM_USEDISTANCE==1\nuniform vec3 lightDataSM;varying vec3 vPositionWSM;\n#endif\nuniform vec3 biasAndScaleSM;uniform vec2 depthValuesSM;\n#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1\nvarying float zSM;\n#endif\n";
e.IncludesShadersStore[r] || (e.IncludesShadersStore[r] = i);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/ShadersInclude/shadowMapFragment.js
var a = "shadowMapFragment", o = "float depthSM=vDepthMetricSM;\n#if defined(SM_DEPTHCLAMP) && SM_DEPTHCLAMP==1\n#if SM_USEDISTANCE==1\ndepthSM=(length(vPositionWSM-lightDataSM)+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;\n#else\n#ifdef USE_REVERSE_DEPTHBUFFER\ndepthSM=(-zSM+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;\n#else\ndepthSM=(zSM+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;\n#endif\n#endif\ndepthSM=clamp(depthSM,0.0,1.0);\n#ifdef USE_REVERSE_DEPTHBUFFER\ngl_FragDepth=clamp(1.0-depthSM,0.0,1.0);\n#else\ngl_FragDepth=clamp(depthSM,0.0,1.0); \n#endif\n#elif SM_USEDISTANCE==1\ndepthSM=(length(vPositionWSM-lightDataSM)+depthValuesSM.x)/depthValuesSM.y+biasAndScaleSM.x;\n#endif\n#if SM_ESM==1\ndepthSM=clamp(exp(-min(87.,biasAndScaleSM.z*depthSM)),0.,1.);\n#endif\n#if SM_FLOAT==1\ngl_FragColor=vec4(depthSM,1.0,1.0,1.0);\n#else\ngl_FragColor=pack(depthSM);\n#endif\nreturn;";
e.IncludesShadersStore[a] || (e.IncludesShadersStore[a] = o);
//#endregion
//#region node_modules/@babylonjs/core/Shaders/shadowMap.fragment.js
var s = "shadowMapPixelShader", c = "#include<shadowMapFragmentExtraDeclaration>\n#ifdef ALPHATEXTURE\nvarying vec2 vUV;uniform sampler2D diffuseSampler;\n#endif\n#include<clipPlaneFragmentDeclaration>\n#define CUSTOM_FRAGMENT_DEFINITIONS\nvoid main(void)\n{\n#include<clipPlaneFragment>\n#ifdef ALPHATEXTURE\nvec4 opacityMap=texture2D(diffuseSampler,vUV);float alphaFromAlphaTexture=opacityMap.a;\n#if SM_SOFTTRANSPARENTSHADOW==1\nif (softTransparentShadowSM.y==1.0) {opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);alphaFromAlphaTexture=opacityMap.x+opacityMap.y+opacityMap.z;}\n#endif\n#ifdef ALPHATESTVALUE\nif (alphaFromAlphaTexture<ALPHATESTVALUE)\ndiscard;\n#endif\n#endif\n#if SM_SOFTTRANSPARENTSHADOW==1\n#ifdef ALPHATEXTURE\nif ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alphaFromAlphaTexture) discard;\n#else\nif ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x) discard;\n#endif\n#endif\n#include<shadowMapFragment>\n}";
e.ShadersStore[s] || (e.ShadersStore[s] = c);
var l = {
	name: s,
	shader: c
};
//#endregion
export { l as t };

//# sourceMappingURL=shadowMap.fragment-ChLcX8jm.js.map