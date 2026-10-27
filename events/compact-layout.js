/* WRC mobile-first hierarchy: compact overview, roster first, details on demand. */
(function(){
 "use strict";
 const root=document.getElementById("current-events");
 if(!root||root.querySelector(".wrc-quick-stats"))return;
 const wrap=root.closest(".wrap");
 const hero=root.querySelector(".event-hero");
 const reg=root.querySelector("#snapshot-title")?.closest(".section");
 const roster=root.querySelector("#roster-title")?.closest(".section");
 const paymentSection=[...root.querySelectorAll(":scope > .section")].find(s=>s.querySelector("h3")?.textContent.trim()==="PAYMENT STATUS.");
 if(!hero||!reg||!roster)return;
 if(wrap)wrap.classList.add("wrc-compact");

 const css=document.createElement("style");
 css.textContent=`
 .wrc-compact .heading{padding:14px 0 0}
 .wrc-compact .heading .kicker,.wrc-compact .heading .lede{display:none}
 .wrc-compact .heading h1{font-size:clamp(29px,5vw,41px);margin:5px 0 7px;line-height:1}
 .wrc-compact .event-hero{margin-top:8px;padding:14px 16px;border-radius:14px}
 .wrc-compact .event-hero h2{font-size:clamp(30px,6vw,42px);margin:4px 0 1px}
 .wrc-compact .event-hero p{margin:3px 0 10px;font-size:12px}
 .wrc-compact .event-hero .chip{font-size:10px;padding:5px 7px;border-radius:6px}
 .wrc-compact .chips{gap:5px}
 .wrc-quick-stats{margin-top:11px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
 .wrc-quick-stats .quick-stat{border:1px solid var(--line);background:#0d2a2e;border-radius:9px;padding:10px 5px 9px;text-align:center;min-width:0}
 .wrc-quick-stats strong{display:block;font-size:clamp(19px,3vw,29px);line-height:1.15;font-variant-numeric:tabular-nums}
 .wrc-quick-stats span{display:block;color:var(--mute);font-size:9px;font-weight:700;line-height:1.3;letter-spacing:.02em;margin-top:2px;text-transform:uppercase}
 .wrc-compact .wrc-roster-main{margin-top:16px}
 .wrc-compact #roster-title{font-size:21px;margin-bottom:8px}
 .wrc-compact .roster-scroll{margin-top:8px}
 .wrc-more{margin-top:16px;border:1px solid var(--line);border-radius:13px;background:#09232a;overflow:hidden}
 .wrc-more>summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;list-style:none;padding:14px 17px;font-size:12px;letter-spacing:.05em;font-weight:800}
 .wrc-more>summary::-webkit-details-marker{display:none}
 .wrc-more>summary::after{content:"+";font-size:22px;line-height:.7;color:var(--lime);font-weight:500}
 .wrc-more[open]>summary::after{content:"−"}
 .wrc-more>summary:focus-visible{outline:2px solid var(--lime);outline-offset:-3px}
 .wrc-more .wrc-detail-body{padding:0 14px 18px;border-top:1px solid var(--line)}
 .wrc-more .wrc-detail-body>.section{margin-top:20px}
 .wrc-more .wrc-detail-body>.section h3{font-size:19px}
 .wrc-more .wrc-detail-body .info{padding:12px}
 .wrc-more .wrc-detail-body .info .value{font-size:22px}
 .wrc-more .wrc-detail-body>.muted{display:block;margin:14px 0 2px}
 .wrc-compact footer{margin-top:23px}
 @media(max-width:620px){
   .wrc-compact .heading{padding-top:8px}
   .wrc-compact .heading h1{font-size:31px;margin:2px 0 6px}
   .wrc-compact .event-hero{padding:12px 13px}
   .wrc-compact .event-hero h2{font-size:30px}
   .wrc-compact .event-hero .kicker{font-size:9px}
   .wrc-compact .event-hero .chip{font-size:9px;padding:4px 5px}
   .wrc-quick-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
   .wrc-quick-stats .quick-stat{padding:7px 3px}
   .wrc-quick-stats strong{font-size:22px}
   .wrc-quick-stats span{font-size:9px}
   .wrc-compact .wrc-roster-main{margin-top:13px}
   .wrc-more>summary{padding:13px}
 }
 `;
 document.head.appendChild(css);

 const overview=document.createElement("section");
 overview.className="wrc-quick-stats";
 overview.setAttribute("aria-label","Event status overview");
 const stats=[...reg.querySelectorAll(".metric"),...(paymentSection?[...paymentSection.querySelectorAll(".metric")]:[])];
 for(const src of stats){
   const item=document.createElement("div");item.className="quick-stat";
   const n=document.createElement("strong");n.textContent=src.querySelector("strong")?.textContent?.trim()||"—";
   const label=document.createElement("span");label.textContent=src.querySelector("span")?.textContent?.trim()||"Status";
   item.append(n,label);overview.appendChild(item);
 }
 hero.insertAdjacentElement("afterend",overview);
 overview.insertAdjacentElement("afterend",roster);
 roster.classList.add("wrc-roster-main");
 reg.hidden=true;reg.style.display="none";
 if(paymentSection){paymentSection.hidden=true;paymentSection.style.display="none";}

 const more=document.createElement("details");more.className="wrc-more";
 const summary=document.createElement("summary");summary.textContent="MORE EVENT DETAILS";
 const body=document.createElement("div");body.className="wrc-detail-body";
 const rosterNote=roster.querySelector(":scope > p.muted");
 if(rosterNote)body.appendChild(rosterNote);
 const other=[...root.children].filter(s=>s.matches("section.section")&&s!==reg&&s!==paymentSection&&s!==roster);
 for(const section of other)body.appendChild(section);
 more.append(summary,body);
 roster.insertAdjacentElement("afterend",more);
})();