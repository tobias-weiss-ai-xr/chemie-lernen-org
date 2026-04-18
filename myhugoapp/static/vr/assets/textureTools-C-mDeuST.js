import { t as e } from "./observable-D7x0jL6J.js";
import { a as t, c as n, n as r, o as i, t as a, u as o } from "./tools.functions-Dgi_rE0R.js";
import { n as s } from "./performanceConfigurator-DMA6Ub5Z.js";
import { t as c } from "./logger-B7TbbsLc.js";
import { r as l } from "./arrayTools-Dxcneqm_.js";
import { n as u, t as d } from "./typeStore-Bwo5hkCf.js";
import "./math.scalar.functions-_PnMiXiP.js";
import { a as f, i as p, t as m } from "./math.vector-ByhvsffM.js";
import { t as h } from "./decorators.serialization-C6Hy3Nio.js";
import { n as g } from "./effectRenderer-_mqgM3-a.js";
import { _, i as v, o as y } from "./decorators-Dkc3uIc_.js";
import { t as b } from "./texture-k-JfmmPT.js";
import { n as x, r as S, t as C } from "./renderingManager-rSXBHAtT.js";
import { n as w, t as T } from "./lightConstants-C8e5vSDa.js";
//#region node_modules/@babylonjs/core/Rendering/objectRenderer.js
var E = class t {
	get renderList() {
		return this._renderList;
	}
	set renderList(e) {
		this._renderList !== e && (this._unObserveRenderList &&= (this._unObserveRenderList(), null), e && (this._unObserveRenderList = l(e, this._renderListHasChanged)), this._renderList = e);
	}
	get disableImageProcessing() {
		return this._disableImageProcessing;
	}
	set disableImageProcessing(e) {
		e !== this._disableImageProcessing && (this._disableImageProcessing = e, this._scene.markAllMaterialsAsDirty(64));
	}
	get disableDepthPrePass() {
		return this._disableDepthPrePass;
	}
	set disableDepthPrePass(e) {
		this._disableDepthPrePass = e, this._renderingManager.disableDepthPrePass = e;
	}
	get name() {
		return this._name;
	}
	set name(e) {
		if (this._name !== e) {
			if (this._name = e, this._sceneUBOs) for (let e = 0; e < this._sceneUBOs.length; ++e) this._sceneUBOs[e].name = `Scene ubo #${e} for ${this.name}`;
			if (this._scene) for (let e = 0; e < this._renderPassIds.length; ++e) {
				let t = this._renderPassIds[e];
				this._engine._renderPassNames[t] = `${this._name}#${e}`;
			}
		}
	}
	get renderPassIds() {
		return this._renderPassIds;
	}
	get currentRefreshId() {
		return this._currentRefreshId;
	}
	getActiveMeshes() {
		return this._activeMeshes;
	}
	setMaterialForRendering(e, t) {
		let n;
		n = Array.isArray(e) ? e : [e];
		for (let e = 0; e < n.length; ++e) for (let r = 0; r < this.options.numPasses; ++r) {
			let i = n[e];
			n[e].isAnInstance && (i = n[e].sourceMesh), i.setMaterialForRenderPass(this._renderPassIds[r], t === void 0 ? void 0 : Array.isArray(t) ? t[r] : t);
		}
	}
	_freezeActiveMeshes(e) {
		this._freezeActiveMeshesCancel = o(() => this._checkReadiness(), () => {
			if (this._freezeActiveMeshesCancel = null, e) for (let e = 0; e < this._activeMeshes.length; e++) this._activeMeshes.data[e]._freeze();
			this._prepareRenderingManager(0, !0), this._isFrozen = !0;
		}, (e, t) => {
			this._freezeActiveMeshesCancel = null, t ? (c.Error("ObjectRenderer: Timeout while waiting for the renderer to be ready."), e && c.Error(e)) : (c.Error("ObjectRenderer: An unexpected error occurred while waiting for the renderer to be ready."), e && (c.Error(e), e.stack && c.Error(e.stack)));
		});
	}
	_unfreezeActiveMeshes() {
		this._freezeActiveMeshesCancel?.(), this._freezeActiveMeshesCancel = null;
		for (let e = 0; e < this._activeMeshes.length; e++) this._activeMeshes.data[e]._unFreeze();
		this._isFrozen = !1;
	}
	constructor(t, n, r) {
		this._unObserveRenderList = null, this._renderListHasChanged = (e, t) => {
			let n = this._renderList ? this._renderList.length : 0;
			if (t === 0 && n > 0 || n === 0) for (let e of this._scene.meshes) e._markSubMeshesAsLightDirty();
		}, this.particleSystemList = null, this.getCustomRenderList = null, this.renderMeshes = !0, this.renderDepthOnlyMeshes = !0, this.renderOpaqueMeshes = !0, this.renderAlphaTestMeshes = !0, this.renderTransparentMeshes = !0, this.renderParticles = !0, this.renderSprites = !1, this.forceLayerMaskCheck = !1, this.enableBoundingBoxRendering = !1, this.enableOutlineRendering = !0, this._disableImageProcessing = !1, this.dontSetTransformationMatrix = !1, this._disableDepthPrePass = !1, this.onBeforeRenderObservable = new e(), this.onAfterRenderObservable = new e(), this.onBeforeRenderingManagerRenderObservable = new e(), this.onAfterRenderingManagerRenderObservable = new e(), this.onInitRenderingObservable = new e(), this.onFinishRenderingObservable = new e(), this.onFastPathRenderObservable = new e(), this._currentRefreshId = -1, this._refreshRate = 1, this._currentApplyByPostProcessSetting = !1, this._activeMeshes = new S(256), this._activeBoundingBoxes = new S(32), this._currentFrameId = -1, this._currentSceneUBOIndex = 0, this._isFrozen = !1, this._freezeActiveMeshesCancel = null, this._currentSceneCamera = null, this.name = t, this._scene = n, this._engine = this._scene.getEngine(), this._useUBO = this._engine.supportsUniformBuffers, this.renderList = [], this._renderPassIds = [], this.options = {
			numPasses: 1,
			doNotChangeAspectRatio: !0,
			enableClusteredLights: !1,
			...r
		}, this._createRenderPassId(), this.renderPassId = this._renderPassIds[0], this._renderingManager = new C(n), this._renderingManager._useSceneAutoClearSetup = !0, this.options.enableClusteredLights && this.onInitRenderingObservable.add(() => {
			for (let e of this._scene.lights) e.getTypeID() === T.LIGHTTYPEID_CLUSTERED_CONTAINER && e.isSupported && e._updateBatches(this.activeCamera).render();
		}), this._scene.addObjectRenderer(this);
	}
	_releaseRenderPassId() {
		for (let e = 0; e < this.options.numPasses; ++e) this._engine.releaseRenderPassId(this._renderPassIds[e]);
		this._renderPassIds.length = 0;
	}
	_createRenderPassId() {
		this._releaseRenderPassId();
		for (let e = 0; e < this.options.numPasses; ++e) this._renderPassIds[e] = this._engine.createRenderPassId(`${this.name}#${e}`);
	}
	_createSceneUBO(e, t) {
		let n = new w(this._scene.getEngine(), void 0, t, e, void 0, !1);
		return n.addUniform("viewProjection", 16), t && n.addUniform("viewProjectionR", 16), n.addUniform("view", 16), n.addUniform("projection", 16), n.addUniform("vEyePosition", 4), n.addUniform("inverseProjection", 16), n;
	}
	_getSceneUBO() {
		this._currentFrameId !== this._engine.frameId && (this._currentSceneUBOIndex = 0, this._currentFrameId = this._engine.frameId), this._sceneUBOs || (this._sceneUBOs = [], this._sceneUBOIsMultiview = []);
		let e = this._engine._currentRenderTarget, t = !!(e && e.texture?.isMultiview) || !!this._scene._multiviewSceneUboIsActive;
		if (this._currentSceneUBOIndex >= this._sceneUBOs.length) {
			let e = this._sceneUBOs.length;
			this._sceneUBOs.push(this._createSceneUBO(`Scene ubo #${e} for ${this.name}`, t)), this._sceneUBOIsMultiview.push(t);
		} else this._sceneUBOIsMultiview[this._currentSceneUBOIndex] !== t && (this._sceneUBOs[this._currentSceneUBOIndex].dispose(), this._sceneUBOs[this._currentSceneUBOIndex] = this._createSceneUBO(`Scene ubo #${this._currentSceneUBOIndex} for ${this.name}`, t), this._sceneUBOIsMultiview[this._currentSceneUBOIndex] = t);
		let n = this._sceneUBOs[this._currentSceneUBOIndex++];
		return n.unbindEffect(), n;
	}
	resetRefreshCounter() {
		this._currentRefreshId = -1;
	}
	get refreshRate() {
		return this._refreshRate;
	}
	set refreshRate(e) {
		this._refreshRate = e, this.resetRefreshCounter();
	}
	shouldRender() {
		return this._currentRefreshId === -1 || this.refreshRate === this._currentRefreshId ? (this._currentRefreshId = 1, !0) : (this._currentRefreshId++, !1);
	}
	isReadyForRendering(e, t) {
		this.prepareRenderList(), this.initRender(e, t);
		let n = this._checkReadiness();
		return this.finishRender(), n;
	}
	prepareRenderList() {
		let e = this._scene;
		if (this._waitingRenderList) {
			if (!this.renderListPredicate) {
				this.renderList = [];
				for (let t = 0; t < this._waitingRenderList.length; t++) {
					let n = this._waitingRenderList[t], r = e.getMeshById(n);
					r && this.renderList.push(r);
				}
			}
			this._waitingRenderList = void 0;
		}
		if (this.renderListPredicate) {
			this.renderList ? this.renderList.length = 0 : this.renderList = [];
			let e = this._scene.meshes;
			for (let t = 0; t < e.length; t++) {
				let n = e[t];
				this.renderListPredicate(n) && this.renderList.push(n);
			}
		}
		this._currentApplyByPostProcessSetting = this._scene.imageProcessingConfiguration.applyByPostProcess, this._disableImageProcessing && (this._scene.imageProcessingConfiguration._applyByPostProcess = this._disableImageProcessing);
	}
	initRender(e, t) {
		let n = this.activeCamera ?? this._scene.activeCamera;
		this._currentSceneCamera = this._scene.activeCamera, this._useUBO && (this._currentSceneUBO = this._scene.getSceneUniformBuffer(), this._currentSceneUBO.unbindEffect(), this._scene.setSceneUniformBuffer(this._getSceneUBO())), this.onInitRenderingObservable.notifyObservers(this), n && (this.dontSetTransformationMatrix || this._scene.setTransformMatrix(n.getViewMatrix(), n.getProjectionMatrix(!0)), this._scene.activeCamera = n, this._engine.setViewport(n.rigParent ? n.rigParent.viewport : n.viewport, e, t)), this._useUBO && this._scene.finalizeSceneUbo(), this._defaultRenderListPrepared = !1;
	}
	finishRender() {
		let e = this._scene;
		this._useUBO && this._scene.setSceneUniformBuffer(this._currentSceneUBO), this._disableImageProcessing && (e.imageProcessingConfiguration._applyByPostProcess = this._currentApplyByPostProcessSetting), e.activeCamera = this._currentSceneCamera, this._currentSceneCamera && (this.activeCamera && this.activeCamera !== e.activeCamera && e.setTransformMatrix(this._currentSceneCamera.getViewMatrix(), this._currentSceneCamera.getProjectionMatrix(!0)), this._engine.setViewport(this._currentSceneCamera.viewport)), e.resetCachedMaterial(), this.onFinishRenderingObservable.notifyObservers(this);
	}
	render(e = 0, t = !1) {
		let n = this._engine.currentRenderPassId;
		if (this._engine.currentRenderPassId = this._renderPassIds[e], this.onBeforeRenderObservable.notifyObservers(e), this._engine.snapshotRendering && this._engine.snapshotRenderingMode === 1) this.onFastPathRenderObservable.notifyObservers(e);
		else {
			let t = this._prepareRenderingManager(e), n = this._scene.getOutlineRenderer?.(), r = n?.enabled;
			n && (n.enabled = this.enableOutlineRendering), this.onBeforeRenderingManagerRenderObservable.notifyObservers(e), this._renderingManager.render(this.customRenderFunction, t, this.renderParticles, this.renderSprites, this.renderDepthOnlyMeshes, this.renderOpaqueMeshes, this.renderAlphaTestMeshes, this.renderTransparentMeshes, this.customRenderTransparentSubMeshes), this.onAfterRenderingManagerRenderObservable.notifyObservers(e), n && (n.enabled = r);
		}
		t || this.onAfterRenderObservable.notifyObservers(e), this._engine.currentRenderPassId = n;
	}
	_checkReadiness() {
		let e = this._scene, t = this._engine.currentRenderPassId, n = !0;
		e.getViewMatrix() || e.updateTransformMatrix();
		let r = this.options.numPasses;
		for (let t = 0; t < r && n; t++) {
			let i = this.renderList ? this.renderList : e.frameGraph ? e.meshes : e.getActiveMeshes().data, a = this.renderList || e.frameGraph ? i.length : e.getActiveMeshes().length;
			this._engine.currentRenderPassId = this._renderPassIds[t], this.onBeforeRenderObservable.notifyObservers(t);
			let o = null, s = a;
			this.getCustomRenderList && (o = this.getCustomRenderList(t, i, a), o && (s = o.length)), o ||= i, this.options.doNotChangeAspectRatio || e.updateTransformMatrix(!0);
			for (let e = 0; e < s && n; ++e) {
				let t = o[e];
				if (!(!t.isEnabled() || t.isBlocked || !t.isVisible || !t.subMeshes)) {
					if (this.customIsReadyFunction) {
						if (!this.customIsReadyFunction(t, this.refreshRate, !0)) {
							n = !1;
							continue;
						}
					} else if (!t.isReady(!0)) {
						n = !1;
						continue;
					}
				}
			}
			this.onAfterRenderObservable.notifyObservers(t), r > 1 && (e.incrementRenderId(), e.resetCachedMaterial());
		}
		let i = this.particleSystemList || e.particleSystems;
		for (let e of i) e.isReady() || (n = !1);
		return this._engine.currentRenderPassId = t, n;
	}
	_prepareRenderingManager(e = 0, t = !1) {
		let n = this._scene, r = null, i, a, o = this.renderList ? this.renderList : n.frameGraph ? n.meshes : n.getActiveMeshes().data, s = this.renderList || n.frameGraph ? o.length : n.getActiveMeshes().length;
		if (this.getCustomRenderList && (r = this.getCustomRenderList(e, o, s)), r) i = r.length, a = this.forceLayerMaskCheck;
		else {
			if (this._defaultRenderListPrepared && !t && !this._engine.isWebGPU) return o;
			this._defaultRenderListPrepared = !0, r = o, i = s, a = !this.renderList || this.forceLayerMaskCheck;
		}
		let c = n.activeCamera, l = this.cameraForLOD ?? c, u = n.getBoundingBoxRenderer?.();
		if (n._activeMeshesFrozen && this._isFrozen) {
			if (this._renderingManager.resetSprites(), this.enableBoundingBoxRendering && u) {
				u.reset();
				for (let e = 0; e < this._activeBoundingBoxes.length; e++) {
					let t = this._activeBoundingBoxes.data[e];
					u.renderList.push(t);
				}
			}
			return r;
		}
		if (this._renderingManager.reset(), this._activeMeshes.reset(), this._activeBoundingBoxes.reset(), u && u.reset(), this.renderMeshes) {
			let e = n.getRenderId(), t = n.getFrameId();
			for (let o = 0; o < i; o++) {
				let i = r[o];
				if (i && !i.isBlocked) {
					if (this.customIsReadyFunction) {
						if (!this.customIsReadyFunction(i, this.refreshRate, !1)) {
							this.resetRefreshCounter();
							continue;
						}
					} else if (!i.isReady(this.refreshRate === 0)) {
						this.resetRefreshCounter();
						continue;
					}
					let r;
					if (l) {
						let e = i._internalAbstractMeshDataInfo._currentLOD.get(l);
						!e || e[1] !== t ? (r = n.customLODSelector ? n.customLODSelector(i, l) : i.getLOD(l), e ? (e[0] = r, e[1] = t) : i._internalAbstractMeshDataInfo._currentLOD.set(l, [r, t])) : r = e[0];
					} else r = i;
					if (!r) continue;
					r !== i && r.billboardMode !== 0 && r.computeWorldMatrix(), r._preActivateForIntermediateRendering(e);
					let o;
					if (o = a && c ? (i.layerMask & c.layerMask) === 0 : !1, i.isEnabled() && i.isVisible && i.subMeshes && !o) {
						if (this._activeMeshes.push(i), r._internalAbstractMeshDataInfo._wasActiveLastFrame = !0, r !== i && r._activate(e, !0), this.enableBoundingBoxRendering && u && u._preActiveMesh(i), i._activate(e, !0) && i.subMeshes.length) {
							i.isAnInstance ? i._internalAbstractMeshDataInfo._actAsRegularMesh && (r = i) : r._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = !1, r._internalAbstractMeshDataInfo._isActiveIntermediate = !0, n._prepareSkeleton(r);
							for (let e = 0; e < r.subMeshes.length; e++) {
								let t = r.subMeshes[e];
								this.enableBoundingBoxRendering && u && u._evaluateSubMesh(i, t), this._renderingManager.dispatch(t, r);
							}
						}
						i._postActivate();
					}
				}
			}
		}
		if (this.enableBoundingBoxRendering && u && t) for (let e = 0; e < u.renderList.length; e++) {
			let t = u.renderList.data[e];
			this._activeBoundingBoxes.push(t);
		}
		if (this._scene.particlesEnabled && this.renderParticles) {
			this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
			let e = this.particleSystemList || n.particleSystems;
			for (let t = 0; t < e.length; t++) {
				let n = e[t], r = n.emitter;
				!n.isStarted() || !r || r.position && !r.isEnabled() || this._renderingManager.dispatchParticles(n);
			}
			this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
		}
		return r;
	}
	get renderingManager() {
		return this._renderingManager;
	}
	setRenderingOrder(e, t = null, n = null, r = null) {
		this._renderingManager.setRenderingOrder(e, t, n, r);
	}
	setRenderingAutoClearDepthStencil(e, t, n = !0, r = !0) {
		this._renderingManager.setRenderingAutoClearDepthStencil(e, t, n, r), this._renderingManager._useSceneAutoClearSetup = !1;
	}
	clone() {
		let e = new t(this.name, this._scene, this.options);
		return this.renderList && (e.renderList = this.renderList.slice(0)), e;
	}
	dispose() {
		let e = this.renderList ? this.renderList : this._scene.getActiveMeshes().data, t = this.renderList ? this.renderList.length : this._scene.getActiveMeshes().length;
		for (let n = 0; n < t; n++) {
			let t = e[n];
			t && t.getMaterialForRenderPass(this.renderPassId) !== void 0 && t.setMaterialForRenderPass(this.renderPassId, void 0);
		}
		if (this.onInitRenderingObservable.clear(), this.onFinishRenderingObservable.clear(), this.onBeforeRenderObservable.clear(), this.onAfterRenderObservable.clear(), this.onBeforeRenderingManagerRenderObservable.clear(), this.onAfterRenderingManagerRenderObservable.clear(), this.onFastPathRenderObservable.clear(), this._releaseRenderPassId(), this.renderList = null, this._sceneUBOs) for (let e of this._sceneUBOs) e.dispose();
		this._sceneUBOs = void 0, this._scene.removeObjectRenderer(this);
	}
	_rebuild() {
		this.refreshRate === t.REFRESHRATE_RENDER_ONCE && (this.refreshRate = t.REFRESHRATE_RENDER_ONCE);
	}
	freeRenderingGroups() {
		this._renderingManager && this._renderingManager.freeRenderingGroups();
	}
};
//#endregion
//#region node_modules/@babylonjs/core/Materials/Textures/renderTargetTexture.js
E.REFRESHRATE_RENDER_ONCE = 0, E.REFRESHRATE_RENDER_ONEVERYFRAME = 1, E.REFRESHRATE_RENDER_ONEVERYTWOFRAMES = 2, n.prototype.setDepthStencilTexture = function(e, t) {
	this._engine.setDepthStencilTexture(this._samplers[e], this._uniforms[e], t, e);
};
var D = class n extends b {
	get renderListPredicate() {
		return this._objectRenderer.renderListPredicate;
	}
	set renderListPredicate(e) {
		this._objectRenderer.renderListPredicate = e;
	}
	get renderList() {
		return this._objectRenderer.renderList;
	}
	set renderList(e) {
		this._objectRenderer.renderList = e;
	}
	get particleSystemList() {
		return this._objectRenderer.particleSystemList;
	}
	set particleSystemList(e) {
		this._objectRenderer.particleSystemList = e;
	}
	get getCustomRenderList() {
		return this._objectRenderer.getCustomRenderList;
	}
	set getCustomRenderList(e) {
		this._objectRenderer.getCustomRenderList = e;
	}
	get renderParticles() {
		return this._objectRenderer.renderParticles;
	}
	set renderParticles(e) {
		this._objectRenderer.renderParticles = e;
	}
	get renderSprites() {
		return this._objectRenderer.renderSprites;
	}
	set renderSprites(e) {
		this._objectRenderer.renderSprites = e;
	}
	get enableBoundingBoxRendering() {
		return this._objectRenderer.enableBoundingBoxRendering;
	}
	set enableBoundingBoxRendering(e) {
		this._objectRenderer.enableBoundingBoxRendering = e;
	}
	get enableOutlineRendering() {
		return this._objectRenderer.enableOutlineRendering;
	}
	set enableOutlineRendering(e) {
		this._objectRenderer.enableOutlineRendering = e;
	}
	get forceLayerMaskCheck() {
		return this._objectRenderer.forceLayerMaskCheck;
	}
	set forceLayerMaskCheck(e) {
		this._objectRenderer.forceLayerMaskCheck = e;
	}
	get activeCamera() {
		return this._objectRenderer.activeCamera;
	}
	set activeCamera(e) {
		this._objectRenderer.activeCamera = e;
	}
	get cameraForLOD() {
		return this._objectRenderer.cameraForLOD;
	}
	set cameraForLOD(e) {
		this._objectRenderer.cameraForLOD = e;
	}
	get disableImageProcessing() {
		return this._objectRenderer.disableImageProcessing;
	}
	set disableImageProcessing(e) {
		this._objectRenderer.disableImageProcessing = e;
	}
	get customIsReadyFunction() {
		return this._objectRenderer.customIsReadyFunction;
	}
	set customIsReadyFunction(e) {
		this._objectRenderer.customIsReadyFunction = e;
	}
	get customRenderFunction() {
		return this._objectRenderer.customRenderFunction;
	}
	set customRenderFunction(e) {
		this._objectRenderer.customRenderFunction = e;
	}
	get postProcesses() {
		return this._postProcesses;
	}
	get _prePassEnabled() {
		return !!this._prePassRenderTarget && this._prePassRenderTarget.enabled;
	}
	set onAfterUnbind(e) {
		this._onAfterUnbindObserver && this.onAfterUnbindObservable.remove(this._onAfterUnbindObserver), this._onAfterUnbindObserver = this.onAfterUnbindObservable.add(e);
	}
	get onBeforeRenderObservable() {
		return this._objectRenderer.onBeforeRenderObservable;
	}
	set onBeforeRender(e) {
		this._onBeforeRenderObserver && this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver), this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(e);
	}
	get onAfterRenderObservable() {
		return this._objectRenderer.onAfterRenderObservable;
	}
	set onAfterRender(e) {
		this._onAfterRenderObserver && this.onAfterRenderObservable.remove(this._onAfterRenderObserver), this._onAfterRenderObserver = this.onAfterRenderObservable.add(e);
	}
	set onClear(e) {
		this._onClearObserver && this.onClearObservable.remove(this._onClearObserver), this._onClearObserver = this.onClearObservable.add(e);
	}
	get _waitingRenderList() {
		return this._objectRenderer._waitingRenderList;
	}
	set _waitingRenderList(e) {
		this._objectRenderer._waitingRenderList = e;
	}
	get renderPassId() {
		return this._objectRenderer.renderPassId;
	}
	get renderPassIds() {
		return this._objectRenderer.renderPassIds;
	}
	get currentRefreshId() {
		return this._objectRenderer.currentRefreshId;
	}
	setMaterialForRendering(e, t) {
		this._objectRenderer.setMaterialForRendering(e, t);
	}
	get isMulti() {
		return this._renderTarget?.isMulti ?? !1;
	}
	get renderTargetOptions() {
		return this._renderTargetOptions;
	}
	get renderTarget() {
		return this._renderTarget;
	}
	_onRatioRescale() {
		this._sizeRatio && this.resize(this._initialSizeParameter);
	}
	set boundingBoxSize(e) {
		if (this._boundingBoxSize && this._boundingBoxSize.equals(e)) return;
		this._boundingBoxSize = e;
		let t = this.getScene();
		t && t.markAllMaterialsAsDirty(1);
	}
	get boundingBoxSize() {
		return this._boundingBoxSize;
	}
	get depthStencilTexture() {
		return this._renderTarget?._depthStencilTexture ?? null;
	}
	constructor(t, n, r, i = !1, a = !0, o = 0, s = !1, l = b.TRILINEAR_SAMPLINGMODE, u = !0, d = !1, p = !1, h = 5, g = !1, _, v, y = !1, x = !1) {
		let S, C = !0, w, T = !1;
		if (typeof i == "object") {
			let e = i;
			i = !!e.generateMipMaps, a = e.doNotChangeAspectRatio ?? !0, o = e.type ?? 0, s = !!e.isCube, l = e.samplingMode ?? b.TRILINEAR_SAMPLINGMODE, u = e.generateDepthBuffer ?? !0, d = !!e.generateStencilBuffer, p = !!e.isMulti, h = e.format ?? 5, g = !!e.delayAllocation, _ = e.samples, v = e.creationFlags, y = !!e.noColorAttachment, x = !!e.useSRGBBuffer, S = e.colorAttachment, C = e.gammaSpace ?? C, w = e.existingObjectRenderer, T = !!e.enableClusteredLights;
		}
		if (super(null, r, !i, void 0, l, void 0, void 0, void 0, void 0, h), this.ignoreCameraViewport = !1, this.onBeforeBindObservable = new e(), this.onAfterUnbindObservable = new e(), this.onClearObservable = new e(), this.onResizeObservable = new e(), this._cleared = !1, this.skipInitialClear = !1, this._samples = 1, this._canRescale = !0, this._renderTarget = null, this._dontDisposeObjectRenderer = !1, this.boundingBoxPosition = f.Zero(), this._disableEngineStages = !1, this._dumpToolsLoading = !1, r = this.getScene(), !r) return;
		let D = this.getScene().getEngine();
		this._gammaSpace = C, this._coordinatesMode = b.PROJECTION_MODE, this.name = t, this.isRenderTarget = !0, this._initialSizeParameter = n, this._dontDisposeObjectRenderer = !!w, this._processSizeParameter(n), this._objectRenderer = w ?? new E(t, r, {
			numPasses: s ? 6 : this.getRenderLayers() || 1,
			doNotChangeAspectRatio: a,
			enableClusteredLights: T
		}), this._onBeforeRenderingManagerRenderObserver = this._objectRenderer.onBeforeRenderingManagerRenderObservable.add(() => {
			let e = this._scene;
			if (!this._disableEngineStages) for (let t of e._beforeRenderTargetClearStage) t.action(this, this._currentFaceIndex, this._currentLayer);
			if (this.onClearObservable.hasObservers() ? this.onClearObservable.notifyObservers(D) : this.skipInitialClear || D.clear(this.clearColor ?? e.clearColor, !0, !0, !0), this._doNotChangeAspectRatio || e.updateTransformMatrix(!0), !this._disableEngineStages) for (let t of e._beforeRenderTargetDrawStage) t.action(this, this._currentFaceIndex, this._currentLayer);
			D._debugPushGroup && D._debugPushGroup(`Render to ${this.name} (face #${this._currentFaceIndex} layer #${this._currentLayer})`);
		}), this._onAfterRenderingManagerRenderObserver = this._objectRenderer.onAfterRenderingManagerRenderObservable.add(() => {
			if (D._debugPopGroup && D._debugPopGroup(), !this._disableEngineStages) for (let e of this._scene._afterRenderTargetDrawStage) e.action(this, this._currentFaceIndex, this._currentLayer);
			let e = this._texture?.generateMipMaps ?? !1;
			if (this._texture && (this._texture.generateMipMaps = !1), this._postProcessManager ? this._postProcessManager._finalizeFrame(!1, this._renderTarget ?? void 0, this._currentFaceIndex, this._postProcesses, this.ignoreCameraViewport) : this._currentUseCameraPostProcess && this._scene.postProcessManager._finalizeFrame(!1, this._renderTarget ?? void 0, this._currentFaceIndex), !this._disableEngineStages) for (let e of this._scene._afterRenderTargetPostProcessStage) e.action(this, this._currentFaceIndex, this._currentLayer);
			this._texture && (this._texture.generateMipMaps = e), this._doNotChangeAspectRatio || this._scene.updateTransformMatrix(!0), this._currentDumpForDebug && (this._dumpTools ? this._dumpTools.DumpFramebuffer(this.getRenderWidth(), this.getRenderHeight(), D) : c.Error("dumpTools module is still being loaded. To speed up the process import dump tools directly in your project"));
		}), this._onFastPathRenderObserver = this._objectRenderer.onFastPathRenderObservable.add(() => {
			this.onClearObservable.hasObservers() ? this.onClearObservable.notifyObservers(D) : this.skipInitialClear || D.clear(this.clearColor || this._scene.clearColor, !0, !0, !0);
		}), this._resizeObserver = D.onResizeObservable.add(() => {}), this._generateMipMaps = !!i, this._doNotChangeAspectRatio = a, !p && (this._renderTargetOptions = {
			generateMipMaps: i,
			type: o,
			format: this._format ?? void 0,
			samplingMode: this.samplingMode,
			generateDepthBuffer: u,
			generateStencilBuffer: d,
			samples: _,
			creationFlags: v,
			noColorAttachment: y,
			useSRGBBuffer: x,
			colorAttachment: S,
			label: this.name
		}, this.samplingMode === b.NEAREST_SAMPLINGMODE && (this.wrapU = b.CLAMP_ADDRESSMODE, this.wrapV = b.CLAMP_ADDRESSMODE), g || (s ? (this._renderTarget = r.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions), this.coordinatesMode = b.INVCUBIC_MODE, this._textureMatrix = m.Identity()) : this._renderTarget = r.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions), this._texture = this._renderTarget.texture, _ !== void 0 && (this.samples = _)));
	}
	createDepthStencilTexture(e = 0, t = !0, n = !1, r = 1, i = 14, a) {
		this._renderTarget?.createDepthStencilTexture(e, t, n, r, i, a);
	}
	_processSizeParameter(e) {
		if (e.ratio) {
			this._sizeRatio = e.ratio;
			let t = this._getEngine();
			this._size = {
				width: this._bestReflectionRenderTargetDimension(t.getRenderWidth(), this._sizeRatio),
				height: this._bestReflectionRenderTargetDimension(t.getRenderHeight(), this._sizeRatio)
			};
		} else this._size = e;
	}
	get samples() {
		return this._renderTarget?.samples ?? this._samples;
	}
	set samples(e) {
		this._renderTarget && (this._samples = this._renderTarget.setSamples(e));
	}
	addPostProcess(e) {
		if (!this._postProcessManager) {
			let e = this.getScene();
			if (!e) return;
			this._postProcessManager = new x(e), this._postProcesses = [];
		}
		this._postProcesses.push(e), this._postProcesses[0].autoClear = !1;
	}
	clearPostProcesses(e = !1) {
		if (this._postProcesses) {
			if (e) for (let e of this._postProcesses) e.dispose();
			this._postProcesses = [];
		}
	}
	removePostProcess(e) {
		if (!this._postProcesses) return;
		let t = this._postProcesses.indexOf(e);
		t !== -1 && (this._postProcesses.splice(t, 1), this._postProcesses.length > 0 && (this._postProcesses[0].autoClear = !1));
	}
	resetRefreshCounter() {
		this._objectRenderer.resetRefreshCounter();
	}
	get refreshRate() {
		return this._objectRenderer.refreshRate;
	}
	set refreshRate(e) {
		this._objectRenderer.refreshRate = e;
	}
	_shouldRender() {
		return this._objectRenderer.shouldRender();
	}
	getRenderSize() {
		return this.getRenderWidth();
	}
	getRenderWidth() {
		return this._size.width ? this._size.width : this._size;
	}
	getRenderHeight() {
		return this._size.width ? this._size.height : this._size;
	}
	getRenderLayers() {
		return this._size.layers || this._size.depth || 0;
	}
	disableRescaling() {
		this._canRescale = !1;
	}
	get canRescale() {
		return this._canRescale;
	}
	scale(e) {
		let t = Math.max(1, this.getRenderSize() * e);
		this.resize(t);
	}
	getReflectionTextureMatrix() {
		return this.isCube ? this._textureMatrix : super.getReflectionTextureMatrix();
	}
	resize(e) {
		let t = this.isCube;
		this._renderTarget?.dispose(), this._renderTarget = null;
		let n = this.getScene();
		n && (this._processSizeParameter(e), t ? this._renderTarget = n.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions) : this._renderTarget = n.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions), this._texture = this._renderTarget.texture, this._renderTargetOptions.samples !== void 0 && (this.samples = this._renderTargetOptions.samples), this.onResizeObservable.hasObservers() && this.onResizeObservable.notifyObservers(this));
	}
	render(e = !1, t = !1) {
		this._render(e, t);
	}
	isReadyForRendering() {
		this._dumpToolsLoading || (this._dumpToolsLoading = !0, import("./dumpTools-DLwsxmL6.js").then((e) => this._dumpTools = e)), this._objectRenderer.prepareRenderList(), this.onBeforeBindObservable.notifyObservers(this), this._objectRenderer.initRender(this.getRenderWidth(), this.getRenderHeight());
		let e = this._objectRenderer._checkReadiness();
		return this.onAfterUnbindObservable.notifyObservers(this), this._objectRenderer.finishRender(), e;
	}
	_render(e = !1, t = !1) {
		let n = this.getScene();
		if (!n) return;
		this.useCameraPostProcesses !== void 0 && (e = this.useCameraPostProcesses);
		let r = n.getEngine();
		if (r._debugPushGroup && r._debugPushGroup(`Render to ${this.name}`), this._objectRenderer.prepareRenderList(), this.onBeforeBindObservable.notifyObservers(this), this._objectRenderer.initRender(this.getRenderWidth(), this.getRenderHeight()), (this.is2DArray || this.is3D) && !this.isMulti) for (let r = 0; r < this.getRenderLayers(); r++) this._renderToTarget(0, e, t, r), n.incrementRenderId(), n.resetCachedMaterial();
		else if (this.isCube && !this.isMulti) for (let r = 0; r < 6; r++) this._renderToTarget(r, e, t), n.incrementRenderId(), n.resetCachedMaterial();
		else this._renderToTarget(0, e, t);
		this.onAfterUnbindObservable.notifyObservers(this), this._objectRenderer.finishRender(), r._debugPopGroup && r._debugPopGroup();
	}
	_bestReflectionRenderTargetDimension(e, n) {
		let r = e * n, i = t(r + 16384 / (128 + r));
		return Math.min(a(e), i);
	}
	_bindFrameBuffer(e = 0, t = 0) {
		let n = this.getScene();
		if (!n) return;
		let r = n.getEngine();
		this._renderTarget && r.bindFramebuffer(this._renderTarget, this.isCube ? e : void 0, void 0, void 0, this.ignoreCameraViewport, 0, t);
	}
	_unbindFrameBuffer(e, t) {
		this._renderTarget && e.unBindFramebuffer(this._renderTarget, this.isCube, () => {
			this.onAfterRenderObservable.notifyObservers(t);
		});
	}
	_prepareFrame(e, t, n, r) {
		this._postProcessManager ? this._prePassEnabled || this._postProcessManager._prepareFrame(this._texture, this._postProcesses) || this._bindFrameBuffer(t, n) : (!r || !e.postProcessManager._prepareFrame(this._texture)) && this._bindFrameBuffer(t, n);
	}
	_renderToTarget(e, t, n, r = 0) {
		let i = this.getScene();
		if (!i) return;
		let a = i.getEngine();
		this._currentFaceIndex = e, this._currentLayer = r, this._currentUseCameraPostProcess = t, this._currentDumpForDebug = n, this._prepareFrame(i, e, r, t), this._objectRenderer.render(e + r, !0), this._unbindFrameBuffer(a, e), this._texture && this.isCube && e === 5 && a.generateMipMapsForCubemap(this._texture, !0);
	}
	setRenderingOrder(e, t = null, n = null, r = null) {
		this._objectRenderer.setRenderingOrder(e, t, n, r);
	}
	setRenderingAutoClearDepthStencil(e, t) {
		this._objectRenderer.setRenderingAutoClearDepthStencil(e, t);
	}
	clone() {
		let e = this.getSize(), t = new n(this.name, e, this.getScene(), this._renderTargetOptions.generateMipMaps, this._doNotChangeAspectRatio, this._renderTargetOptions.type, this.isCube, this._renderTargetOptions.samplingMode, this._renderTargetOptions.generateDepthBuffer, this._renderTargetOptions.generateStencilBuffer, void 0, this._renderTargetOptions.format, void 0, this._renderTargetOptions.samples);
		return t.hasAlpha = this.hasAlpha, t.level = this.level, t.coordinatesMode = this.coordinatesMode, this.renderList && (t.renderList = this.renderList.slice(0)), t;
	}
	serialize() {
		if (!this.name) return null;
		let e = super.serialize();
		if (e.renderTargetSize = this.getRenderSize(), e.renderList = [], this.renderList) for (let t = 0; t < this.renderList.length; t++) e.renderList.push(this.renderList[t].id);
		return e;
	}
	disposeFramebufferObjects() {
		this._renderTarget?.dispose(!0);
	}
	releaseInternalTexture() {
		this._renderTarget?.releaseTextures(), this._texture = null;
	}
	dispose() {
		this.onResizeObservable.clear(), this.onClearObservable.clear(), this.onAfterUnbindObservable.clear(), this.onBeforeBindObservable.clear(), this._postProcessManager &&= (this._postProcessManager.dispose(), null), this._prePassRenderTarget && this._prePassRenderTarget.dispose(), this._objectRenderer.onBeforeRenderingManagerRenderObservable.remove(this._onBeforeRenderingManagerRenderObserver), this._objectRenderer.onAfterRenderingManagerRenderObservable.remove(this._onAfterRenderingManagerRenderObserver), this._objectRenderer.onFastPathRenderObservable.remove(this._onFastPathRenderObserver), this._dontDisposeObjectRenderer || this._objectRenderer.dispose(), this.clearPostProcesses(!0), this._resizeObserver &&= (this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver), null);
		let e = this.getScene();
		if (!e) return;
		let t = e.customRenderTargets.indexOf(this);
		t >= 0 && e.customRenderTargets.splice(t, 1);
		for (let n of e.cameras) t = n.customRenderTargets.indexOf(this), t >= 0 && n.customRenderTargets.splice(t, 1);
		this._renderTarget?.dispose(), this._renderTarget = null, this._texture = null, super.dispose();
	}
	_rebuild() {
		this._objectRenderer._rebuild(), this._postProcessManager && this._postProcessManager._rebuild();
	}
	freeRenderingGroups() {
		this._objectRenderer.freeRenderingGroups();
	}
	getViewCount() {
		return 1;
	}
};
D.REFRESHRATE_RENDER_ONCE = E.REFRESHRATE_RENDER_ONCE, D.REFRESHRATE_RENDER_ONEVERYFRAME = E.REFRESHRATE_RENDER_ONEVERYFRAME, D.REFRESHRATE_RENDER_ONEVERYTWOFRAMES = E.REFRESHRATE_RENDER_ONEVERYTWOFRAMES, b._CreateRenderTargetTexture = (e, t, n, r, i) => new D(e, t, n, r), i.prototype.setTextureFromPostProcess = function(e, t, n) {
	let r = null;
	t && (t._forcedOutputTexture ? r = t._forcedOutputTexture : t._textures.data[t._currentRenderTextureInd] && (r = t._textures.data[t._currentRenderTextureInd])), this._bindTexture(e, r?.texture ?? null, n);
}, i.prototype.setTextureFromPostProcessOutput = function(e, t, n) {
	this._bindTexture(e, t?._outputTexture?.texture ?? null, n);
}, n.prototype.setTextureFromPostProcess = function(e, t) {
	this._engine.setTextureFromPostProcess(this._samplers[e], t, e);
}, n.prototype.setTextureFromPostProcessOutput = function(e, t) {
	this._engine.setTextureFromPostProcessOutput(this._samplers[e], t, e);
};
var O = class t {
	static get ForceGLSL() {
		return g.ForceGLSL;
	}
	static set ForceGLSL(e) {
		g.ForceGLSL = e;
	}
	static RegisterShaderCodeProcessing(e, t) {
		g.RegisterShaderCodeProcessing(e, t);
	}
	get name() {
		return this._effectWrapper.name;
	}
	set name(e) {
		this._effectWrapper.name = e;
	}
	get alphaMode() {
		return this._effectWrapper.alphaMode;
	}
	set alphaMode(e) {
		this._effectWrapper.alphaMode = e;
	}
	get samples() {
		return this._samples;
	}
	set samples(e) {
		this._samples = Math.min(e, this._engine.getCaps().maxMSAASamples), this._textures.forEach((e) => {
			e.setSamples(this._samples);
		});
	}
	get shaderLanguage() {
		return this._shaderLanguage;
	}
	getEffectName() {
		return this._fragmentUrl;
	}
	set onActivate(e) {
		this._onActivateObserver && this.onActivateObservable.remove(this._onActivateObserver), e && (this._onActivateObserver = this.onActivateObservable.add(e));
	}
	set onSizeChanged(e) {
		this._onSizeChangedObserver && this.onSizeChangedObservable.remove(this._onSizeChangedObserver), this._onSizeChangedObserver = this.onSizeChangedObservable.add(e);
	}
	set onApply(e) {
		this._onApplyObserver && this.onApplyObservable.remove(this._onApplyObserver), this._onApplyObserver = this.onApplyObservable.add(e);
	}
	set onBeforeRender(e) {
		this._onBeforeRenderObserver && this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver), this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(e);
	}
	set onAfterRender(e) {
		this._onAfterRenderObserver && this.onAfterRenderObservable.remove(this._onAfterRenderObserver), this._onAfterRenderObserver = this.onAfterRenderObservable.add(e);
	}
	get inputTexture() {
		return this._textures.data[this._currentRenderTextureInd];
	}
	set inputTexture(e) {
		this._forcedOutputTexture = e;
	}
	restoreDefaultInputTexture() {
		this._forcedOutputTexture && (this._forcedOutputTexture = null, this.markTextureDirty());
	}
	getCamera() {
		return this._camera;
	}
	get texelSize() {
		return this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.texelSize : (this._forcedOutputTexture && this._texelSize.copyFromFloats(1 / this._forcedOutputTexture.width, 1 / this._forcedOutputTexture.height), this._texelSize);
	}
	constructor(n, r, i, a, o, s, c = 1, l, u, d = null, f = 0, m = "postprocess", h, _ = !1, v = 5, y, b) {
		this._parentContainer = null, this.width = -1, this.height = -1, this.nodeMaterialSource = null, this._outputTexture = null, this.autoClear = !0, this.forceAutoClearInAlphaMode = !1, this.animations = [], this.enablePixelPerfectMode = !1, this.forceFullscreenViewport = !0, this.scaleMode = 1, this.alwaysForcePOT = !1, this._samples = 1, this.adaptScaleToCurrentViewport = !1, this.doNotSerialize = !1, this._webGPUReady = !1, this._reusable = !1, this._renderId = 0, this.externalTextureSamplerBinding = !1, this._textures = new S(2), this._textureCache = [], this._currentRenderTextureInd = 0, this._scaleRatio = new p(1, 1), this._texelSize = p.Zero(), this.onActivateObservable = new e(), this.onSizeChangedObservable = new e(), this.onApplyObservable = new e(), this.onBeforeRenderObservable = new e(), this.onAfterRenderObservable = new e(), this.onDisposeObservable = new e();
		let x = 1, C = null, w;
		if (i && !Array.isArray(i)) {
			let e = i;
			i = e.uniforms ?? null, a = e.samplers ?? null, x = e.size ?? 1, s = e.camera ?? null, c = e.samplingMode ?? 1, l = e.engine, u = e.reusable, d = Array.isArray(e.defines) ? e.defines.join("\n") : e.defines ?? null, f = e.textureType ?? 0, m = e.vertexUrl ?? "postprocess", h = e.indexParameters, _ = e.blockCompilation ?? !1, v = e.textureFormat ?? 5, y = e.shaderLanguage ?? 0, C = e.uniformBuffers ?? null, b = e.extraInitializations, w = e.effectWrapper;
		} else o && (x = typeof o == "number" ? o : {
			width: o.width,
			height: o.height
		});
		if (this._useExistingThinPostProcess = !!w, this._effectWrapper = w ?? new g({
			name: n,
			useShaderStore: !0,
			useAsPostProcess: !0,
			fragmentShader: r,
			engine: l || s?.getScene().getEngine(),
			uniforms: i,
			samplers: a,
			uniformBuffers: C,
			defines: d,
			vertexUrl: m,
			indexParameters: h,
			blockCompilation: !0,
			shaderLanguage: y,
			extraInitializations: void 0
		}), this.name = n, this.onEffectCreatedObservable = this._effectWrapper.onEffectCreatedObservable, s == null ? l && (this._engine = l, this._engine.postProcesses.push(this)) : (this._camera = s, this._scene = s.getScene(), s.attachPostProcess(this), this._engine = this._scene.getEngine(), this._scene.addPostProcess(this), this.uniqueId = this._scene.getUniqueId()), this._options = x, this.renderTargetSamplingMode = c || 1, this._reusable = u || !1, this._textureType = f, this._textureFormat = v, this._shaderLanguage = y || 0, this._samplers = a || [], this._samplers.indexOf("textureSampler") === -1 && this._samplers.push("textureSampler"), this._fragmentUrl = r, this._vertexUrl = m, this._parameters = i || [], this._parameters.indexOf("scale") === -1 && this._parameters.push("scale"), this._uniformBuffers = C || [], this._indexParameters = h, !this._useExistingThinPostProcess) {
			this._webGPUReady = this._shaderLanguage === 1;
			let e = [];
			this._gatherImports(this._engine.isWebGPU && !t.ForceGLSL, e), this._effectWrapper._webGPUReady = this._webGPUReady, this._effectWrapper._postConstructor(_, d, b, e);
		}
	}
	_gatherImports(e = !1, t) {
		e && this._webGPUReady ? t.push(Promise.all([import("./postprocess.vertex-j4O6iNZB.js")])) : t.push(Promise.all([import("./postprocess.vertex-BSyqVuDa.js")]));
	}
	getClassName() {
		return "PostProcess";
	}
	getEngine() {
		return this._engine;
	}
	getEffect() {
		return this._effectWrapper.drawWrapper.effect;
	}
	shareOutputWith(e) {
		return this._disposeTextures(), this._shareOutputWithPostProcess = e, this;
	}
	useOwnOutput() {
		this._textures.length == 0 && (this._textures = new S(2)), this._shareOutputWithPostProcess = null;
	}
	updateEffect(e = null, t = null, n = null, r, i, a, o, s) {
		this._effectWrapper.updateEffect(e, t, n, r, i, a, o, s), this._postProcessDefines = Array.isArray(this._effectWrapper.options.defines) ? this._effectWrapper.options.defines.join("\n") : this._effectWrapper.options.defines;
	}
	isReusable() {
		return this._reusable;
	}
	markTextureDirty() {
		this.width = -1;
	}
	_createRenderTargetTexture(e, t, n = 0) {
		for (let r = 0; r < this._textureCache.length; r++) if (this._textureCache[r].texture.width === e.width && this._textureCache[r].texture.height === e.height && this._textureCache[r].postProcessChannel === n && this._textureCache[r].texture._generateDepthBuffer === t.generateDepthBuffer && this._textureCache[r].texture.samples === t.samples) return this._textureCache[r].texture;
		let r = this._engine.createRenderTargetTexture(e, t);
		return this._textureCache.push({
			texture: r,
			postProcessChannel: n,
			lastUsedRenderId: -1
		}), r;
	}
	_flushTextureCache() {
		let e = this._renderId;
		for (let t = this._textureCache.length - 1; t >= 0; t--) if (e - this._textureCache[t].lastUsedRenderId > 100) {
			let e = !1;
			for (let n = 0; n < this._textures.length; n++) if (this._textures.data[n] === this._textureCache[t].texture) {
				e = !0;
				break;
			}
			e || (this._textureCache[t].texture.dispose(), this._textureCache.splice(t, 1));
		}
	}
	resize(e, t, n = null, r = !1, i = !1) {
		this._textures.length > 0 && this._textures.reset(), this.width = e, this.height = t;
		let a = null;
		if (n) {
			for (let e = 0; e < n._postProcesses.length; e++) if (n._postProcesses[e] !== null) {
				a = n._postProcesses[e];
				break;
			}
		}
		let o = {
			width: this.width,
			height: this.height
		}, s = {
			generateMipMaps: r,
			generateDepthBuffer: i || a === this,
			generateStencilBuffer: (i || a === this) && this._engine.isStencilEnable,
			samplingMode: this.renderTargetSamplingMode,
			type: this._textureType,
			format: this._textureFormat,
			samples: this._samples,
			label: "PostProcessRTT-" + this.name
		};
		this._textures.push(this._createRenderTargetTexture(o, s, 0)), this._reusable && this._textures.push(this._createRenderTargetTexture(o, s, 1)), this._texelSize.copyFromFloats(1 / this.width, 1 / this.height), this.onSizeChangedObservable.notifyObservers(this);
	}
	_getTarget() {
		let e;
		if (this._shareOutputWithPostProcess) e = this._shareOutputWithPostProcess.inputTexture;
		else if (this._forcedOutputTexture) e = this._forcedOutputTexture, this.width = this._forcedOutputTexture.width, this.height = this._forcedOutputTexture.height;
		else {
			e = this.inputTexture;
			let t;
			for (let n = 0; n < this._textureCache.length; n++) if (this._textureCache[n].texture === e) {
				t = this._textureCache[n];
				break;
			}
			t && (t.lastUsedRenderId = this._renderId);
		}
		return e;
	}
	activate(e, t = null, n) {
		let i = e === null || e.cameraRigMode !== void 0 ? e || this._camera : null, a = i?.getScene() ?? e, o = a.getEngine(), s = o.getCaps().maxTextureSize, c = (t ? t.width : this._engine.getRenderWidth(!0)) * this._options | 0, l = (t ? t.height : this._engine.getRenderHeight(!0)) * this._options | 0, u = this._options.width || c, d = this._options.height || l, f = this.renderTargetSamplingMode !== 7 && this.renderTargetSamplingMode !== 1 && this.renderTargetSamplingMode !== 2, p = null;
		if (!this._shareOutputWithPostProcess && !this._forcedOutputTexture) {
			if (this.adaptScaleToCurrentViewport) {
				let e = o.currentViewport;
				e && (u *= e.width, d *= e.height);
			}
			(f || this.alwaysForcePOT) && (this._options.width || (u = o.needPOTTextures ? r(u, s, this.scaleMode) : u), this._options.height || (d = o.needPOTTextures ? r(d, s, this.scaleMode) : d)), (this.width !== u || this.height !== d || !(p = this._getTarget())) && this.resize(u, d, i, f, n), this._textures.forEach((e) => {
				e.samples !== this.samples && this._engine.updateRenderTargetTextureSampleCount(e, this.samples);
			}), this._flushTextureCache(), this._renderId++;
		}
		return p ||= this._getTarget(), this.enablePixelPerfectMode ? (this._scaleRatio.copyFromFloats(c / u, l / d), this._engine.bindFramebuffer(p, 0, c, l, this.forceFullscreenViewport)) : (this._scaleRatio.copyFromFloats(1, 1), this._engine.bindFramebuffer(p, 0, void 0, void 0, this.forceFullscreenViewport)), this._engine._debugInsertMarker?.(`post process ${this.name} input`), this.onActivateObservable.notifyObservers(i), this.autoClear && (this.alphaMode === 0 || this.forceAutoClearInAlphaMode) && this._engine.clear(this.clearColor ? this.clearColor : a.clearColor, a._allowPostProcessClearColor, !0, !0), this._reusable && (this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2), p;
	}
	get isSupported() {
		return this._effectWrapper.drawWrapper.effect.isSupported;
	}
	get aspectRatio() {
		return this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.aspectRatio : this._forcedOutputTexture ? this._forcedOutputTexture.width / this._forcedOutputTexture.height : this.width / this.height;
	}
	isReady() {
		return this._effectWrapper.isReady();
	}
	apply() {
		if (!this._effectWrapper.isReady()) return null;
		this._engine.enableEffect(this._effectWrapper.drawWrapper), this._engine.setState(!1), this._engine.setDepthBuffer(!1), this._engine.setDepthWrite(!1), this.alphaConstants && this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a), this._engine.setAlphaMode(this.alphaMode);
		let e;
		return e = this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.inputTexture : this._forcedOutputTexture ? this._forcedOutputTexture : this.inputTexture, this.externalTextureSamplerBinding || this._effectWrapper.drawWrapper.effect._bindTexture("textureSampler", e?.texture), this._effectWrapper.drawWrapper.effect.setVector2("scale", this._scaleRatio), this.onApplyObservable.notifyObservers(this._effectWrapper.drawWrapper.effect), this._effectWrapper.bind(!0), this._effectWrapper.drawWrapper.effect;
	}
	_disposeTextures() {
		if (this._shareOutputWithPostProcess || this._forcedOutputTexture) {
			this._disposeTextureCache();
			return;
		}
		this._disposeTextureCache(), this._textures.dispose();
	}
	_disposeTextureCache() {
		for (let e = this._textureCache.length - 1; e >= 0; e--) this._textureCache[e].texture.dispose();
		this._textureCache.length = 0;
	}
	setPrePassRenderer(e) {
		return this._prePassEffectConfiguration ? (this._prePassEffectConfiguration = e.addEffectConfiguration(this._prePassEffectConfiguration), this._prePassEffectConfiguration.enabled = !0, !0) : !1;
	}
	dispose(e) {
		e ||= this._camera, this._useExistingThinPostProcess || this._effectWrapper.dispose(), this._disposeTextures(), this._scene && this._scene.removePostProcess(this);
		let t;
		if (this._parentContainer &&= (t = this._parentContainer.postProcesses.indexOf(this), t > -1 && this._parentContainer.postProcesses.splice(t, 1), null), t = this._engine.postProcesses.indexOf(this), t !== -1 && this._engine.postProcesses.splice(t, 1), this.onDisposeObservable.notifyObservers(), e) {
			if (e.detachPostProcess(this), t = e._postProcesses.indexOf(this), t === 0 && e._postProcesses.length > 0) {
				let e = this._camera._getFirstPostProcess();
				e && e.markTextureDirty();
			}
			this.onActivateObservable.clear(), this.onAfterRenderObservable.clear(), this.onApplyObservable.clear(), this.onBeforeRenderObservable.clear(), this.onSizeChangedObservable.clear(), this.onEffectCreatedObservable.clear();
		}
	}
	serialize() {
		let e = h.Serialize(this), t = this.getCamera() || this._scene && this._scene.activeCamera;
		return e.customType = "BABYLON." + this.getClassName(), e.cameraId = t ? t.id : null, e.reusable = this._reusable, e.textureType = this._textureType, e.fragmentUrl = this._fragmentUrl, e.parameters = this._parameters, e.samplers = this._samplers, e.uniformBuffers = this._uniformBuffers, e.options = this._options, e.defines = this._postProcessDefines, e.textureFormat = this._textureFormat, e.vertexUrl = this._vertexUrl, e.indexParameters = this._indexParameters, e;
	}
	clone() {
		let e = this.serialize();
		e._engine = this._engine, e.cameraId = null;
		let n = t.Parse(e, this._scene, "");
		return n ? (n.onActivateObservable = this.onActivateObservable.clone(), n.onSizeChangedObservable = this.onSizeChangedObservable.clone(), n.onApplyObservable = this.onApplyObservable.clone(), n.onBeforeRenderObservable = this.onBeforeRenderObservable.clone(), n.onAfterRenderObservable = this.onAfterRenderObservable.clone(), n._prePassEffectConfiguration = this._prePassEffectConfiguration, n) : null;
	}
	static Parse(e, t, n) {
		let r = d(e.customType);
		if (!r || !r._Parse) return null;
		let i = t ? t.getCameraById(e.cameraId) : null;
		return r._Parse(e, i, t, n);
	}
	static _Parse(e, n, r, i) {
		return h.Parse(() => new t(e.name, e.fragmentUrl, e.parameters, e.samplers, e.options, n, e.renderTargetSamplingMode, e._engine, e.reusable, e.defines, e.textureType, e.vertexUrl, e.indexParameters, !1, e.textureFormat), e, r, i);
	}
};
_([v()], O.prototype, "uniqueId", void 0), _([v()], O.prototype, "name", null), _([v()], O.prototype, "width", void 0), _([v()], O.prototype, "height", void 0), _([v()], O.prototype, "renderTargetSamplingMode", void 0), _([y()], O.prototype, "clearColor", void 0), _([v()], O.prototype, "autoClear", void 0), _([v()], O.prototype, "forceAutoClearInAlphaMode", void 0), _([v()], O.prototype, "alphaMode", null), _([v()], O.prototype, "alphaConstants", void 0), _([v()], O.prototype, "enablePixelPerfectMode", void 0), _([v()], O.prototype, "forceFullscreenViewport", void 0), _([v()], O.prototype, "scaleMode", void 0), _([v()], O.prototype, "alwaysForcePOT", void 0), _([v("samples")], O.prototype, "_samples", void 0), _([v()], O.prototype, "adaptScaleToCurrentViewport", void 0), u("BABYLON.PostProcess", O);
//#endregion
//#region node_modules/@babylonjs/core/PostProcesses/thinPassPostProcess.js
var k = class e extends g {
	_gatherImports(e, t) {
		e ? (this._webGPUReady = !0, t.push(Promise.all([import("./pass.fragment-D0CFF7RN.js")]))) : t.push(Promise.all([import("./pass.fragment-BoC4dZe-.js")])), super._gatherImports(e, t);
	}
	constructor(t, n = null, r) {
		let i = {
			name: t,
			engine: n || s.LastCreatedEngine,
			useShaderStore: !0,
			useAsPostProcess: !0,
			fragmentShader: e.FragmentUrl,
			...r
		};
		i.engine ||= s.LastCreatedEngine, super(i);
	}
};
k.FragmentUrl = "pass";
var A = class e extends g {
	_gatherImports(e, t) {
		e ? (this._webGPUReady = !0, t.push(Promise.all([import("./passCube.fragment-Bc4-s72g.js")]))) : t.push(Promise.all([import("./passCube.fragment-B3fbixNQ.js")])), super._gatherImports(e, t);
	}
	constructor(t, n = null, r) {
		super({
			...r,
			name: t,
			engine: n || s.LastCreatedEngine,
			useShaderStore: !0,
			useAsPostProcess: !0,
			fragmentShader: e.FragmentUrl,
			defines: "#define POSITIVEX"
		}), this._face = 0;
	}
	get face() {
		return this._face;
	}
	set face(e) {
		if (!(e < 0 || e > 5)) switch (this._face = e, this._face) {
			case 0:
				this.updateEffect("#define POSITIVEX");
				break;
			case 1:
				this.updateEffect("#define NEGATIVEX");
				break;
			case 2:
				this.updateEffect("#define POSITIVEY");
				break;
			case 3:
				this.updateEffect("#define NEGATIVEY");
				break;
			case 4:
				this.updateEffect("#define POSITIVEZ");
				break;
			case 5:
				this.updateEffect("#define NEGATIVEZ");
				break;
		}
	}
};
A.FragmentUrl = "passCube";
//#endregion
//#region node_modules/@babylonjs/core/PostProcesses/passPostProcess.js
var j = class e extends O {
	getClassName() {
		return "PassPostProcess";
	}
	constructor(e, t, n = null, r, i, a, o = 0, s = !1) {
		let c = {
			size: typeof t == "number" ? t : void 0,
			camera: n,
			samplingMode: r,
			engine: i,
			reusable: a,
			textureType: o,
			blockCompilation: s,
			...t
		};
		super(e, k.FragmentUrl, {
			effectWrapper: typeof t == "number" || !t.effectWrapper ? new k(e, i, c) : void 0,
			...c
		});
	}
	static _Parse(t, n, r, i) {
		return h.Parse(() => new e(t.name, t.options, n, t.renderTargetSamplingMode, t._engine, t.reusable), t, r, i);
	}
};
u("BABYLON.PassPostProcess", j);
var M = class e extends O {
	get face() {
		return this._effectWrapper.face;
	}
	set face(e) {
		this._effectWrapper.face = e;
	}
	getClassName() {
		return "PassCubePostProcess";
	}
	constructor(e, t, n = null, r, i, a, o = 0, s = !1) {
		let c = {
			size: typeof t == "number" ? t : void 0,
			camera: n,
			samplingMode: r,
			engine: i,
			reusable: a,
			textureType: o,
			blockCompilation: s,
			...t
		};
		super(e, k.FragmentUrl, {
			effectWrapper: typeof t == "number" || !t.effectWrapper ? new A(e, i, c) : void 0,
			...c
		});
	}
	static _Parse(t, n, r, i) {
		return h.Parse(() => new e(t.name, t.options, n, t.renderTargetSamplingMode, t._engine, t.reusable), t, r, i);
	}
};
_([v()], M.prototype, "face", null), i._RescalePostProcessFactory = (e) => new j("rescale", 1, null, 2, e, !1, 0);
//#endregion
//#region node_modules/@babylonjs/core/Misc/textureTools.js
function N(e, t, n, r, i, a, o, s) {
	let c = t.getEngine();
	return t.isReady = !1, i ??= t.samplingMode, r ??= t.type, a ??= t.format, o ??= t.width, s ??= t.height, r === -1 && (r = 0), new Promise((l) => {
		let u = new O("postprocess", e, null, null, 1, null, i, c, !1, void 0, r, void 0, null, !1, a);
		u.externalTextureSamplerBinding = !0;
		let d = c.createRenderTargetTexture({
			width: o,
			height: s
		}, {
			generateDepthBuffer: !1,
			generateMipMaps: !1,
			generateStencilBuffer: !1,
			samplingMode: i,
			type: r,
			format: a
		});
		u.onEffectCreatedObservable.addOnce((e) => {
			e.executeWhenCompiled(() => {
				u.onApply = (e) => {
					e._bindTexture("textureSampler", t), e.setFloat2("scale", 1, 1);
				}, n.postProcessManager.directRender([u], d, !0), c.restoreDefaultFramebuffer(), c._releaseTexture(t), u && u.dispose(), d._swapAndDie(t), t.type = r, t.format = 5, t.isReady = !0, l(t);
			});
		});
	});
}
var P, F;
function I(e) {
	P || (P = new Float32Array(1), F = new Int32Array(P.buffer)), P[0] = e;
	let t = F[0], n = t >> 16 & 32768, r = t >> 12 & 2047, i = t >> 23 & 255;
	return i < 103 ? n : i > 142 ? (n |= 31744, n |= (i == 255 ? 0 : 1) && t & 8388607, n) : i < 113 ? (r |= 2048, n |= (r >> 114 - i) + (r >> 113 - i & 1), n) : (n |= i - 112 << 10 | r >> 1, n += r & 1, n);
}
function L(e) {
	let t = (e & 32768) >> 15, n = (e & 31744) >> 10, r = e & 1023;
	return n === 0 ? (t ? -1 : 1) * 2 ** -14 * (r / 2 ** 10) : n == 31 ? r ? NaN : (t ? -1 : 1) * Infinity : (t ? -1 : 1) * 2 ** (n - 15) * (1 + r / 2 ** 10);
}
//#endregion
export { D as a, O as i, L as n, I as r, N as t };

//# sourceMappingURL=textureTools-C-mDeuST.js.map