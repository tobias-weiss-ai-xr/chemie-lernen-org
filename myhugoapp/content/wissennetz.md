---
title: 'Wissensnetz Graph'
description: 'Interaktive Visualisierung der Wissensverbindungen zwischen Fachbegriffen und Artikeln'
date: 2026-06-11
aliases: [/entity/graph/]
weight: 10
---

<style>
#kg-controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding:10px;background:#f8f9fa;border-radius:8px;align-items:center;}
#kg-controls label{font-size:0.85rem;font-weight:600;margin-right:4px;color:#555;}
.kg-filter-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border:1px solid #ddd;border-radius:14px;background:#fff;cursor:pointer;font-size:0.8rem;transition:all 0.2s;user-select:none;}
.kg-filter-chip:hover{border-color:#999;}
.kg-filter-chip.active{color:#fff;border-color:currentColor;}
.kg-filter-chip .kg-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
@media(prefers-color-scheme:dark){
#kg-controls{background:#2a2a2a;}
#kg-controls label{color:#ccc;}
.kg-filter-chip{background:#333;border-color:#555;color:#ddd;}
.kg-filter-chip:hover{border-color:#888;}
}
</style>
<div id="kg-controls">
<label>Kategorien:</label>
</div>
<div id="kg-app" style="width:100%;height:700px;border:1px solid #ddd;border-radius:8px;background:#fafafa;position:relative;">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
<div class="spinner-border text-primary mb-3" role="status"><span class="visually-hidden">Loading...</span></div>
<h5>Lade Wissensnetz...</h5>
</div>
</div>
<script>
(function(){ // Lazy D3 loader
var d3Script=document.createElement("script");
d3Script.src="https://d3js.org/d3.v7.min.js";
d3Script.onload=function(){main();};
d3Script.onerror=function(){document.getElementById("kg-app").innerHTML='<p style="padding:2em;color:#888;">Graph-Bibliothek konnte nicht geladen werden.</p>';};
document.head.appendChild(d3Script);
async function main(){
var container=document.getElementById("kg-app");
var controls=document.getElementById("kg-controls");
try{
var res=await fetch("/api/kg-data",{signal:AbortSignal.timeout(15000)});
if(!res.ok)throw new Error(res.status);
var data=await res.json();
}catch(e){
container.innerHTML='<p style="padding:2em;color:#888;">Wissensnetz konnte nicht geladen werden.</p>';
return;
}
var catColors={stoff:"#667eea",methode:"#f093fb",reaktion:"#4ecdc4",konzept:"#45b7d1",person:"#ff9a76",quelle:"#a8a8a8"};
var catLabels={stoff:"Stoff",konzept:"Konzept",reaktion:"Reaktion",methode:"Methode",person:"Person",quelle:"Quelle"};
var activeCategories={stoff:true,konzept:true,reaktion:true,methode:true,person:true,quelle:true};
// Build filter chips
Object.keys(catLabels).forEach(function(cat){
var chip=document.createElement("span");
chip.className="kg-filter-chip active";
chip.dataset.cat=cat;
chip.style.color=catColors[cat];
chip.style.borderColor=catColors[cat];
chip.innerHTML='<span class="kg-dot" style="background:'+catColors[cat]+'"></span>'+catLabels[cat];
chip.addEventListener("click",function(){
var isActive=activeCategories[cat];
activeCategories[cat]=!isActive;
if(activeCategories[cat]){chip.classList.add("active");chip.style.color=catColors[cat];chip.style.borderColor=catColors[cat];}
else{chip.classList.remove("active");chip.style.color="#999";chip.style.borderColor="#ddd";}
updateVisibility();
});
controls.appendChild(chip);
});
// Page/Article filter chip
var _pageActive=true;
var pageChip=document.createElement("span");
pageChip.className="kg-filter-chip active";
pageChip.style.color="#2ecc71";pageChip.style.borderColor="#2ecc71";
pageChip.innerHTML='<span class="kg-dot" style="background:#2ecc71"></span>Artikel';
pageChip.addEventListener("click",function(){_pageActive=!_pageActive;if(_pageActive){pageChip.classList.add("active");pageChip.style.color="#2ecc71";pageChip.style.borderColor="#2ecc71";}else{pageChip.classList.remove("active");pageChip.style.color="#999";pageChip.style.borderColor="#ddd";}updateVisibility();});
controls.appendChild(pageChip);
var nodes=[],links=[],emap=new Map();
data.entities.forEach(function(e){
var conns=(e.relatedEntities||[]).length;
var n={id:e.id,label:e.name,type:"entity",category:e.category,
size:Math.max(6,Math.min(25,Math.sqrt(conns+1)*5+(e.articleCount||0)*2)),
count:e.articleCount||0,components:e.components||[]};
nodes.push(n);emap.set(e.name,n);
});
data.articles.forEach(function(a){
var isPage=a.type==="page";
var n={id:a.id,label:a.title,type:isPage?"page":"article",size:isPage?4:3,url:a.url};
nodes.push(n);
(a.entities||[]).forEach(function(en){var e=emap.get(en);if(e){links.push({source:e.id,target:n.id,type:"entity-article"});}});
});
var compLinks=[];
data.entities.forEach(function(e){
if(e.components){e.components.forEach(function(comp){
var c=emap.get(comp);if(c)compLinks.push({source:e.id,target:c.id,type:"composition"});
});}
});
links=links.concat(compLinks);
container.innerHTML="";
var w=container.clientWidth,h=700;
var svg=d3.select("#kg-app").append("svg").attr("width",w).attr("height",h).style("cursor","grab");
var g=svg.append("g");
svg.call(d3.zoom().scaleExtent([0.1,8]).on("zoom",function(ev){g.attr("transform",ev.transform)}));
var legend=svg.append("g").attr("transform","translate(10,10)").style("font-size","11px").style("pointer-events","none");
var li=0;
[{label:"Stoff",color:"#667eea"},{label:"Konzept",color:"#45b7d1"},{label:"Reaktion",color:"#4ecdc4"},
{label:"Methode",color:"#f093fb"},{label:"Person",color:"#ff9a76"}].forEach(function(item){
legend.append("circle").attr("cx",6).attr("cy",6+li*18).attr("r",5).attr("fill",item.color);
legend.append("text").attr("x",16).attr("y",10+li*18).text(item.label).attr("fill","#555");
li++;
});
legend.append("line").attr("x1",0).attr("y1",6+li*18).attr("x2",12).attr("y2",6+li*18).attr("stroke","#e74c3c").attr("stroke-dasharray","3,2");
legend.append("text").attr("x",16).attr("y",10+li*18).text("Besteht aus").attr("fill","#555");
li++;
legend.append("circle").attr("cx",6).attr("cy",6+li*18).attr("r",3).attr("fill","#999");
legend.append("text").attr("x",16).attr("y",10+li*18).text("Artikel").attr("fill","#555");
li++;
legend.append("rect").attr("x",2).attr("y",2+li*18).attr("width",8).attr("height",8).attr("fill","#2ecc71").attr("rx",1);
legend.append("text").attr("x",16).attr("y",10+li*18).text("Grundlage").attr("fill","#555");
var statsText=data.source+" | "+data.entities.length+" Begriffe | "+data.articles.length+" Dokumente";
legend.append("text").attr("x",0).attr("y",18+li*18).text(statsText).attr("fill","#999").style("font-size","10px");
var link=g.append("g").selectAll("line").data(links).enter().append("line")
.attr("stroke",function(d){return d.type==="composition"?"#e74c3c":"#ccc"})
.attr("stroke-width",function(d){return d.type==="composition"?1.5:0.8})
.attr("stroke-dasharray",function(d){return d.type==="composition"?"4,2":null})
.attr("stroke-opacity",function(d){return d.type==="composition"?0.7:0.4});
var node=g.append("g").selectAll("circle").data(nodes).enter().append("circle")
.attr("r",function(d){return d.size||4})
.attr("fill",function(d){
if(d.type==="page")return"#2ecc71";if(d.type==="article")return"#999";
return catColors[d.category]||"#667eea";
})
.attr("stroke","#fff").attr("stroke-width",1).style("cursor","pointer").style("opacity",0.85)
.on("mouseover",function(ev,d){
d3.select(this).transition().duration(200).attr("r",(d.size||4)*1.3).style("opacity",1);
var connected=new Set();
links.forEach(function(l){if(l.source.id===d.id)connected.add(l.target.id);if(l.target.id===d.id)connected.add(l.source.id);});
node.style("opacity",function(n){return connected.has(n.id)?1:0.2});
link.style("stroke-opacity",function(l){
return(l.source.id===d.id||l.target.id===d.id)?0.8:0.1});
})
.on("mouseout",function(ev,d){
d3.select(this).transition().duration(200).attr("r",d.size||4).style("opacity",0.85);
node.style("opacity",0.85);link.style("stroke-opacity",function(d){return d.type==="composition"?0.7:0.4});
})
.on("click",function(ev,d){if(d.url)window.open(d.url,"_blank")});
var labels=g.append("g").selectAll("text").data(nodes.filter(function(d){return d.type==="entity"&&d.size>=8})).enter().append("text")
.text(function(d){return d.label}).attr("font-size","10px").attr("dx",function(d){return d.size+3}).attr("dy",3)
.attr("fill","#444").style("pointer-events","none").style("text-shadow","0 0 3px #fafafa,0 0 3px #fafafa");
function updateVisibility(){
node.style("display",function(d){
if(d.type==="page"||d.type==="article")return _pageActive?null:"none";
return activeCategories[d.category]!==false?null:"none";
});
link.style("display",function(d){
var srcNode=typeof d.source==="object"?d.source:nodes.find(function(n){return n.id===d.source;});
var tgtNode=typeof d.target==="object"?d.target:nodes.find(function(n){return n.id===d.target;});
if(!srcNode||!tgtNode)return"none";
if(srcNode.type==="page"||srcNode.type==="article")return _pageActive?null:"none";
if(tgtNode.type==="page"||tgtNode.type==="article")return _pageActive?null:"none";
if(activeCategories[srcNode.category]!==false&&activeCategories[tgtNode.category]!==false)return null;
return"none";
});
}
var tooltip=g.append("g").style("display","none");
tooltip.append("rect").attr("rx",4).attr("fill","#fff").attr("stroke","#ddd").style("filter","drop-shadow(0 1px 2px rgba(0,0,0,0.1))");
tooltip.append("text").attr("dy","1.2em").attr("x",8).style("font-size","12px").attr("fill","#333");
node.on("mouseover.tooltip",function(ev,d){
if(d.type!=="entity")return;
var txt=d.label+" ("+d.category+") ["+d.count+" Dok.]";
if(d.components&&d.components.length)txt+=" | Besteht aus: "+d.components.slice(0,5).join(", ");
var bbox=tooltip.select("text").text(txt).node().getBBox();
tooltip.select("rect").attr("width",bbox.width+16).attr("height",bbox.height+10);
tooltip.style("display",null).attr("transform","translate("+ev.x+","+(ev.y-d.size-10)+")");
})
.on("mouseout.tooltip",function(){tooltip.style("display","none")});
d3.forceSimulation(nodes)
.force("link",d3.forceLink(links).id(function(d){return d.id}).distance(function(d){return d.type==="composition"?60:100}).strength(0.3))
.force("charge",d3.forceManyBody().strength(-150))
.force("center",d3.forceCenter(w/2,h/2))
.force("collision",d3.forceCollide().radius(function(d){return(d.size||4)+3}))
.force("x",d3.forceX(w/2).strength(0.01))
.force("y",d3.forceY(h/2).strength(0.01))
.alphaDecay(0.02)
.on("tick",function(){
link.attr("x1",function(d){return isNaN(d.source.x)?0:d.source.x}).attr("y1",function(d){return isNaN(d.source.y)?0:d.source.y})
.attr("x2",function(d){return isNaN(d.target.x)?0:d.target.x}).attr("y2",function(d){return isNaN(d.target.y)?0:d.target.y});
node.attr("cx",function(d){return isNaN(d.x)?0:d.x}).attr("cy",function(d){return d.y});
labels.attr("x",function(d){return isNaN(d.x)?0:d.x}).attr("y",function(d){return d.y});
});
})(); // end main
})(); // end lazy loader IIFE
</script>
