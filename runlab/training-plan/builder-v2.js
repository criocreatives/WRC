/* RUNLAB training-plan builder: guided, fitness-based, conservative progression. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const round=n=>Math.round(n*10)/10;
const km=n=>round(n).toFixed(1)+' km';
const pad=n=>String(n).padStart(2,'0');
const mins=n=>Math.max(1,Math.round(n))+' min';
const fmtPace=s=>{const v=Math.max(1,Math.round(s/5)*5);return Math.floor(v/60)+':'+pad(v%60)};
const paceBands={easy:[1.23,1.43],long:[1.27,1.49],recovery:[1.36,1.60],tempo:[1.08,1.15],intervals:[0.98,1.06]};
const effortBands={easy:'easy conversation · RPE 3–4/10',long:'comfortable conversation · RPE 3–4/10',recovery:'very gentle · RPE 2–3/10',tempo:'comfortably hard · RPE 6–7/10',intervals:'strong but controlled · RPE 7–8/10'};
let basePace=null,runNumber=0;
function pace(type){
 if(!basePace)return effortBands[type]||effortBands.easy;
 const [lo,hi]=paceBands[type]||paceBands.easy;
 return fmtPace(basePace*lo)+'–'+fmtPace(basePace*hi)+'/km';
}
function timeRange(distance,type){
 if(!basePace)return '';
 const [lo,hi]=paceBands[type]||paceBands.easy;
 return 'Approx. '+Math.floor(distance*basePace*lo/60)+'–'+Math.ceil(distance*basePace*hi/60)+' min total';
}
function clock(h,m,s){return Number($(h).value)*3600+Number($(m).value)*60+Number($(s).value)}
function selected(name){return document.querySelector('input[name="'+name+'"]:checked')?.value||''}
function wireRange(id,label,suffix){
 const el=$(id),out=$(label);
 const sync=()=>out.textContent=el.value+suffix;
 el.addEventListener('input',sync,{passive:true});el.addEventListener('change',sync);sync();
}
wireRange('days','daysOut',' / WK');wireRange('km','kmOut',' KM');wireRange('long','longOut',' KM');
const dateEl=$('date');
if(!dateEl.value){
 const date=new Date();date.setDate(date.getDate()+56);
 dateEl.value=date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
}
function syncBenchmark(){$('benchmarkTimeField').style.display=selected('bench')==='none'?'none':'block'}
document.querySelectorAll('input[name="bench"]').forEach(x=>x.addEventListener('change',syncBenchmark));
syncBenchmark();
function timeLeft(){
 const date=new Date(dateEl.value+'T12:00:00');
 const now=new Date();now.setHours(12,0,0,0);
 return (date-now)/604800000;
}
function readiness(T,K,L,D){
 const base=T>=42?16:T>=21?12:T>=10?8:6;
 const beginner=K<8||L<3;
 const newbie=T>=42?28:T>=21?20:T>=10?14:10;
 const volumeGoal=T>=42?42:T>=21?28:T>=10?19:12;
 const longGoal=T>=42?26:T>=21?16:T>=10?8:4;
 function steps(value,goal,long){
  if(value<=0)return newbie;
  let v=value,w=0;
  while(v<goal&&w<52){
   w++;
   if(w%4!==0)v=long?Math.min(v*1.09+.25,v+1.2):v*1.075;
  }
  return w+2;
 }
 return {beginner,required:Math.max(beginner?newbie:base,steps(K,volumeGoal,false),steps(L,longGoal,true))};
}
function allowedDays(D,K,L){
 return Math.min(D,K<8||L<3?3:K<15?3:K<25?4:K<40?5:K<55?6:7);
}
function preview(){
 const area=$('readinessPrecheck');
 if(!area)return;
 const remain=timeLeft(),T=Number(selected('target')),K=Number($('km').value),L=Number($('long').value);
 if(!Number.isFinite(remain)||remain<=0){area.classList.remove('good');area.textContent='Choose a future race date to assess your preparation window.';return}
 const ready=readiness(T,K,L,Number($('days').value));
 area.classList.toggle('good',remain>=ready.required);
 area.textContent=(remain<ready.required?'SHORT TRAINING WINDOW · ':'TRAINING WINDOW · ')+
  'You have '+(Math.floor(remain*10)/10)+' weeks. Based on '+K+' km/week and a '+L+
  ' km longest recent run, a gradual build toward '+(T>=42?'the marathon':T>=21?'the half marathon':T+'K')+
  ' may need roughly '+ready.required+'+ weeks. '+
  (remain<ready.required?'A later race or shorter distance may be safer.':'Continue progressively, adjusting to recovery.');
}
['date','days','km','long'].forEach(id=>$(id).addEventListener('change',preview));
['days','km','long'].forEach(id=>$(id).addEventListener('input',preview));
document.querySelectorAll('input[name="target"]').forEach(x=>x.addEventListener('change',preview));
preview();
function session(name,distance,kind,description,override){
 const label='RUN '+(++runNumber)+' · '+name;
 const effort=override||pace(kind);
 const estimate=timeRange(distance,kind);
 return '<div class="run"><div class="session-top"><strong>'+label+'</strong><span>'+km(distance)+'</span></div>'+
  '<div class="session-pace">PACE / EFFORT · '+effort+
  (estimate?' <span class="session-time">· '+estimate+'</span>':'')+
  '</div><p class="session-detail">'+description+'</p></div>';
}
function easy(distance,kind){
 const long=kind==='long',recovery=kind==='recovery';
 const description=long?
  'Run '+km(distance)+' at a comfortable effort. This is the longest SESSION of the week, not a fast run. Maintain conversational breathing; short walking breaks are fine.':
  recovery?'Jog or run/walk '+km(distance)+' very gently. This is for recovery, not speed or a personal best.':
  'Run '+km(distance)+' at an easy, conversational effort. Start gently. You should be able to speak in full sentences throughout.';
 return session(long?'LONG EASY RUN':recovery?'RECOVERY RUN':'EASY AEROBIC',distance,kind,description);
}
function strides(distance,taper){
 return session(taper?'EASY + RACE-WEEK STRIDES':'EASY + RELAXED STRIDES',distance,'easy',
  'Run '+km(distance)+' easy. Near the end, add 4 × 20 seconds of quick, relaxed strides, walking/jogging 60–90 seconds between them. Include the strides within the total distance. They are not sprints.'+
  (taper?' Finish fresh, not exhausted.':''));
}
function tempo(distance){
 const warm=round(Math.max(0.8,Math.min(1.5,distance*.25)));
 const cool=round(Math.max(0.8,Math.min(1.2,distance*.2)));
 const work=round(distance-warm-cool);
 if(work<1.5)return strides(distance,false);
 return session('TEMPO RUN',distance,'easy',
  'Warm up '+km(warm)+' at '+pace('easy')+'. Then run '+km(work)+' continuously at '+
  pace('tempo')+' (comfortably hard but sustainable). Cool down '+km(cool)+
  ' easy. All segments add up to '+km(distance)+'.',
  'TEMPO SEGMENT '+pace('tempo')+' · warm-up/cooldown easy');
}
function intervals(distance,T){
 const interval=T>=10?.6:.4;
 let reps=distance>=7.5?5:4,warm=1.2,recovery=.2;
 let cool=round(distance-warm-reps*interval-(reps-1)*recovery);
 while(reps>2&&cool<.8){reps--;cool=round(distance-warm-reps*interval-(reps-1)*recovery)}
 if(cool<.8)return tempo(distance);
 return session('INTERVAL SESSION',distance,'easy',
  'Warm up '+km(warm)+' easy. Run '+reps+' × '+Math.round(interval*1000)+' m at '+
  pace('intervals')+', with '+Math.round(recovery*1000)+' m very easy jog between reps. '+
  'Cool down '+km(cool)+' easy. Total '+km(distance)+'. Do not sprint.',
  'WORK REPS '+pace('intervals')+' · recoveries easy');
}
function walkRun(week,long,race,T,recovery){
 if(race){
  const title='RUN '+(++runNumber)+' · RACE DAY / READINESS CHECK';
  return '<div class="run"><div class="session-top"><strong>'+title+'</strong><span>'+km(T)+'</span></div>'+
   '<div class="session-pace">EFFORT · no forced target pace</div>'+
   '<p class="session-detail">This is the event distance, NOT a prescription to attempt it unprepared. With a limited current base, consider a shorter distance or later race. Do not try to make up missed mileage.</p></div>';
 }
 const duration=Math.max(15,Math.min(40,(long?25:20)+Math.floor((week-1)/2)*3-(recovery?5:0)));
 const pattern=week<=3?'1 min gentle jog / 2 min walk':week<=6?'2 min easy jog / 2 min walk':'3 min easy jog / 1 min walk';
 return '<div class="run"><div class="session-top"><strong>RUN '+(++runNumber)+' · '+
  (long?'LONG EASY RUN / WALK':'EASY RUN / WALK')+'</strong><span>'+mins(duration)+'</span></div>'+
  '<div class="session-pace">EFFORT · easy conversation / RPE 2–4/10</div>'+
  '<p class="session-detail">Walk 5 min to warm up. Alternate '+pattern+' for '+
  (duration-10)+' min. Walk 5 min to cool down. Total '+mins(duration)+
  '. The longer session is only longer relative to this week. Avoid forcing speed or extra distance.</p></div>';
}
function raceRun(T,benchmarkDistance,benchmarkSeconds){
 const prediction=benchmarkSeconds?benchmarkSeconds*Math.pow(T/benchmarkDistance,1.06)/T:null;
 const paceEstimate=prediction?fmtPace(prediction*.98)+'–'+fmtPace(prediction*1.05)+'/km (rough prediction)':
  'Start controlled; adjust to effort';
 return session('RACE DAY',T,'easy','Complete the race distance only if your preparation supports it. Begin conservatively, adjust to hills and heat, and walk when needed. A projected pace is not a required pace.',paceEstimate);
}
function build(){
 const T=Number(selected('target')),K=Number($('km').value),L=Number($('long').value),
  D=Number($('days').value),weeksAvailable=timeLeft();
 if(!Number.isFinite(weeksAvailable)||weeksAvailable<=0){alert('Choose a future race date.');return}
 const benchmarkDistance=selected('bench')==='none'?0:Number(selected('bench')||5);
 const benchmarkSeconds=benchmarkDistance?clock('bh','bm','bs'):0;
 if(benchmarkDistance&&!benchmarkSeconds){alert('Enter your actual benchmark time or select NONE.');return}
 const goalSeconds=clock('thh','tmm','tss');
 const days=allowedDays(D,K,L),safe=readiness(T,K,L,D);
 const weeks=Math.min(32,Math.max(1,Math.ceil(weeksAvailable)));
 basePace=benchmarkSeconds?benchmarkSeconds*Math.pow(5/benchmarkDistance,1.06)/5:null;
 const warnings=[];
 if(weeksAvailable<safe.required)
  warnings.push('<strong>SHORT TRAINING WINDOW</strong> You have '+(Math.floor(weeksAvailable*10)/10)+
   ' weeks. Based on your current '+K+' km/week and '+L+' km longest run, a gradual buildup may require around '+
   safe.required+'+ weeks. Consider a later event or shorter distance. This builder cannot guarantee race readiness.');
 if(days<D)warnings.push('Your current volume supports '+days+' running days/week rather than the requested '+D+
  '. The schedule was adjusted; add days gradually when your base improves.');
 if(K>0&&L>K*1.15)warnings.push('Your longest recent run exceeds your typical weekly distance. Check your inputs: weekly kilometres are the sum of all runs in a normal week; longest run is one session within the last 4 weeks.');
 if(safe.beginner)warnings.push('Your current base is limited, so the plan prioritizes easy run/walk sessions instead of intervals or tempo workouts.');
 if(!benchmarkDistance)warnings.push('Without a timed benchmark, your sessions use conversational effort and RPE rather than estimated min/km paces.');
 if(D<2&&T>=10)warnings.push('One run per week generally provides limited preparation for this race distance.');
 if(T>=21&&(K<(T>=42?35:20)||L<(T>=42?16:9)))
  warnings.push('Your mileage and longest run are below a typical starting base for this distance. Do not attempt to catch up by making sudden increases.');
 if(benchmarkSeconds&&goalSeconds&&goalSeconds<benchmarkSeconds*Math.pow(T/benchmarkDistance,1.06)*.90)
  warnings.push('Your target finish time is over 10% faster than projected from your recent benchmark. Workouts are based on current ability, not your goal.');
 if(weeksAvailable>32)warnings.push('Only the first 32 training weeks are shown. Rebuild closer to race day for the remaining weeks.');
 let result='<div class="stats"><div class="stat"><small>TIME TO RACE</small><b>'+
  (Math.floor(weeksAvailable*10)/10)+' weeks</b></div><div class="stat"><small>RUNS / WEEK</small><b>'+
  days+(days<D?' adjusted':'')+'</b></div><div class="stat"><small>CURRENT VOLUME</small><b>'+K+' km</b></div></div>';
 if(warnings.length)result+='<div class="training-warning"><strong>IMPORTANT BEFORE YOU START</strong>'+
  warnings.map(item=>'<p>'+item+'</p>').join('')+'</div>';
 result+='<div class="guide-summary"><strong>HOW TO READ YOUR WORKOUTS</strong><p>The weekly volume is the TOTAL across all sessions, not one run. RUN 1, RUN 2 and so on are the order, not fixed weekdays. Allow recovery between sessions, especially before and after the longer run. Long easy means the longest session of YOUR week; it could be only 2–3 km for a new runner.</p></div>';
 if(basePace)result+='<div class="pace-guide"><b>YOUR ESTIMATED TRAINING PACES</b><div class="pace-grid">'+
  [['Easy','easy'],['Long easy','long'],['Recovery','recovery'],['Tempo','tempo'],['Intervals','intervals']]
  .map(([label,type])=>'<div><small>'+label+'</small><strong>'+pace(type)+'</strong></div>').join('')+
  '</div><p>From your recent '+benchmarkDistance+'K benchmark. Adjust to fatigue, terrain and heat. These are guides, not mandatory splits.</p></div>';
 else result+='<div class="pace-guide"><b>TRAIN BY EFFORT</b><p>Easy and long runs = comfortable conversation (RPE 3–4/10). Tempo = comfortably hard (6–7/10). Intervals = controlled strong effort (7–8/10). Enter a timed benchmark to get estimated pace ranges.</p></div>';
 const longCap=T>=42?32:T>=21?21:T>=10?15:11;
 let prevLong=Math.max(1,Math.min(L||K/Math.max(days,1),K?K*.55:1));
 for(let week=1;week<=weeks;week++){
  runNumber=0;
  const race=week===weeks,remaining=weeks-week,
   taper=!race&&remaining<=2,recovery=!race&&!taper&&week%4===0;
  let weekHtml='',actual=0;
  if(safe.beginner){
   for(let i=0;i<days;i++)
    weekHtml+=walkRun(week,i===days-1,race&&i===days-1,T,recovery);
  }else if(race){
   const preDist=Math.max(1.5,Math.min(4,K/Math.max(days,2)*.55));
   for(let i=0;i<days-1;i++){
    const d=round(i===days-2?Math.min(2.5,preDist):preDist);
    actual+=d;weekHtml+=i===days-2?strides(d,true):easy(d,'easy');
   }
   actual+=T;weekHtml+=raceRun(T,benchmarkDistance,benchmarkSeconds);
  }else{
   let wanted=K*Math.min(1.65,Math.pow(1.075,week-1));
   if(recovery)wanted*=.82;
   if(taper)wanted*=remaining===2?.82:.65;
   wanted=round(Math.max(days*1.25,wanted));
   const share=days===1?1:days===2?.60:days===3?.48:days===4?.41:days===5?.36:.32;
   let longDistance=Math.min(longCap,wanted*share);
   longDistance=Math.min(longDistance,week===1?prevLong:Math.min(prevLong*1.09+.15,prevLong+1.2));
   longDistance=round(Math.max(1.5,longDistance));
   if(days===1){weekHtml+=easy(longDistance,'long');actual=longDistance}
   else{
    const otherLimit=longDistance*1.16;
    const possible=Math.min(wanted,longDistance+(days-1)*otherLimit);
    const otherTotal=Math.max(0,possible-longDistance);
    const weights=Array.from({length:days-1},(_,i)=>i===0&&days>=3?1.10:i===days-2&&days>=5?.80:1);
    const sum=weights.reduce((a,b)=>a+b,0);
    const distances=weights.map(x=>round(Math.min(otherLimit,otherTotal*x/sum)));
    const remainder=round(otherTotal-distances.reduce((a,b)=>a+b,0));
    if(remainder>0&&distances.length){
     let left=remainder;
     for(let j=distances.length-1;j>=0&&left>0;j--){
      const add=Math.min(left,Math.max(0,round(otherLimit-distances[j])));
      distances[j]=round(distances[j]+add);left=round(left-add);
     }
    }
    distances.forEach((d,i)=>{
     actual+=d;
     const quality=days>=3&&i===0&&week>=4&&K>=18&&L>=5&&!taper&&!recovery&&d>=4.5;
     if(quality)weekHtml+=week%2===0&&d>=6?intervals(d,T):tempo(d);
     else if(i===0&&days>=3&&d>=3.5&&!recovery&&!taper)weekHtml+=strides(d,false);
     else weekHtml+=easy(d,days>=5&&i===days-2?'recovery':'easy');
    });
    actual+=longDistance;
    weekHtml+=easy(longDistance,'long');
   }
   if(!taper&&!recovery)prevLong=longDistance;
  }
  const weekLabel=race?'Race week includes the event itself. Attempt it only if your preparation supports it.':
   safe.beginner?'Run/walk sessions are time-based. Do not force extra kilometres.':
   'Scheduled total: '+km(actual)+'. Allow recovery between runs; no need for back-to-back hard workouts.';
  result+='<div class="week"><h3>WEEK '+week+' · '+(race?'RACE WEEK':taper?'TAPER':recovery?'RECOVERY':'BUILD')+
   '</h3><p class="week-volume">'+weekLabel+'</p>'+weekHtml+'</div>';
 }
 $('res').innerHTML=result;
 $('res').classList.add('on');
 document.dispatchEvent(new CustomEvent('runlab:planready'));
 $('res').scrollIntoView({behavior:'smooth',block:'start'});
}
$('buildPlanBtn').addEventListener('click',build);
})();