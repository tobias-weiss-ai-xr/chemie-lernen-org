import { t as e } from "./logger-B7TbbsLc.js";
import { n as t } from "./typeStore-Bwo5hkCf.js";
import { m as n, o as r } from "./flowGraphBlock-CtJfM_SU.js";
import { t as i } from "./flowGraphExecutionBlockWithOutSignal-y8yifvjc.js";
//#region node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/flowGraphConsoleLogBlock.js
var a = class extends i {
	constructor(e) {
		if (super(e), this.message = this.registerDataInput("message", r), this.logType = this.registerDataInput("logType", n, "log"), e?.messageTemplate) {
			let t = this._getTemplateMatches(e.messageTemplate);
			for (let e of t) this.registerDataInput(e, r);
		}
	}
	_execute(t) {
		let n = this.logType.getValue(t), r = this._getMessageValue(t);
		n === "warn" ? e.Warn(r) : n === "error" ? e.Error(r) : e.Log(r), this.out._activateSignal(t);
	}
	getClassName() {
		return "FlowGraphConsoleLogBlock";
	}
	_getMessageValue(e) {
		if (this.config?.messageTemplate) {
			let t = this.config.messageTemplate, n = this._getTemplateMatches(t);
			for (let r of n) {
				let n = this.getDataInput(r)?.getValue(e);
				n !== void 0 && (t = t.replace(RegExp(`\\{${r}\\}`, "g"), n.toString()));
			}
			return t;
		} else return this.message.getValue(e);
	}
	_getTemplateMatches(e) {
		let t = /\{([^}]+)\}/g, n = [], r;
		for (; (r = t.exec(e)) !== null;) n.push(r[1]);
		return n;
	}
};
t("FlowGraphConsoleLogBlock", a);
//#endregion
export { a as FlowGraphConsoleLogBlock };

//# sourceMappingURL=flowGraphConsoleLogBlock-ern8RVdh.js.map