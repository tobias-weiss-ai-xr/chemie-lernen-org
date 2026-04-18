import { t as e } from "./observable-D7x0jL6J.js";
import { t } from "./logger-B7TbbsLc.js";
import { _ as n, i as r } from "./decorators-Dkc3uIc_.js";
import { t as i } from "./guid-CAqeuNf_.js";
import { t as a } from "./pointerEvents-N30Mbvxy.js";
import { i as o } from "./flowGraphBlock-CtJfM_SU.js";
import { t as s } from "./flowGraphAssetsContext-D5U5Q3eA.js";
import { t as c } from "./flowGraphExecutionBlock-B8lZ_whT.js";
import { t as l } from "./flowGraphAsyncExecutionBlock-C3ToWL9g.js";
import { a as u } from "./utils-ChmPBd4C.js";
import { t as d } from "./flowGraphEventBlock-CRT78Q3u.js";
//#region node_modules/@babylonjs/core/FlowGraph/flowGraphLogger.js
var f;
(function(e) {
	e.ExecuteBlock = "ExecuteBlock", e.ExecuteEvent = "ExecuteEvent", e.TriggerConnection = "TriggerConnection", e.ContextVariableSet = "ContextVariableSet", e.GlobalVariableSet = "GlobalVariableSet", e.GlobalVariableDelete = "GlobalVariableDelete", e.GlobalVariableGet = "GlobalVariableGet", e.AddConnection = "AddConnection", e.GetConnectionValue = "GetConnectionValue", e.SetConnectionValue = "SetConnectionValue", e.ActivateSignal = "ActivateSignal", e.ContextVariableGet = "ContextVariableGet";
})(f ||= {});
var p = class {
	constructor() {
		this.logToConsole = !1, this.log = [];
	}
	addLogItem(e) {
		if (e.time ||= Date.now(), this.log.push(e), this.logToConsole) {
			let n = e.payload?.value;
			typeof n == "object" && n.getClassName ? t.Log(`[FGLog] ${e.className}:${e.uniqueId.split("-")[0]} ${e.action} - ${JSON.stringify(n.getClassName())}: ${n.toString()}`) : t.Log(`[FGLog] ${e.className}:${e.uniqueId.split("-")[0]} ${e.action} - ${JSON.stringify(e.payload)}`);
		}
	}
	getItemsOfType(e) {
		return this.log.filter((t) => t.action === e);
	}
}, m = class {
	get enableLogging() {
		return this._enableLogging;
	}
	set enableLogging(e) {
		this._enableLogging !== e && (this._enableLogging = e, this._enableLogging ? (this.logger = new p(), this.logger.logToConsole = !0) : this.logger = null);
	}
	constructor(t) {
		this.uniqueId = i(), this._userVariables = {}, this._executionVariables = {}, this._globalContextVariables = {}, this._connectionValues = {}, this._pendingBlocks = [], this._executionId = 0, this.onNodeExecutedObservable = new e(), this.onBreakpointHitObservable = new e(), this.breakpointPredicate = null, this._pendingActivation = null, this._stepMode = !1, this._skipBreakpointForBlockId = null, this.treatDataAsRightHanded = !1, this._enableLogging = !1, this._configuration = t, this.assetsContext = t.assetsContext ?? t.scene;
	}
	hasVariable(e) {
		return e in this._userVariables;
	}
	setVariable(e, t) {
		this._userVariables[e] = t, this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "ContextVariableSet",
			payload: {
				name: e,
				value: t
			}
		});
	}
	getAsset(e, t) {
		return s(this.assetsContext, e, t);
	}
	getVariable(e) {
		return this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "ContextVariableGet",
			payload: {
				name: e,
				value: this._userVariables[e]
			}
		}), this._userVariables[e];
	}
	get userVariables() {
		return this._userVariables;
	}
	getScene() {
		return this._configuration.scene;
	}
	_getUniqueIdPrefixedName(e, t) {
		return `${e.uniqueId}_${t}`;
	}
	_getGlobalContextVariable(e, t) {
		return this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "GlobalVariableGet",
			payload: {
				name: e,
				defaultValue: t,
				possibleValue: this._globalContextVariables[e]
			}
		}), this._hasGlobalContextVariable(e) ? this._globalContextVariables[e] : t;
	}
	_setGlobalContextVariable(e, t) {
		this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "GlobalVariableSet",
			payload: {
				name: e,
				value: t
			}
		}), this._globalContextVariables[e] = t;
	}
	_deleteGlobalContextVariable(e) {
		this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "GlobalVariableDelete",
			payload: { name: e }
		}), delete this._globalContextVariables[e];
	}
	_hasGlobalContextVariable(e) {
		return e in this._globalContextVariables;
	}
	_setExecutionVariable(e, t, n) {
		this._executionVariables[this._getUniqueIdPrefixedName(e, t)] = n;
	}
	_getExecutionVariable(e, t, n) {
		return this._hasExecutionVariable(e, t) ? this._executionVariables[this._getUniqueIdPrefixedName(e, t)] : n;
	}
	_deleteExecutionVariable(e, t) {
		delete this._executionVariables[this._getUniqueIdPrefixedName(e, t)];
	}
	_hasExecutionVariable(e, t) {
		return this._getUniqueIdPrefixedName(e, t) in this._executionVariables;
	}
	_hasConnectionValue(e) {
		return e.uniqueId in this._connectionValues;
	}
	_setConnectionValue(e, t) {
		this._connectionValues[e.uniqueId] = t, this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "SetConnectionValue",
			payload: {
				connectionPointId: e.uniqueId,
				value: t
			}
		});
	}
	_setConnectionValueByKey(e, t) {
		this._connectionValues[e] = t;
	}
	_getConnectionValue(e) {
		return this.logger?.addLogItem({
			time: Date.now(),
			className: this.getClassName(),
			uniqueId: this.uniqueId,
			action: "GetConnectionValue",
			payload: {
				connectionPointId: e.uniqueId,
				value: this._connectionValues[e.uniqueId]
			}
		}), this._connectionValues[e.uniqueId];
	}
	get configuration() {
		return this._configuration;
	}
	get hasPendingBlocks() {
		return this._pendingBlocks.length > 0;
	}
	_addPendingBlock(e) {
		this._pendingBlocks.includes(e) || (this._pendingBlocks.push(e), this._pendingBlocks.sort((e, t) => e.priority - t.priority));
	}
	_removePendingBlock(e) {
		let t = this._pendingBlocks.indexOf(e);
		t !== -1 && this._pendingBlocks.splice(t, 1);
	}
	_clearPendingBlocks() {
		for (let e of this._pendingBlocks) e._cancelPendingTasks(this);
		this._pendingBlocks.length = 0;
	}
	_notifyExecuteNode(e) {
		this.onNodeExecutedObservable.notifyObservers(e), this.logger?.addLogItem({
			time: Date.now(),
			className: e.getClassName(),
			uniqueId: e.uniqueId,
			action: "ExecuteBlock"
		});
	}
	_notifyOnTick(e) {
		this._setGlobalContextVariable("timeSinceStart", e.timeSinceStart), this._setGlobalContextVariable("deltaTime", e.deltaTime);
		for (let e of this._pendingBlocks) e._executeOnTick?.(this);
	}
	_increaseExecutionId() {
		this._executionId++;
	}
	get executionId() {
		return this._executionId;
	}
	_shouldBreak(e, t) {
		return this._skipBreakpointForBlockId === e.uniqueId ? (this._skipBreakpointForBlockId = null, !1) : this._pendingActivation ? !0 : this._stepMode ? (this._stepMode = !1, this._pendingActivation = {
			block: e,
			context: this,
			signal: t
		}, this.onBreakpointHitObservable.notifyObservers(this._pendingActivation), !0) : this.breakpointPredicate && this.breakpointPredicate(e) ? (this._pendingActivation = {
			block: e,
			context: this,
			signal: t
		}, this.onBreakpointHitObservable.notifyObservers(this._pendingActivation), !0) : !1;
	}
	get pendingActivation() {
		return this._pendingActivation;
	}
	continueExecution() {
		let e = this._pendingActivation;
		e && (this._pendingActivation = null, this._skipBreakpointForBlockId = e.block.uniqueId, e.signal._activateSignal(this), this._skipBreakpointForBlockId = null);
	}
	stepExecution() {
		let e = this._pendingActivation;
		e && (this._pendingActivation = null, this._stepMode = !0, this._skipBreakpointForBlockId = e.block.uniqueId, e.signal._activateSignal(this), this._stepMode = !1, this._skipBreakpointForBlockId = null);
	}
	_clearPendingActivation() {
		this._pendingActivation = null, this._stepMode = !1, this._skipBreakpointForBlockId = null;
	}
	serialize(e = {}, t = o) {
		e.uniqueId = this.uniqueId, e._userVariables = {};
		for (let n in this._userVariables) t(n, this._userVariables[n], e._userVariables);
		e._connectionValues = {};
		for (let n in this._connectionValues) t(n, this._connectionValues[n], e._connectionValues);
		this.assetsContext !== this.getScene() && (e._assetsContext = {
			meshes: this.assetsContext.meshes.map((e) => e.id),
			materials: this.assetsContext.materials.map((e) => e.id),
			textures: this.assetsContext.textures.map((e) => e.name),
			animations: this.assetsContext.animations.map((e) => e.name),
			lights: this.assetsContext.lights.map((e) => e.id),
			cameras: this.assetsContext.cameras.map((e) => e.id),
			sounds: this.assetsContext.sounds?.map((e) => e.name),
			skeletons: this.assetsContext.skeletons.map((e) => e.id),
			particleSystems: this.assetsContext.particleSystems.map((e) => e.name),
			geometries: this.assetsContext.geometries.map((e) => e.id),
			multiMaterials: this.assetsContext.multiMaterials.map((e) => e.id),
			transformNodes: this.assetsContext.transformNodes.map((e) => e.id)
		});
	}
	getClassName() {
		return "FlowGraphContext";
	}
};
n([r()], m.prototype, "uniqueId", void 0);
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/flowGraphSceneEventCoordinator.js
var h = class {
	constructor(t) {
		this.onEventTriggeredObservable = new e(), this.sceneReadyTriggered = !1, this._pointerUnderMeshState = {}, this._startingTime = 0, this._scene = t, this._initialize();
	}
	_initialize() {
		this._sceneReadyObserver = this._scene.onReadyObservable.addOnce(() => {
			this.sceneReadyTriggered ||= (this.onEventTriggeredObservable.notifyObservers({ type: "SceneReady" }), !0);
		}), this._sceneDisposeObserver = this._scene.onDisposeObservable.add(() => {
			this.onEventTriggeredObservable.notifyObservers({ type: "SceneDispose" });
		}), this._sceneOnBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
			let e = this._scene.getEngine().getDeltaTime() / 1e3;
			this.onEventTriggeredObservable.notifyObservers({
				type: "SceneBeforeRender",
				payload: {
					timeSinceStart: this._startingTime,
					deltaTime: e
				}
			}), this._startingTime += e;
		}), this._meshPickedObserver = this._scene.onPointerObservable.add((e) => {
			this.onEventTriggeredObservable.notifyObservers({
				type: "MeshPick",
				payload: e
			});
		}, a.POINTERPICK), this._pointerDownObserver = this._scene.onPointerObservable.add((e) => {
			this.onEventTriggeredObservable.notifyObservers({
				type: "PointerDown",
				payload: e
			});
		}, a.POINTERDOWN), this._pointerUpObserver = this._scene.onPointerObservable.add((e) => {
			this.onEventTriggeredObservable.notifyObservers({
				type: "PointerUp",
				payload: e
			});
		}, a.POINTERUP), this._pointerMoveObserver = this._scene.onPointerObservable.add((e) => {
			this.onEventTriggeredObservable.notifyObservers({
				type: "PointerMove",
				payload: e
			});
		}, a.POINTERMOVE), this._meshUnderPointerObserver = this._scene.onMeshUnderPointerUpdatedObservable.add((e) => {
			let t = e.pointerId, n = e.mesh, r = this._pointerUnderMeshState[t];
			!r && n ? this.onEventTriggeredObservable.notifyObservers({
				type: "PointerOver",
				payload: {
					pointerId: t,
					mesh: n
				}
			}) : r && !n ? this.onEventTriggeredObservable.notifyObservers({
				type: "PointerOut",
				payload: {
					pointerId: t,
					mesh: r
				}
			}) : r && n && r !== n && (this.onEventTriggeredObservable.notifyObservers({
				type: "PointerOut",
				payload: {
					pointerId: t,
					mesh: r,
					over: n
				}
			}), this.onEventTriggeredObservable.notifyObservers({
				type: "PointerOver",
				payload: {
					pointerId: t,
					mesh: n,
					out: r
				}
			})), this._pointerUnderMeshState[t] = n;
		}, a.POINTERMOVE);
	}
	dispose() {
		this._sceneDisposeObserver?.remove(), this._sceneReadyObserver?.remove(), this._sceneOnBeforeRenderObserver?.remove(), this._meshPickedObserver?.remove(), this._meshUnderPointerObserver?.remove(), this._pointerDownObserver?.remove(), this._pointerUpObserver?.remove(), this._pointerMoveObserver?.remove(), this.onEventTriggeredObservable.clear();
	}
}, g;
(function(e) {
	e[e.Error = 0] = "Error", e[e.Warning = 1] = "Warning";
})(g ||= {});
var _ = new Set([
	"number",
	"FlowGraphInteger",
	"boolean"
]), v = new Set(["Vector4", "Quaternion"]), y = new Set(["Color3", "Color4"]);
function b(e, t) {
	return !!(e === t || e === "any" || t === "any" || _.has(e) && _.has(t) || v.has(e) && v.has(t) || y.has(e) && y.has(t));
}
function x(e) {
	let t = [], n = /* @__PURE__ */ new Map(), r = (e) => {
		if (t.push(e), e.block) {
			let t = n.get(e.block.uniqueId);
			t || (t = [], n.set(e.block.uniqueId, t)), t.push(e);
		}
	}, i = [];
	e.visitAllBlocks((e) => {
		i.push(e);
	}), C(e).length === 0 && r({
		severity: 0,
		message: "Graph has no event blocks — nothing will trigger execution."
	});
	for (let e of i) for (let t of e.dataInputs) !t.optional && !t.isDisabled && !t.isConnected() && r({
		severity: 1,
		message: `"${t.name}" is not connected and will use its default value.`,
		block: e,
		connectionName: t.name
	});
	for (let e of i) if (e instanceof c) {
		if (w(e)) continue;
		let t = e.signalInputs.find((e) => e.name === "in");
		t && !t.isConnected() && r({
			severity: 0,
			message: "Execution block has no incoming signal — it will never execute.",
			block: e,
			connectionName: "in"
		});
	}
	for (let e of i) for (let t of e.dataInputs) {
		if (!t.isConnected()) continue;
		let n = t._connectedPoint[0], i = n.richType?.typeName, a = t.richType?.typeName;
		if (i && a && !b(i, a)) {
			if (n.richType.typeTransformer !== void 0 || t.richType.typeTransformer !== void 0) continue;
			r({
				severity: 1,
				message: `Type mismatch: "${n._ownerBlock.name}.${n.name}" (${i}) → "${e.name}.${t.name}" (${a}).`,
				block: e,
				connectionName: t.name
			});
		}
	}
	let a = /* @__PURE__ */ new Set();
	return e.visitAllBlocks((e) => {
		a.add(e.uniqueId);
	}), T(i, r), t.sort((e, t) => e.severity - t.severity), {
		isValid: t.every((e) => e.severity !== 0),
		issues: t,
		errorCount: t.filter((e) => e.severity === 0).length,
		warningCount: t.filter((e) => e.severity === 1).length,
		issuesByBlock: n
	};
}
function S(e, t) {
	let n = x(e), r = /* @__PURE__ */ new Set();
	e.visitAllBlocks((e) => {
		r.add(e.uniqueId);
	});
	for (let e of t) if (!r.has(e.uniqueId)) {
		let t = {
			severity: 1,
			message: "Block is unreachable from any event block.",
			block: e
		};
		n.issues.push(t), n.warningCount++;
		let r = n.issuesByBlock.get(e.uniqueId);
		r || (r = [], n.issuesByBlock.set(e.uniqueId, r)), r.push(t);
		for (let t of e.dataInputs) if (!t.optional && !t.isDisabled && !t.isConnected()) {
			let i = {
				severity: 1,
				message: `"${t.name}" is not connected and will use its default value.`,
				block: e,
				connectionName: t.name
			};
			n.issues.push(i), n.warningCount++, r.push(i);
		}
		if (e instanceof c && !w(e)) {
			let t = e.signalInputs.find((e) => e.name === "in");
			if (t && !t.isConnected()) {
				let t = {
					severity: 0,
					message: "Execution block has no incoming signal — it will never execute.",
					block: e,
					connectionName: "in"
				};
				n.issues.push(t), n.errorCount++, r.push(t);
			}
		}
	}
	return n.isValid = n.issues.every((e) => e.severity !== 0), n.issues.sort((e, t) => e.severity - t.severity), n;
}
function C(e) {
	let t = [];
	for (let n in e._eventBlocks) for (let r of e._eventBlocks[n]) t.push(r);
	return t;
}
function w(e) {
	return e instanceof d;
}
function T(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let t of e) n.set(t.uniqueId, 0);
	let r = /* @__PURE__ */ new Map();
	for (let t of e) r.set(t.uniqueId, t);
	let i = /* @__PURE__ */ new Set();
	function a(e) {
		n.set(e.uniqueId, 1);
		for (let r of e.dataInputs) if (r.isConnected()) for (let o of r._connectedPoint) {
			let r = o._ownerBlock;
			if (r instanceof c) continue;
			let s = n.get(r.uniqueId);
			if (s === 1) return i.has(e.uniqueId) || (i.add(e.uniqueId), t({
				severity: 0,
				message: "Data dependency cycle detected — getValue() will recurse infinitely.",
				block: e
			})), i.has(r.uniqueId) || (i.add(r.uniqueId), t({
				severity: 0,
				message: "Data dependency cycle detected — getValue() will recurse infinitely.",
				block: r
			})), !0;
			s === 0 && a(r);
		}
		return n.set(e.uniqueId, 2), !1;
	}
	for (let t of e) n.get(t.uniqueId) === 0 && a(t);
}
//#endregion
//#region node_modules/@babylonjs/core/FlowGraph/flowGraph.js
var E;
(function(e) {
	e[e.Stopped = 0] = "Stopped", e[e.Started = 1] = "Started", e[e.Paused = 2] = "Paused";
})(E ||= {});
var D = class {
	get scene() {
		return this._scene;
	}
	get state() {
		return this._state;
	}
	set state(e) {
		this._state = e, this.onStateChangedObservable.notifyObservers(e);
	}
	constructor(t) {
		this.onStateChangedObservable = new e(), this._eventBlocks = {
			SceneReady: [],
			SceneDispose: [],
			SceneBeforeRender: [],
			MeshPick: [],
			PointerDown: [],
			PointerUp: [],
			PointerMove: [],
			PointerOver: [],
			PointerOut: [],
			SceneAfterRender: [],
			NoTrigger: []
		}, this._allBlocks = [], this._executionContexts = [], this._state = 0, this._scene = t.scene, this._sceneEventCoordinator = new h(this._scene), this._coordinator = t.coordinator;
	}
	_attachEventObserver() {
		this._eventObserver ||= this._sceneEventCoordinator.onEventTriggeredObservable.add((e) => {
			if (e.type === "SceneDispose") {
				this.dispose();
				return;
			}
			if (this.state === 1) {
				for (let t of this._executionContexts) {
					let n = this._getContextualOrder(e.type, t);
					for (let r of n) if (!r._executeEvent(t, e.payload)) break;
				}
				switch (e.type) {
					case "SceneReady":
						this._sceneEventCoordinator.sceneReadyTriggered = !0;
						break;
					case "SceneBeforeRender":
						for (let t of this._executionContexts) t._notifyOnTick(e.payload);
						break;
				}
			}
		});
	}
	_detachEventObserver() {
		this._eventObserver?.remove(), this._eventObserver = null;
	}
	setScene(e) {
		e !== this._scene && (this.state === 1 && this.stop(), this._detachEventObserver(), this._sceneEventCoordinator.dispose(), this._scene = e, this._scene.constantlyUpdateMeshUnderPointer = !0, this._sceneEventCoordinator = new h(this._scene), this._attachEventObserver());
	}
	createContext() {
		let e = new m({
			scene: this._scene,
			coordinator: this._coordinator
		});
		return this._executionContexts.push(e), e;
	}
	getContext(e) {
		return this._executionContexts[e];
	}
	getAllBlocks() {
		return this._allBlocks;
	}
	addBlock(e) {
		this._allBlocks.indexOf(e) === -1 && this._allBlocks.push(e);
	}
	removeBlock(e) {
		let t = this._allBlocks.indexOf(e);
		if (t !== -1 && this._allBlocks.splice(t, 1), e instanceof c && "type" in e) {
			let t = e, n = this._eventBlocks[t.type];
			if (n) {
				let e = n.indexOf(t);
				e !== -1 && n.splice(e, 1);
			}
		}
		if (e instanceof l) for (let t of this._executionContexts) e._cancelPendingTasks(t), e._resetAfterCanceled(t);
		for (let t of e.dataInputs) t.disconnectFromAll();
		for (let t of e.dataOutputs) t.disconnectFromAll();
		if (e instanceof c) {
			for (let t of e.signalInputs) t.disconnectFromAll();
			for (let t of e.signalOutputs) t.disconnectFromAll();
		}
	}
	addEventBlock(e) {
		if (this.addBlock(e), (e.type === "PointerOver" || e.type === "PointerOut") && (this._scene.constantlyUpdateMeshUnderPointer = !0), this._eventBlocks[e.type].push(e), this.state === 1) for (let t of this._executionContexts) e._startPendingTasks(t);
		else this.onStateChangedObservable.addOnce((t) => {
			if (t === 1) for (let t of this._executionContexts) e._startPendingTasks(t);
		});
	}
	stop() {
		if (this.state !== 0) {
			this._detachEventObserver(), this.state = 0;
			for (let e of this._executionContexts) e._clearPendingBlocks(), e._clearPendingActivation();
			this._executionContexts.length = 0;
		}
	}
	pause() {
		if (this.state === 1) {
			this._detachEventObserver(), this.state = 2;
			for (let e of this._executionContexts) e._clearPendingBlocks();
		}
	}
	start() {
		if (this.state === 1) return;
		let e = this.state === 2;
		this._executionContexts.length === 0 && this.createContext(), this._attachEventObserver(), this.state = 1, this._startPendingEvents(), e || (this._sceneEventCoordinator.sceneReadyTriggered = !1, this._scene.isReady(!0) ? (this._sceneEventCoordinator.sceneReadyTriggered = !0, this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({ type: "SceneReady" })) : this._scene.executeWhenReady(() => {
			this.state === 1 && !this._sceneEventCoordinator.sceneReadyTriggered && (this._sceneEventCoordinator.sceneReadyTriggered = !0, this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({ type: "SceneReady" }));
		}, !0));
	}
	_startPendingEvents() {
		for (let e of this._executionContexts) for (let t in this._eventBlocks) {
			let n = this._getContextualOrder(t, e);
			for (let t of n) t._startPendingTasks(e);
		}
	}
	_getContextualOrder(e, t) {
		let n = this._eventBlocks[e].sort((e, t) => t.initPriority - e.initPriority);
		if (e === "MeshPick") {
			let e = [];
			for (let r of n) {
				let i = r.asset.getValue(t), a = 0;
				for (; a < n.length; a++) {
					let e = n[a].asset.getValue(t);
					if (i && e && u(i, e)) break;
				}
				e.splice(a, 0, r);
			}
			return e;
		}
		return n;
	}
	dispose() {
		if (this.state !== 0) {
			this.state = 0;
			for (let e of this._executionContexts) e._clearPendingBlocks(), e._clearPendingActivation();
			this._executionContexts.length = 0;
			for (let e in this._eventBlocks) this._eventBlocks[e].length = 0;
			this._allBlocks.length = 0, this._detachEventObserver(), this._sceneEventCoordinator.dispose();
		}
	}
	visitAllBlocks(e) {
		let t = [], n = /* @__PURE__ */ new Set();
		for (let e in this._eventBlocks) for (let r of this._eventBlocks[e]) t.push(r), n.add(r.uniqueId);
		for (; t.length > 0;) {
			let r = t.pop();
			e(r);
			for (let e of r.dataInputs) for (let r of e._connectedPoint) n.has(r._ownerBlock.uniqueId) || (t.push(r._ownerBlock), n.add(r._ownerBlock.uniqueId));
			if (r instanceof c) for (let e of r.signalOutputs) for (let r of e._connectedPoint) n.has(r._ownerBlock.uniqueId) || (t.push(r._ownerBlock), n.add(r._ownerBlock.uniqueId));
		}
	}
	validate() {
		return S(this, this._allBlocks);
	}
	serialize(e = {}, t) {
		e.allBlocks = [];
		let n = /* @__PURE__ */ new Set(), r = (t) => {
			if (n.has(t.uniqueId)) return;
			n.add(t.uniqueId);
			let r = {};
			t.serialize(r), e.allBlocks.push(r);
		};
		this.visitAllBlocks(r);
		for (let e of this._allBlocks) r(e);
		e.executionContexts = [];
		for (let n of this._executionContexts) {
			let r = {};
			n.serialize(r, t), e.executionContexts.push(r);
		}
	}
}, O = class n {
	constructor(e) {
		this.config = e, this.dispatchEventsSynchronously = !0, this._flowGraphs = [], this._customEventsMap = /* @__PURE__ */ new Map(), this._eventExecutionCounter = /* @__PURE__ */ new Map(), this._executeOnNextFrame = [], this._eventUniqueId = 0, this._disposeObserver = this.config.scene.onDisposeObservable.add(() => {
			this.dispose();
		}), this._onBeforeRenderObserver = this.config.scene.onBeforeRenderObservable.add(() => {
			this._eventExecutionCounter.clear();
			let e = this._executeOnNextFrame.slice(0);
			if (e.length) for (let t of e) {
				this.notifyCustomEvent(t.id, t.data, !1);
				let e = this._executeOnNextFrame.findIndex((e) => e.uniqueId === t.uniqueId);
				e !== -1 && this._executeOnNextFrame.splice(e, 1);
			}
		});
		let t = n.SceneCoordinators.get(this.config.scene);
		t || (t = [], n.SceneCoordinators.set(this.config.scene, t)), t.push(this);
	}
	createGraph() {
		let e = new D({
			scene: this.config.scene,
			coordinator: this
		});
		return this._flowGraphs.push(e), e;
	}
	removeGraph(e) {
		let t = this._flowGraphs.indexOf(e);
		t !== -1 && (e.dispose(), this._flowGraphs.splice(t, 1));
	}
	start() {
		for (let e of this._flowGraphs) e.start();
	}
	dispose() {
		for (let e of this._flowGraphs) e.dispose();
		this._flowGraphs.length = 0, this._disposeObserver?.remove(), this._onBeforeRenderObserver?.remove();
		let e = n.SceneCoordinators.get(this.config.scene) ?? [], t = e.indexOf(this);
		t !== -1 && e.splice(t, 1);
	}
	serialize(e, t) {
		e._flowGraphs = [];
		for (let n of this._flowGraphs) {
			let r = {};
			n.serialize(r, t), e._flowGraphs.push(r);
		}
		e.dispatchEventsSynchronously = this.dispatchEventsSynchronously;
	}
	get flowGraphs() {
		return this._flowGraphs;
	}
	getCustomEventObservable(t) {
		let n = this._customEventsMap.get(t);
		return n || (n = new e(), this._customEventsMap.set(t, n)), n;
	}
	notifyCustomEvent(e, r, i = !this.dispatchEventsSynchronously) {
		if (i) {
			this._executeOnNextFrame.push({
				id: e,
				data: r,
				uniqueId: this._eventUniqueId++
			});
			return;
		}
		if (this._eventExecutionCounter.has(e)) {
			let r = this._eventExecutionCounter.get(e);
			if (this._eventExecutionCounter.set(e, r + 1), r >= n.MaxEventTypeExecutionPerFrame) {
				r === n.MaxEventTypeExecutionPerFrame && t.Warn(`FlowGraphCoordinator: Too many executions of event "${e}".`);
				return;
			}
		} else this._eventExecutionCounter.set(e, 1);
		let a = this._customEventsMap.get(e);
		a && a.notifyObservers(r);
	}
};
O.MaxEventsPerType = 30, O.MaxEventTypeExecutionPerFrame = 30, O.SceneCoordinators = /* @__PURE__ */ new Map();
//#endregion
export { O as t };

//# sourceMappingURL=flowGraphCoordinator-BQfno_qB.js.map