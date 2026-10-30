/* WRC event detail extension — current RafJam planning snapshot */
(function(){
 "use strict";
 const active=document.getElementById("current-events");
 if(!active)return;
 const $=(s)=>active.querySelector(s);
 const registration=$('#snapshot-title')?.closest('.section');
 const logistics=$('#logistics-title')?.closest('.section');
 const roster=$('#roster-title')?.closest('.section');
 if(!registration||!logistics||!roster)return;
 const add=(anchor,markup)=>anchor.insertAdjacentHTML("afterend",markup);
 const experience='<section class="section"><h3>EXPERIENCE BREAKDOWN.</h3><div class="info" style="display:grid;gap:13px">'+
   [['Occasional hikers',13],['Regular hikers',2],['First-time hikers',2]].map(([n,v])=>'<div><div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:5px"><span>'+n+'</span><b>'+v+' ('+Math.round(v/17*100)+'%)</b></div><div style="height:9px;border-radius:50px;background:#24494a;overflow:hidden"><div style="height:100%;width:'+(v/17*100)+'%;border-radius:50px;background:linear-gradient(90deg,#c9ff3d,#15e6c1)"></div></div></div>').join('')+'</div></section>';
 add(registration,experience);
 const money='<section class="section"><h3>FINANCIAL OUTLOOK.</h3><div class="info-grid">'+
 '<div class="info"><div class="kicker">POTENTIAL FEE REVENUE</div><span class="value">J$60,000</span><p>12 non-core registrations × J$5,000. Five registered core members are exempt.</p></div>'+
 '<div class="info"><div class="kicker">PAID IN TRACKER</div><span class="value">J$40,000</span><p>8 non-core registrations marked Paid; no independent receipt verification.</p></div>'+ 
 '<div class="info"><div class="kicker">REFRESHMENTS · 20 KITS</div><span class="value">J$9,000–13,000</span><p>17 hikers plus 3 spares · J$450–650 per kit</p></div>'+
 '</div><p style="font-size:12px;color:var(--mute);line-height:1.6">Potential revenue is not confirmed collections. The form does not record payments. Eleven hikers making their own way does not imply eleven cars; confirm drivers and parking capacity.</p></section>';
 add(logistics,money);
 const reviews='<section class="section"><h3>ITEMS REQUIRING ATTENTION.</h3><div class="info-grid">'+
 [['Charlette R.','Verify emergency-contact number'],['Randall R.','Confirm membership category privately']].map(([n,msg])=>'<div class="info" style="border-color:#695337"><b style="color:#ffdfa8">'+n+'</b><p>'+msg+'.</p></div>').join('')+
 '</div><p style="color:var(--mute);font-size:12px;line-height:1.6">All 17 active hikers submitted the required acknowledgements and confirmed comfort with the route. Resolve any corrections privately.</p><p style="color:var(--mute);font-size:12px"><b>Payments:</b> Friday, October 30 · <b>Hike:</b> Sunday, November 1</p></section>';
 add(roster,reviews);
 const core=new Set(['Lyrae M.','Romario L.','Joel N.','Shane G.','Brittany B.']);
 active.querySelectorAll('.person').forEach(item=>{
   const name=item.querySelector('strong')?.textContent?.trim();
   if(core.has(name)){
     const t=item.querySelector('.transport');
     if(t)t.insertAdjacentHTML('afterend','<span style="display:block;margin-top:4px;font-size:10px;font-weight:800;color:#c9ff3d">CORE MEMBER · FEE EXEMPT</span>');
   }
 });
 const reminder=logistics.querySelector('.info-grid .info:last-child p');
 if(reminder)reminder.textContent='Payment deadline for non-core participants. J$5,000 per paying hiker; core members exempt. No payment receipts are tracked here.';
})();
/* Match expanded text colors to the status controls without exposing extra data. */
document.addEventListener("click",function(event){
 const trigger=event.target.closest?.(".roster-table .roster-state");
 if(!trigger)return;
 const row=trigger.closest("tr"),next=row?.nextElementSibling;
 if(!next?.classList.contains("roster-detail-row"))return;
 const values=next.querySelectorAll("td > div");
 const icons=row.querySelectorAll(".roster-state");
 icons.forEach((status,i)=>{if(values[i])values[i].style.color=getComputedStyle(status).color});
 if(values[3]&&icons[1])values[3].style.color=getComputedStyle(icons[1]).color;
});
