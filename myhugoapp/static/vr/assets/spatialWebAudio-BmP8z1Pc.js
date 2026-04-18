import { t as e } from "./precisionDate-bmQoyfr9.js";
import { a as t, n, t as r } from "./math.vector-ByhvsffM.js";
import { c as i, l as a, n as o, t as s } from "./webAudioBaseSubGraph--YgU7EJs.js";
//#region node_modules/@babylonjs/core/AudioV2/abstractAudio/subProperties/abstractSpatialAudio.js
var c = {
	coneInnerAngle: 6.28318530718,
	coneOuterAngle: 6.28318530718,
	coneOuterVolume: 0,
	distanceModel: "linear",
	maxDistance: 1e4,
	minDistance: 1,
	orientation: t.Right(),
	panningModel: "equalpower",
	position: t.Zero(),
	rolloffFactor: 1,
	rotation: t.Zero(),
	rotationQuaternion: new n()
};
function l(e) {
	return e.spatialEnabled || e.spatialAutoUpdate !== void 0 || e.spatialConeInnerAngle !== void 0 || e.spatialConeOuterAngle !== void 0 || e.spatialConeOuterVolume !== void 0 || e.spatialDistanceModel !== void 0 || e.spatialMaxDistance !== void 0 || e.spatialMinDistance !== void 0 || e.spatialMinUpdateTime !== void 0 || e.spatialOrientation !== void 0 || e.spatialPanningModel !== void 0 || e.spatialPosition !== void 0 || e.spatialRolloffFactor !== void 0 || e.spatialRotation !== void 0 || e.spatialRotationQuaternion !== void 0;
}
var u = class {}, d = { pan: 0 };
function f(e) {
	return e.stereoEnabled || e.stereoPan !== void 0;
}
var p = class {}, m = class extends a {
	constructor(e) {
		super("Stereo", e);
	}
	setOptions(e) {
		this.pan = e.stereoPan ?? d.pan;
	}
};
function h(e) {
	return e.getSubNode("Stereo");
}
function g(e, t, n) {
	e.callOnSubNode("Stereo", (e) => {
		e[t] = n;
	});
}
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/abstractAudio/subProperties/stereoAudio.js
var _ = class extends p {
	constructor(e) {
		super(), this._pan = d.pan, this._subGraph = e;
	}
	get pan() {
		return this._pan;
	}
	set pan(e) {
		this._pan = e, g(this._subGraph, "pan", e);
	}
}, v = class {
	constructor(e) {
		this._attachmentType = 3, this._position = new t(), this._rotationQuaternion = new n(), this._sceneNode = null, this._useBoundingBox = !1, this.dispose = () => {
			this.detach();
		}, this._spatialAudioNode = e;
	}
	get isAttached() {
		return this._sceneNode !== null;
	}
	attach(e, t, n) {
		this._sceneNode !== e && (this.detach(), e && (this._attachmentType = n, this._sceneNode = e, this._sceneNode.onDisposeObservable.add(this.dispose), this._useBoundingBox = t));
	}
	detach() {
		this._sceneNode?.onDisposeObservable.removeCallback(this.dispose), this._sceneNode = null;
	}
	update() {
		this._attachmentType & 1 && (this._useBoundingBox && this._sceneNode.getBoundingInfo ? this._position.copyFrom(this._sceneNode.getBoundingInfo().boundingBox.centerWorld) : this._sceneNode?.getWorldMatrix().getTranslationToRef(this._position), this._spatialAudioNode.position.copyFrom(this._position), this._spatialAudioNode._updatePosition()), this._attachmentType & 2 && (this._sceneNode?.getWorldMatrix().decompose(void 0, this._rotationQuaternion), this._spatialAudioNode.rotationQuaternion.copyFrom(this._rotationQuaternion), this._spatialAudioNode._updateRotation());
	}
}, y = class extends a {
	constructor(e) {
		super("Spatial", e), this._attacherComponent = null;
	}
	get isAttached() {
		return this._attacherComponent !== null && this._attacherComponent.isAttached;
	}
	attach(e, t, n) {
		this.detach(), this._attacherComponent ||= new v(this), this._attacherComponent.attach(e, t, n);
	}
	detach() {
		this._attacherComponent?.detach();
	}
	dispose() {
		super.dispose(), this._attacherComponent?.dispose(), this._attacherComponent = null;
	}
	setOptions(e) {
		this.coneInnerAngle = e.spatialConeInnerAngle ?? c.coneInnerAngle, this.coneOuterAngle = e.spatialConeOuterAngle ?? c.coneOuterAngle, this.coneOuterVolume = e.spatialConeOuterVolume ?? c.coneOuterVolume, this.distanceModel = e.spatialDistanceModel ?? c.distanceModel, this.maxDistance = e.spatialMaxDistance ?? c.maxDistance, this.minDistance = e.spatialMinDistance ?? c.minDistance, this.orientation = e.spatialOrientation ?? c.orientation, this.panningModel = e.spatialPanningModel ?? c.panningModel, this.rolloffFactor = e.spatialRolloffFactor ?? c.rolloffFactor, e.spatialPosition && (this.position = e.spatialPosition.clone()), e.spatialRotationQuaternion ? this.rotationQuaternion = e.spatialRotationQuaternion.clone() : e.spatialRotation ? this.rotation = e.spatialRotation.clone() : this.rotationQuaternion = c.rotationQuaternion.clone(), this.update();
	}
	update() {
		this.isAttached ? this._attacherComponent?.update() : (this._updatePosition(), this._updateRotation());
	}
};
function b(e) {
	return e.getSubNode("Spatial");
}
function x(e, t, n) {
	e.callOnSubNode("Spatial", (e) => {
		e[t] = n;
	});
}
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/webAudio/subNodes/spatialWebAudioSubNode.js
var S = r.Zero(), C = new n();
function w(e) {
	return e * Math.PI / 180;
}
function T(e) {
	return e * 180 / Math.PI;
}
async function E(e) {
	return new D(e);
}
var D = class extends y {
	constructor(e) {
		super(e), this._lastOrientation = t.Zero(), this._lastPosition = t.Zero(), this._lastRotation = t.Zero(), this._lastRotationQuaternion = new n(), this.orientation = c.orientation.clone(), this.position = c.position.clone(), this.rotation = c.rotation.clone(), this.rotationQuaternion = c.rotationQuaternion.clone(), this.node = new PannerNode(e._audioContext), this._orientationX = new o(e, this.node.orientationX), this._orientationY = new o(e, this.node.orientationY), this._orientationZ = new o(e, this.node.orientationZ), this._positionX = new o(e, this.node.positionX), this._positionY = new o(e, this.node.positionY), this._positionZ = new o(e, this.node.positionZ);
	}
	dispose() {
		super.dispose(), this._orientationX.dispose(), this._orientationY.dispose(), this._orientationZ.dispose(), this._positionX.dispose(), this._positionY.dispose(), this._positionZ.dispose(), this.node.disconnect();
	}
	get coneInnerAngle() {
		return w(this.node.coneInnerAngle);
	}
	set coneInnerAngle(e) {
		this.node.coneInnerAngle = T(e);
	}
	get coneOuterAngle() {
		return w(this.node.coneOuterAngle);
	}
	set coneOuterAngle(e) {
		this.node.coneOuterAngle = T(e);
	}
	get coneOuterVolume() {
		return this.node.coneOuterGain;
	}
	set coneOuterVolume(e) {
		this.node.coneOuterGain = e;
	}
	get distanceModel() {
		return this.node.distanceModel;
	}
	set distanceModel(e) {
		this.node.distanceModel = e;
		let t = this.node.maxDistance;
		this.node.maxDistance = t + .001, this.node.maxDistance = t;
	}
	get minDistance() {
		return this.node.refDistance;
	}
	set minDistance(e) {
		this.node.refDistance = e;
	}
	get maxDistance() {
		return this.node.maxDistance;
	}
	set maxDistance(e) {
		this.node.maxDistance = e;
	}
	get panningModel() {
		return this.node.panningModel;
	}
	set panningModel(e) {
		this.node.panningModel = e;
	}
	get rolloffFactor() {
		return this.node.rolloffFactor;
	}
	set rolloffFactor(e) {
		this.node.rolloffFactor = e;
	}
	get _inNode() {
		return this.node;
	}
	get _outNode() {
		return this.node;
	}
	_updatePosition() {
		this._lastPosition.equalsWithEpsilon(this.position) || (this._positionX.targetValue = this.position.x, this._positionY.targetValue = this.position.y, this._positionZ.targetValue = this.position.z, this._lastPosition.copyFrom(this.position));
	}
	_updateRotation() {
		let e = !1;
		if (!this._lastRotationQuaternion.equalsWithEpsilon(this.rotationQuaternion)) C.copyFrom(this.rotationQuaternion), this._lastRotationQuaternion.copyFrom(this.rotationQuaternion), e = !0;
		else if (!this._lastRotation.equalsWithEpsilon(this.rotation)) n.FromEulerAnglesToRef(this.rotation.x, this.rotation.y, this.rotation.z, C), this._lastRotation.copyFrom(this.rotation), e = !0;
		else if (this._lastOrientation.equalsWithEpsilon(this.orientation)) return;
		e && (r.FromQuaternionToRef(C, S), t.TransformNormalToRef(t.RightReadOnly, S, this.orientation)), this._orientationX.targetValue = this.orientation.x, this._orientationY.targetValue = this.orientation.y, this._orientationZ.targetValue = this.orientation.z;
	}
	_connect(e) {
		return super._connect(e) ? (e._inNode && this.node.connect(e._inNode), !0) : !1;
	}
	_disconnect(e) {
		return super._disconnect(e) ? (e._inNode && this.node.disconnect(e._inNode), !0) : !1;
	}
	getClassName() {
		return "_SpatialWebAudioSubNode";
	}
};
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/webAudio/subNodes/stereoWebAudioSubNode.js
async function O(e) {
	return new k(e);
}
var k = class extends m {
	constructor(e) {
		super(e), this.node = new StereoPannerNode(e._audioContext), this._pan = new o(e, this.node.pan);
	}
	dispose() {
		super.dispose(), this._pan.dispose();
	}
	get pan() {
		return this._pan.targetValue;
	}
	set pan(e) {
		this._pan.targetValue = e;
	}
	get _inNode() {
		return this.node;
	}
	get _outNode() {
		return this.node;
	}
	getClassName() {
		return "_StereoWebAudioSubNode";
	}
	_connect(e) {
		return super._connect(e) ? (e._inNode && this.node.connect(e._inNode), !0) : !1;
	}
	_disconnect(e) {
		return super._disconnect(e) ? (e._inNode && this.node.disconnect(e._inNode), !0) : !1;
	}
}, A = class extends s {
	constructor() {
		super(...arguments), this._rootNode = null, this._inputNode = null;
	}
	async initAsync(e) {
		await super.initAsync(e);
		let t, n;
		(t = l(e)) && await this.createAndAddSubNodeAsync("Spatial"), (n = f(e)) && await this.createAndAddSubNodeAsync("Stereo"), await this._createSubNodePromisesResolvedAsync(), t && b(this)?.setOptions(e), n && h(this)?.setOptions(e);
	}
	get _inNode() {
		return this._inputNode;
	}
	_createSubNode(e) {
		try {
			return super._createSubNode(e);
		} catch {}
		switch (e) {
			case "Spatial": return E(this._owner.engine);
			case "Stereo": return O(this._owner.engine);
			default: throw Error(`Unknown subnode name: ${e}`);
		}
	}
	_onSubNodesChanged() {
		super._onSubNodesChanged();
		let e = b(this), t = h(this), n = i(this);
		if (e && e.getClassName() !== "_SpatialWebAudioSubNode" || t && t.getClassName() !== "_StereoWebAudioSubNode" || n && n.getClassName() !== "_VolumeWebAudioSubNode") throw Error("Not a WebAudio subnode.");
		e && (e.disconnectAll(), n && e.connect(n)), t && (t.disconnectAll(), n && t.connect(n)), e && t ? (this._rootNode = new GainNode(this._owner.engine._audioContext), this._rootNode.connect(e._outNode), this._rootNode.connect(t._outNode)) : (this._rootNode?.disconnect(), this._rootNode = null);
		let r = null, a;
		if (this._rootNode ? a = this._rootNode : (e ? r = e : t ? r = t : n && (r = n), a = r?.node ?? null), this._inputNode !== a) {
			if (this._inputNode && this._upstreamNodes) {
				let e = this._upstreamNodes.values();
				for (let t = e.next(); !t.done; t = e.next()) t.value._outNode?.disconnect(this._inputNode);
			}
			if (this._inputNode = a, a && this._upstreamNodes) {
				let e = this._upstreamNodes.values();
				for (let t = e.next(); !t.done; t = e.next()) t.value._outNode?.connect(a);
			}
		}
	}
}, j = class extends u {
	constructor(e) {
		super(), this._coneInnerAngle = c.coneInnerAngle, this._coneOuterAngle = c.coneOuterAngle, this._coneOuterVolume = c.coneOuterVolume, this._distanceModel = c.distanceModel, this._maxDistance = c.maxDistance, this._minDistance = c.minDistance, this._panningModel = c.panningModel, this._rolloffFactor = c.rolloffFactor;
		let t = b(e);
		t ? (this._orientation = t.orientation.clone(), this._position = t.position.clone(), this._rotation = t.rotation.clone(), this._rotationQuaternion = t.rotationQuaternion.clone()) : (this._orientation = c.orientation.clone(), this._position = c.position.clone(), this._rotation = c.rotation.clone(), this._rotationQuaternion = c.rotationQuaternion.clone(), e.createAndAddSubNodeAsync("Spatial")), this._subGraph = e;
	}
	dispose() {
		this._subGraph.removeSubNodeAsync(b(this._subGraph));
	}
	get coneInnerAngle() {
		return this._coneInnerAngle;
	}
	set coneInnerAngle(e) {
		this._coneInnerAngle = e, x(this._subGraph, "coneInnerAngle", e);
	}
	get coneOuterAngle() {
		return this._coneOuterAngle;
	}
	set coneOuterAngle(e) {
		this._coneOuterAngle = e, x(this._subGraph, "coneOuterAngle", e);
	}
	get coneOuterVolume() {
		return this._coneOuterVolume;
	}
	set coneOuterVolume(e) {
		this._coneOuterVolume = e, x(this._subGraph, "coneOuterVolume", e);
	}
	get distanceModel() {
		return this._distanceModel;
	}
	set distanceModel(e) {
		this._distanceModel = e, x(this._subGraph, "distanceModel", e);
	}
	get isAttached() {
		return this._subGraph.getSubNode("Spatial")?.isAttached ?? !1;
	}
	get maxDistance() {
		return this._maxDistance;
	}
	set maxDistance(e) {
		e <= 0 && (e = 1e-6), this._maxDistance = e, x(this._subGraph, "maxDistance", e);
	}
	get minDistance() {
		return this._minDistance;
	}
	set minDistance(e) {
		this._minDistance = e, x(this._subGraph, "minDistance", e);
	}
	get orientation() {
		return this._orientation;
	}
	set orientation(e) {
		this._orientation = e, this._updateRotation();
	}
	get panningModel() {
		return this._panningModel;
	}
	set panningModel(e) {
		this._panningModel = e, x(this._subGraph, "panningModel", e);
	}
	get position() {
		return this._position;
	}
	set position(e) {
		this._position = e, this._updatePosition();
	}
	get rolloffFactor() {
		return this._rolloffFactor;
	}
	set rolloffFactor(e) {
		this._rolloffFactor = e, x(this._subGraph, "rolloffFactor", e);
	}
	get rotation() {
		return this._rotation;
	}
	set rotation(e) {
		this._rotation = e, this._updateRotation();
	}
	get rotationQuaternion() {
		return this._rotationQuaternion;
	}
	set rotationQuaternion(e) {
		this._rotationQuaternion = e, this._updateRotation();
	}
	attach(e, t = !1, n = 3) {
		b(this._subGraph)?.attach(e, t, n);
	}
	detach() {
		b(this._subGraph)?.detach();
	}
	update() {
		let e = b(this._subGraph);
		e && (e.isAttached ? e.update() : (this._updatePosition(e), this._updateRotation(e)));
	}
	_updatePosition(e = null) {
		!e && (e = b(this._subGraph), !e) || e.position.equalsWithEpsilon(this._position) || (e.position.copyFrom(this._position), e._updatePosition());
	}
	_updateRotation(e = null) {
		!e && (e = b(this._subGraph), !e) || (e.rotationQuaternion.equalsWithEpsilon(this._rotationQuaternion) ? e.rotation.equalsWithEpsilon(this._rotation) ? e.orientation.equalsWithEpsilon(this._orientation) || (e.orientation.copyFrom(this._orientation), e._updateRotation(), this._rotation.copyFrom(e.rotation), this._rotationQuaternion.copyFrom(e.rotationQuaternion)) : (e.rotation.copyFrom(this._rotation), e._updateRotation(), this._orientation.copyFrom(e.orientation), this._rotationQuaternion.copyFrom(e.rotationQuaternion)) : (e.rotationQuaternion.copyFrom(this._rotationQuaternion), e._updateRotation(), this._orientation.copyFrom(e.orientation), this._rotation.copyFrom(e.rotation)));
	}
}, M = class {
	constructor(t, n, r) {
		if (this._autoUpdate = !0, this._lastUpdateTime = 0, this.minUpdateTime = 0, !n) return;
		this.minUpdateTime = r;
		let i = () => {
			if (!this._autoUpdate) return;
			let n = !1;
			if (0 < this.minUpdateTime) {
				let t = e.Now;
				this._lastUpdateTime && t - this._lastUpdateTime < this.minUpdateTime * 1e3 && (n = !0), this._lastUpdateTime = t;
			}
			n || t.update(), requestAnimationFrame(i);
		};
		requestAnimationFrame(i);
	}
	dispose() {
		this._autoUpdate = !1;
	}
}, N = class extends j {
	constructor(e, t, n) {
		super(e), this._updaterComponent = new M(this, t, n);
	}
	get minUpdateTime() {
		return this._updaterComponent.minUpdateTime;
	}
	set minUpdateTime(e) {
		this._updaterComponent.minUpdateTime = e;
	}
	dispose() {
		super.dispose(), this._updaterComponent.dispose(), this._updaterComponent = null;
	}
};
//#endregion
export { _ as a, v as i, M as n, l as o, A as r, c as s, N as t };

//# sourceMappingURL=spatialWebAudio-BmP8z1Pc.js.map