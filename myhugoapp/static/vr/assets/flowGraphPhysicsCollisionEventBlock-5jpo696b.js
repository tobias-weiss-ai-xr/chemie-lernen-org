import { n as e } from "./typeStore-Bwo5hkCf.js";
import { f as t, g as n, o as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphPhysicsCollisionEventBlock.js
var a = class extends i {
	constructor(e) {
		super(e), this.config = e, this.body = this.registerDataInput("body", r), this.otherBody = this.registerDataOutput("otherBody", r), this.point = this.registerDataOutput("point", n), this.normal = this.registerDataOutput("normal", n), this.impulse = this.registerDataOutput("impulse", t), this.distance = this.registerDataOutput("distance", t);
	}
	_preparePendingTasks(e) {
		let t = this.body.getValue(e);
		if (!t) {
			this._reportError(e, "No physics body provided for collision event");
			return;
		}
		t.setCollisionCallbackEnabled(!0);
		let n = t.getCollisionObservable().add((t) => {
			this._onCollision(e, t);
		});
		e._setExecutionVariable(this, "_collisionObserver", n), e._setExecutionVariable(this, "_subscribedBody", t);
	}
	_onCollision(e, t) {
		let n = this.body.getValue(e), r = t.collider === n ? t.collidedAgainst : t.collider;
		this.otherBody.setValue(r, e), t.point && this.point.setValue(t.point, e), t.normal && this.normal.setValue(t.normal, e), this.impulse.setValue(t.impulse, e), this.distance.setValue(t.distance, e), this._execute(e);
	}
	_executeEvent(e, t) {
		return !0;
	}
	_cancelPendingTasks(e) {
		let t = e._getExecutionVariable(this, "_collisionObserver", null), n = e._getExecutionVariable(this, "_subscribedBody", null);
		if (t && n) {
			let e = n.getCollisionObservable();
			e.remove(t), e.hasObservers() || n.setCollisionCallbackEnabled(!1);
		}
		e._setExecutionVariable(this, "_collisionObserver", null), e._setExecutionVariable(this, "_subscribedBody", null);
	}
	getClassName() {
		return "FlowGraphPhysicsCollisionEventBlock";
	}
};
e("FlowGraphPhysicsCollisionEventBlock", a);
//#endregion
export { a as FlowGraphPhysicsCollisionEventBlock };

//# sourceMappingURL=flowGraphPhysicsCollisionEventBlock-5jpo696b.js.map