import { a as e, o as t, r as n, t as r } from "./spatialWebAudio-BmP8z1Pc.js";
import { t as i } from "./abstractSoundSource-BkODqWnN.js";
//#region node_modules/@babylonjs/core/AudioV2/webAudio/webAudioSoundSource.js
var a = class n extends i {
	constructor(e, t, r, i) {
		super(e, r, i), this._stereo = null, this._webAudioNode = null, this._audioContext = this.engine._audioContext, this._webAudioNode = t, this._subGraph = new n._SubGraph(this);
	}
	async _initAsync(e) {
		e.outBus ? this.outBus = e.outBus : e.outBusAutoDefault !== !1 && (await this.engine.isReadyPromise, this.outBus = this.engine.defaultMainBus), await this._subGraph.initAsync(e), t(e) && this._initSpatialProperty(), this.engine._addNode(this);
	}
	get _inNode() {
		return this._webAudioNode;
	}
	get _outNode() {
		return this._subGraph._outNode;
	}
	get stereo() {
		return this._stereo ??= new e(this._subGraph);
	}
	dispose() {
		if (super.dispose(), this._webAudioNode) {
			if (this._webAudioNode instanceof MediaStreamAudioSourceNode) for (let e of this._webAudioNode.mediaStream.getTracks()) e.stop();
			this._webAudioNode.disconnect(), this._webAudioNode = null;
		}
		this._stereo = null, this._subGraph.dispose(), this.engine._removeNode(this);
	}
	getClassName() {
		return "_WebAudioSoundSource";
	}
	_connect(e) {
		return super._connect(e) ? (e._inNode && this._outNode?.connect(e._inNode), !0) : !1;
	}
	_disconnect(e) {
		return super._disconnect(e) ? (e._inNode && this._outNode?.disconnect(e._inNode), !0) : !1;
	}
	_createSpatialProperty(e, t) {
		return new r(this._subGraph, e, t);
	}
};
a._SubGraph = class extends n {
	get _downstreamNodes() {
		return this._owner._downstreamNodes ?? null;
	}
	get _upstreamNodes() {
		return this._owner._upstreamNodes ?? null;
	}
	_onSubNodesChanged() {
		super._onSubNodesChanged(), this._owner._inNode?.disconnect(), this._owner._subGraph._inNode && this._owner._inNode?.connect(this._owner._subGraph._inNode);
	}
};
//#endregion
export { a as t };

//# sourceMappingURL=webAudioSoundSource-D9G4LC5e.js.map