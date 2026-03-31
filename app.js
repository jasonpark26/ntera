/* NTERA minimal static dashboard */
const DATA = {
  b50_city: "data/city_statistical_audit_bottom50_top50.csv",
  q1q5_city: "data/city_statistical_audit_q1q5.csv",
  b50_prov: "data/province_statistical_summary_bottom50_top50.csv",
  q1q5_prov: "data/province_statistical_summary_q1q5.csv",
  kpis: "data/kpis.json",
  summary: "data/summary.json"
};

function parseCSV(url){
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: reject
    });
  });
}

async function loadKPIs(){
  try{
    const r = await fetch(DATA.kpis, {cache:"no-store"});
    if(!r.ok) return;
    const k = await r.json();
    const pct = (x) => (typeof x === "number" ? `${x.toFixed(2)}%` : "—");
    const num = (x) => (typeof x === "number" ? x.toLocaleString() : "—");

    document.getElementById("kpi-desert-overall").textContent = pct(k.desert_rate_overall_pct);
    document.getElementById("kpi-desert-q1").textContent = pct(k.desert_rate_q1_pct);
    document.getElementById("kpi-desert-q5").textContent = pct(k.desert_rate_q5_pct);
    document.getElementById("kpi-rows").textContent = num(k.neighborhood_rows);
  }catch(e){}
}

