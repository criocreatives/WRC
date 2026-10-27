/* Accessible responder-status table. Runs after summary.js and payments.js. */
(function(){
  "use strict";
  const section=document.getElementById("roster-title")?.closest(".section");
  const list=section?.querySelector("ul.roster");
  if(!list||section.querySelector("table.roster-table"))return;
  const people=[...list.querySelectorAll("li.person")];
  if(!people.length)return;
  const style=document.createElement("style");
  style.textContent=".roster-scroll{margin-top:15px;border:1px solid var(--line);border-radius:13px;overflow-x:auto;background:#0a2329;scrollbar-color:#356c65 transparent}.roster-table{width:100%;border-collapse:collapse;text-align:left;min-width:590px;font-size:13px}.roster-table th{background:#123237;color:var(--mute);font-size:10px;letter-spacing:.07em;text-transform:uppercase;font-weight:800;padding:14px 12px;white-space:normal}.roster-table td{padding:12px;vertical-align:middle;border-top:1px solid var(--line)}.roster-table tbody tr:nth-child(2n){background:rgba(255,255,255,.025)}.roster-table td:first-child,.roster-table th:first-child{position:sticky;left:0;z-index:1;background:#0c282e;min-width:132px}.roster-table th:first-child{background:#123237;z-index:2}.roster-table tbody tr:nth-child(2n) td:first-child{background:#102b31}.roster-table .status{font-size:10px}.roster-pay{display:inline-block;border-radius:6px;padding:5px 9px;font-size:10px;font-weight:800;white-space:nowrap}.roster-pay.paid{background:#1b4835;color:#b9f5d1}.roster-pay.pending{background:#34444b;color:#e8efed}.roster-pay.exempt{background:#154746;color:#bbf4e8}.roster-pay.unknown{background:#584a31;color:#ffe6b8}.roster-issue{font-size:11px;line-height:1.4;margin-top:5px;color:#f2d8ac}.roster-table .route{font-size:12px;color:var(--mute);white-space:nowrap}@media(max-width:620px){.roster-table{min-width:545px}.roster-table td,.roster-table th{padding:11px 10px}.roster-table td:first-child,.roster-table th:first-child{min-width:125px}}";
  document.head.appendChild(style);
  const scroll=document.createElement("div");scroll.className="roster-scroll";scroll.tabIndex=0;scroll.setAttribute("role","region");scroll.setAttribute("aria-label","WRC responder status table");
  const table=document.createElement("table");table.className="roster-table";
  const head=document.createElement("thead");const hr=document.createElement("tr");
  for(const title of ["Name","Payment Status","Registration Status","Transport"]){const th=document.createElement("th");th.scope="col";th.textContent=title;hr.appendChild(th)}
  head.appendChild(hr);table.appendChild(head);
  const body=document.createElement("tbody");
  for(const item of people){
    const name=item.querySelector(".person-top strong")?.textContent?.trim()||"Participant";
    const reg=item.querySelector(".person-top .status");
    const issue=item.querySelector(".issue")?.textContent?.trim();
    const transport=item.querySelector(".transport");
    const payment=transport?.nextElementSibling?.textContent?.trim()||"";
    const paymentValue=/^(PAID|PENDING|EXEMPT)$/.test(payment)?payment:"NOT RECORDED";
    const tr=document.createElement("tr");
    const nameTd=document.createElement("td");const strong=document.createElement("strong");strong.textContent=name;nameTd.appendChild(strong);
    const paymentTd=document.createElement("td");const chip=document.createElement("span");chip.className="roster-pay "+(paymentValue==="NOT RECORDED"?"unknown":paymentValue.toLowerCase());chip.textContent=paymentValue;paymentTd.appendChild(chip);
    const regTd=document.createElement("td");if(reg)regTd.appendChild(reg.cloneNode(true));
    if(issue){const note=document.createElement("div");note.className="roster-issue";note.textContent=issue;regTd.appendChild(note)}
    const travelTd=document.createElement("td");travelTd.className="route";travelTd.textContent=transport?.textContent?.trim()||"—";
    tr.append(nameTd,paymentTd,regTd,travelTd);body.appendChild(tr);
  }
  table.appendChild(body);scroll.appendChild(table);list.replaceWith(scroll);
})();