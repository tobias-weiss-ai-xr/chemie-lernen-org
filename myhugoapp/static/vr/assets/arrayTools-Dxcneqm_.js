//#region node_modules/@babylonjs/core/Maths/math.constants.js
var e = 1 / 2.2, t = 2.2, n = (1 + Math.sqrt(5)) / 2, r = .001;
//#endregion
//#region node_modules/@babylonjs/core/Misc/arrayTools.js
function i(e, t) {
	let n = [];
	for (let r = 0; r < e; ++r) n.push(t());
	return n;
}
function a(e, t) {
	return i(e, t);
}
function o(e, t, n) {
	let r = e[t];
	if (typeof r != "function") return null;
	let i = function() {
		let r = e.length, a = i.previous.apply(e, arguments);
		return n(t, r), a;
	};
	return r.next = i, i.previous = r, e[t] = i, () => {
		let n = i.previous;
		if (!n) return;
		let r = i.next;
		r ? (n.next = r, r.previous = n) : (n.next = void 0, e[t] = n), i.next = void 0, i.previous = void 0;
	};
}
var s = [
	"push",
	"splice",
	"pop",
	"shift",
	"unshift"
];
function c(e, t) {
	let n = s.map((n) => o(e, n, t));
	return () => {
		for (let e of n) e?.();
	};
}
//#endregion
export { n as a, r as i, a as n, e as o, c as r, t as s, i as t };

//# sourceMappingURL=arrayTools-Dxcneqm_.js.map