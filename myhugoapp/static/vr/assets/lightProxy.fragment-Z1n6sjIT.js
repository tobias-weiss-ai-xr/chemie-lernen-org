import { t as e } from "./shaderStore-CADv5V1N.js";
//#region node_modules/@babylonjs/core/ShadersWGSL/lightProxy.fragment.js
var t = "lightProxyPixelShader", n = "flat varying vOffset: u32;flat varying vMask: u32;uniform tileMaskResolution: vec3f;var<storage,read_write> tileMaskBuffer: array<atomic<u32>>;@fragment\nfn main(input: FragmentInputs)->FragmentOutputs {let maskResolution=vec2u(uniforms.tileMaskResolution.yz);let tilePosition=vec2u(fragmentInputs.position.xy);let tileIndex=(tilePosition.x*maskResolution.x+tilePosition.y)*maskResolution.y+fragmentInputs.vOffset;atomicOr(&tileMaskBuffer[tileIndex],fragmentInputs.vMask);}\n";
e.ShadersStoreWGSL[t] || (e.ShadersStoreWGSL[t] = n);
var r = {
	name: t,
	shader: n
};
//#endregion
export { r as t };

//# sourceMappingURL=lightProxy.fragment-Z1n6sjIT.js.map