import { t as e } from "./observable-D7x0jL6J.js";
//#region node_modules/@babylonjs/core/Misc/timer.js
var t;
(function(e) {
	e[e.INIT = 0] = "INIT", e[e.STARTED = 1] = "STARTED", e[e.ENDED = 2] = "ENDED";
})(t ||= {});
function n(e) {
	let t = 0, n = Date.now();
	e.observableParameters = e.observableParameters ?? {};
	let r = e.contextObservable.add((i) => {
		let a = Date.now();
		t = a - n;
		let o = {
			startTime: n,
			currentTime: a,
			deltaTime: t,
			completeRate: t / e.timeout,
			payload: i
		};
		if (e.breakCondition && e.breakCondition(o)) {
			e.contextObservable.remove(r), e.onAborted && e.onAborted(o);
			return;
		}
		if (t >= e.timeout) {
			e.contextObservable.remove(r), e.onEnded && e.onEnded(o);
			return;
		}
		e.onTick && e.onTick(o);
	}, e.observableParameters.mask, e.observableParameters.insertFirst, e.observableParameters.scope);
	return r;
}
var r = class {
	constructor(t) {
		this.onEachCountObservable = new e(), this.onTimerAbortedObservable = new e(), this.onTimerEndedObservable = new e(), this.onStateChangedObservable = new e(), this._observer = null, this._breakOnNextTick = !1, this._tick = (e) => {
			let t = Date.now();
			this._timer = t - this._startTime;
			let n = {
				startTime: this._startTime,
				currentTime: t,
				deltaTime: this._timer,
				completeRate: this._timer / this._timeToEnd,
				payload: e
			}, r = this._breakOnNextTick || this._breakCondition(n);
			r || this._timer >= this._timeToEnd ? this._stop(n, r) : this.onEachCountObservable.notifyObservers(n);
		}, this._setState(0), this._contextObservable = t.contextObservable, this._observableParameters = t.observableParameters ?? {}, this._breakCondition = t.breakCondition ?? (() => !1), this._timeToEnd = t.timeout, t.onEnded && this.onTimerEndedObservable.add(t.onEnded), t.onTick && this.onEachCountObservable.add(t.onTick), t.onAborted && this.onTimerAbortedObservable.add(t.onAborted);
	}
	set breakCondition(e) {
		this._breakCondition = e;
	}
	clearObservables() {
		this.onEachCountObservable.clear(), this.onTimerAbortedObservable.clear(), this.onTimerEndedObservable.clear(), this.onStateChangedObservable.clear();
	}
	start(e = this._timeToEnd) {
		if (this._state === 1) throw Error("Timer already started. Please stop it before starting again");
		this._timeToEnd = e, this._startTime = Date.now(), this._timer = 0, this._observer = this._contextObservable.add(this._tick, this._observableParameters.mask, this._observableParameters.insertFirst, this._observableParameters.scope), this._setState(1);
	}
	stop() {
		this._state === 1 && (this._breakOnNextTick = !0);
	}
	dispose() {
		this._observer && this._contextObservable.remove(this._observer), this.clearObservables();
	}
	_setState(e) {
		this._state = e, this.onStateChangedObservable.notifyObservers(this._state);
	}
	_stop(e, t = !1) {
		this._contextObservable.remove(this._observer), this._setState(2), t ? this.onTimerAbortedObservable.notifyObservers(e) : this.onTimerEndedObservable.notifyObservers(e);
	}
};
//#endregion
export { n, r as t };

//# sourceMappingURL=timer-BNwwhc1r.js.map