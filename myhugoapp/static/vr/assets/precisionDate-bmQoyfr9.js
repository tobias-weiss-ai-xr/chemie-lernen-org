//#region node_modules/@babylonjs/core/Misc/domManagement.js
function e() {
	return typeof window < "u";
}
function t() {
	return typeof navigator < "u";
}
function n() {
	return typeof document < "u";
}
function r(e) {
	let t = "", n = e.firstChild;
	for (; n;) n.nodeType === 3 && (t += n.textContent), n = n.nextSibling;
	return t;
}
//#endregion
//#region node_modules/@babylonjs/core/Misc/precisionDate.js
var i = class {
	static get Now() {
		return e() && window.performance && window.performance.now ? window.performance.now() : Date.now();
	}
};
//#endregion
export { e as a, t as i, r as n, n as r, i as t };

//# sourceMappingURL=precisionDate-bmQoyfr9.js.map