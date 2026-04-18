import { n as e, t } from "./typeStore-Bwo5hkCf.js";
import { a as n, i as r, n as i, r as a, t as o } from "./math.vector-ByhvsffM.js";
import { t as s } from "./math.axis-DW8_2_EH.js";
import { n as c, r as l, t as u } from "./math.color-BS-ZqBtl.js";
import { t as d } from "./decorators.serialization-C6Hy3Nio.js";
import { _ as f, a as p, h as m, i as h, n as g, p as _ } from "./decorators-Dkc3uIc_.js";
import { t as v } from "./texture-k-JfmmPT.js";
import { n as y, t as b } from "./lightConstants-C8e5vSDa.js";
import { l as x, t as S } from "./animation-BZ-Lo6NO.js";
import { t as C } from "./constants-bT98KaZq.js";
//#region node_modules/@babylonjs/core/Lights/light.js
var w = class e extends x {
	get range() {
		return this._range;
	}
	set range(e) {
		this._range = e, this._inverseSquaredRange = 1 / (this.range * this.range);
	}
	get intensityMode() {
		return this._intensityMode;
	}
	set intensityMode(e) {
		this._intensityMode = e, this._computePhotometricScale();
	}
	get radius() {
		return this._radius;
	}
	set radius(e) {
		this._radius = e, this._computePhotometricScale();
	}
	get shadowEnabled() {
		return this._shadowEnabled;
	}
	set shadowEnabled(e) {
		this._shadowEnabled !== e && (this._shadowEnabled = e, this._markMeshesAsLightDirty());
	}
	get includedOnlyMeshes() {
		return this._includedOnlyMeshes;
	}
	set includedOnlyMeshes(e) {
		this._includedOnlyMeshes = e, this._hookArrayForIncludedOnly(e);
	}
	get excludedMeshes() {
		return this._excludedMeshes;
	}
	set excludedMeshes(e) {
		this._excludedMeshes = e, this._hookArrayForExcluded(e);
	}
	get excludeWithLayerMask() {
		return this._excludeWithLayerMask;
	}
	set excludeWithLayerMask(e) {
		this._excludeWithLayerMask = e, this._resyncMeshes();
	}
	get includeOnlyWithLayerMask() {
		return this._includeOnlyWithLayerMask;
	}
	set includeOnlyWithLayerMask(e) {
		this._includeOnlyWithLayerMask = e, this._resyncMeshes();
	}
	get lightmapMode() {
		return this._lightmapMode;
	}
	set lightmapMode(e) {
		this._lightmapMode !== e && (this._lightmapMode = e, this._markMeshesAsLightDirty());
	}
	getViewMatrix(e) {
		return null;
	}
	getProjectionMatrix(e, t) {
		return null;
	}
	constructor(t, n, r) {
		super(t, n, !1), this.diffuse = new u(1, 1, 1), this.specular = new u(1, 1, 1), this.falloffType = e.FALLOFF_DEFAULT, this.intensity = 1, this._range = Number.MAX_VALUE, this._inverseSquaredRange = 0, this._photometricScale = 1, this._intensityMode = e.INTENSITYMODE_AUTOMATIC, this._radius = 1e-5, this.renderPriority = 0, this._shadowEnabled = !0, this._excludeWithLayerMask = 0, this._includeOnlyWithLayerMask = 0, this._lightmapMode = 0, this._shadowGenerators = null, this._excludedMeshesIds = [], this._includedOnlyMeshesIds = [], this._currentViewDepth = 0, this._isLight = !0, r || this.getScene().addLight(this), this._uniformBuffer = new y(this.getScene().getEngine(), void 0, void 0, t), this._buildUniformLayout(), this.includedOnlyMeshes = [], this.excludedMeshes = [], r || this._resyncMeshes();
	}
	transferTexturesToEffect(e, t) {
		return this;
	}
	_bindLight(e, t, n, r, i = !0) {
		let a = e.toString(), o = !1;
		if (this._uniformBuffer.bindToEffect(n, "Light" + a), this._renderId !== t.getRenderId() || this._lastUseSpecular !== r || !this._uniformBuffer.useUbo) {
			this._renderId = t.getRenderId(), this._lastUseSpecular = r;
			let e = this.getScaledIntensity();
			this.transferToEffect(n, a), this.diffuse.scaleToRef(e, l.Color3[0]), this._uniformBuffer.updateColor4("vLightDiffuse", l.Color3[0], this.range, a), r && (this.specular.scaleToRef(e, l.Color3[1]), this._uniformBuffer.updateColor4("vLightSpecular", l.Color3[1], this.radius, a)), o = !0;
		}
		if (this.transferTexturesToEffect(n, a), t.shadowsEnabled && this.shadowEnabled && i) {
			let e = this.getShadowGenerator(t.activeCamera) ?? this.getShadowGenerator();
			e && (e.bindShadowLight(a, n), o = !0);
		}
		o ? this._uniformBuffer.update() : this._uniformBuffer.bindUniformBuffer();
	}
	getClassName() {
		return "Light";
	}
	toString(e) {
		let t = "Name: " + this.name;
		if (t += ", type: " + [
			"Point",
			"Directional",
			"Spot",
			"Hemispheric",
			"Clustered"
		][this.getTypeID()], this.animations) for (let n = 0; n < this.animations.length; n++) t += ", animation[0]: " + this.animations[n].toString(e);
		return t;
	}
	_syncParentEnabledState() {
		super._syncParentEnabledState(), this.isDisposed() || this._resyncMeshes();
	}
	setEnabled(e) {
		super.setEnabled(e), this._resyncMeshes();
	}
	getShadowGenerator(e = null) {
		return this._shadowGenerators === null ? null : this._shadowGenerators.get(e) ?? null;
	}
	getShadowGenerators() {
		return this._shadowGenerators;
	}
	getAbsolutePosition() {
		return n.Zero();
	}
	canAffectMesh(e) {
		return e ? !(this.includedOnlyMeshes && this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(e) === -1 || this.excludedMeshes && this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(e) !== -1 || this.includeOnlyWithLayerMask !== 0 && (this.includeOnlyWithLayerMask & e.layerMask) === 0 || this.excludeWithLayerMask !== 0 && this.excludeWithLayerMask & e.layerMask) : !0;
	}
	dispose(e, t = !1) {
		if (this._shadowGenerators) {
			let e = this._shadowGenerators.values();
			for (let t = e.next(); t.done !== !0; t = e.next()) t.value.dispose();
			this._shadowGenerators = null;
		}
		if (this.getScene().stopAnimation(this), this._parentContainer) {
			let e = this._parentContainer.lights.indexOf(this);
			e > -1 && this._parentContainer.lights.splice(e, 1), this._parentContainer = null;
		}
		for (let e of this.getScene().meshes) e._removeLightSource(this, !0);
		this._uniformBuffer.dispose(), this.getScene().removeLight(this), super.dispose(e, t);
	}
	getTypeID() {
		return 0;
	}
	getScaledIntensity() {
		return this._photometricScale * this.intensity;
	}
	clone(t, n = null) {
		let r = e.GetConstructorFromName(this.getTypeID(), t, this.getScene());
		if (!r) return null;
		let i = d.Clone(r, this);
		return t && (i.name = t), n && (i.parent = n), i.setEnabled(this.isEnabled()), this.onClonedObservable.notifyObservers(i), i;
	}
	serialize() {
		let e = d.Serialize(this);
		if (e.uniqueId = this.uniqueId, e.type = this.getTypeID(), this.parent && this.parent._serializeAsParent(e), this.excludedMeshes.length > 0) {
			e.excludedMeshesIds = [];
			for (let t of this.excludedMeshes) e.excludedMeshesIds.push(t.id);
		}
		if (this.includedOnlyMeshes.length > 0) {
			e.includedOnlyMeshesIds = [];
			for (let t of this.includedOnlyMeshes) e.includedOnlyMeshesIds.push(t.id);
		}
		return d.AppendSerializedAnimations(this, e), e.ranges = this.serializeAnimationRanges(), e.isEnabled = this.isEnabled(), e;
	}
	static GetConstructorFromName(e, t, n) {
		return x.Construct("Light_Type_" + e, t, n) || null;
	}
	static Parse(n, r) {
		let i = e.GetConstructorFromName(n.type, n.name, r);
		if (!i) return null;
		let a = d.Parse(i, n, r);
		if (n.excludedMeshesIds && (a._excludedMeshesIds = n.excludedMeshesIds), n.includedOnlyMeshesIds && (a._includedOnlyMeshesIds = n.includedOnlyMeshesIds), n.parentId !== void 0 && (a._waitingParentId = n.parentId), n.parentInstanceIndex !== void 0 && (a._waitingParentInstanceIndex = n.parentInstanceIndex), n.falloffType !== void 0 && (a.falloffType = n.falloffType), n.lightmapMode !== void 0 && (a.lightmapMode = n.lightmapMode), n.animations) {
			for (let e = 0; e < n.animations.length; e++) {
				let r = n.animations[e], i = t("BABYLON.Animation");
				i && a.animations.push(i.Parse(r));
			}
			x.ParseAnimationRanges(a, n, r);
		}
		return n.autoAnimate && r.beginAnimation(a, n.autoAnimateFrom, n.autoAnimateTo, n.autoAnimateLoop, n.autoAnimateSpeed || 1), n.isEnabled !== void 0 && a.setEnabled(n.isEnabled), a._onParsed(n, r), a;
	}
	_onParsed(e, t) {}
	_hookArrayForExcluded(e) {
		let t = e.push;
		e.push = (...n) => {
			let r = t.apply(e, n);
			for (let e of n) e._resyncLightSource(this);
			return r;
		};
		let n = e.splice;
		e.splice = (t, r) => {
			let i = n.call(e, t, r ?? e.length);
			for (let e of i) e._resyncLightSource(this);
			return i;
		};
		for (let t of e) t._resyncLightSource(this);
	}
	_hookArrayForIncludedOnly(e) {
		let t = e.push;
		e.push = (...n) => {
			let r = t.apply(e, n);
			return this._resyncMeshes(), r;
		};
		let n = e.splice;
		e.splice = (t, r) => {
			let i = n.call(e, t, r ?? e.length);
			return this._resyncMeshes(), i;
		}, this._resyncMeshes();
	}
	_resyncMeshes() {
		for (let e of this.getScene().meshes) e._resyncLightSource(this);
	}
	_markMeshesAsLightDirty() {
		for (let e of this.getScene().meshes) e.lightSources.indexOf(this) !== -1 && e._markSubMeshesAsLightDirty();
	}
	_computePhotometricScale() {
		this._photometricScale = this._getPhotometricScale(), this.getScene().resetCachedMaterial();
	}
	_getPhotometricScale() {
		let t = 0, n = this.getTypeID(), r = this.intensityMode;
		switch (r === e.INTENSITYMODE_AUTOMATIC && (r = n === e.LIGHTTYPEID_DIRECTIONALLIGHT ? e.INTENSITYMODE_ILLUMINANCE : e.INTENSITYMODE_LUMINOUSINTENSITY), n) {
			case e.LIGHTTYPEID_POINTLIGHT:
			case e.LIGHTTYPEID_SPOTLIGHT:
				switch (r) {
					case e.INTENSITYMODE_LUMINOUSPOWER:
						t = 1 / (4 * Math.PI);
						break;
					case e.INTENSITYMODE_LUMINOUSINTENSITY:
						t = 1;
						break;
					case e.INTENSITYMODE_LUMINANCE:
						t = this.radius * this.radius;
						break;
				}
				break;
			case e.LIGHTTYPEID_DIRECTIONALLIGHT:
				switch (r) {
					case e.INTENSITYMODE_ILLUMINANCE:
						t = 1;
						break;
					case e.INTENSITYMODE_LUMINANCE: {
						let e = this.radius;
						e = Math.max(e, .001), t = 2 * Math.PI * (1 - Math.cos(e));
						break;
					}
				}
				break;
			case e.LIGHTTYPEID_HEMISPHERICLIGHT:
				t = 1;
				break;
		}
		return t;
	}
	_reorderLightsInScene() {
		let e = this.getScene();
		this._renderPriority != 0 && (e.requireLightSorting = !0), this.getScene().sortLightsByPriority();
	}
	_isReady() {
		return !0;
	}
};
w.FALLOFF_DEFAULT = b.FALLOFF_DEFAULT, w.FALLOFF_PHYSICAL = b.FALLOFF_PHYSICAL, w.FALLOFF_GLTF = b.FALLOFF_GLTF, w.FALLOFF_STANDARD = b.FALLOFF_STANDARD, w.LIGHTMAP_DEFAULT = b.LIGHTMAP_DEFAULT, w.LIGHTMAP_SPECULAR = b.LIGHTMAP_SPECULAR, w.LIGHTMAP_SHADOWSONLY = b.LIGHTMAP_SHADOWSONLY, w.INTENSITYMODE_AUTOMATIC = b.INTENSITYMODE_AUTOMATIC, w.INTENSITYMODE_LUMINOUSPOWER = b.INTENSITYMODE_LUMINOUSPOWER, w.INTENSITYMODE_LUMINOUSINTENSITY = b.INTENSITYMODE_LUMINOUSINTENSITY, w.INTENSITYMODE_ILLUMINANCE = b.INTENSITYMODE_ILLUMINANCE, w.INTENSITYMODE_LUMINANCE = b.INTENSITYMODE_LUMINANCE, w.LIGHTTYPEID_POINTLIGHT = b.LIGHTTYPEID_POINTLIGHT, w.LIGHTTYPEID_DIRECTIONALLIGHT = b.LIGHTTYPEID_DIRECTIONALLIGHT, w.LIGHTTYPEID_SPOTLIGHT = b.LIGHTTYPEID_SPOTLIGHT, w.LIGHTTYPEID_HEMISPHERICLIGHT = b.LIGHTTYPEID_HEMISPHERICLIGHT, w.LIGHTTYPEID_RECT_AREALIGHT = b.LIGHTTYPEID_RECT_AREALIGHT, f([p()], w.prototype, "diffuse", void 0), f([p()], w.prototype, "specular", void 0), f([h()], w.prototype, "falloffType", void 0), f([h()], w.prototype, "intensity", void 0), f([h()], w.prototype, "range", null), f([h()], w.prototype, "intensityMode", null), f([h()], w.prototype, "radius", null), f([h()], w.prototype, "_renderPriority", void 0), f([g("_reorderLightsInScene")], w.prototype, "renderPriority", void 0), f([h("shadowEnabled")], w.prototype, "_shadowEnabled", void 0), f([h("excludeWithLayerMask")], w.prototype, "_excludeWithLayerMask", void 0), f([h("includeOnlyWithLayerMask")], w.prototype, "_includeOnlyWithLayerMask", void 0), f([h("lightmapMode")], w.prototype, "_lightmapMode", void 0);
//#endregion
//#region node_modules/@babylonjs/core/Lights/shadowLight.js
var T = class extends w {
	constructor() {
		super(...arguments), this._needProjectionMatrixCompute = !0, this._viewMatrix = o.Identity(), this._projectionMatrix = o.Identity();
	}
	_setPosition(e) {
		this._position = e;
	}
	get position() {
		return this._position;
	}
	set position(e) {
		this._setPosition(e);
	}
	_setDirection(e) {
		this._direction = e;
	}
	get direction() {
		return this._direction;
	}
	set direction(e) {
		this._setDirection(e);
	}
	get shadowMinZ() {
		return this._shadowMinZ;
	}
	set shadowMinZ(e) {
		this._shadowMinZ = e, this.forceProjectionMatrixCompute();
	}
	get shadowMaxZ() {
		return this._shadowMaxZ;
	}
	set shadowMaxZ(e) {
		this._shadowMaxZ = e, this.forceProjectionMatrixCompute();
	}
	computeTransformedInformation() {
		return this.parent && this.parent.getWorldMatrix ? (this.transformedPosition ||= n.Zero(), n.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition), this.direction && (this.transformedDirection ||= n.Zero(), n.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this.transformedDirection)), !0) : !1;
	}
	getDepthScale() {
		return 50;
	}
	getShadowDirection(e) {
		return this.transformedDirection ? this.transformedDirection : this.direction;
	}
	getAbsolutePosition() {
		return this.transformedPosition ? this.transformedPosition : this.position;
	}
	setDirectionToTarget(e) {
		return this.direction = n.Normalize(e.subtract(this.position)), this.direction;
	}
	getRotation() {
		this.direction.normalize();
		let e = n.Cross(this.direction, s.Y), t = n.Cross(e, this.direction);
		return n.RotationFromAxis(e, t, this.direction);
	}
	needCube() {
		return !1;
	}
	needProjectionMatrixCompute() {
		return this._needProjectionMatrixCompute;
	}
	forceProjectionMatrixCompute() {
		this._needProjectionMatrixCompute = !0;
	}
	_initCache() {
		super._initCache(), this._cache.position = n.Zero();
	}
	_isSynchronized() {
		return !!this._cache.position.equals(this.position);
	}
	computeWorldMatrix(e) {
		return !e && this.isSynchronized() ? (this._currentRenderId = this.getScene().getRenderId(), this._worldMatrix) : (this._updateCache(), this._cache.position.copyFrom(this.position), this._worldMatrix ||= o.Identity(), o.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix), this.parent && this.parent.getWorldMatrix && (this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix), this._markSyncedWithParent()), this._worldMatrixDeterminantIsDirty = !0, this._worldMatrix);
	}
	getDepthMinZ(e) {
		return this.shadowMinZ === void 0 ? e?.minZ || 0 : this.shadowMinZ;
	}
	getDepthMaxZ(e) {
		return this.shadowMaxZ === void 0 ? e?.maxZ || 1e4 : this.shadowMaxZ;
	}
	setShadowProjectionMatrix(e, t, n) {
		return this.customProjectionMatrixBuilder ? this.customProjectionMatrixBuilder(t, n, e) : this._setDefaultShadowProjectionMatrix(e, t, n), this;
	}
	_syncParentEnabledState() {
		super._syncParentEnabledState(), (!this.parent || !this.parent.getWorldMatrix) && (this.transformedPosition = null, this.transformedDirection = null);
	}
	getViewMatrix(e) {
		let t = a.Vector3[0], r = this.position;
		this.computeTransformedInformation() && (r = this.transformedPosition), n.NormalizeToRef(this.getShadowDirection(e), t), Math.abs(n.Dot(t, n.Up())) === 1 && (t.z = 1e-13);
		let i = a.Vector3[1];
		return r.addToRef(t, i), o.LookAtLHToRef(r, i, n.Up(), this._viewMatrix), this._viewMatrix;
	}
	getProjectionMatrix(e, t) {
		return this.setShadowProjectionMatrix(this._projectionMatrix, e ?? this._viewMatrix, t ?? []), this._projectionMatrix;
	}
};
//#endregion
//#region node_modules/@babylonjs/core/Lights/spotLight.js
f([m()], T.prototype, "position", null), f([m()], T.prototype, "direction", null), f([h()], T.prototype, "shadowMinZ", null), f([h()], T.prototype, "shadowMaxZ", null), x.AddNodeConstructor("Light_Type_2", (e, t) => () => new E(e, n.Zero(), n.Zero(), 0, 0, t));
var E = class e extends T {
	get iesProfileTexture() {
		return this._iesProfileTexture;
	}
	set iesProfileTexture(t) {
		this._iesProfileTexture !== t && (this._iesProfileTexture = t, this._iesProfileTexture && e._IsTexture(this._iesProfileTexture) && this._iesProfileTexture.onLoadObservable.addOnce(() => {
			this._markMeshesAsLightDirty();
		}));
	}
	get angle() {
		return this._angle;
	}
	set angle(e) {
		this._angle = e, this._cosHalfAngle = Math.cos(e * .5), this._projectionTextureProjectionLightDirty = !0, this.forceProjectionMatrixCompute(), this._computeAngleValues();
	}
	get innerAngle() {
		return this._innerAngle;
	}
	set innerAngle(e) {
		this._innerAngle = e, this._computeAngleValues();
	}
	get shadowAngleScale() {
		return this._shadowAngleScale;
	}
	set shadowAngleScale(e) {
		this._shadowAngleScale = e, this.forceProjectionMatrixCompute();
	}
	get projectionTextureMatrix() {
		return this._projectionTextureMatrix;
	}
	get projectionTextureLightNear() {
		return this._projectionTextureLightNear;
	}
	set projectionTextureLightNear(e) {
		this._projectionTextureLightNear = e, this._projectionTextureProjectionLightDirty = !0;
	}
	get projectionTextureLightFar() {
		return this._projectionTextureLightFar;
	}
	set projectionTextureLightFar(e) {
		this._projectionTextureLightFar = e, this._projectionTextureProjectionLightDirty = !0;
	}
	get projectionTextureUpDirection() {
		return this._projectionTextureUpDirection;
	}
	set projectionTextureUpDirection(e) {
		this._projectionTextureUpDirection = e, this._projectionTextureProjectionLightDirty = !0;
	}
	get projectionTexture() {
		return this._projectionTexture;
	}
	set projectionTexture(t) {
		this._projectionTexture !== t && (this._projectionTexture = t, this._projectionTextureDirty = !0, this._projectionTexture && !this._projectionTexture.isReady() && (e._IsProceduralTexture(this._projectionTexture) ? this._projectionTexture.getEffect().executeWhenCompiled(() => {
			this._markMeshesAsLightDirty();
		}) : e._IsTexture(this._projectionTexture) && this._projectionTexture.onLoadObservable.addOnce(() => {
			this._markMeshesAsLightDirty();
		})));
	}
	static _IsProceduralTexture(e) {
		return e.onGeneratedObservable !== void 0;
	}
	static _IsTexture(e) {
		return e.onLoadObservable !== void 0;
	}
	get projectionTextureProjectionLightMatrix() {
		return this._projectionTextureProjectionLightMatrix;
	}
	set projectionTextureProjectionLightMatrix(e) {
		this._projectionTextureProjectionLightMatrix = e, this._projectionTextureProjectionLightDirty = !1, this._projectionTextureDirty = !0;
	}
	constructor(e, t, r, i, a, s, c) {
		super(e, s, c), this._innerAngle = 0, this._iesProfileTexture = null, this._projectionTextureMatrix = o.Zero(), this._projectionTextureLightNear = 1e-6, this._projectionTextureLightFar = 1e3, this._projectionTextureUpDirection = n.Up(), this._projectionTextureViewLightDirty = !0, this._projectionTextureProjectionLightDirty = !0, this._projectionTextureDirty = !0, this._projectionTextureViewTargetVector = n.Zero(), this._projectionTextureViewLightMatrix = o.Zero(), this._projectionTextureProjectionLightMatrix = o.Zero(), this._projectionTextureScalingMatrix = o.FromValues(.5, 0, 0, 0, 0, .5, 0, 0, 0, 0, .5, 0, .5, .5, .5, 1), this.position = t, this.direction = r, this.angle = i, this.exponent = a;
	}
	getClassName() {
		return "SpotLight";
	}
	getTypeID() {
		return w.LIGHTTYPEID_SPOTLIGHT;
	}
	_setDirection(e) {
		super._setDirection(e), this._projectionTextureViewLightDirty = !0;
	}
	_setPosition(e) {
		super._setPosition(e), this._projectionTextureViewLightDirty = !0;
	}
	_setDefaultShadowProjectionMatrix(e, t, n) {
		let r = this.getScene().activeCamera;
		if (!r) return;
		this._shadowAngleScale = this._shadowAngleScale || 1;
		let i = this._shadowAngleScale * this._angle, a = this.shadowMinZ === void 0 ? r.minZ : this.shadowMinZ, s = this.shadowMaxZ === void 0 ? r.maxZ : this.shadowMaxZ, c = this.getScene().getEngine().useReverseDepthBuffer;
		o.PerspectiveFovLHToRef(i, 1, c ? s : a, c ? a : s, e, !0, this._scene.getEngine().isNDCHalfZRange, void 0, c);
	}
	_computeProjectionTextureViewLightMatrix() {
		this._projectionTextureViewLightDirty = !1, this._projectionTextureDirty = !0, this.getAbsolutePosition().addToRef(this.getShadowDirection(), this._projectionTextureViewTargetVector), o.LookAtLHToRef(this.getAbsolutePosition(), this._projectionTextureViewTargetVector, this._projectionTextureUpDirection, this._projectionTextureViewLightMatrix);
	}
	_computeProjectionTextureProjectionLightMatrix() {
		this._projectionTextureProjectionLightDirty = !1, this._projectionTextureDirty = !0;
		let e = this.projectionTextureLightFar, t = this.projectionTextureLightNear, n = e / (e - t), r = -n * t, i = 1 / Math.tan(this._angle / 2);
		o.FromValuesToRef(i / 1, 0, 0, 0, 0, i, 0, 0, 0, 0, n, 1, 0, 0, r, 0, this._projectionTextureProjectionLightMatrix);
	}
	_computeProjectionTextureMatrix() {
		if (this._projectionTextureDirty = !1, this._projectionTextureViewLightMatrix.multiplyToRef(this._projectionTextureProjectionLightMatrix, this._projectionTextureMatrix), this._projectionTexture instanceof v) {
			let e = this._projectionTexture.uScale / 2, t = this._projectionTexture.vScale / 2;
			o.FromValuesToRef(e, 0, 0, 0, 0, t, 0, 0, 0, 0, .5, 0, .5, .5, .5, 1, this._projectionTextureScalingMatrix);
		}
		this._projectionTextureMatrix.multiplyToRef(this._projectionTextureScalingMatrix, this._projectionTextureMatrix);
	}
	_buildUniformLayout() {
		this._uniformBuffer.addUniform("vLightData", 4), this._uniformBuffer.addUniform("vLightDiffuse", 4), this._uniformBuffer.addUniform("vLightSpecular", 4), this._uniformBuffer.addUniform("vLightDirection", 3), this._uniformBuffer.addUniform("vLightFalloff", 4), this._uniformBuffer.addUniform("shadowsInfo", 3), this._uniformBuffer.addUniform("depthValues", 2), this._uniformBuffer.create();
	}
	_computeAngleValues() {
		this._lightAngleScale = 1 / Math.max(.001, Math.cos(this._innerAngle * .5) - this._cosHalfAngle), this._lightAngleOffset = -this._cosHalfAngle * this._lightAngleScale;
	}
	transferTexturesToEffect(e, t) {
		return this.projectionTexture && this.projectionTexture.isReady() && (this._projectionTextureViewLightDirty && this._computeProjectionTextureViewLightMatrix(), this._projectionTextureProjectionLightDirty && this._computeProjectionTextureProjectionLightMatrix(), this._projectionTextureDirty && this._computeProjectionTextureMatrix(), e.setMatrix("textureProjectionMatrix" + t, this._projectionTextureMatrix), e.setTexture("projectionLightTexture" + t, this.projectionTexture)), this._iesProfileTexture && this._iesProfileTexture.isReady() && e.setTexture("iesLightTexture" + t, this._iesProfileTexture), this;
	}
	transferToEffect(e, t) {
		let r, i = this._scene.floatingOriginOffset;
		return this.computeTransformedInformation() ? (this._uniformBuffer.updateFloat4("vLightData", this.transformedPosition.x - i.x, this.transformedPosition.y - i.y, this.transformedPosition.z - i.z, this.exponent, t), r = n.Normalize(this.transformedDirection)) : (this._uniformBuffer.updateFloat4("vLightData", this.position.x - i.x, this.position.y - i.y, this.position.z - i.z, this.exponent, t), r = n.Normalize(this.direction)), this._uniformBuffer.updateFloat4("vLightDirection", r.x, r.y, r.z, this._cosHalfAngle, t), this._uniformBuffer.updateFloat4("vLightFalloff", this.range, this._inverseSquaredRange, this._lightAngleScale, this._lightAngleOffset, t), this;
	}
	transferToNodeMaterialEffect(e, t) {
		let r;
		return r = this.computeTransformedInformation() ? n.Normalize(this.transformedDirection) : n.Normalize(this.direction), this.getScene().useRightHandedSystem ? e.setFloat3(t, -r.x, -r.y, -r.z) : e.setFloat3(t, r.x, r.y, r.z), this;
	}
	dispose() {
		super.dispose(), this._projectionTexture && this._projectionTexture.dispose(), this._iesProfileTexture &&= (this._iesProfileTexture.dispose(), null);
	}
	getDepthMinZ(e) {
		let t = this._scene.getEngine(), n = this.shadowMinZ === void 0 ? e?.minZ ?? 0 : this.shadowMinZ;
		return t.useReverseDepthBuffer && t.isNDCHalfZRange ? n : this._scene.getEngine().isNDCHalfZRange ? 0 : n;
	}
	getDepthMaxZ(e) {
		let t = this._scene.getEngine(), n = this.shadowMaxZ === void 0 ? e?.maxZ ?? 1e4 : this.shadowMaxZ;
		return t.useReverseDepthBuffer && t.isNDCHalfZRange ? 0 : n;
	}
	prepareLightSpecificDefines(e, t) {
		e["SPOTLIGHT" + t] = !0, e["PROJECTEDLIGHTTEXTURE" + t] = !!(this.projectionTexture && this.projectionTexture.isReady()), e["IESLIGHTTEXTURE" + t] = !!(this._iesProfileTexture && this._iesProfileTexture.isReady());
	}
};
f([h()], E.prototype, "angle", null), f([h()], E.prototype, "innerAngle", null), f([h()], E.prototype, "shadowAngleScale", null), f([h()], E.prototype, "exponent", void 0), f([h()], E.prototype, "projectionTextureLightNear", null), f([h()], E.prototype, "projectionTextureLightFar", null), f([h()], E.prototype, "projectionTextureUpDirection", null), f([_("projectedLightTexture")], E.prototype, "_projectionTexture", void 0), e("BABYLON.SpotLight", E);
//#endregion
//#region node_modules/@babylonjs/loaders/glTF/2.0/Extensions/gltfPathToObjectConverter.js
var D = [{ regex: RegExp("^/nodes/\\d+/extensions/") }], O = class {
	constructor(e, t) {
		this._gltf = e, this._infoTree = t;
	}
	convert(e) {
		let t = this._gltf, n = this._infoTree, r;
		if (!e.startsWith("/")) throw Error("Path must start with a /");
		let i = e.split("/");
		if (i.shift(), i[i.length - 1].includes(".length")) {
			let e = i[i.length - 1].split(".");
			i.pop(), i.push(...e);
		}
		let a = !1;
		for (let o of i) {
			let i = o === "length";
			if (i && !n.__array__) throw Error(`Path ${e} is invalid`);
			if (n.__ignoreObjectTree__ && (a = !0), n.__array__ && !i) n = n.__array__;
			else if (n = n[o], !n) throw Error(`Path ${e} is invalid`);
			if (!a) if (t === void 0) {
				if (!D.find((t) => t.regex.test(e))) throw Error(`Path ${e} is invalid`);
			} else i || (t = t?.[o]);
			(n.__target__ || i) && (r = t);
		}
		return {
			object: r,
			info: n
		};
	}
}, k = {
	length: {
		type: "number",
		get: (e) => e.length,
		getTarget: (e) => e.map((e) => e._babylonTransformNode),
		getPropertyName: [() => "length"]
	},
	__array__: {
		__target__: !0,
		translation: {
			type: "Vector3",
			get: (e) => e._babylonTransformNode?.position,
			set: (e, t) => t._babylonTransformNode?.position.copyFrom(e),
			getTarget: (e) => e._babylonTransformNode,
			getPropertyName: [() => "position"]
		},
		rotation: {
			type: "Quaternion",
			get: (e) => e._babylonTransformNode?.rotationQuaternion,
			set: (e, t) => t._babylonTransformNode?.rotationQuaternion?.copyFrom(e),
			getTarget: (e) => e._babylonTransformNode,
			getPropertyName: [() => "rotationQuaternion"]
		},
		scale: {
			type: "Vector3",
			get: (e) => e._babylonTransformNode?.scaling,
			set: (e, t) => t._babylonTransformNode?.scaling.copyFrom(e),
			getTarget: (e) => e._babylonTransformNode,
			getPropertyName: [() => "scaling"]
		},
		weights: {
			length: {
				type: "number",
				get: (e) => e._numMorphTargets,
				getTarget: (e) => e._babylonTransformNode,
				getPropertyName: [() => "influence"]
			},
			__array__: {
				__target__: !0,
				type: "number",
				get: (e, t) => t === void 0 ? void 0 : e._primitiveBabylonMeshes?.[0].morphTargetManager?.getTarget(t).influence,
				getTarget: (e) => e._babylonTransformNode,
				getPropertyName: [() => "influence"]
			},
			type: "number[]",
			get: (e, t) => [0],
			getTarget: (e) => e._babylonTransformNode,
			getPropertyName: [() => "influence"]
		},
		matrix: {
			type: "Matrix",
			get: (e) => o.Compose(e._babylonTransformNode?.scaling, e._babylonTransformNode?.rotationQuaternion, e._babylonTransformNode?.position),
			getTarget: (e) => e._babylonTransformNode,
			isReadOnly: !0
		},
		globalMatrix: {
			type: "Matrix",
			get: (e) => {
				let t = o.Identity(), n = e.parent;
				for (; n && n.parent;) n = n.parent;
				let r = e._babylonTransformNode?.position._isDirty || e._babylonTransformNode?.rotationQuaternion?._isDirty || e._babylonTransformNode?.scaling._isDirty;
				if (n) {
					let i = n._babylonTransformNode?.computeWorldMatrix(!0).invert();
					i && e._babylonTransformNode?.computeWorldMatrix(r)?.multiplyToRef(i, t);
				} else e._babylonTransformNode && t.copyFrom(e._babylonTransformNode.computeWorldMatrix(r));
				return t;
			},
			getTarget: (e) => e._babylonTransformNode,
			isReadOnly: !0
		},
		extensions: {
			EXT_lights_ies: {
				multiplier: {
					type: "number",
					get: (e) => e._babylonTransformNode?.getChildren((e) => e instanceof E, !0)[0]?.intensity,
					getTarget: (e) => e._babylonTransformNode?.getChildren((e) => e instanceof E, !0)[0],
					set: (e, t) => {
						if (t._babylonTransformNode) {
							let n = t._babylonTransformNode.getChildren((e) => e instanceof E, !0)[0];
							n && (n.intensity = e);
						}
					}
				},
				color: {
					type: "Color3",
					get: (e) => e._babylonTransformNode?.getChildren((e) => e instanceof E, !0)[0]?.diffuse,
					getTarget: (e) => e._babylonTransformNode?.getChildren((e) => e instanceof E, !0)[0],
					set: (e, t) => {
						if (t._babylonTransformNode) {
							let n = t._babylonTransformNode.getChildren((e) => e instanceof E, !0)[0];
							n && (n.diffuse = e);
						}
					}
				}
			},
			KHR_node_visibility: { visible: {
				type: "boolean",
				get: (e) => e._primitiveBabylonMeshes ? e._primitiveBabylonMeshes[0].isVisible : !1,
				getTarget: () => void 0,
				set: (e, t) => {
					t._primitiveBabylonMeshes && t._primitiveBabylonMeshes.forEach((t) => t.isVisible = e);
				}
			} }
		}
	}
}, A = {
	length: {
		type: "number",
		get: (e) => e.length,
		getTarget: (e) => e.map((e) => e._babylonAnimationGroup),
		getPropertyName: [() => "length"]
	},
	__array__: {}
}, j = {
	length: {
		type: "number",
		get: (e) => e.length,
		getTarget: (e) => e.map((e) => e.primitives[0]._instanceData?.babylonSourceMesh),
		getPropertyName: [() => "length"]
	},
	__array__: {}
}, M = { __array__: {
	__target__: !0,
	orthographic: {
		xmag: {
			componentsCount: 2,
			type: "Vector2",
			get: (e) => new r(e._babylonCamera?.orthoLeft ?? 0, e._babylonCamera?.orthoRight ?? 0),
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.orthoLeft = e.x, t._babylonCamera.orthoRight = e.y);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "orthoLeft", () => "orthoRight"]
		},
		ymag: {
			componentsCount: 2,
			type: "Vector2",
			get: (e) => new r(e._babylonCamera?.orthoBottom ?? 0, e._babylonCamera?.orthoTop ?? 0),
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.orthoBottom = e.x, t._babylonCamera.orthoTop = e.y);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "orthoBottom", () => "orthoTop"]
		},
		zfar: {
			type: "number",
			get: (e) => e._babylonCamera?.maxZ,
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.maxZ = e);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "maxZ"]
		},
		znear: {
			type: "number",
			get: (e) => e._babylonCamera?.minZ,
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.minZ = e);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "minZ"]
		}
	},
	perspective: {
		aspectRatio: {
			type: "number",
			get: (e) => e._babylonCamera?.getEngine().getAspectRatio(e._babylonCamera),
			getTarget: (e) => e,
			getPropertyName: [() => "aspectRatio"],
			isReadOnly: !0
		},
		yfov: {
			type: "number",
			get: (e) => e._babylonCamera?.fov,
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.fov = e);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "fov"]
		},
		zfar: {
			type: "number",
			get: (e) => e._babylonCamera?.maxZ,
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.maxZ = e);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "maxZ"]
		},
		znear: {
			type: "number",
			get: (e) => e._babylonCamera?.minZ,
			set: (e, t) => {
				t._babylonCamera && (t._babylonCamera.minZ = e);
			},
			getTarget: (e) => e,
			getPropertyName: [() => "minZ"]
		}
	}
} }, N = { __array__: {
	__target__: !0,
	emissiveFactor: {
		type: "Color3",
		get: (e, t, n) => I(e, t, n).emissiveColor,
		set: (e, t, n, r) => I(t, n, r).emissiveColor.copyFrom(e),
		getTarget: (e, t, n) => I(e, t, n),
		getPropertyName: [() => "emissiveColor"]
	},
	emissiveTexture: { extensions: { KHR_texture_transform: L("emissiveTexture") } },
	normalTexture: {
		scale: {
			type: "number",
			get: (e, t, n) => F(e, n, "bumpTexture")?.level,
			set: (e, t, n, r) => {
				let i = F(t, r, "bumpTexture");
				i && (i.level = e);
			},
			getTarget: (e, t, n) => I(e, t, n),
			getPropertyName: [() => "level"]
		},
		extensions: { KHR_texture_transform: L("bumpTexture") }
	},
	occlusionTexture: {
		strength: {
			type: "number",
			get: (e, t, n) => I(e, t, n).ambientTextureStrength,
			set: (e, t, n, r) => {
				let i = I(t, n, r);
				i && (i.ambientTextureStrength = e);
			},
			getTarget: (e, t, n) => I(e, t, n),
			getPropertyName: [() => "ambientTextureStrength"]
		},
		extensions: { KHR_texture_transform: L("ambientTexture") }
	},
	pbrMetallicRoughness: {
		baseColorFactor: {
			type: "Color4",
			get: (e, t, n) => {
				let r = I(e, t, n);
				return c.FromColor3(r.albedoColor, r.alpha);
			},
			set: (e, t, n, r) => {
				let i = I(t, n, r);
				i.albedoColor.set(e.r, e.g, e.b), i.alpha = e.a;
			},
			getTarget: (e, t, n) => I(e, t, n),
			getPropertyName: [() => "albedoColor", () => "alpha"]
		},
		baseColorTexture: { extensions: { KHR_texture_transform: L("albedoTexture") } },
		metallicFactor: {
			type: "number",
			get: (e, t, n) => I(e, t, n).metallic,
			set: (e, t, n, r) => {
				let i = I(t, n, r);
				i && (i.metallic = e);
			},
			getTarget: (e, t, n) => I(e, t, n),
			getPropertyName: [() => "metallic"]
		},
		roughnessFactor: {
			type: "number",
			get: (e, t, n) => I(e, t, n).roughness,
			set: (e, t, n, r) => {
				let i = I(t, n, r);
				i && (i.roughness = e);
			},
			getTarget: (e, t, n) => I(e, t, n),
			getPropertyName: [() => "roughness"]
		},
		metallicRoughnessTexture: { extensions: { KHR_texture_transform: L("metallicTexture") } }
	},
	extensions: {
		KHR_materials_anisotropy: {
			anisotropyStrength: {
				type: "number",
				get: (e, t, n) => I(e, t, n).anisotropy.intensity,
				set: (e, t, n, r) => {
					I(t, n, r).anisotropy.intensity = e;
				},
				getTarget: (e, t, n) => I(e, t, n),
				getPropertyName: [() => "anisotropy.intensity"]
			},
			anisotropyRotation: {
				type: "number",
				get: (e, t, n) => I(e, t, n).anisotropy.angle,
				set: (e, t, n, r) => {
					I(t, n, r).anisotropy.angle = e;
				},
				getTarget: (e, t, n) => I(e, t, n),
				getPropertyName: [() => "anisotropy.angle"]
			},
			anisotropyTexture: { extensions: { KHR_texture_transform: L("anisotropy", "texture") } }
		},
		KHR_materials_clearcoat: {
			clearcoatFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).clearCoat.intensity,
				set: (e, t, n, r) => {
					I(t, n, r).clearCoat.intensity = e;
				},
				getTarget: (e, t, n) => I(e, t, n),
				getPropertyName: [() => "clearCoat.intensity"]
			},
			clearcoatRoughnessFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).clearCoat.roughness,
				set: (e, t, n, r) => {
					I(t, n, r).clearCoat.roughness = e;
				},
				getTarget: (e, t, n) => I(e, t, n),
				getPropertyName: [() => "clearCoat.roughness"]
			},
			clearcoatTexture: { extensions: { KHR_texture_transform: L("clearCoat", "texture") } },
			clearcoatNormalTexture: {
				scale: {
					type: "number",
					get: (e, t, n) => I(e, t, n).clearCoat.bumpTexture?.level,
					getTarget: I,
					set: (e, t, n, r) => I(t, n, r).clearCoat.bumpTexture.level = e
				},
				extensions: { KHR_texture_transform: L("clearCoat", "bumpTexture") }
			},
			clearcoatRoughnessTexture: { extensions: { KHR_texture_transform: L("clearCoat", "textureRoughness") } }
		},
		KHR_materials_dispersion: { dispersion: {
			type: "number",
			get: (e, t, n) => I(e, t, n).subSurface.dispersion,
			getTarget: I,
			set: (e, t, n, r) => I(t, n, r).subSurface.dispersion = e
		} },
		KHR_materials_emissive_strength: { emissiveStrength: {
			type: "number",
			get: (e, t, n) => I(e, t, n).emissiveIntensity,
			getTarget: I,
			set: (e, t, n, r) => I(t, n, r).emissiveIntensity = e
		} },
		KHR_materials_ior: { ior: {
			type: "number",
			get: (e, t, n) => I(e, t, n).indexOfRefraction,
			getTarget: I,
			set: (e, t, n, r) => I(t, n, r).indexOfRefraction = e
		} },
		KHR_materials_iridescence: {
			iridescenceFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).iridescence.intensity,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).iridescence.intensity = e
			},
			iridescenceIor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).iridescence.indexOfRefraction,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).iridescence.indexOfRefraction = e
			},
			iridescenceTexture: { extensions: { KHR_texture_transform: L("iridescence", "texture") } },
			iridescenceThicknessMaximum: {
				type: "number",
				get: (e, t, n) => I(e, t, n).iridescence.maximumThickness,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).iridescence.maximumThickness = e
			},
			iridescenceThicknessMinimum: {
				type: "number",
				get: (e, t, n) => I(e, t, n).iridescence.minimumThickness,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).iridescence.minimumThickness = e
			},
			iridescenceThicknessTexture: { extensions: { KHR_texture_transform: L("iridescence", "thicknessTexture") } }
		},
		KHR_materials_sheen: {
			sheenColorFactor: {
				type: "Color3",
				get: (e, t, n) => I(e, t, n).sheen.color,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).sheen.color.copyFrom(e)
			},
			sheenColorTexture: { extensions: { KHR_texture_transform: L("sheen", "texture") } },
			sheenRoughnessFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).sheen.intensity,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).sheen.intensity = e
			},
			sheenRoughnessTexture: { extensions: { KHR_texture_transform: L("sheen", "thicknessTexture") } }
		},
		KHR_materials_specular: {
			specularFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).metallicF0Factor,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).metallicF0Factor = e,
				getPropertyName: [() => "metallicF0Factor"]
			},
			specularColorFactor: {
				type: "Color3",
				get: (e, t, n) => I(e, t, n).metallicReflectanceColor,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).metallicReflectanceColor.copyFrom(e),
				getPropertyName: [() => "metallicReflectanceColor"]
			},
			specularTexture: { extensions: { KHR_texture_transform: L("metallicReflectanceTexture") } },
			specularColorTexture: { extensions: { KHR_texture_transform: L("reflectanceTexture") } }
		},
		KHR_materials_transmission: {
			transmissionFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).subSurface.refractionIntensity,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).subSurface.refractionIntensity = e,
				getPropertyName: [() => "subSurface.refractionIntensity"]
			},
			transmissionTexture: { extensions: { KHR_texture_transform: L("subSurface", "refractionIntensityTexture") } }
		},
		KHR_materials_diffuse_transmission: {
			diffuseTransmissionFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).subSurface.translucencyIntensity,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).subSurface.translucencyIntensity = e
			},
			diffuseTransmissionTexture: { extensions: { KHR_texture_transform: L("subSurface", "translucencyIntensityTexture") } },
			diffuseTransmissionColorFactor: {
				type: "Color3",
				get: (e, t, n) => I(e, t, n).subSurface.translucencyColor,
				getTarget: I,
				set: (e, t, n, r) => e && I(t, n, r).subSurface.translucencyColor?.copyFrom(e)
			},
			diffuseTransmissionColorTexture: { extensions: { KHR_texture_transform: L("subSurface", "translucencyColorTexture") } }
		},
		KHR_materials_volume: {
			attenuationColor: {
				type: "Color3",
				get: (e, t, n) => I(e, t, n).subSurface.tintColor,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).subSurface.tintColor.copyFrom(e)
			},
			attenuationDistance: {
				type: "number",
				get: (e, t, n) => I(e, t, n).subSurface.tintColorAtDistance,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).subSurface.tintColorAtDistance = e
			},
			thicknessFactor: {
				type: "number",
				get: (e, t, n) => I(e, t, n).subSurface.maximumThickness,
				getTarget: I,
				set: (e, t, n, r) => I(t, n, r).subSurface.maximumThickness = e
			},
			thicknessTexture: { extensions: { KHR_texture_transform: L("subSurface", "thicknessTexture") } }
		}
	}
} }, P = {
	KHR_lights_punctual: { lights: {
		length: {
			type: "number",
			get: (e) => e.length,
			getTarget: (e) => e.map((e) => e._babylonLight),
			getPropertyName: [(e) => "length"]
		},
		__array__: {
			__target__: !0,
			color: {
				type: "Color3",
				get: (e) => e._babylonLight?.diffuse,
				set: (e, t) => t._babylonLight?.diffuse.copyFrom(e),
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "diffuse"]
			},
			intensity: {
				type: "number",
				get: (e) => e._babylonLight?.intensity,
				set: (e, t) => t._babylonLight ? t._babylonLight.intensity = e : void 0,
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "intensity"]
			},
			range: {
				type: "number",
				get: (e) => e._babylonLight?.range,
				set: (e, t) => t._babylonLight ? t._babylonLight.range = e : void 0,
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "range"]
			},
			spot: {
				innerConeAngle: {
					type: "number",
					get: (e) => e._babylonLight?.innerAngle,
					set: (e, t) => t._babylonLight ? t._babylonLight.innerAngle = e : void 0,
					getTarget: (e) => e._babylonLight,
					getPropertyName: [(e) => "innerConeAngle"]
				},
				outerConeAngle: {
					type: "number",
					get: (e) => e._babylonLight?.angle,
					set: (e, t) => t._babylonLight ? t._babylonLight.angle = e : void 0,
					getTarget: (e) => e._babylonLight,
					getPropertyName: [(e) => "outerConeAngle"]
				}
			}
		}
	} },
	EXT_lights_area: { lights: {
		length: {
			type: "number",
			get: (e) => e.length,
			getTarget: (e) => e.map((e) => e._babylonLight),
			getPropertyName: [(e) => "length"]
		},
		__array__: {
			__target__: !0,
			color: {
				type: "Color3",
				get: (e) => e._babylonLight?.diffuse,
				set: (e, t) => t._babylonLight?.diffuse.copyFrom(e),
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "diffuse"]
			},
			intensity: {
				type: "number",
				get: (e) => e._babylonLight?.intensity,
				set: (e, t) => t._babylonLight ? t._babylonLight.intensity = e : void 0,
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "intensity"]
			},
			size: {
				type: "number",
				get: (e) => e._babylonLight?.height,
				set: (e, t) => t._babylonLight ? t._babylonLight.height = e : void 0,
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "size"]
			},
			rect: { aspect: {
				type: "number",
				get: (e) => e._babylonLight?.width / e._babylonLight?.height,
				set: (e, t) => t._babylonLight ? t._babylonLight.width = e * t._babylonLight.height : void 0,
				getTarget: (e) => e._babylonLight,
				getPropertyName: [(e) => "aspect"]
			} }
		}
	} },
	EXT_lights_ies: { lights: { length: {
		type: "number",
		get: (e) => e.length,
		getTarget: (e) => e.map((e) => e._babylonLight),
		getPropertyName: [(e) => "length"]
	} } },
	EXT_lights_image_based: { lights: {
		length: {
			type: "number",
			get: (e) => e.length,
			getTarget: (e) => e.map((e) => e._babylonTexture),
			getPropertyName: [(e) => "length"]
		},
		__array__: {
			__target__: !0,
			intensity: {
				type: "number",
				get: (e) => e._babylonTexture?.level,
				set: (e, t) => {
					t._babylonTexture && (t._babylonTexture.level = e);
				},
				getTarget: (e) => e._babylonTexture
			},
			rotation: {
				type: "Quaternion",
				get: (e) => e._babylonTexture && i.FromRotationMatrix(e._babylonTexture?.getReflectionTextureMatrix()),
				set: (e, t) => {
					t._babylonTexture && (t._babylonTexture.getScene()?.useRightHandedSystem || (e = i.Inverse(e)), o.FromQuaternionToRef(e, t._babylonTexture.getReflectionTextureMatrix()));
				},
				getTarget: (e) => e._babylonTexture
			}
		}
	} }
};
function F(e, t, n, r) {
	let i = I(e, t);
	return r ? i[n][r] : i[n];
}
function I(e, t, n) {
	return e._data?.[n?.fillMode ?? C.MATERIAL_TriangleFillMode]?.babylonMaterial;
}
function L(e, t) {
	return {
		offset: {
			componentsCount: 2,
			type: "Vector2",
			get: (n, i, a) => {
				let o = F(n, a, e, t);
				return new r(o?.uOffset, o?.vOffset);
			},
			getTarget: I,
			set: (n, r, i, a) => {
				let o = F(r, a, e, t);
				o.uOffset = n.x, o.vOffset = n.y;
			},
			getPropertyName: [() => `${e}${t ? "." + t : ""}.uOffset`, () => `${e}${t ? "." + t : ""}.vOffset`]
		},
		rotation: {
			type: "number",
			get: (n, r, i) => F(n, i, e, t)?.wAng,
			getTarget: I,
			set: (n, r, i, a) => F(r, a, e, t).wAng = n,
			getPropertyName: [() => `${e}${t ? "." + t : ""}.wAng`]
		},
		scale: {
			componentsCount: 2,
			type: "Vector2",
			get: (n, i, a) => {
				let o = F(n, a, e, t);
				return new r(o?.uScale, o?.vScale);
			},
			getTarget: I,
			set: (n, r, i, a) => {
				let o = F(r, a, e, t);
				o.uScale = n.x, o.vScale = n.y;
			},
			getPropertyName: [() => `${e}${t ? "." + t : ""}.uScale`, () => `${e}${t ? "." + t : ""}.vScale`]
		}
	};
}
var R = {
	cameras: M,
	nodes: k,
	materials: N,
	extensions: P,
	animations: A,
	meshes: j
};
function z(e) {
	return new O(e, R);
}
function B(e) {
	let t = e.split("/").map((e) => e.replace(/{}/g, "__array__")), n = R;
	for (let e of t) e && (n = n[e]);
	if (n && n.type && n.get) return n;
}
function V(e, t) {
	let n = e.split("/").map((e) => e.replace(/{}/g, "__array__")), r = R;
	for (let e of n) e && (r = r[e]);
	r && r.type && r.get && (r.interpolation = t);
}
function H(e, t) {
	let n = e.split("/").map((e) => e.replace(/{}/g, "__array__")), r = R;
	for (let e of n) if (e) {
		if (!r[e]) {
			if (e === "?") {
				r.__ignoreObjectTree__ = !0;
				continue;
			}
			r[e] = {}, e === "__array__" && (r[e].__target__ = !0);
		}
		r = r[e];
	}
	Object.assign(r, t);
}
//#endregion
//#region node_modules/@babylonjs/loaders/glTF/2.0/glTFLoaderAnimation.js
function U(e, t, r, i) {
	return n.FromArray(t, r).scaleInPlace(i);
}
function W(e, t, n, r) {
	return i.FromArray(t, n).scaleInPlace(r);
}
function G(e, t, n, r) {
	let i = Array(e._numMorphTargets);
	for (let e = 0; e < i.length; e++) i[e] = t[n++] * r;
	return i;
}
var K = class {
	constructor(e, t, n, r) {
		this.type = e, this.name = t, this.getValue = n, this.getStride = r;
	}
	_buildAnimation(e, t, n) {
		let r = new S(e, this.name, t, this.type);
		return r.setKeys(n, !0), r;
	}
}, q = class extends K {
	buildAnimations(e, t, n, r) {
		let i = [];
		return i.push({
			babylonAnimatable: e._babylonTransformNode,
			babylonAnimation: this._buildAnimation(t, n, r)
		}), i;
	}
}, J = class extends K {
	buildAnimations(e, t, n, r) {
		let i = [];
		if (e._numMorphTargets) for (let a = 0; a < e._numMorphTargets; a++) {
			let o = new S(`${t}_${a}`, this.name, n, this.type);
			if (o.setKeys(r.map((e) => ({
				frame: e.frame,
				inTangent: e.inTangent ? e.inTangent[a] : void 0,
				value: e.value[a],
				outTangent: e.outTangent ? e.outTangent[a] : void 0,
				interpolation: e.interpolation
			})), !0), e._primitiveBabylonMeshes) {
				for (let t of e._primitiveBabylonMeshes) if (t.morphTargetManager) {
					let e = t.morphTargetManager.getTarget(a), n = o.clone();
					e.animations.push(n), i.push({
						babylonAnimatable: e,
						babylonAnimation: n
					});
				}
			}
		}
		return i;
	}
};
V("/nodes/{}/translation", [new q(S.ANIMATIONTYPE_VECTOR3, "position", U, () => 3)]), V("/nodes/{}/rotation", [new q(S.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", W, () => 4)]), V("/nodes/{}/scale", [new q(S.ANIMATIONTYPE_VECTOR3, "scaling", U, () => 3)]), V("/nodes/{}/weights", [new J(S.ANIMATIONTYPE_FLOAT, "influence", G, (e) => e._numMorphTargets)]);
//#endregion
export { U as a, B as c, E as d, T as f, W as i, z as l, q as n, G as o, w as p, J as r, H as s, K as t, V as u };

//# sourceMappingURL=glTFLoaderAnimation-cASOH0jH.js.map