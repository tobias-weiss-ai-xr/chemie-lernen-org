import { t as e } from "./observable-D7x0jL6J.js";
import { t } from "./logger-B7TbbsLc.js";
import { t as n } from "./webRequest-DpJBqzQO.js";
//#region node_modules/@babylonjs/core/AudioV2/abstractAudio/abstractAudioNode.js
var r;
(function(e) {
	e[e.HAS_INPUTS = 1] = "HAS_INPUTS", e[e.HAS_OUTPUTS = 2] = "HAS_OUTPUTS", e[e.HAS_INPUTS_AND_OUTPUTS = 3] = "HAS_INPUTS_AND_OUTPUTS";
})(r ||= {});
var i = class {
	constructor(t, n) {
		this.onDisposeObservable = new e(), this.engine = t, n & 1 && (this._upstreamNodes = /* @__PURE__ */ new Set()), n & 2 && (this._downstreamNodes = /* @__PURE__ */ new Set());
	}
	dispose() {
		if (this._downstreamNodes) {
			for (let e of Array.from(this._downstreamNodes)) if (!this._disconnect(e)) throw Error("Disconnect failed");
			this._downstreamNodes.clear();
		}
		if (this._upstreamNodes) {
			for (let e of Array.from(this._upstreamNodes)) if (!e._disconnect(this)) throw Error("Disconnect failed");
			this._upstreamNodes.clear();
		}
		this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear();
	}
	_connect(e) {
		return !this._downstreamNodes || this._downstreamNodes.has(e) || !e._onConnect(this) ? !1 : (this._downstreamNodes.add(e), !0);
	}
	_disconnect(e) {
		return !this._downstreamNodes || !this._downstreamNodes.delete(e) ? !1 : e._onDisconnect(this);
	}
	_onConnect(e) {
		return !this._upstreamNodes || this._upstreamNodes.has(e) ? !1 : (this._upstreamNodes.add(e), !0);
	}
	_onDisconnect(e) {
		return this._upstreamNodes?.delete(e) ?? !1;
	}
}, a = class extends i {
	constructor(t, n, r) {
		super(n, r), this.onNameChangedObservable = new e(), this._name = t;
	}
	get name() {
		return this._name;
	}
	set name(e) {
		if (this._name === e) return;
		let t = this._name;
		this._name = e, this.onNameChangedObservable.notifyObservers({
			newName: e,
			oldName: t,
			node: this
		});
	}
	dispose() {
		super.dispose(), this.onNameChangedObservable.clear();
	}
}, o = class extends a {
	constructor(e, t) {
		super(e, t, 3);
	}
	connect(e) {
		if (!this._connect(e)) throw Error("Connect failed");
	}
	disconnect(e) {
		if (!this._disconnect(e)) throw Error("Disconnect failed");
	}
	disconnectAll() {
		if (!this._downstreamNodes) throw Error("Disconnect failed");
		let e = this._downstreamNodes.values();
		for (let t = e.next(); !t.done; t = e.next()) if (!this._disconnect(t.value)) throw Error("Disconnect failed");
	}
}, s = { volume: 1 }, c = class extends o {
	constructor(e) {
		super("Volume", e);
	}
	setOptions(e) {
		this.setVolume(e.volume ?? s.volume, { shape: "none" });
	}
};
function l(e) {
	return e.getSubNode("Volume");
}
function u(e, t) {
	return l(e)?.[t] ?? s[t];
}
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/abstractAudio/subProperties/abstractAudioAnalyzer.js
var d = {
	fftSize: 2048,
	minDecibels: -100,
	maxDecibels: -30,
	smoothing: .8
};
function f(e) {
	return e.analyzerEnabled || e.analyzerFFTSize !== void 0 || e.analyzerMinDecibels !== void 0 || e.analyzerMaxDecibels !== void 0 || e.analyzerSmoothing !== void 0;
}
var p = class {
	get frequencyBinCount() {
		return this.fftSize / 2;
	}
}, m = class extends o {
	constructor(e) {
		super("Analyzer", e);
	}
	setOptions(e) {
		this.fftSize = e.analyzerFFTSize ?? d.fftSize, this.minDecibels = e.analyzerMinDecibels ?? d.minDecibels, this.maxDecibels = e.analyzerMaxDecibels ?? d.maxDecibels, this.smoothing = e.analyzerSmoothing ?? d.smoothing;
	}
};
function h(e) {
	return e.getSubNode("Analyzer");
}
function g(e, t, n) {
	e.callOnSubNode("Analyzer", (e) => {
		e[t] = n;
	});
}
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/abstractAudio/subProperties/audioAnalyzer.js
var _ = null, v = null;
function y() {
	return _ ||= new Uint8Array(), _;
}
function b() {
	return v ||= new Float32Array(), v;
}
var x = class extends p {
	constructor(e) {
		super(), this._fftSize = d.fftSize, this._maxDecibels = d.maxDecibels, this._minDecibels = d.minDecibels, this._smoothing = d.smoothing, this._subGraph = e;
	}
	get fftSize() {
		return this._fftSize;
	}
	set fftSize(e) {
		this._fftSize = e, g(this._subGraph, "fftSize", e);
	}
	get isEnabled() {
		return h(this._subGraph) !== null;
	}
	get minDecibels() {
		return this._minDecibels;
	}
	set minDecibels(e) {
		this._minDecibels = e, g(this._subGraph, "minDecibels", e);
	}
	get maxDecibels() {
		return this._maxDecibels;
	}
	set maxDecibels(e) {
		this._maxDecibels = e, g(this._subGraph, "maxDecibels", e);
	}
	get smoothing() {
		return this._smoothing;
	}
	set smoothing(e) {
		this._smoothing = e, g(this._subGraph, "smoothing", e);
	}
	dispose() {
		let e = h(this._subGraph);
		e && (this._subGraph.removeSubNodeAsync(e), e.dispose());
	}
	async enableAsync() {
		h(this._subGraph) || await this._subGraph.createAndAddSubNodeAsync("Analyzer");
	}
	getByteFrequencyData() {
		let e = h(this._subGraph);
		return e ? e.getByteFrequencyData() : (t.Warn("AudioAnalyzer not enabled"), this.enableAsync(), y());
	}
	getFloatFrequencyData() {
		let e = h(this._subGraph);
		return e ? e.getFloatFrequencyData() : (t.Warn("AudioAnalyzer not enabled"), this.enableAsync(), b());
	}
}, S = class extends a {
	constructor(e, t, n) {
		super(e, t, n), this._analyzer = null;
	}
	get analyzer() {
		return this._analyzer ??= new x(this._subGraph);
	}
	get volume() {
		return u(this._subGraph, "volume");
	}
	set volume(e) {
		let t = l(this._subGraph);
		if (!t) throw Error("No volume subnode");
		t.volume = e;
	}
	dispose() {
		super.dispose(), this._analyzer?.dispose(), this._analyzer = null, this._subGraph.dispose();
	}
	setVolume(e, t = null) {
		let n = l(this._subGraph);
		if (!n) throw Error("No volume subnode");
		n.setVolume(e, t);
	}
}, C = /* @__PURE__ */ RegExp("\\.(\\w{3,4})($|\\?)"), w = 100, T = new Float32Array([0, 0]), E = null, D = null, O = null;
function k() {
	if (!D) {
		D = new Float32Array(w);
		let e = 1 / (w - 1), t = e;
		for (let n = 1; n < w; n++) D[n] = Math.exp(-11.512925464970227 * (1 - t)), t += e;
	}
	return D;
}
function A() {
	if (!O) {
		O = new Float32Array(w);
		let e = 1 / w, t = e;
		for (let n = 0; n < w; n++) O[n] = 1 + Math.log10(t) / Math.log10(w), t += e;
	}
	return O;
}
function j(e, t, n) {
	E ||= new Float32Array(w);
	let r;
	if (e === "linear") return T[0] = t, T[1] = n, T;
	if (e === "exponential") r = k();
	else if (e === "logarithmic") r = A();
	else throw Error(`Unknown ramp shape: ${e}`);
	let i = Math.sign(n - t), a = Math.abs(n - t);
	if (i === 1) for (let e = 0; e < r.length; e++) E[e] = t + a * r[e];
	else {
		let e = w - 1;
		for (let n = 0; n < r.length; n++, e--) E[n] = t - a * (1 - r[e]);
	}
	return E;
}
function M(e) {
	return e.replace(/#/gm, "%23");
}
function N(e) {
	let { url: r, headers: i } = n._CollectCustomizations(e);
	return Object.keys(i).length > 0 && t.Warn("WebAudioStreamingSound: Custom request headers cannot be applied to a streaming <audio> element and will be ignored. To use custom headers with audio, switch to a static (non-streaming) sound which fetches the file up-front."), r;
}
async function P(e) {
	let t = await n.FetchAsync(e);
	if (!t.ok) throw Error(`HTTP ${t.status} loading '${e}': ${t.statusText}`);
	return {
		data: await t.arrayBuffer(),
		contentType: t.headers.get("Content-Type") ?? ""
	};
}
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/webAudio/components/webAudioParameterComponent.js
var F = 1e-6, I = !0, L = class {
	constructor(e, t) {
		this._rampEndTime = 0, this._engine = e, this._param = t, this._targetValue = t.value;
	}
	get isRamping() {
		return this._engine.currentTime < this._rampEndTime;
	}
	get targetValue() {
		return this._targetValue;
	}
	set targetValue(e) {
		this.setTargetValue(e);
	}
	get value() {
		return this._param.value;
	}
	dispose() {
		this._param = null, this._engine = null;
	}
	setTargetValue(e, n = null) {
		if (!Number.isFinite(e)) {
			t.Warn(`Attempted to set audio parameter to non-finite value: ${e}`);
			return;
		}
		this._param.cancelScheduledValues(0);
		let r = typeof n?.shape == "string" ? n.shape : "linear", i = this._engine.currentTime;
		if (r === "none") {
			this._param.value = this._targetValue = e, this._rampEndTime = i;
			return;
		}
		let a = typeof n?.duration == "number" ? Math.max(n.duration, this._engine.parameterRampDuration) : this._engine.parameterRampDuration;
		if (this._targetValue = e, (a = Math.max(this._engine.parameterRampDuration, a)) < F) {
			this._param.setValueAtTime(e, i);
			return;
		}
		try {
			this._param.setValueCurveAtTime(j(r, Number.isFinite(this._param.value) ? this._param.value : 0, e), i, a), this._rampEndTime = i + a;
		} catch (e) {
			I &&= (t.Warn(`Audio parameter ramping failed: ${e.message}`), !1);
		}
	}
}, R = class {
	constructor() {
		this._createSubNodePromises = {}, this._isDisposed = !1, this._subNodes = {}, this._onSubNodeDisposed = (e) => {
			let t = e;
			delete this._subNodes[t.name], this._onSubNodesChanged();
		};
	}
	callOnSubNode(e, t) {
		let n = this.getSubNode(e);
		if (n) {
			t(n);
			return;
		}
		this._createSubNodePromisesResolvedAsync().then(() => {
			let n = this.getSubNode(e);
			if (n) {
				t(n);
				return;
			}
			this.createAndAddSubNodeAsync(e).then((e) => {
				t(e);
			});
		});
	}
	createAndAddSubNodeAsync(e) {
		var t;
		return (t = this._createSubNodePromises)[e] || (t[e] = this._createSubNode(e).then((e) => (this._addSubNode(e), e))), this._createSubNodePromises[e];
	}
	dispose() {
		this._isDisposed = !0;
		let e = Object.values(this._subNodes);
		for (let t of e) t.dispose();
		this._subNodes = {}, this._createSubNodePromises = {};
	}
	getSubNode(e) {
		return this._subNodes[e] ?? null;
	}
	async removeSubNodeAsync(e) {
		if (!e) return;
		await this._createSubNodePromisesResolvedAsync();
		let t = e.name;
		this._subNodes[t] && delete this._subNodes[t], delete this._createSubNodePromises[t], this._onSubNodesChanged();
	}
	async _createSubNodePromisesResolvedAsync() {
		return await Promise.all(Object.values(this._createSubNodePromises));
	}
	_addSubNode(e) {
		if (this._isDisposed) {
			e.dispose();
			return;
		}
		this._subNodes[e.name] = e, e.onDisposeObservable.addOnce(this._onSubNodeDisposed), this._onSubNodesChanged();
	}
};
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/webAudio/subNodes/volumeWebAudioSubNode.js
async function z(e) {
	return new B(e);
}
var B = class extends c {
	constructor(e) {
		super(e), this._volume = new L(e, (this.node = new GainNode(e._audioContext)).gain);
	}
	dispose() {
		super.dispose(), this._volume.dispose();
	}
	get volume() {
		return this._volume.value;
	}
	set volume(e) {
		this.setVolume(e);
	}
	get _inNode() {
		return this.node;
	}
	get _outNode() {
		return this.node;
	}
	setVolume(e, t = null) {
		this._volume.setTargetValue(e, t);
	}
	_connect(e) {
		return super._connect(e) ? (e._inNode && this.node.connect(e._inNode), !0) : !1;
	}
	_disconnect(e) {
		return super._disconnect(e) ? (e._inNode && this.node.disconnect(e._inNode), !0) : !1;
	}
	getClassName() {
		return "_VolumeWebAudioSubNode";
	}
};
//#endregion
//#region node_modules/@babylonjs/core/AudioV2/webAudio/subNodes/webAudioAnalyzerSubNode.js
async function V(e) {
	return new H(e);
}
var H = class extends m {
	constructor(e) {
		super(e), this._byteFrequencyData = null, this._floatFrequencyData = null, this._analyzerNode = new AnalyserNode(e._audioContext);
	}
	get fftSize() {
		return this._analyzerNode.fftSize;
	}
	set fftSize(e) {
		e !== this._analyzerNode.fftSize && (this._analyzerNode.fftSize = e, this._clearArrays());
	}
	get _inNode() {
		return this._analyzerNode;
	}
	get minDecibels() {
		return this._analyzerNode.minDecibels;
	}
	set minDecibels(e) {
		this._analyzerNode.minDecibels = e;
	}
	get maxDecibels() {
		return this._analyzerNode.maxDecibels;
	}
	set maxDecibels(e) {
		this._analyzerNode.maxDecibels = e;
	}
	get smoothing() {
		return this._analyzerNode.smoothingTimeConstant;
	}
	set smoothing(e) {
		this._analyzerNode.smoothingTimeConstant = e;
	}
	dispose() {
		super.dispose(), this._clearArrays(), this._byteFrequencyData = null, this._floatFrequencyData = null, this._analyzerNode.disconnect();
	}
	getClassName() {
		return "_WebAudioAnalyzerSubNode";
	}
	getByteFrequencyData() {
		return (!this._byteFrequencyData || this._byteFrequencyData.length === 0) && (this._byteFrequencyData = new Uint8Array(this._analyzerNode.frequencyBinCount)), this._analyzerNode.getByteFrequencyData(this._byteFrequencyData), this._byteFrequencyData;
	}
	getFloatFrequencyData() {
		return (!this._floatFrequencyData || this._floatFrequencyData.length === 0) && (this._floatFrequencyData = new Float32Array(this._analyzerNode.frequencyBinCount)), this._analyzerNode.getFloatFrequencyData(this._floatFrequencyData), this._floatFrequencyData;
	}
	_clearArrays() {
		this._byteFrequencyData?.set(y()), this._floatFrequencyData?.set(b());
	}
}, U = class extends R {
	constructor(e) {
		super(), this._outputNode = null, this._owner = e;
	}
	async initAsync(e) {
		let t = f(e);
		if (t && await this.createAndAddSubNodeAsync("Analyzer"), await this.createAndAddSubNodeAsync("Volume"), await this._createSubNodePromisesResolvedAsync(), t) {
			let t = h(this);
			if (!t) throw Error("No analyzer subnode.");
			t.setOptions(e);
		}
		let n = l(this);
		if (!n) throw Error("No volume subnode.");
		if (n.setOptions(e), n.getClassName() !== "_VolumeWebAudioSubNode") throw Error("Not a WebAudio subnode.");
		if (this._outputNode = n.node, this._outputNode && this._downstreamNodes) {
			let e = this._downstreamNodes.values();
			for (let t = e.next(); !t.done; t = e.next()) {
				let e = t.value._inNode;
				e && this._outputNode.connect(e);
			}
		}
	}
	get _inNode() {
		return this._outputNode;
	}
	get _outNode() {
		return this._outputNode;
	}
	_createSubNode(e) {
		switch (e) {
			case "Analyzer": return V(this._owner.engine);
			case "Volume": return z(this._owner.engine);
			default: throw Error(`Unknown subnode name: ${e}`);
		}
	}
	_onSubNodesChanged() {
		let e = h(this), t = l(this);
		e && t && t.connect(e);
	}
};
//#endregion
export { N as a, l as c, C as i, o as l, L as n, P as o, M as r, S as s, U as t, i as u };

//# sourceMappingURL=webAudioBaseSubGraph--YgU7EJs.js.map