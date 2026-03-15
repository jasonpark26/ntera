const DATA={b50_city:"data/city_statistical_audit_bottom50_top50.csv",q1q5_city:"data/city_statistical_audit_q1q5.csv",b50_prov:"data/province_statistical_summary_bottom50_top50.csv",q1q5_prov:"data/province_statistical_summary_q1q5.csv",kpis:"data/kpis.json"};
function parseCSV(url){return new Promise((resolve,reject)=>{Papa.parse(url,{download:true,header:true,dynamicTyping:true,skipEmptyLines:true,complete:(res)=>resolve(res.data),error:reject});});}
async function loadKPIs(){try{const r=await fetch(DATA.kpis,{cache:"no-store"});if(!r.ok)return;const k=await r.json();const pct=(x)=>(typeof x==="number"?`${x.toFixed(2)}%`:"—");const num=(x)=>(typeof x==="number"?x.toLocaleString():"—");
document.getElementById("kpi-desert-overall").textContent=pct(k.desert_rate_overall_pct);
document.getElementById("kpi-desert-q1").textContent=pct(k.desert_rate_q1_pct);
document.getElementById("kpi-desert-q5").textContent=pct(k.desert_rate_q5_pct);
document.getElementById("kpi-rows").textContent=num(k.neighborhood_rows);}catch(e){}}
function badgeFor(metric,value){if(typeof value!=="number")return `<span class="badge">—</span>`;
if(metric==="wait"){return value>0?`<span class="badge worse">Low-income worse</span>`:(value<0?`<span class="badge better">Low-income better</span>`:`<span class="badge">Neutral</span>`);}
return value<0?`<span class="badge worse">Low-income worse</span>`:(value>0?`<span class="badge better">Low-income better</span>`:`<span class="badge">Neutral</span>`);}
function fmt(x,d=2){if(typeof x!=="number"||!isFinite(x))return "—";return x.toFixed(d);}
function buildTable(el,columns,rows){let sortKey=columns[0].key;let sortDir="desc";
function render(){const col=columns.find(c=>c.key===sortKey)||columns[0];const get=col.sortAccessor||((r)=>r[col.key]);
const sorted=[...rows].sort((a,b)=>{const av=get(a),bv=get(b);const an=(typeof av==="number"&&isFinite(av))?av:(av??"");const bn=(typeof bv==="number"&&isFinite(bv))?bv:(bv??"");
if(typeof an==="number"&&typeof bn==="number")return sortDir==="asc"?an-bn:bn-an;return sortDir==="asc"?String(an).localeCompare(String(bn)):String(bn).localeCompare(String(an));});
const thead=`<thead><tr>${columns.map(c=>`<th data-key="${c.key}">${c.label}${c.key===sortKey?(sortDir==="asc"?" ▲":" ▼"):""}</th>`).join("")}</tr></thead>`;
const tbody=`<tbody>${sorted.map(r=>`<tr>${columns.map(c=>{const v=r[c.key];const html=c.formatter?c.formatter(v,r):(v??"—");return `<td class="${c.cls||""}">${html}</td>`;}).join("")}</tr>`).join("")}</tbody>`;
el.innerHTML=thead+tbody;el.querySelectorAll("th").forEach(th=>{th.onclick=()=>{const k=th.getAttribute("data-key");if(k===sortKey)sortDir=(sortDir==="asc")?"desc":"asc";else{sortKey=k;sortDir="desc";}render();};});}
render();}
function unique(vals){return [...new Set(vals.filter(v=>v!=null&&v!==""))].sort((a,b)=>String(a).localeCompare(String(b)));}
async function main(){await loadKPIs();
const comparisonSel=document.getElementById("comparison");
const provinceSel=document.getElementById("province");
const metricSel=document.getElementById("metric");
const directionSel=document.getElementById("direction");
const datasets={b50:{city:await parseCSV(DATA.b50_city),prov:await parseCSV(DATA.b50_prov)},q1q5:{city:await parseCSV(DATA.q1q5_city),prov:await parseCSV(DATA.q1q5_prov)}};
unique([...datasets.b50.city.map(r=>r.prov),...datasets.q1q5.city.map(r=>r.prov)]).forEach(p=>{const opt=document.createElement("option");opt.value=p;opt.textContent=p;provinceSel.appendChild(opt);});
const provTable=document.getElementById("prov-table");const cityTable=document.getElementById("city-table");
function render(){const mode=comparisonSel.value;const metric=metricSel.value;const prov=provinceSel.value;const direction=directionSel.value;
const provRows=datasets[mode].prov.filter(r=>(prov==="ALL"?true:r.prov===prov));
const cityRowsRaw=datasets[mode].city.filter(r=>(prov==="ALL"?true:r.prov===prov));
const gapKey=(metric==="wait")?"wait_gap_wk_med":"dens_gap_wk_med";
const cityRows=cityRowsRaw.filter(r=>{const v=r[gapKey];if(typeof v!=="number"||!isFinite(v))return false;
if(direction==="any")return true;
if(metric==="wait")return direction==="low_worse"?v>0:v<0;
return direction==="low_worse"?v<0:v>0;});
buildTable(provTable,[{key:"prov",label:"Prov"},{key:"cities",label:"# systems",cls:"mono"},{key:"median_wait_gap_wk",label:"Median wait gap (wk)",cls:"mono",formatter:(v)=>fmt(v,2)},{key:"median_dens_gap_wk",label:"Median density gap (wk)",cls:"mono",formatter:(v)=>fmt(v,2)}],provRows);
buildTable(cityTable,[{key:"city",label:"City / system"},{key:"prov",label:"Prov",cls:"mono"},{key:"neighborhoods",label:"N",cls:"mono"},
{key:"wait_gap_wk_med",label:"Wait gap wk (min)",cls:"mono",formatter:(v)=>fmt(v,2),sortAccessor:(r)=>r[gapKey]},
{key:"wait_gap_wk_p",label:"p (wait)",cls:"mono",formatter:(v)=>fmt(v,3)},
{key:"dens_gap_wk_med",label:"Density gap wk",cls:"mono",formatter:(v)=>fmt(v,2)},
{key:"dens_gap_wk_p",label:"p (dens)",cls:"mono",formatter:(v)=>fmt(v,3)},
{key:"_badge",label:"Direction",formatter:(_,r)=>badgeFor(metric,r[gapKey])}],cityRows);}
render();
[comparisonSel,provinceSel,metricSel,directionSel].forEach(el=>el.onchange=render);}
main().catch(err=>{console.error(err);document.getElementById("city-table").innerHTML=`<tr><td style="padding:12px">Could not load /data CSVs. Add them to the repo.</td></tr>`;});