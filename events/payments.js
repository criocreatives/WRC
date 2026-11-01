/* WRC RafJam payment snapshot — reconciled with private Payments tab on 1 November 2026.
   Display abbreviated names only; no contacts, receipts, or private notes. */
(function(){
 "use strict";
 const root=document.getElementById("current-events");
 if(!root)return;
 const registration=root.querySelector("#snapshot-title")?.closest(".section");
 if(!registration)return;
 const statuses=new Map([["Lisa-Gaye","Paid"],["Marsha-Gaye W.","Paid"],["Randall R.","Exempt"],["Roberto E.","Paid"],["Toni-Ann S.","Paid"],["Venessa C.","Paid"],["Andre F.","Paid"],["Anna-Marie O.","Paid"],["Charlette R.","Paid"],["Christina D.","Paid"],["Karen O.","Paid"],["Krisann T.","Paid"],["Shantae L.","Paid"],["Siobhan D.","Paid"],["Tenelle C.","Paid"],["Brittany B.","Exempt"],["Joel N.","Exempt"],["Lyrae M.","Exempt"],["Romario L.","Exempt"],["Shane G.","Exempt"]]);
 const totals={Paid:0,Pending:0,Exempt:0,Unrecorded:0};
 root.querySelectorAll(".person").forEach(person=>{
   const name=person.querySelector(".person-top strong")?.textContent?.trim();
   const transport=person.querySelector(".transport");
   if(!name||!transport)return;
   const status=statuses.get(name)||"Not recorded";
   if(status==="Not recorded")totals.Unrecorded++;
   else if(Object.prototype.hasOwnProperty.call(totals,status))totals[status]++;
   person.querySelectorAll("span").forEach(el=>{
     if(el.textContent.trim()==="CORE MEMBER · FEE EXEMPT")el.remove();
   });
   const indicator=document.createElement("span");
   indicator.style.cssText="display:inline-block;margin-top:6px;padding:4px 8px;border-radius:7px;font-size:10px;font-weight:800;background:"+
     (status==="Exempt"?"#154c4a":status==="Paid"?"#255b38":status==="Pending"?"#35434a":"#55442d")+";color:#e8f7ec";
   indicator.textContent=status.toUpperCase();
   transport.insertAdjacentElement("afterend",indicator);
 });
 const section=document.createElement("section");
 section.className="section";
 const title=document.createElement("h3");title.textContent="PAYMENT STATUS.";
 const metrics=document.createElement("div");metrics.className="metrics";
 for(const [key,label] of [["Paid","PAID"],["Pending","PENDING"],["Exempt","CORE EXEMPT"]]){
   const tile=document.createElement("div");tile.className="metric";
   const num=document.createElement("strong");num.textContent=String(totals[key]);
   const desc=document.createElement("span");desc.textContent=label;
   tile.append(num,desc);metrics.appendChild(tile);
 }
 const note=document.createElement("p");note.className="muted";
 note.textContent="Payments tab rechecked November 1, 2026: 13 Paid, 6 Exempt, and 1 Pending (excluded from active attendance). Siobhan D. remains organiser-confirmed Paid but has no Payments-tab entry."+
   (totals.Unrecorded?" "+totals.Unrecorded+" registration(s) have no payment record.":"");
 section.append(title,metrics,note);
 registration.insertAdjacentElement("afterend",section);
})();