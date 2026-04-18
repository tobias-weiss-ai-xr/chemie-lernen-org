import { t as e } from "./observable-D7x0jL6J.js";
import { n as t } from "./performanceConfigurator-DMA6Ub5Z.js";
import { t as n } from "./devTools-LMnNz6iC.js";
import { n as r } from "./typeStore-Bwo5hkCf.js";
import { a as i, n as a } from "./math.scalar.functions-_PnMiXiP.js";
import { a as o, i as s, n as c, r as l, t as u } from "./math.vector-ByhvsffM.js";
import { n as d, t as f } from "./math.color-BS-ZqBtl.js";
import { r as p, t as m } from "./decorators.serialization-C6Hy3Nio.js";
import { _ as h, i as g } from "./decorators-Dkc3uIc_.js";
import { t as _ } from "./webRequest-DpJBqzQO.js";
//#region node_modules/@babylonjs/core/node.js
var v = class {
	constructor() {
		this._doNotSerialize = !1, this._isDisposed = !1, this._sceneRootNodesIndex = -1, this._isEnabled = !0, this._isParentEnabled = !0, this._isReady = !0, this._onEnabledStateChangedObservable = new e(), this._onClonedObservable = new e(), this._inheritVisibility = !1, this._isVisible = !0;
	}
}, y = class n {
	static AddNodeConstructor(e, t) {
		this._NodeConstructors[e] = t;
	}
	static Construct(e, t, n, r) {
		let i = this._NodeConstructors[e];
		return i ? i(t, n, r) : null;
	}
	set accessibilityTag(e) {
		this._accessibilityTag = e, this.onAccessibilityTagChangedObservable.notifyObservers(e);
	}
	get accessibilityTag() {
		return this._accessibilityTag;
	}
	get doNotSerialize() {
		return this._nodeDataStorage._doNotSerialize ? !0 : this._parentNode ? this._parentNode.doNotSerialize : !1;
	}
	set doNotSerialize(e) {
		this._nodeDataStorage._doNotSerialize = e;
	}
	isDisposed() {
		return this._nodeDataStorage._isDisposed;
	}
	set parent(e) {
		if (this._parentNode === e) return;
		let t = this._parentNode;
		if (this._parentNode && this._parentNode._children !== void 0 && this._parentNode._children !== null) {
			let t = this._parentNode._children.indexOf(this);
			t !== -1 && this._parentNode._children.splice(t, 1), !e && !this._nodeDataStorage._isDisposed && this._addToSceneRootNodes();
		}
		this._parentNode = e, this._isDirty = !0, this._parentNode && ((this._parentNode._children === void 0 || this._parentNode._children === null) && (this._parentNode._children = []), this._parentNode._children.push(this), t || this._removeFromSceneRootNodes()), this._syncParentEnabledState();
	}
	get parent() {
		return this._parentNode;
	}
	get inheritVisibility() {
		return this._nodeDataStorage._inheritVisibility;
	}
	set inheritVisibility(e) {
		this._nodeDataStorage._inheritVisibility = e;
	}
	get isVisible() {
		return this.inheritVisibility && this._parentNode && !this._parentNode.isVisible ? !1 : this._nodeDataStorage._isVisible;
	}
	set isVisible(e) {
		this._nodeDataStorage._isVisible = e;
	}
	_serializeAsParent(e) {
		e.parentId = this.uniqueId;
	}
	_addToSceneRootNodes() {
		this._nodeDataStorage._sceneRootNodesIndex === -1 && (this._nodeDataStorage._sceneRootNodesIndex = this._scene.rootNodes.length, this._scene.rootNodes.push(this));
	}
	_removeFromSceneRootNodes() {
		if (this._nodeDataStorage._sceneRootNodesIndex !== -1) {
			let e = this._scene.rootNodes, t = e.length - 1;
			e[this._nodeDataStorage._sceneRootNodesIndex] = e[t], e[this._nodeDataStorage._sceneRootNodesIndex]._nodeDataStorage._sceneRootNodesIndex = this._nodeDataStorage._sceneRootNodesIndex, this._scene.rootNodes.pop(), this._nodeDataStorage._sceneRootNodesIndex = -1;
		}
	}
	get animationPropertiesOverride() {
		return this._animationPropertiesOverride ? this._animationPropertiesOverride : this._scene.animationPropertiesOverride;
	}
	set animationPropertiesOverride(e) {
		this._animationPropertiesOverride = e;
	}
	getClassName() {
		return "Node";
	}
	set onDispose(e) {
		this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
	}
	get onEnabledStateChangedObservable() {
		return this._nodeDataStorage._onEnabledStateChangedObservable;
	}
	get onClonedObservable() {
		return this._nodeDataStorage._onClonedObservable;
	}
	constructor(n, r = null, i = !0) {
		this._isDirty = !1, this._nodeDataStorage = new v(), this.state = "", this.metadata = null, this.reservedDataStore = null, this._accessibilityTag = null, this.onAccessibilityTagChangedObservable = new e(), this._parentContainer = null, this.animations = [], this._ranges = {}, this.onReady = null, this._currentRenderId = -1, this._parentUpdateId = -1, this._childUpdateId = -1, this._waitingParentId = null, this._waitingParentInstanceIndex = null, this._waitingParsedUniqueId = null, this._cache = {}, this._parentNode = null, this._children = null, this._worldMatrix = u.Identity(), this._worldMatrixDeterminant = 0, this._worldMatrixDeterminantIsDirty = !0, this._animationPropertiesOverride = null, this._isNode = !0, this.onDisposeObservable = new e(), this._onDisposeObserver = null, this._behaviors = [], this.name = n, this.id = n, this._scene = r || t.LastCreatedScene, this.uniqueId = this._scene.getUniqueId(), this._initCache(), i && this._addToSceneRootNodes();
	}
	getScene() {
		return this._scene;
	}
	getEngine() {
		return this._scene.getEngine();
	}
	addBehavior(e, t = !1) {
		return this._behaviors.indexOf(e) === -1 ? (e.init(), this._scene.isLoading && !t ? this._scene.onDataLoadedObservable.addOnce(() => {
			this._behaviors.includes(e) && e.attach(this);
		}) : e.attach(this), this._behaviors.push(e), this) : this;
	}
	removeBehavior(e) {
		let t = this._behaviors.indexOf(e);
		return t === -1 ? this : (this._behaviors[t].detach(), this._behaviors.splice(t, 1), this);
	}
	get behaviors() {
		return this._behaviors;
	}
	getBehaviorByName(e) {
		for (let t of this._behaviors) if (t.name === e) return t;
		return null;
	}
	getWorldMatrix() {
		return this._currentRenderId !== this._scene.getRenderId() && this.computeWorldMatrix(), this._worldMatrix;
	}
	_getWorldMatrixDeterminant() {
		return this._worldMatrixDeterminantIsDirty && (this._worldMatrixDeterminantIsDirty = !1, this._worldMatrixDeterminant = this._worldMatrix.determinant()), this._worldMatrixDeterminant;
	}
	get worldMatrixFromCache() {
		return this._worldMatrix;
	}
	_initCache() {
		this._cache = {};
	}
	updateCache(e) {
		!e && this.isSynchronized() || this._updateCache();
	}
	_getActionManagerForTrigger(e, t = !0) {
		return this.parent ? this.parent._getActionManagerForTrigger(e, !1) : null;
	}
	_updateCache(e) {}
	_isSynchronized() {
		return !0;
	}
	_markSyncedWithParent() {
		this._parentNode && (this._parentUpdateId = this._parentNode._childUpdateId);
	}
	isSynchronizedWithParent() {
		return this._parentNode ? this._parentNode._isDirty || this._parentUpdateId !== this._parentNode._childUpdateId ? !1 : this._parentNode.isSynchronized() : !0;
	}
	isSynchronized() {
		return this._parentNode && !this.isSynchronizedWithParent() ? !1 : this._isSynchronized();
	}
	isReady(e = !1) {
		return this._nodeDataStorage._isReady;
	}
	markAsDirty(e) {
		return this._currentRenderId = Number.MAX_VALUE, this._isDirty = !0, this;
	}
	isEnabled(e = !0) {
		return e === !1 ? this._nodeDataStorage._isEnabled : this._nodeDataStorage._isEnabled ? this._nodeDataStorage._isParentEnabled : !1;
	}
	_syncParentEnabledState() {
		if (this._nodeDataStorage._isParentEnabled = this._parentNode ? this._parentNode.isEnabled() : !0, this._children) for (let e of this._children) e._syncParentEnabledState();
	}
	setEnabled(e) {
		this._nodeDataStorage._isEnabled !== e && (this._nodeDataStorage._isEnabled = e, this._syncParentEnabledState(), this._nodeDataStorage._onEnabledStateChangedObservable.notifyObservers(e));
	}
	isDescendantOf(e) {
		return this.parent ? this.parent === e ? !0 : this.parent.isDescendantOf(e) : !1;
	}
	_getDescendants(e, t = !1, n) {
		if (this._children) for (let r = 0; r < this._children.length; r++) {
			let i = this._children[r];
			(!n || n(i)) && e.push(i), t || i._getDescendants(e, !1, n);
		}
	}
	getDescendants(e, t) {
		let n = [];
		return this._getDescendants(n, e, t), n;
	}
	getChildMeshes(e, t) {
		let n = [];
		return this._getDescendants(n, e, (e) => (!t || t(e)) && e.cullingStrategy !== void 0), n;
	}
	getChildren(e, t = !0) {
		return this.getDescendants(t, e);
	}
	_setReady(e) {
		if (e !== this._nodeDataStorage._isReady) {
			if (!e) {
				this._nodeDataStorage._isReady = !1;
				return;
			}
			this.onReady && this.onReady(this), this._nodeDataStorage._isReady = !0;
		}
	}
	getAnimationByName(e) {
		for (let t = 0; t < this.animations.length; t++) {
			let n = this.animations[t];
			if (n.name === e) return n;
		}
		return null;
	}
	createAnimationRange(e, t, r) {
		if (!this._ranges[e]) {
			this._ranges[e] = n._AnimationRangeFactory(e, t, r);
			for (let n = 0, i = this.animations.length; n < i; n++) this.animations[n] && this.animations[n].createRange(e, t, r);
		}
	}
	deleteAnimationRange(e, t = !0) {
		for (let n = 0, r = this.animations.length; n < r; n++) this.animations[n] && this.animations[n].deleteRange(e, t);
		this._ranges[e] = null;
	}
	getAnimationRange(e) {
		return this._ranges[e] || null;
	}
	clone(e, t, r) {
		let i = m.Clone(() => new n(e, this.getScene()), this);
		if (t && (i.parent = t), !r) {
			let t = this.getDescendants(!0);
			for (let n = 0; n < t.length; n++) {
				let r = t[n];
				r.clone(e + "." + r.name, i);
			}
		}
		return i;
	}
	getAnimationRanges() {
		let e = [], t;
		for (t in this._ranges) e.push(this._ranges[t]);
		return e;
	}
	beginAnimation(e, t, n, r) {
		let i = this.getAnimationRange(e);
		return i ? this._scene.beginAnimation(this, i.from, i.to, t, n, r) : null;
	}
	serializeAnimationRanges() {
		let e = [];
		for (let t in this._ranges) {
			let n = this._ranges[t];
			if (!n) continue;
			let r = {};
			r.name = t, r.from = n.from, r.to = n.to, e.push(r);
		}
		return e;
	}
	computeWorldMatrix(e) {
		return this._worldMatrix ||= u.Identity(), this._worldMatrix;
	}
	dispose(e, t = !1) {
		if (this._nodeDataStorage._isDisposed = !0, !e) {
			let n = this.getDescendants(!0);
			for (let r of n) r.dispose(e, t);
		}
		this.parent ? this.parent = null : this._removeFromSceneRootNodes(), this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this.onEnabledStateChangedObservable.clear(), this.onClonedObservable.clear();
		for (let e of this._behaviors) e.detach();
		this._behaviors.length = 0, this.metadata = null;
	}
	static ParseAnimationRanges(e, t, n) {
		if (t.ranges) for (let n = 0; n < t.ranges.length; n++) {
			let r = t.ranges[n];
			e.createAnimationRange(r.name, r.from, r.to);
		}
	}
	getHierarchyBoundingVectors(e = !0, t = null) {
		this.getScene().incrementRenderId(), this.computeWorldMatrix(!0);
		let n, r, i = this;
		if (i.getBoundingInfo && i.subMeshes) {
			let e = i.getBoundingInfo();
			n = e.boundingBox.minimumWorld.clone(), r = e.boundingBox.maximumWorld.clone();
		} else n = new o(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), r = new o(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
		if (e) {
			let e = this.getDescendants(!1);
			for (let i of e) {
				let e = i;
				if (e.computeWorldMatrix(!0), t && !t(e) || !e.getBoundingInfo || e.getTotalVertices() === 0) continue;
				let a = e.getBoundingInfo().boundingBox, s = a.minimumWorld, c = a.maximumWorld;
				o.CheckExtends(s, n, r), o.CheckExtends(c, n, r);
			}
		}
		return {
			min: n,
			max: r
		};
	}
};
y._AnimationRangeFactory = (e, t, r) => {
	throw n("AnimationRange");
}, y._NodeConstructors = {}, h([g()], y.prototype, "name", void 0), h([g()], y.prototype, "id", void 0), h([g()], y.prototype, "uniqueId", void 0), h([g()], y.prototype, "state", void 0), h([g()], y.prototype, "metadata", void 0);
//#endregion
//#region node_modules/@babylonjs/core/Animations/animationRange.js
var b = class e {
	constructor(e, t, n) {
		this.name = e, this.from = t, this.to = n;
	}
	clone() {
		return new e(this.name, this.from, this.to);
	}
}, x = Object.freeze(new c(0, 0, 0, 0)), S = Object.freeze(o.Zero()), C = Object.freeze(s.Zero()), w = Object.freeze(p.Zero()), T = Object.freeze(f.Black()), E = Object.freeze(new d(0, 0, 0, 0)), D = {
	key: 0,
	repeatCount: 0,
	loopMode: 2
}, O = class e {
	static _PrepareAnimation(t, n, r, i, a, l, u, m) {
		let h;
		if (!isNaN(parseFloat(a)) && isFinite(a) ? h = e.ANIMATIONTYPE_FLOAT : a instanceof c ? h = e.ANIMATIONTYPE_QUATERNION : a instanceof o ? h = e.ANIMATIONTYPE_VECTOR3 : a instanceof s ? h = e.ANIMATIONTYPE_VECTOR2 : a instanceof f ? h = e.ANIMATIONTYPE_COLOR3 : a instanceof d ? h = e.ANIMATIONTYPE_COLOR4 : a instanceof p && (h = e.ANIMATIONTYPE_SIZE), h == null) return null;
		let g = new e(t, n, r, h, u), _ = [{
			frame: 0,
			value: a
		}, {
			frame: i,
			value: l
		}];
		return g.setKeys(_), m !== void 0 && g.setEasingFunction(m), g;
	}
	static CreateAnimation(t, n, r, i) {
		let a = new e(t + "Animation", t, r, n, e.ANIMATIONLOOPMODE_CONSTANT);
		return a.setEasingFunction(i), a;
	}
	static CreateAndStartAnimation(t, n, r, i, a, o, s, c, l, u, d) {
		let f = e._PrepareAnimation(t, r, i, a, o, s, c, l);
		return !f || (n.getScene && (d = n.getScene()), !d) ? null : d.beginDirectAnimation(n, [f], 0, a, f.loopMode !== e.ANIMATIONLOOPMODE_CONSTANT, 1, u);
	}
	static CreateAndStartHierarchyAnimation(t, n, r, i, a, o, s, c, l, u, d) {
		let f = e._PrepareAnimation(t, i, a, o, s, c, l, u);
		return f ? n.getScene().beginDirectHierarchyAnimation(n, r, [f], 0, o, f.loopMode === 1, 1, d) : null;
	}
	static CreateMergeAndStartAnimation(t, n, r, i, a, o, s, c, l, u) {
		let d = e._PrepareAnimation(t, r, i, a, o, s, c, l);
		return d ? (n.animations.push(d), n.getScene().beginAnimation(n, 0, a, d.loopMode === 1, 1, u)) : null;
	}
	static MakeAnimationAdditive(t, n, r, i = !1, a) {
		let o;
		o = typeof n == "object" ? n : {
			referenceFrame: n ?? 0,
			range: r,
			cloneOriginalAnimation: i,
			clonedAnimationName: a
		};
		let s = t;
		if (o.cloneOriginalAnimation && (s = t.clone(), s.name = o.clonedAnimationName || s.name), !s._keys.length) return s;
		let c = o.referenceFrame && o.referenceFrame >= 0 ? o.referenceFrame : 0, d = 0, f = s._keys[0], p = s._keys.length - 1, m = s._keys[p], h = {
			referenceValue: f.value,
			referencePosition: l.Vector3[0],
			referenceQuaternion: l.Quaternion[0],
			referenceScaling: l.Vector3[1],
			keyPosition: l.Vector3[2],
			keyQuaternion: l.Quaternion[1],
			keyScaling: l.Vector3[3]
		}, g = f.frame, _ = m.frame;
		if (o.range) {
			let e = s.getRange(o.range);
			e && (g = e.from, _ = e.to);
		} else g = o.fromFrame ?? g, _ = o.toFrame ?? _;
		if (g !== f.frame && (d = s.createKeyForFrame(g)), _ !== m.frame && (p = s.createKeyForFrame(_)), s._keys.length === 1) {
			let e = s._getKeyValue(s._keys[0]);
			h.referenceValue = e.clone ? e.clone() : e;
		} else if (c <= f.frame) {
			let e = s._getKeyValue(f.value);
			h.referenceValue = e.clone ? e.clone() : e;
		} else if (c >= m.frame) {
			let e = s._getKeyValue(m.value);
			h.referenceValue = e.clone ? e.clone() : e;
		} else {
			D.key = 0;
			let e = s._interpolate(c, D);
			h.referenceValue = e.clone ? e.clone() : e;
		}
		s.dataType === e.ANIMATIONTYPE_QUATERNION ? h.referenceValue.normalize().conjugateInPlace() : s.dataType === e.ANIMATIONTYPE_MATRIX && (h.referenceValue.decompose(h.referenceScaling, h.referenceQuaternion, h.referencePosition), h.referenceQuaternion.normalize().conjugateInPlace());
		let v = Number.MAX_VALUE, y = o.clipKeys ? [] : null;
		for (let t = d; t <= p; t++) {
			let n = s._keys[t];
			if ((y || o.cloneOriginalAnimation) && (n = {
				frame: n.frame,
				value: n.value.clone ? n.value.clone() : n.value,
				inTangent: n.inTangent,
				outTangent: n.outTangent,
				interpolation: n.interpolation,
				lockedTangent: n.lockedTangent,
				easingFunction: n.easingFunction
			}, y && (v === Number.MAX_VALUE && (v = n.frame), n.frame -= v, y.push(n))), !(t && s.dataType !== e.ANIMATIONTYPE_FLOAT && n.value === f.value)) switch (s.dataType) {
				case e.ANIMATIONTYPE_MATRIX:
					n.value.decompose(h.keyScaling, h.keyQuaternion, h.keyPosition), h.keyPosition.subtractInPlace(h.referencePosition), h.keyScaling.divideInPlace(h.referenceScaling), h.referenceQuaternion.multiplyToRef(h.keyQuaternion, h.keyQuaternion), u.ComposeToRef(h.keyScaling, h.keyQuaternion, h.keyPosition, n.value);
					break;
				case e.ANIMATIONTYPE_QUATERNION:
					h.referenceValue.multiplyToRef(n.value, n.value);
					break;
				case e.ANIMATIONTYPE_VECTOR2:
				case e.ANIMATIONTYPE_VECTOR3:
				case e.ANIMATIONTYPE_COLOR3:
				case e.ANIMATIONTYPE_COLOR4:
					n.value.subtractToRef(h.referenceValue, n.value);
					break;
				case e.ANIMATIONTYPE_SIZE:
					n.value.width -= h.referenceValue.width, n.value.height -= h.referenceValue.height;
					break;
				default: n.value -= h.referenceValue;
			}
		}
		return y && s.setKeys(y, !0), s;
	}
	static TransitionTo(e, t, n, r, i, a, o, s = null, c = !0, l) {
		if (o <= 0) return n[e] = t, s && s(), null;
		let u = o / 1e3 * i;
		return a.setKeys(l ?? [{
			frame: 0,
			value: n[e].clone ? n[e].clone() : n[e]
		}, {
			frame: u,
			value: t
		}]), n.animations ||= [], n.animations.push(a), r.beginAnimation(n, 0, u, !1, 1, s ?? void 0, void 0, c);
	}
	get runtimeAnimations() {
		return this._runtimeAnimations;
	}
	get hasRunningRuntimeAnimations() {
		for (let e of this._runtimeAnimations) if (!e.isStopped()) return !0;
		return !1;
	}
	constructor(t, n, r, i, a, o) {
		this.name = t, this.targetProperty = n, this.framePerSecond = r, this.dataType = i, this.loopMode = a, this.enableBlending = o, this._easingFunction = null, this._runtimeAnimations = [], this._events = [], this.blendingSpeed = .01, this._ranges = {}, this._coreAnimation = null, this.targetPropertyPath = n.split("."), this.dataType = i, this.loopMode = a === void 0 ? e.ANIMATIONLOOPMODE_CYCLE : a, this.uniqueId = e._UniqueIdGenerator++;
	}
	toString(e) {
		let t = "Name: " + this.name + ", property: " + this.targetProperty;
		if (t += ", datatype: " + [
			"Float",
			"Vector3",
			"Quaternion",
			"Matrix",
			"Color3",
			"Vector2"
		][this.dataType], t += ", nKeys: " + (this._keys ? this._keys.length : "none"), t += ", nRanges: " + (this._ranges ? Object.keys(this._ranges).length : "none"), e) {
			t += ", Ranges: {";
			let e = !0;
			for (let n in this._ranges) e || (t += ", "), e = !1, t += n;
			t += "}";
		}
		return t;
	}
	addEvent(e) {
		this._events.push(e), this._events.sort((e, t) => e.frame - t.frame);
	}
	removeEvents(e) {
		for (let t = 0; t < this._events.length; t++) this._events[t].frame === e && (this._events.splice(t, 1), t--);
	}
	getEvents() {
		return this._events;
	}
	createRange(e, t, n) {
		this._ranges[e] || (this._ranges[e] = new b(e, t, n));
	}
	deleteRange(e, t = !0) {
		let n = this._ranges[e];
		if (n) {
			if (t) {
				let e = n.from, t = n.to;
				for (let n = this._keys.length - 1; n >= 0; n--) this._keys[n].frame >= e && this._keys[n].frame <= t && this._keys.splice(n, 1);
			}
			this._ranges[e] = null;
		}
	}
	getRange(e) {
		return this._ranges[e];
	}
	getKeys() {
		return this._keys;
	}
	getHighestFrame() {
		let e = 0;
		for (let t = 0, n = this._keys.length; t < n; t++) e < this._keys[t].frame && (e = this._keys[t].frame);
		return e;
	}
	getEasingFunction() {
		return this._easingFunction;
	}
	setEasingFunction(e) {
		this._easingFunction = e;
	}
	floatInterpolateFunction(e, t, n) {
		return i(e, t, n);
	}
	floatInterpolateFunctionWithTangents(e, t, n, r, i) {
		return a(e, t, n, r, i);
	}
	quaternionInterpolateFunction(e, t, n) {
		return c.Slerp(e, t, n);
	}
	quaternionInterpolateFunctionWithTangents(e, t, n, r, i) {
		return c.Hermite(e, t, n, r, i).normalize();
	}
	vector3InterpolateFunction(e, t, n) {
		return o.Lerp(e, t, n);
	}
	vector3InterpolateFunctionWithTangents(e, t, n, r, i) {
		return o.Hermite(e, t, n, r, i);
	}
	vector2InterpolateFunction(e, t, n) {
		return s.Lerp(e, t, n);
	}
	vector2InterpolateFunctionWithTangents(e, t, n, r, i) {
		return s.Hermite(e, t, n, r, i);
	}
	sizeInterpolateFunction(e, t, n) {
		return p.Lerp(e, t, n);
	}
	color3InterpolateFunction(e, t, n) {
		return f.Lerp(e, t, n);
	}
	color3InterpolateFunctionWithTangents(e, t, n, r, i) {
		return f.Hermite(e, t, n, r, i);
	}
	color4InterpolateFunction(e, t, n) {
		return d.Lerp(e, t, n);
	}
	color4InterpolateFunctionWithTangents(e, t, n, r, i) {
		return d.Hermite(e, t, n, r, i);
	}
	_getKeyValue(e) {
		return typeof e == "function" ? e() : e;
	}
	evaluate(e) {
		return D.key = 0, this._interpolate(e, D);
	}
	_interpolate(t, n, r = !1) {
		if (n.loopMode === e.ANIMATIONLOOPMODE_CONSTANT && n.repeatCount > 0) return n.highLimitValue.clone ? n.highLimitValue.clone() : n.highLimitValue;
		let i = this._keys, a;
		if (this._coreAnimation) a = this._coreAnimation._key;
		else {
			let e = i.length;
			for (a = n.key; a >= 0 && t < i[a].frame;) --a;
			for (; a + 1 <= e - 1 && t >= i[a + 1].frame;) ++a;
			if (n.key = a, a < 0) return r ? void 0 : this._getKeyValue(i[0].value);
			if (a + 1 > e - 1) return r ? void 0 : this._getKeyValue(i[e - 1].value);
			this._key = a;
		}
		let o = i[a], s = i[a + 1];
		if (r && (t === o.frame || t === s.frame)) return;
		let c = this._getKeyValue(o.value), l = this._getKeyValue(s.value);
		if (o.interpolation === 1) return s.frame > t ? c : l;
		let u = o.outTangent !== void 0 && s.inTangent !== void 0, d = s.frame - o.frame, f = (t - o.frame) / d, p = o.easingFunction || this.getEasingFunction();
		switch (p && (f = p.ease(f)), this.dataType) {
			case e.ANIMATIONTYPE_FLOAT: {
				let t = u ? this.floatInterpolateFunctionWithTangents(c, o.outTangent * d, l, s.inTangent * d, f) : this.floatInterpolateFunction(c, l, f);
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return t;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return (n.offsetValue ?? 0) * n.repeatCount + t;
				}
				break;
			}
			case e.ANIMATIONTYPE_QUATERNION: {
				let t = u ? this.quaternionInterpolateFunctionWithTangents(c, o.outTangent.scale(d), l, s.inTangent.scale(d), f) : this.quaternionInterpolateFunction(c, l, f);
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return t;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return t.addInPlace((n.offsetValue || x).scale(n.repeatCount));
				}
				return t;
			}
			case e.ANIMATIONTYPE_VECTOR3: {
				let t = u ? this.vector3InterpolateFunctionWithTangents(c, o.outTangent.scale(d), l, s.inTangent.scale(d), f) : this.vector3InterpolateFunction(c, l, f);
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return t;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return t.add((n.offsetValue || S).scale(n.repeatCount));
				}
				break;
			}
			case e.ANIMATIONTYPE_VECTOR2: {
				let t = u ? this.vector2InterpolateFunctionWithTangents(c, o.outTangent.scale(d), l, s.inTangent.scale(d), f) : this.vector2InterpolateFunction(c, l, f);
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return t;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return t.add((n.offsetValue || C).scale(n.repeatCount));
				}
				break;
			}
			case e.ANIMATIONTYPE_SIZE:
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return this.sizeInterpolateFunction(c, l, f);
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return this.sizeInterpolateFunction(c, l, f).add((n.offsetValue || w).scale(n.repeatCount));
				}
				break;
			case e.ANIMATIONTYPE_COLOR3: {
				let t = u ? this.color3InterpolateFunctionWithTangents(c, o.outTangent.scale(d), l, s.inTangent.scale(d), f) : this.color3InterpolateFunction(c, l, f);
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return t;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return t.add((n.offsetValue || T).scale(n.repeatCount));
				}
				break;
			}
			case e.ANIMATIONTYPE_COLOR4: {
				let t = u ? this.color4InterpolateFunctionWithTangents(c, o.outTangent.scale(d), l, s.inTangent.scale(d), f) : this.color4InterpolateFunction(c, l, f);
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return t;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return t.add((n.offsetValue || E).scale(n.repeatCount));
				}
				break;
			}
			case e.ANIMATIONTYPE_MATRIX:
				switch (n.loopMode) {
					case e.ANIMATIONLOOPMODE_CYCLE:
					case e.ANIMATIONLOOPMODE_CONSTANT:
					case e.ANIMATIONLOOPMODE_YOYO: return e.AllowMatricesInterpolation ? this.matrixInterpolateFunction(c, l, f, n.workValue) : c;
					case e.ANIMATIONLOOPMODE_RELATIVE:
					case e.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT: return c;
				}
				break;
		}
		return 0;
	}
	matrixInterpolateFunction(t, n, r, i) {
		return e.AllowMatrixDecomposeForInterpolation ? i ? (u.DecomposeLerpToRef(t, n, r, i), i) : u.DecomposeLerp(t, n, r) : i ? (u.LerpToRef(t, n, r, i), i) : u.Lerp(t, n, r);
	}
	clone(t = !1) {
		let n = new e(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);
		if (n.enableBlending = this.enableBlending, n.blendingSpeed = this.blendingSpeed, this._keys && n.setKeys(this._keys, !1, t), this._ranges) {
			n._ranges = {};
			for (let e in this._ranges) {
				let t = this._ranges[e];
				t && (n._ranges[e] = t.clone());
			}
		}
		return n;
	}
	setKeys(e, t = !1, n = !1) {
		if (t) this._keys = e;
		else if (this._keys = e.slice(0), n) for (let e = 0; e < this._keys.length; e++) {
			let t = this._keys[e];
			this._keys[e] = {
				frame: t.frame,
				value: t.value.clone ? t.value.clone() : t.value,
				inTangent: t.inTangent && t.inTangent.clone ? t.inTangent.clone() : t.inTangent,
				outTangent: t.outTangent && t.outTangent.clone ? t.outTangent.clone() : t.outTangent,
				interpolation: t.interpolation,
				lockedTangent: t.lockedTangent,
				easingFunction: t.easingFunction
			};
		}
	}
	createKeyForFrame(e) {
		D.key = 0;
		let t = this._interpolate(e, D, !0);
		if (!t) return this._keys[D.key].frame === e ? D.key : D.key + 1;
		let n = {
			frame: e,
			value: t.clone ? t.clone() : t
		};
		return this._keys.splice(D.key + 1, 0, n), D.key + 1;
	}
	serialize() {
		let t = {};
		t.name = this.name, t.property = this.targetProperty, t.framePerSecond = this.framePerSecond, t.dataType = this.dataType, t.loopBehavior = this.loopMode, t.enableBlending = this.enableBlending, t.blendingSpeed = this.blendingSpeed;
		let n = this.dataType;
		t.keys = [];
		let r = this.getKeys();
		for (let i = 0; i < r.length; i++) {
			let a = r[i], o = {};
			switch (o.frame = a.frame, n) {
				case e.ANIMATIONTYPE_FLOAT:
					o.values = [a.value], a.inTangent !== void 0 && o.values.push(a.inTangent), a.outTangent !== void 0 && (a.inTangent === void 0 && o.values.push(void 0), o.values.push(a.outTangent)), a.interpolation !== void 0 && (a.inTangent === void 0 && o.values.push(void 0), a.outTangent === void 0 && o.values.push(void 0), o.values.push(a.interpolation));
					break;
				case e.ANIMATIONTYPE_QUATERNION:
				case e.ANIMATIONTYPE_MATRIX:
				case e.ANIMATIONTYPE_VECTOR3:
				case e.ANIMATIONTYPE_COLOR3:
				case e.ANIMATIONTYPE_COLOR4:
					o.values = a.value.asArray(), a.inTangent != null && o.values.push(a.inTangent.asArray()), a.outTangent != null && (a.inTangent === void 0 && o.values.push(void 0), o.values.push(a.outTangent.asArray())), a.interpolation !== void 0 && (a.inTangent === void 0 && o.values.push(void 0), a.outTangent === void 0 && o.values.push(void 0), o.values.push(a.interpolation));
					break;
			}
			t.keys.push(o);
		}
		t.ranges = [];
		for (let e in this._ranges) {
			let n = this._ranges[e];
			if (!n) continue;
			let r = {};
			r.name = e, r.from = n.from, r.to = n.to, t.ranges.push(r);
		}
		return t;
	}
	static _UniversalLerp(e, t, n) {
		let r = e.constructor;
		return r.Lerp ? r.Lerp(e, t, n) : r.Slerp ? r.Slerp(e, t, n) : e.toFixed ? e * (1 - n) + n * t : t;
	}
	static Parse(t) {
		let n = new e(t.name, t.property, t.framePerSecond, t.dataType, t.loopBehavior), r = t.dataType, i = [], a, s;
		for (t.enableBlending && (n.enableBlending = t.enableBlending), t.blendingSpeed && (n.blendingSpeed = t.blendingSpeed), s = 0; s < t.keys.length; s++) {
			let n = t.keys[s], l, p, m;
			switch (r) {
				case e.ANIMATIONTYPE_FLOAT:
					a = n.values[0], n.values.length >= 2 && (l = n.values[1]), n.values.length >= 3 && (p = n.values[2]), n.values.length >= 4 && (m = n.values[3]);
					break;
				case e.ANIMATIONTYPE_QUATERNION:
					if (a = c.FromArray(n.values), n.values.length >= 8) {
						let e = c.FromArray(n.values.slice(4, 8));
						e.equals(c.Zero()) || (l = e);
					}
					if (n.values.length >= 12) {
						let e = c.FromArray(n.values.slice(8, 12));
						e.equals(c.Zero()) || (p = e);
					}
					n.values.length >= 13 && (m = n.values[12]);
					break;
				case e.ANIMATIONTYPE_MATRIX:
					a = u.FromArray(n.values), n.values.length >= 17 && (m = n.values[16]);
					break;
				case e.ANIMATIONTYPE_COLOR3:
					a = f.FromArray(n.values), n.values[3] && (l = f.FromArray(n.values[3])), n.values[4] && (p = f.FromArray(n.values[4])), n.values[5] && (m = n.values[5]);
					break;
				case e.ANIMATIONTYPE_COLOR4:
					a = d.FromArray(n.values), n.values[4] && (l = d.FromArray(n.values[4])), n.values[5] && (p = d.FromArray(n.values[5])), n.values[6] && (m = d.FromArray(n.values[6]));
					break;
				case e.ANIMATIONTYPE_VECTOR3:
				default:
					a = o.FromArray(n.values), n.values[3] && (l = o.FromArray(n.values[3])), n.values[4] && (p = o.FromArray(n.values[4])), n.values[5] && (m = n.values[5]);
					break;
			}
			let h = {};
			h.frame = n.frame, h.value = a, l != null && (h.inTangent = l), p != null && (h.outTangent = p), m != null && (h.interpolation = m), i.push(h);
		}
		if (n.setKeys(i), t.ranges) for (s = 0; s < t.ranges.length; s++) a = t.ranges[s], n.createRange(a.name, a.from, a.to);
		return n;
	}
	static AppendSerializedAnimations(e, t) {
		m.AppendSerializedAnimations(e, t);
	}
	static async ParseFromFileAsync(e, t) {
		return await new Promise((n, r) => {
			let i = new _();
			i.addEventListener("readystatechange", () => {
				if (i.readyState == 4) if (i.status == 200) {
					let t = JSON.parse(i.responseText);
					if (t.animations && (t = t.animations), t.length) {
						let e = [];
						for (let n of t) e.push(this.Parse(n));
						n(e);
					} else {
						let r = this.Parse(t);
						e && (r.name = e), n(r);
					}
				} else r("Unable to load the animation");
			}), i.open("GET", t), i.send();
		});
	}
	static async ParseFromSnippetAsync(e) {
		return await new Promise((t, n) => {
			let r = new _();
			r.addEventListener("readystatechange", () => {
				if (r.readyState == 4) if (r.status == 200) {
					let n = JSON.parse(JSON.parse(r.responseText).jsonPayload);
					if (n.animations) {
						let r = JSON.parse(n.animations), i = [];
						for (let t of r.animations) {
							let n = this.Parse(t);
							n.snippetId = e, i.push(n);
						}
						t(i);
					} else {
						let r = JSON.parse(n.animation), i = this.Parse(r);
						i.snippetId = e, t(i);
					}
				} else n("Unable to load the snippet " + e);
			}), r.open("GET", this.SnippetUrl + "/" + e.replace(/#/g, "/")), r.send();
		});
	}
};
O._UniqueIdGenerator = 0, O.AllowMatricesInterpolation = !1, O.AllowMatrixDecomposeForInterpolation = !0, O.SnippetUrl = "https://snippet.babylonjs.com", O.ANIMATIONTYPE_FLOAT = 0, O.ANIMATIONTYPE_VECTOR3 = 1, O.ANIMATIONTYPE_QUATERNION = 2, O.ANIMATIONTYPE_MATRIX = 3, O.ANIMATIONTYPE_COLOR3 = 4, O.ANIMATIONTYPE_COLOR4 = 7, O.ANIMATIONTYPE_VECTOR2 = 5, O.ANIMATIONTYPE_SIZE = 6, O.ANIMATIONLOOPMODE_RELATIVE = 0, O.ANIMATIONLOOPMODE_CYCLE = 1, O.ANIMATIONLOOPMODE_CONSTANT = 2, O.ANIMATIONLOOPMODE_YOYO = 4, O.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT = 5, O.CreateFromSnippetAsync = O.ParseFromSnippetAsync, r("BABYLON.Animation", O), y._AnimationRangeFactory = (e, t, n) => new b(e, t, n);
//#endregion
export { w as a, b as c, x as i, y as l, T as n, C as o, E as r, S as s, O as t };

//# sourceMappingURL=animation-BZ-Lo6NO.js.map