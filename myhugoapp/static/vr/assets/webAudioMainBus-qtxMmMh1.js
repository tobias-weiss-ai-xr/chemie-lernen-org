import { t as e } from "./webAudioBaseSubGraph--YgU7EJs.js";
import { t } from "./abstractAudioBus-C8p12gDG.js";
//#region node_modules/@babylonjs/core/AudioV2/abstractAudio/mainAudioBus.js
var n = class extends t {
	constructor(e, t) {
		super(e, t);
	}
}, r = class e extends n {
	constructor(t, n) {
		super(t, n), this._subGraph = new e._SubGraph(this);
	}
	async _initAsync(e) {
		if (await this._subGraph.initAsync(e), this.engine.mainOut && !this._connect(this.engine.mainOut)) throw Error("Connect failed");
		this.engine._addMainBus(this);
	}
	dispose() {
		super.dispose(), this.engine._removeMainBus(this);
	}
	get _inNode() {
		return this._subGraph._inNode;
	}
	get _outNode() {
		return this._subGraph._outNode;
	}
	_connect(e) {
		return super._connect(e) ? (e._inNode && this._outNode?.connect(e._inNode), !0) : !1;
	}
	_disconnect(e) {
		return super._disconnect(e) ? (e._inNode && this._outNode?.disconnect(e._inNode), !0) : !1;
	}
	getClassName() {
		return "_WebAudioMainBus";
	}
};
r._SubGraph = class extends e {
	get _downstreamNodes() {
		return this._owner._downstreamNodes ?? null;
	}
};
//#endregion
export { r as _WebAudioMainBus };

//# sourceMappingURL=webAudioMainBus-qtxMmMh1.js.map