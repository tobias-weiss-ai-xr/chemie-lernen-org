import { t as e } from "./math.color-BS-ZqBtl.js";
//#region node_modules/@babylonjs/loaders/glTF/2.0/openpbrMaterialLoadingAdapter.js
var t = class {
	constructor(t) {
		this._diffuseTransmissionTint = e.White(), this._diffuseTransmissionTintTexture = null, this._material = t;
	}
	get material() {
		return this._material;
	}
	get isUnlit() {
		return this._material.unlit;
	}
	set isUnlit(e) {
		this._material.unlit = e;
	}
	set backFaceCulling(e) {
		this._material.backFaceCulling = e;
	}
	get backFaceCulling() {
		return this._material.backFaceCulling;
	}
	set twoSidedLighting(e) {
		this._material.twoSidedLighting = e;
	}
	get twoSidedLighting() {
		return this._material.twoSidedLighting;
	}
	set alphaCutOff(e) {}
	get alphaCutOff() {
		return .5;
	}
	set useAlphaFromBaseColorTexture(e) {
		this._material._useAlphaFromBaseColorTexture = e;
	}
	get useAlphaFromBaseColorTexture() {
		return !1;
	}
	get transparencyAsAlphaCoverage() {
		return !1;
	}
	set transparencyAsAlphaCoverage(e) {}
	set baseColor(e) {
		this._material.baseColor = e;
	}
	get baseColor() {
		return this._material.baseColor;
	}
	set baseColorTexture(e) {
		this._material.baseColorTexture = e;
	}
	get baseColorTexture() {
		return this._material.baseColorTexture;
	}
	set baseDiffuseRoughness(e) {
		this._material.baseDiffuseRoughness = e;
	}
	get baseDiffuseRoughness() {
		return this._material.baseDiffuseRoughness;
	}
	set baseDiffuseRoughnessTexture(e) {
		this._material.baseDiffuseRoughnessTexture = e;
	}
	get baseDiffuseRoughnessTexture() {
		return this._material.baseDiffuseRoughnessTexture;
	}
	set baseMetalness(e) {
		this._material.baseMetalness = e;
	}
	get baseMetalness() {
		return this._material.baseMetalness;
	}
	set baseMetalnessTexture(e) {
		this._material.baseMetalnessTexture = e;
	}
	get baseMetalnessTexture() {
		return this._material.baseMetalnessTexture;
	}
	set useRoughnessFromMetallicTextureGreen(e) {
		this._material._useRoughnessFromMetallicTextureGreen = e;
	}
	set useMetallicFromMetallicTextureBlue(e) {
		this._material._useMetallicFromMetallicTextureBlue = e;
	}
	enableSpecularEdgeColor(e = !1) {}
	set specularWeight(e) {
		this._material.specularWeight = e;
	}
	get specularWeight() {
		return this._material.specularWeight;
	}
	set specularWeightTexture(e) {
		this._material.specularColorTexture === e ? (this._material.specularWeightTexture = null, this._material._useSpecularWeightFromSpecularColorTexture = !0, this._material._useSpecularWeightFromAlpha = !0) : this._material.specularWeightTexture = e;
	}
	get specularWeightTexture() {
		return this._material.specularWeightTexture;
	}
	set specularColor(e) {
		this._material.specularColor = e;
	}
	get specularColor() {
		return this._material.specularColor;
	}
	set specularColorTexture(e) {
		this._material.specularColorTexture = e, this._material.specularWeightTexture === this._material.specularColorTexture && (this._material.specularWeightTexture = null, this._material._useSpecularWeightFromSpecularColorTexture = !0, this._material._useSpecularWeightFromAlpha = !0);
	}
	get specularColorTexture() {
		return this._material.specularColorTexture;
	}
	set specularRoughness(e) {
		this._material.specularRoughness = e;
	}
	get specularRoughness() {
		return this._material.specularRoughness;
	}
	set specularRoughnessTexture(e) {
		this._material.specularRoughnessTexture = e;
	}
	get specularRoughnessTexture() {
		return this._material.specularRoughnessTexture;
	}
	set specularIor(e) {
		this._material.specularIor = e;
	}
	get specularIor() {
		return this._material.specularIor;
	}
	set emissionColor(e) {
		this._material.emissionColor = e;
	}
	get emissionColor() {
		return this._material.emissionColor;
	}
	set emissionLuminance(e) {
		this._material.emissionLuminance = e;
	}
	get emissionLuminance() {
		return this._material.emissionLuminance;
	}
	set emissionColorTexture(e) {
		this._material.emissionColorTexture = e;
	}
	get emissionColorTexture() {
		return this._material.emissionColorTexture;
	}
	set ambientOcclusionTexture(e) {
		this._material.ambientOcclusionTexture = e;
	}
	get ambientOcclusionTexture() {
		return this._material.ambientOcclusionTexture;
	}
	set ambientOcclusionTextureStrength(e) {
		let t = this._material.ambientOcclusionTexture;
		t && (t.level = e);
	}
	get ambientOcclusionTextureStrength() {
		return this._material.ambientOcclusionTexture?.level ?? 1;
	}
	configureCoat() {}
	set coatWeight(e) {
		this._material.coatWeight = e;
	}
	get coatWeight() {
		return this._material.coatWeight;
	}
	set coatWeightTexture(e) {
		this._material.coatWeightTexture = e;
	}
	get coatWeightTexture() {
		return this._material.coatWeightTexture;
	}
	set coatColor(e) {
		this._material.coatColor = e;
	}
	set coatColorTexture(e) {
		this._material.coatColorTexture = e;
	}
	set coatRoughness(e) {
		this._material.coatRoughness = e;
	}
	get coatRoughness() {
		return this._material.coatRoughness;
	}
	set coatRoughnessTexture(e) {
		this._material.coatRoughnessTexture = e, e && (this._material._useCoatRoughnessFromGreenChannel = !0);
	}
	get coatRoughnessTexture() {
		return this._material.coatRoughnessTexture;
	}
	set coatIor(e) {
		this._material.coatIor = e;
	}
	set coatDarkening(e) {
		this._material.coatDarkening = e;
	}
	set coatDarkeningTexture(e) {
		this._material.coatDarkeningTexture = e;
	}
	set coatRoughnessAnisotropy(e) {
		this._material.coatRoughnessAnisotropy = e;
	}
	get coatRoughnessAnisotropy() {
		return this._material.coatRoughnessAnisotropy;
	}
	set geometryCoatTangentAngle(e) {
		this._material.geometryCoatTangentAngle = e;
	}
	set geometryCoatTangentTexture(e) {
		this._material.geometryCoatTangentTexture = e, e && (this._material._useCoatRoughnessAnisotropyFromTangentTexture = !0);
	}
	get geometryCoatTangentTexture() {
		return this._material.geometryCoatTangentTexture;
	}
	configureTransmission() {
		this._material.geometryThinWalled = 1, this._material.transmissionDepth = 0;
	}
	set transmissionWeight(e) {
		this._material.transmissionWeight = e;
	}
	set transmissionWeightTexture(e) {
		this._material.transmissionWeightTexture = e;
	}
	get transmissionWeight() {
		return this._material.transmissionWeight;
	}
	set transmissionScatter(e) {
		this._material.transmissionScatter = e;
	}
	get transmissionScatter() {
		return this._material.transmissionScatter;
	}
	set transmissionScatterTexture(e) {
		this._material.transmissionScatterTexture = e;
	}
	get transmissionScatterTexture() {
		return this._material.transmissionScatterTexture;
	}
	set transmissionScatterAnisotropy(e) {
		this._material.transmissionScatterAnisotropy = e;
	}
	set transmissionDispersionAbbeNumber(e) {
		this._material.transmissionDispersionAbbeNumber = e;
	}
	set transmissionDispersionScale(e) {
		this._material.transmissionDispersionScale = e;
	}
	set transmissionDepth(e) {
		e !== Number.MAX_VALUE || this._material.transmissionDepth !== 0 ? this._material.transmissionDepth = e : this._material.transmissionDepth = 0;
	}
	get transmissionDepth() {
		return this._material.transmissionDepth;
	}
	set transmissionColor(t) {
		t.equals(e.White()) || (this._material.transmissionColor = t);
	}
	get transmissionColor() {
		return this._material.transmissionColor;
	}
	get refractionBackgroundTexture() {
		return this._material.backgroundRefractionTexture;
	}
	set refractionBackgroundTexture(e) {
		this._material.backgroundRefractionTexture = e;
	}
	configureVolume() {
		this._material.geometryThinWalled = 0;
	}
	set geometryThinWalled(e) {
		this._material.geometryThinWalled = +!!e;
	}
	get geometryThinWalled() {
		return !!this._material.geometryThinWalled;
	}
	set volumeThicknessTexture(e) {
		this._material.geometryThicknessTexture = e, this._material._useGeometryThicknessFromGreenChannel = !0;
	}
	set volumeThickness(e) {
		this._material.geometryThickness = e;
	}
	configureSubsurface() {
		this._material.geometryThinWalled = 1, this._material.subsurfaceScatterAnisotropy = 1;
	}
	set subsurfaceWeight(e) {
		this._material.subsurfaceWeight = e;
	}
	get subsurfaceWeight() {
		return this._material.subsurfaceWeight;
	}
	set subsurfaceWeightTexture(e) {
		this._material.subsurfaceWeightTexture = e;
	}
	set subsurfaceColor(e) {
		this._material.subsurfaceColor = e;
	}
	set subsurfaceColorTexture(e) {
		this._material.subsurfaceColorTexture = e;
	}
	set diffuseTransmissionTint(e) {
		this._diffuseTransmissionTint = e;
	}
	get diffuseTransmissionTint() {
		return this._diffuseTransmissionTint;
	}
	set diffuseTransmissionTintTexture(e) {
		this._diffuseTransmissionTintTexture = e;
	}
	get subsurfaceRadius() {
		return this._material.subsurfaceRadius;
	}
	set subsurfaceRadius(e) {
		this._material.subsurfaceRadius = e;
	}
	get subsurfaceRadiusScale() {
		return this._material.subsurfaceRadiusScale;
	}
	set subsurfaceRadiusScale(e) {
		this._material.subsurfaceRadiusScale = e;
	}
	set subsurfaceScatterAnisotropy(e) {
		this._material.subsurfaceScatterAnisotropy = e;
	}
	isTranslucent() {
		return this.transmissionWeight > 0 || this.subsurfaceWeight > 0;
	}
	configureFuzz() {}
	set fuzzWeight(e) {
		this._material.fuzzWeight = e;
	}
	set fuzzWeightTexture(e) {
		this._material.fuzzWeightTexture = e;
	}
	set fuzzColor(e) {
		this._material.fuzzColor = e;
	}
	set fuzzColorTexture(e) {
		this._material.fuzzColorTexture = e;
	}
	set fuzzRoughness(e) {
		this._material.fuzzRoughness = e;
	}
	set fuzzRoughnessTexture(e) {
		this._material.fuzzRoughnessTexture = e, this._material._useFuzzRoughnessFromTextureAlpha = !0;
	}
	set specularRoughnessAnisotropy(e) {
		this._material.specularRoughnessAnisotropy = e;
	}
	get specularRoughnessAnisotropy() {
		return this._material.specularRoughnessAnisotropy;
	}
	set geometryTangentAngle(e) {
		this._material.geometryTangentAngle = e;
	}
	set geometryTangentTexture(e) {
		this._material.geometryTangentTexture = e, this._material._useSpecularRoughnessAnisotropyFromTangentTexture = !0;
	}
	get geometryTangentTexture() {
		return this._material.geometryTangentTexture;
	}
	configureGltfStyleAnisotropy(e = !0) {
		this._material._useGltfStyleAnisotropy = e;
	}
	set thinFilmWeight(e) {
		this._material.thinFilmWeight = e;
	}
	set thinFilmIor(e) {
		this._material.thinFilmIor = e;
	}
	set thinFilmThicknessMinimum(e) {
		this._material.thinFilmThicknessMin = e / 1e3;
	}
	set thinFilmThicknessMaximum(e) {
		this._material.thinFilmThickness = e / 1e3;
	}
	set thinFilmWeightTexture(e) {
		this._material.thinFilmWeightTexture = e;
	}
	set thinFilmThicknessTexture(e) {
		this._material.thinFilmThicknessTexture = e, this._material._useThinFilmThicknessFromTextureGreen = !0;
	}
	set unlit(e) {
		this._material.unlit = e;
	}
	set geometryOpacity(e) {
		this._material.geometryOpacity = e;
	}
	get geometryOpacity() {
		return this._material.geometryOpacity;
	}
	set geometryNormalTexture(e) {
		this._material.geometryNormalTexture = e;
	}
	get geometryNormalTexture() {
		return this._material.geometryNormalTexture;
	}
	setNormalMapInversions(e, t) {}
	set geometryCoatNormalTexture(e) {
		this._material.geometryCoatNormalTexture = e;
	}
	get geometryCoatNormalTexture() {
		return this._material.geometryCoatNormalTexture;
	}
	set geometryCoatNormalTextureScale(e) {
		this._material.geometryCoatNormalTexture && (this._material.geometryCoatNormalTexture.level = e);
	}
	finalize() {
		(this._diffuseTransmissionTint && !this._diffuseTransmissionTint.equals(e.White()) || this._diffuseTransmissionTintTexture) && (this._material.geometryThinWalled ? (this.subsurfaceColor = this._diffuseTransmissionTint, this.subsurfaceColorTexture = this._diffuseTransmissionTintTexture) : this._material.coatWeight == 0 && (!this.baseColor.equals(e.White()) || this.baseColorTexture) && (this._material.coatWeight = this.subsurfaceWeight, this._material.coatWeightTexture = this.subsurfaceWeightTexture, this._material.coatColor = this._diffuseTransmissionTint, this._material.coatColorTexture = this._diffuseTransmissionTintTexture, this._material.coatIor = this._material.specularIor, this._material.coatDarkening = 0, this._material.coatRoughness = this._material.specularRoughness, this._material.coatRoughnessTexture = this._material.specularRoughnessTexture)), this.transmissionWeight > 0 && (this._material.geometryThinWalled || this._material.transmissionDepth === 0 ? (this._material.transmissionColor = this._material.baseColor, this._material.transmissionColorTexture = this._material.baseColorTexture) : this._material.coatWeight == 0 && (!this.baseColor.equals(e.White()) || this.baseColorTexture !== null) && (this._material.coatWeight = this.transmissionWeight, this._material.coatWeightTexture = this.transmissionWeightTexture, this._material.coatColor = this.baseColor, this._material.coatColorTexture = this.baseColorTexture, this._material.coatIor = this._material.specularIor, this._material.coatDarkening = 0, this._material.coatRoughness = this._material.specularRoughness, this._material.coatRoughnessTexture = this._material.specularRoughnessTexture));
	}
};
//#endregion
export { t };

//# sourceMappingURL=openpbrMaterialLoadingAdapter-YAvmI15W.js.map