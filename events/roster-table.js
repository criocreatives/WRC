/* WRC four-column responsive icon roster. Runs after summary.js and payments.js. */
(function () {
  "use strict";
  const section = document.getElementById("roster-title")?.closest(".section");
  const list = section?.querySelector("ul.roster");
  if (!list || section.querySelector(".roster-table")) return;
  const people = [...list.querySelectorAll("li.person")];
  if (!people.length) return;

  const paths = {
    payment: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    registration: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5V3h6v1.5M9 11h6M9 15h6"/>',
    car: '<path d="m5 17-1 2v2h2v-2h12v2h2v-2l-1-2M5 17H3v-6l2-6h14l2 6v6h-2M5 17h14M3 11h18"/><path d="M7 14h1m8 0h1"/>',
    group: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4.5a4 4 0 0 1 0 7.7M22 20v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/>',
    paid: '<path d="m4 12 5 5L20 6"/>',
    pending: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    exempt: '<path d="m12 2-8 3v7c0 5 3.3 8.2 8 10 4.7-1.8 8-5 8-10V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
    good: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    unknown: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/>'
  };
  const icon = (name) => '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
  const style = document.createElement("style");
  style.textContent = `
  .roster-scroll{margin-top:13px;border:1px solid var(--line);border-radius:13px;overflow:hidden;background:#0a2329}
  .roster-table{table-layout:fixed;width:100%;min-width:0;border-collapse:collapse;text-align:left}
  .roster-table th{padding:12px 5px;color:var(--mute);background:#123237;font-size:10px;letter-spacing:.05em}
  .roster-table td{border-top:1px solid var(--line);padding:7px 5px;vertical-align:middle}
  .roster-table th:first-child,.roster-table td:first-child{width:41%;padding-left:14px;text-align:left}
  .roster-table th:not(:first-child),.roster-table td:not(:first-child){width:19.666%;text-align:center}
  .roster-table td:first-child strong{font-size:13px;line-height:1.25;display:block;overflow-wrap:anywhere}
  .roster-table tbody tr:nth-child(4n+3){background:rgba(255,255,255,.025)}
  .roster-heading-icon{display:inline-flex;color:var(--teal);align-items:center;justify-content:center;vertical-align:middle}
  .roster-heading-icon svg{width:18px;height:18px}
  .roster-state{appearance:none;border:1px solid transparent;display:inline-flex;align-items:center;justify-content:center;width:36px;height:34px;padding:0;border-radius:9px;cursor:pointer;transition:border-color .15s,background .15s}
  .roster-state:focus-visible{outline:2px solid var(--lime);outline-offset:3px}
  .roster-state:hover,.roster-state[aria-expanded="true"]{border-color:currentColor}
  .roster-state.paid,.roster-state.good{color:#b3f9c9;background:#174537}
  .roster-state.pending{color:#ffdfa0;background:#413924}
  .roster-state.exempt{color:#91f2de;background:#144b49}
  .roster-state.follow-up,.roster-state.unknown{color:#ffdc9e;background:#503b21}
  .roster-state.own{color:#adebdc;background:#19423f}
  .roster-state.carpool{color:#b2d9ff;background:#213b51}
  .roster-state svg{width:19px;height:19px;flex-shrink:0}
  .roster-detail-row td{width:auto!important;text-align:left!important;padding:12px 14px!important;background:#103337;color:#d6efe6;font-size:12px;line-height:1.6}
  .roster-detail-row strong{color:var(--lime)}
  .roster-detail-row .detail-label{color:var(--mute)}
  @media(max-width:440px){.roster-table th{padding:10px 3px}.roster-table td{padding:7px 3px}.roster-table th:first-child,.roster-table td:first-child{width:43%;padding-left:9px}.roster-table th:not(:first-child),.roster-table td:not(:first-child){width:19%}.roster-table td:first-child strong{font-size:12px}.roster-state{width:31px;height:31px}.roster-state svg{width:17px;height:17px}}
  @media(prefers-reduced-motion:reduce){.roster-state{transition:none}}
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.className = "roster-scroll";
  const table = document.createElement("table");
  table.className = "roster-table";
  table.setAttribute("aria-label", "Participants: payment, registration and transport status");
  const thead = document.createElement("thead");
  const headingRow = document.createElement("tr");
  const columns = [["Name",null],["Payment status","payment"],["Registration status","registration"],["Transport","car"]];
  for (const [label,glyph] of columns) {
    const th = document.createElement("th");
    th.scope = "col";
    th.setAttribute("aria-label",label);
    th.title = label;
    if(glyph){th.innerHTML = '<span class="roster-heading-icon">' + icon(glyph) + '</span>';}
    else th.textContent = label;
    headingRow.appendChild(th);
  }
  thead.appendChild(headingRow);table.appendChild(thead);
  const tbody = document.createElement("tbody");
  let expandedRow = null;
  const button = (glyph,css,label) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "roster-state " + css;
    el.setAttribute("aria-label",label);
    el.setAttribute("aria-expanded","false");
    el.title = label;
    el.innerHTML = icon(glyph);
    return el;
  };
  for (const item of people) {
    const name = item.querySelector(".person-top strong")?.textContent?.trim() || "Participant";
    const regTag = item.querySelector(".person-top .status");
    const needsAttention = regTag?.classList.contains("flag") || /FOLLOW-UP/i.test(regTag?.textContent || "");
    const issue = item.querySelector(".issue")?.textContent?.trim() || "";
    const transport = item.querySelector(".transport");
    const travel = transport?.textContent?.trim() || "Not recorded";
    const paymentText = transport?.nextElementSibling?.textContent?.trim().toUpperCase() || "";
    const payment = ["PAID","PENDING","EXEMPT"].includes(paymentText) ? paymentText : "NOT RECORDED";
    const paymentName = payment === "NOT RECORDED" ? "Not recorded" : payment[0]+payment.slice(1).toLowerCase();
    const registration = needsAttention ? "Follow-up needed" : "All good";
    const travelIsCarpool = /carpool/i.test(travel);
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const strong = document.createElement("strong");strong.textContent = name;nameCell.appendChild(strong);
    const paymentCell = document.createElement("td");
    const paymentButton = button(payment==="PAID"?"paid":payment==="EXEMPT"?"exempt":payment==="PENDING"?"pending":"unknown",payment.toLowerCase().replace(" ","-"),name + " — Payment status: " + paymentName);
    paymentCell.appendChild(paymentButton);
    const registrationCell = document.createElement("td");
    const registrationButton = button(needsAttention?"alert":"good",needsAttention?"follow-up":"good",name+" — Registration status: "+registration+(issue?". "+issue:""));
    registrationCell.appendChild(registrationButton);
    const travelCell = document.createElement("td");
    const travelButton = button(travelIsCarpool?"group":"car",travelIsCarpool?"carpool":"own",name+" — Transport: "+travel);
    travelCell.appendChild(travelButton);
    row.append(nameCell,paymentCell,registrationCell,travelCell);
    const buttons = [paymentButton,registrationButton,travelButton];
    const reveal = () => {
      const isOpen = expandedRow?.previousElementSibling === row;
      if(expandedRow){expandedRow.remove();expandedRow=null;}
      tbody.querySelectorAll('.roster-state[aria-expanded="true"]').forEach(b=>b.setAttribute("aria-expanded","false"));
      if(isOpen)return;
      const details = document.createElement("tr");details.className="roster-detail-row";
      const cell = document.createElement("td");cell.colSpan=4;
      const lines = [[ "Payment",paymentName],["Registration",registration],["Transport",travel]];
      const b=document.createElement("strong");b.textContent=name;cell.appendChild(b);
      for(const [heading,value] of lines){
        const div=document.createElement("div");const label=document.createElement("span");label.className="detail-label";label.textContent=heading+": ";
        div.append(label,document.createTextNode(value));cell.appendChild(div);
      }
      if(issue){const div=document.createElement("div");const label=document.createElement("span");label.className="detail-label";label.textContent="Follow-up: ";div.append(label,document.createTextNode(issue));cell.appendChild(div);}
      details.appendChild(cell);row.insertAdjacentElement("afterend",details);expandedRow=details;
      buttons.forEach(btn=>btn.setAttribute("aria-expanded","true"));
    };
    buttons.forEach(btn=>btn.addEventListener("click",reveal));
    tbody.appendChild(row);
  }
  table.appendChild(tbody);wrapper.appendChild(table);list.replaceWith(wrapper);
})();