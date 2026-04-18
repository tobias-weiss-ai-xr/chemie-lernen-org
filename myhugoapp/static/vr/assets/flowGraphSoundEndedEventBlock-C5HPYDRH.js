import { n as e } from "./typeStore-Bwo5hkCf.js";
import { o as t } from "./flowGraphBlock-CtJfM_SU.js";
import { t as n } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSoundEndedEventBlock.js
var r = class extends n {
	constructor(e) {
		super(e), this.sound = this.registerDataInput("sound", t);
	}
	_preparePendingTasks(e) {
		let t = this.sound.getValue(e);
		if (!t) {
			this._reportError(e, "No sound provided for sound-ended event");
			return;
		}
		let n = t.onEndedObservable.add(() => {
			this._execute(e);
		});
		e._setExecutionVariable(this, "_soundEndedObserver", n), e._setExecutionVariable(this, "_subscribedSound", t);
	}
	_executeEvent(e, t) {
		return !0;
	}
	_cancelPendingTasks(e) {
		let t = e._getExecutionVariable(this, "_soundEndedObserver", null), n = e._getExecutionVariable(this, "_subscribedSound", null);
		t && n && n.onEndedObservable.remove(t), e._setExecutionVariable(this, "_soundEndedObserver", null), e._setExecutionVariable(this, "_subscribedSound", null);
	}
	getClassName() {
		return "FlowGraphSoundEndedEventBlock";
	}
};
e("FlowGraphSoundEndedEventBlock", r);
//#endregion
export { r as FlowGraphSoundEndedEventBlock };

//# sourceMappingURL=flowGraphSoundEndedEventBlock-C5HPYDRH.js.map