async function loadSummary(){
  try{
    const r = await fetch(DATA.summary, {cache:"no-store"});
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
}

function setText(id, text){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = text;
}

function fmtSigned(x, digits=2, unit=""){
  if(typeof x !== "number" || !isFinite(x)) return "—";
  const s = x > 0 ? `+${x.toFixed(digits)}` : x.toFixed(digits);
  return unit ? `${s} ${unit}` : s;
}

function renderReport(summary){
  if(!summary) return;

  if(typeof summary.desert_rate_overall_pct === "number") setText("r-desert-overall", `${summary.desert_rate_overall_pct.toFixed(2)}%`);
  if(typeof summary.desert_rate_q1_pct === "number") setText("r-desert-q1", `${summary.desert_rate_q1_pct.toFixed(2)}%`);
  if(typeof summary.desert_rate_q5_pct === "number") setText("r-desert-q5", `${summary.desert_rate_q5_pct.toFixed(2)}%`);

  if(typeof summary.weekday_wait_non_null_pct === "number") setText("r-wait-cov", `${summary.weekday_wait_non_null_pct.toFixed(1)}%`);
  if(typeof summary.weekday_density_non_null_pct === "number") setText("r-dens-cov", `${summary.weekday_density_non_null_pct.toFixed(1)}%`);

  const b = summary.bottom50_top50 || {};
  setText("r-b50-systems", (b.systems_analyzed ?? "—").toString());
  setText("r-b50-wait", fmtSigned(b.median_wait_gap_wk, 2, "min"));
  setText("r-b50-dens", fmtSigned(b.median_dens_gap_wk, 2, "trips/km²"));

  const q = summary.q1_vs_q5 || {};
  setText("r-q-systems", (q.systems_analyzed ?? "—").toString());
  setText("r-q-wait", fmtSigned(q.median_wait_gap_wk, 2, "min"));
  setText("r-q-dens", fmtSigned(q.median_dens_gap_wk, 2, "trips/km²"));
  // Last updated
  if(typeof summary.generated_on_utc === "string"){
    const d = new Date(summary.generated_on_utc);
    if(!isNaN(d)) setText("last-updated", d.toISOString().slice(0,10));
    else setText("last-updated", summary.generated_on_utc);
  }

  // Data quality
  if(typeof summary.weekday_wait_non_null_pct === "number") setText("dq-wait-cov", `${summary.weekday_wait_non_null_pct.toFixed(1)}%`);
  if(typeof summary.weekday_density_non_null_pct === "number") setText("dq-dens-cov", `${summary.weekday_density_non_null_pct.toFixed(1)}%`);

  const qb = (summary.quality && summary.quality.bottom50_top50) ? summary.quality.bottom50_top50 : {};
  const qq = (summary.quality && summary.quality.q1_vs_q5) ? summary.quality.q1_vs_q5 : {};

  if(qb.systems_analyzed != null) setText("dq-b50-sys", qb.systems_analyzed.toString());
  if(qb.usable_wait_wk != null) setText("dq-b50-wait", qb.usable_wait_wk.toString());
  if(qb.usable_dens_wk != null) setText("dq-b50-dens", qb.usable_dens_wk.toString());

  if(qq.systems_analyzed != null) setText("dq-q-sys", qq.systems_analyzed.toString());
  if(qq.usable_wait_wk != null) setText("dq-q-wait", qq.usable_wait_wk.toString());
  if(qq.usable_dens_wk != null) setText("dq-q-dens", qq.usable_dens_wk.toString());

}

function badgeFor(metric, value){
  if(typeof value !== "number") return `<span class="badge">—</span>`;
  if(metric === "wait"){
    return value > 0 ? `<span class="badge worse">Low-income worse</span>` : (value < 0 ? `<span class="badge better">Low-income better</span>` : `<span class="badge">Neutral</span>`);
  }else{
    return value < 0 ? `<span class="badge worse">Low-income worse</span>` : (value > 0 ? `<span class="badge better">Low-income better</span>` : `<span class="badge">Neutral</span>`);
  }
}

function fmt(x, digits=2){
  if(typeof x !== "number" || !isFinite(x)) return "—";
  return x.toFixed(digits);
}

function buildTable(el, columns, rows){
  let sortKey = columns[0].key;
  let sortDir = "desc";

  function render(){
    const col = columns.find(c => c.key === sortKey) || columns[0];
    const get = col.sortAccessor || ((r)=>r[col.key]);
    const sorted = [...rows].sort((a,b)=>{
      const av = get(a), bv = get(b);
      const an = (typeof av === "number" && isFinite(av)) ? av : (av ?? "");
      const bn = (typeof bv === "number" && isFinite(bv)) ? bv : (bv ?? "");
      if(typeof an === "number" && typeof bn === "number"){
        return sortDir === "asc" ? an - bn : bn - an;
      }
      return sortDir === "asc" ? String(an).localeCompare(String(bn)) : String(bn).localeCompare(String(an));
    });

    const thead = `<thead><tr>${
      columns.map(c => `<th data-key="${c.key}">${c.label}${c.key===sortKey ? (sortDir==="asc" ? " ▲" : " ▼") : ""}</th>`).join("")
    }</tr></thead>`;

    const tbody = `<tbody>${
      sorted.map(r => `<tr>${
        columns.map(c=>{
          const v = r[c.key];
          const html = c.formatter ? c.formatter(v, r) : (v ?? "—");
          const cls = c.cls || "";
          return `<td class="${cls}">${html}</td>`;
        }).join("")
      }</tr>`).join("")
    }</tbody>`;

    el.innerHTML = thead + tbody;

    el.querySelectorAll("th").forEach(th=>{
      th.onclick = ()=>{
        const k = th.getAttribute("data-key");
        if(k === sortKey){
          sortDir = (sortDir === "asc") ? "desc" : "asc";
        }else{
          sortKey = k;
          sortDir = "desc";
        }
        render();
      };
    });
  }

  render();
}

function unique(values){
  return [...new Set(values.filter(v=>v!=null && v!==""))].sort((a,b)=>String(a).localeCompare(String(b)));
}

async function main(){
  await loadKPIs();
  const summary = await loadSummary();
  renderReport(summary);

  const comparisonSel = document.getElementById("comparison");
  const provinceSel   = document.getElementById("province");
  const metricSel     = document.getElementById("metric");
  const directionSel  = document.getElementById("direction");

  const datasets = {
    b50: {
      city: await parseCSV(DATA.b50_city),
      prov: await parseCSV(DATA.b50_prov),
    },
    q1q5: {
      city: await parseCSV(DATA.q1q5_city),
      prov: await parseCSV(DATA.q1q5_prov),
    }
  };

  const provs = unique([
    ...datasets.b50.city.map(r=>r.prov),
    ...datasets.q1q5.city.map(r=>r.prov),
  ]);
  provs.forEach(p=>{
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    provinceSel.appendChild(opt);
  });

  const provTable = document.getElementById("prov-table");
  const cityTable = document.getElementById("city-table");

  function render(){
    const mode = comparisonSel.value;
    const metric = metricSel.value;
    const prov = provinceSel.value;
    const direction = directionSel.value;

    const provRows = datasets[mode].prov
      .filter(r => (prov==="ALL" ? true : r.prov === prov));

    const cityRowsRaw = datasets[mode].city
      .filter(r => (prov==="ALL" ? true : r.prov === prov));

    const gapKey = (metric==="wait") ? "wait_gap_wk_med" : "dens_gap_wk_med";

    const cityRows = cityRowsRaw.filter(r=>{
      const v = r[gapKey];
      if(typeof v !== "number" || !isFinite(v)) return false;
      if(direction === "any") return true;
      if(metric === "wait"){
        return direction === "low_worse" ? v > 0 : v < 0;
      }else{
        return direction === "low_worse" ? v < 0 : v > 0;
      }
    });

    buildTable(provTable, [
      {key:"prov", label:"Prov"},
      {key:"cities", label:"# systems", cls:"mono"},
      {key:"median_wait_gap_wk", label:"Median wait gap (wk)", cls:"mono", formatter:(v)=>fmt(v,2)},
      {key:"median_dens_gap_wk", label:"Median density gap (wk)", cls:"mono", formatter:(v)=>fmt(v,2)},
    ], provRows);

    buildTable(cityTable, [
      {key:"city", label:"City / system"},
      {key:"prov", label:"Prov", cls:"mono"},
      {key:"neighborhoods", label:"N", cls:"mono"},
      {key:"wait_gap_wk_med", label:"Wait gap wk (min)", cls:"mono", formatter:(v)=>fmt(v,2), sortAccessor:(r)=>r[gapKey]},
      {key:"wait_gap_wk_p", label:"p (wait)", cls:"mono", formatter:(v)=>fmt(v,3)},
      {key:"dens_gap_wk_med", label:"Density gap wk", cls:"mono", formatter:(v)=>fmt(v,2)},
      {key:"dens_gap_wk_p", label:"p (dens)", cls:"mono", formatter:(v)=>fmt(v,3)},
      {key:"_badge", label:"Direction", formatter:(_, r)=>badgeFor(metric, r[gapKey])},
    ], cityRows);
  }

  render();
  [comparisonSel, provinceSel, metricSel, directionSel].forEach(el => el.onchange = render);
}

main().catch(err=>{
  console.error(err);
  const cityTable = document.getElementById("city-table");
  cityTable.innerHTML = `<tr><td style="padding:12px">Could not load data files. Make sure /data/*.csv exist in the repo.</td></tr>`;
});
