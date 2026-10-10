/* RUNLAB Training Plan — client-side adaptive, effort-first generator */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const round = n => Math.round((n + Number.EPSILON) * 10) / 10;
const km = n => round(n).toFixed(1) + ' km';
const minText = n => Math.round(n) + ' min';
const paceFormat = seconds => {
  const s = Math.max(1, Math.round(seconds / 5) * 5);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const effort = {
  easy: 'conversational · RPE 3–4/10',
  long: 'easy conversation · RPE 3–4/10',
  recovery: 'very relaxed · RPE 2–3/10',
  tempo: 'comfortably hard · RPE 6–7/10',
  intervals: 'strong but controlled · RPE 7–8/10'
};
const multipliers = {
  easy:[1.23,1.43], long:[1.27,1.49], recovery:[1.36,1.60],
  tempo:[1.08,1.15], intervals:[0.98,1.06]
};
function pace(base,kind) {
  if (!base) return effort[kind] || effort.easy;
  const m = multipliers[kind] || multipliers.easy;
  return paceFormat(base*m[0]) + '–' + paceFormat(base*m[1]) + '/km';
}
function duration(distance,base,kind) {
  if (!base) return '';
  const m = multipliers[kind] || multipliers.easy;
  return 'approx. ' + Math.max(1,Math.floor(distance*base*m[0]/60)) +
     '–' + Math.max(1,Math.ceil(distance*base*m[1]/60)) + ' min';
}
function fieldValue(h,m,s) {
  return Number($(h).value)*3600 + Number($(m).value)*60 + Number($(s).value);
}
function wireSlider(id,out,suffix) {
  const el=$(id);
  const sync=()=>{$(out).textContent=el.value+suffix;};
  el.addEventListener('input',sync,{passive:true});
  el.addEventListener('change',sync);
  sync();
}
wireSlider('days','daysOut',' / WK');
wireSlider('km','kmOut',' KM');
wireSlider('long','longOut',' KM');
const dateEl=$('date');
if (!dateEl.value) {
  const d=new Date();d.setDate(d.getDate()+56);
  dateEl.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function syncBenchmark() {
  const sel=document.querySelector('input[name="bench"]:checked');
  $('benchmarkTimeField').style.display = !sel || sel.value==='none' ? 'none' : 'block';
}
document.querySelectorAll('input[name="bench"]').forEach(el=>el.addEventListener('change',syncBenchmark));
syncBenchmark();
function session(title,amount,paceLabel,detail,estimate) {
  return '<div class="run"><div class="session-top"><strong>'+title+
    '</strong><span>'+amount+'</span></div><div class="session-pace">'+paceLabel+
    (estimate?' <span class="session-time"> · '+estimate+'</span>':'')+
    '</div><p class="session-detail">'+detail+'</p></div>';
}
function easyRun(d,base,type) {
  const kind=type==='long'?'long':type==='recovery'?'recovery':'easy';
  const title=type==='long'?'LONG EASY RUN':type==='recovery'?'RECOVERY RUN':'EASY AEROBIC';
  const detail=kind==='long'?
    'Run '+km(d)+' at a comfortable talk-test effort. This is your endurance-focused run, not a speed session. Walk briefly if needed, and take water on longer outings.':
    kind==='recovery'?
    'Jog '+km(d)+' gently, with walking breaks whenever needed. Stay relaxed; do not try to make up missed faster running.':
    'Run '+km(d)+' comfortably. You should be able to talk in full sentences; slow down on hills or in heat. Start easy and finish easy.';
  return session(title,km(d),pace(base,kind),detail,duration(d,base,kind));
}
function walkRun(d,w,isLong) {
  const jog=w<=3?'1 min easy running, then 2 min walking':w<=7?'2 min easy running, then 2 min walking':'3 min easy running, then 1 min walking';
  return session(isLong?'LONG EASY RUN / WALK':'EASY RUN / WALK',km(d),
    'comfortable conversation · RPE 2–4/10',
    'Warm up with 5 minutes of walking. Alternate '+jog+
    ' until you cover '+km(d)+', then walk 5 minutes to cool down. '+ 
    'The warm-up and cooldown walks are extra; the '+km(d)+' is your run/walk route distance. If you cannot speak comfortably, shorten the running sections.','');
}
function firstTimeRun(w,long,cutback) {
  let total=Math.min(40,(long?25:20)+Math.floor((w-1)/2)*3);
  if (cutback) total=Math.max(15,Math.round(total*.85));
  const active=total-10;
  const block=w<=3?'1 minute jogging / 2 minutes walking':w<=7?
    '2 minutes jogging / 2 minutes walking':'3 minutes jogging / 1 minute walking';
  return session(long?'LONG RUN / WALK':'EASY RUN / WALK',minText(total),
    'easy conversation · RPE 2–4/10',
    'Walk 5 minutes to warm up. Alternate '+block+' for '+minText(active)+
    ', then walk 5 minutes to cool down. Total '+minText(total)+
    '. All movement should feel manageable; repeat a week if needed.','');
}
function strides(d,base,taper) {
  return session(taper?'EASY RUN + STRIDES':'FORM / STRIDES',km(d),pace(base,'easy'),
    'Cover '+km(d)+' at an easy pace, with 4 × 20 seconds of relaxed faster strides near the end. Walk or jog 60–90 seconds between each. The strides are within the '+km(d)+' total and are not sprints.'+
    (taper?' Finish feeling fresh.':''),duration(d,base,'easy'));
}
function tempo(d,base) {
  const warm=round(Math.min(1.5,Math.max(1,d*.25)));
  const cool=round(Math.min(1.3,Math.max(.9,d*.2)));
  const work=round(d-warm-cool);
  if (work<1.5)return strides(d,base,false);
  return session('TEMPO RUN',km(d),pace(base,'tempo')+' during the tempo',
    'Warm up '+km(warm)+' at '+pace(base,'easy')+
    '. Run '+km(work)+' at '+pace(base,'tempo')+
    ' (comfortably hard, controlled—not racing). Cool down '+km(cool)+
    ' easy. Total '+km(d)+'.',duration(d,base,'easy'));
}
function intervals(d,base,target) {
  const rep=target<=5?.4:.6;
  let reps=d>=8?5:4;
  const warm=1.2, jog=.2;
  while(reps>=3&&d-warm-reps*rep-(reps-1)*jog<.9)reps--;
  if(reps<3)return tempo(d,base);
  const cool=round(d-warm-reps*rep-(reps-1)*jog);
  return session('INTERVAL SESSION',km(d),pace(base,'intervals')+' on repetitions',
    'Warm up '+km(warm)+' at '+pace(base,'easy')+
    '. Then '+reps+' × '+Math.round(rep*1000)+' m at '+pace(base,'intervals')+
    ', jogging '+Math.round(jog*1000)+' m very easily between reps. Cool down '+
    km(cool)+' easy. Total '+km(d)+'. Keep every repetition controlled.',duration(d,base,'easy'));
}
function runSlot(num,day,body) {
  return '<div class="run-slot"><div class="slot-label">RUN '+num+
    (day?' · '+day:'')+'</div>'+body+'</div>';
}
function notice(type,title,text) {
  return '<div class="plan-notice '+type+'" role="'+(type==='danger'?'alert':'note')+
    '"><strong>'+title+'</strong><p>'+text+'</p></div>';
}
function readiness(target,k,longest,days) {
  // Conservative planning estimates, not a validated individual fitness prediction.
  const strong=target<=5?k>=15&&longest>=5&&days>=3:
    target<=10?k>=25&&longest>=8&&days>=3:
    target<30?k>=35&&longest>=12&&days>=3:
    k>=50&&longest>=20&&days>=4;
  const moderate=target<=5?k>=8&&longest>=3&&days>=3:
    target<=10?k>=12&&longest>=5&&days>=3:
    target<30?k>=20&&longest>=8&&days>=3:
    k>=30&&longest>=12&&days>=4;
  const minimum=target<=5?(strong?6:moderate?9:12):
    target<=10?(strong?8:moderate?12:16):
    target<30?(strong?12:moderate?16:22):
    strong?18:moderate?22:30;
  const targetLong=target<=5?4:target<=10?8:target<30?16:26;
  const startingLong=Math.max(.6,longest);
  const growthWeeks=startingLong>=targetLong?0:
    Math.ceil(Math.log(targetLong/startingLong)/Math.log(1.08));
  const extra=days<3?4:0;
  return Math.max(minimum+extra,growthWeeks+2+extra);
}
function scheduleDays(days) {
  const layouts={
    1:['SAT'],2:['WED','SUN'],3:['TUE','THU','SUN'],
    4:['MON','WED','FRI','SUN'],5:['MON','TUE','THU','FRI','SUN'],
    6:['MON','TUE','WED','THU','FRI','SUN']
  };
  return layouts[days]||layouts[3];
}
function build() {
  const raceDate=new Date(dateEl.value+'T12:00:00');
  const today=new Date();today.setHours(0,0,0,0);
  if (!dateEl.value||Number.isNaN(raceDate.getTime())||raceDate<=today) {
    alert('Choose a future race date.');return;
  }
  const daysRemaining=Math.ceil((raceDate-today)/86400000);
  const weeks=Math.ceil(daysRemaining/7);
  if(weeks>52){alert('This builder covers up to 52 weeks. Return closer to race day to build your plan.');return;}
  const target=Number(document.querySelector('input[name="target"]:checked').value);
  const b=document.querySelector('input[name="bench"]:checked');
  const benchmark=b?Number(b.value):NaN;
  const hasBenchmark=b&&b.value!=='none';
  const seconds=hasBenchmark?fieldValue('bh','bm','bs'):0;
  if(hasBenchmark&&seconds<=0){alert('Enter your actual recent finishing time, or select NONE.');return;}
  const goalSeconds=fieldValue('thh','tmm','tss');
  const daysAsked=Number($('days').value);
  const weekly=Number($('km').value);
  const longest=Number($('long').value);
  if(weekly>0&&longest===0){
    $('res').innerHTML=notice('danger','CHECK YOUR LONGEST RUN','You entered weekly running distance but a longest recent run of 0 km. Enter the longest single run you completed in the past four weeks, then build again.');
    $('res').classList.add('on');$('res').scrollIntoView({behavior:'smooth',block:'start'});return;
  }
  const paceBase=hasBenchmark?seconds*Math.pow(5/benchmark,1.06)/5:null;
  // Respect actual mileage and include full recovery days. Fewer days are prescribed
  // when requested frequency exceeds the runner's current distance/endurance.
  let days=Math.min(6,daysAsked);
  if(weekly<8||longest<3)days=Math.min(days,3);
  else if(weekly<12)days=Math.min(days,4);
  else if(weekly<20)days=Math.min(days,5);
  if(weekly>0)days=Math.max(1,Math.min(days,Math.max(1,Math.floor(weekly/1.5))));
  const newRunner=weekly<3||longest===0;
  const novice=weekly<8||longest<3||(days>=3&&weekly/days<2);
  const required=readiness(target,weekly,longest,days);
  const shortWindow=weeks<required;
  const plans=[];
  if(days!==daysAsked)plans.push(notice('warning','RUN DAYS ADJUSTED',
    'You selected '+daysAsked+' runs per week. RunLab scheduled '+days+
    ' based on your reported mileage and longest run, leaving time for recovery. Build consistency before increasing frequency.'));
  if(longest>weekly+.5)plans.push(notice('warning','DOUBLE-CHECK YOUR CURRENT MILEAGE',
    'Your longest recent run ('+km(longest)+') exceeds the distance you report in a typical week ('+
    km(weekly)+'). This can happen if that run was from a different week. Confirm both values are accurate; progression uses the smaller weekly total.'));
  if(weekly>0&&longest>0&&weekly>longest*days*1.08)plans.push(notice('warning','STARTING DISTANCE ADJUSTED',
    'Your selected '+days+' runs and recent longest run of '+km(longest)+
    ' do not support distributing '+km(weekly)+' safely across those sessions. Week 1 will start lower rather than forcing extra distance into each run.'));
  if(shortWindow)plans.push(notice('danger','TRAINING WINDOW MAY BE TOO SHORT',
    'You have about '+weeks+' week'+(weeks===1?'':'s')+' until race day. Based on your '+
    km(weekly)+' per week, longest recent '+km(longest)+' and '+days+' feasible run day'+
    (days===1?'':'s')+', allow approximately '+required+'+ weeks as a conservative planning estimate ('+
    (required-weeks)+' more than you have). RunLab will not prescribe a full '+km(target)+
    ' race attempt on this date. Consider a shorter distance or later race and reassess with a coach if unsure.'));
  else plans.push(notice('ok','TRAINING WINDOW LOOKS PLAUSIBLE',
    'Approximately '+weeks+' weeks remain; your inputs suggest at least '+required+
    ' weeks for a gradual buildup. This is a planning estimate, not a guarantee of race readiness. Reassess if training is interrupted or your body is not adapting.'));
  if(newRunner)plans.push(notice('warning','BEGINNER START: TIME, NOT SPEED',
    'Start with easy run/walk sessions and rest days. No speed sessions or fixed race pace are prescribed at your current training volume.'));
  else if(novice)plans.push(notice('info','BUILDING AN AEROBIC BASE',
    'Your current longest run or weekly distance suggests easy run/walk training first. Faster tempo and interval workouts are intentionally withheld until a steadier running base is established.'));
  if(!hasBenchmark)plans.push(notice('info','NO BENCHMARK PROVIDED',
    'Workout intensity will use the talk test and perceived effort. For pace ranges in min/km, enter a recent timed 3K, 5K or 10K.'));
  if(goalSeconds&&hasBenchmark){
    const predicted=seconds*Math.pow(target/benchmark,1.06);
    if(goalSeconds<predicted*.86)plans.push(notice('warning','AMBITIOUS TIME GOAL',
      'Your target time is substantially faster than a rough estimate based on your recent benchmark. Workout paces will follow current fitness rather than that target.'));
  }
  const maxLong=target<=5?12:target<=10?16:target<30?22:32;
  let html='<div class="stats"><div class="stat"><small>TIME TO RACE</small><b>'+
    weeks+' WK</b></div><div class="stat"><small>PLANNED RUNS</small><b>'+days+'/WK</b>'+
    '</div><div class="stat"><small>YOUR CURRENT VOLUME</small><b>'+weekly+' km</b></div></div>'+
    '<div class="plan-intro">Follow RUN 1, RUN 2, RUN 3 in order. Weekday labels are suggested—not compulsory. Rest or walk between runs; leave at least one easy/recovery day after harder efforts. Weekly distance means all runs added together.</div>'+
    plans.join('');
  if(paceBase&&!newRunner&&!novice){
    html+='<div class="pace-guide"><b>PERSONAL TRAINING PACES</b><div class="pace-grid">'+
      [['Easy','easy'],['Long','long'],['Recovery','recovery'],['Tempo','tempo'],['Intervals','intervals']]
      .map(([title,type])=>'<div><small>'+title+'</small><strong>'+pace(paceBase,type)+'</strong></div>').join('')+
      '</div><p>Estimated from your recent '+benchmark+'K result, not your goal time. Heat, hills, fatigue and the talk test take priority.</p></div>';
  }else{
    html+='<div class="pace-guide"><b>USE THE TALK TEST</b><p>Easy and long: full sentences (RPE 3–4/10). Run/walk: gentle jogging with recovery walks. If you supply a benchmark, use it later when a continuous-running base is established.</p></div>';
  }
  const weekdays=scheduleDays(days);
  const cappedStart=weekly>0&&longest>0?Math.min(weekly,longest*days):weekly;
  for(let w=1;w<=weeks;w++){
    const last=w===weeks, left=weeks-w;
    const taper=!last&&left<=2;
    const cutback=!last&&!taper&&w%4===0;
    let runs='',distance=0;
    let runNo=0;
    let firstWeekLimit=cappedStart;
    if(last){
      // The race is a scheduling milestone, never an instruction to attempt a
      // potentially unsafe distance when the fitness/window check fails.
      const available=Math.max(1,daysRemaining-(weeks-1)*7);
      const maxPre=Math.max(0,Math.floor((available-1)/2));
      const pre=Math.min(days-1,maxPre);
      for(let i=0;i<pre;i++){
        const d=newRunner?0:round(Math.max(.8,Math.min(3,cappedStart/Math.max(2,days)*.65)));
        const proposedDate=new Date(raceDate.getTime()-(pre-i)*2*86400000);
        const day=proposedDate.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
        const body=newRunner?firstTimeRun(w,false,true):novice?walkRun(d,w,false):easyRun(d,paceBase,'easy');
        if(!newRunner)distance=round(distance+d);
        runs+=runSlot(++runNo,day.toUpperCase(),body);
      }
      const label=raceDate.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}).toUpperCase();
      if(shortWindow){
        runs+='<div class="race-advisory"><b>RACE DATE · REASSESS</b><p>Your current training window may be insufficient for '+km(target)+
          '. This plan does not prescribe racing that distance. Consider postponing or entering a shorter event; do not make up lost mileage.</p></div>';
      }else{
        const rough=hasBenchmark?seconds*Math.pow(target/benchmark,1.06)/target:null;
        const raceEffort=rough?paceFormat(rough*.98)+'–'+paceFormat(rough*1.05)+'/km (rough estimate)':'Start controlled and use effort rather than pace';
        runs+=runSlot(++runNo,label,session('RACE DAY',km(target),raceEffort,
          'Warm up gently, start conservatively and adjust for conditions. Race only if your training has supported this distance and you feel healthy; estimated pace is not a requirement.',''));
        distance=round(distance+target);
      }
    }else if(newRunner){
      for(let i=0;i<days;i++){
        runs+=runSlot(++runNo,weekdays[i],firstTimeRun(w,i===days-1,cutback||taper));
      }
    }else{
      // Respect both the typical weekly total and the longest *recent* single run.
      // Build gradually; never force the requested total into implausibly long sessions.
      const progressed=weekly*Math.min(1.8,Math.pow(1.06,w-1));
      const longLimit=Math.min(maxLong,longest*Math.pow(1.075,w-1));
      const share=days===1?1:days===2?.62:days===3?.45:days===4?.38:days===5?.34:.30;
      let targetWeekly=Math.min(progressed,longLimit*days);
      if(cutback)targetWeekly*=.82;
      if(taper)targetWeekly*=left===2?.80:.65;
      targetWeekly=round(Math.max(.6,targetWeekly));
      const longD=round(Math.min(longLimit,Math.max(targetWeekly/days,targetWeekly*share)));
      if(days===1){
        distance=longD;
        runs+=runSlot(1,weekdays[0],novice?walkRun(longD,w,true):easyRun(longD,paceBase,'long'));
      }else{
        const remaining=round(Math.max(0,targetWeekly-longD));
        const weights=Array.from({length:days-1},(_,i)=>i===0&&days>=3?1.05:i===days-2&&days>=5?.85:1);
        const totalW=weights.reduce((a,b)=>a+b,0);
        let used=0;
        for(let i=0;i<days-1;i++){
          const d=round(i===days-2?remaining-used:remaining*weights[i]/totalW);
          used=round(used+d);
          distance=round(distance+d);
          let body;
          const quality=!novice&&!taper&&!cutback&&w>=3&&weekly>=18&&longest>=5&&days>=3&&i===0&&d>=4;
          if(novice)body=walkRun(d,w,false);
          else if(quality)body=w%2===0&&d>=5.5?intervals(d,paceBase,target):tempo(d,paceBase);
          else body=days>=5&&i===days-2?easyRun(d,paceBase,'recovery'):
            taper&&i===0&&d>=2.5?strides(d,paceBase,true):easyRun(d,paceBase,'easy');
          runs+=runSlot(++runNo,weekdays[i],body);
        }
        distance=round(distance+longD);
        runs+=runSlot(++runNo,weekdays[days-1],novice?walkRun(longD,w,true):easyRun(longD,paceBase,'long'));
      }
    }
    const volume=newRunner?'Run/walk time-based sessions':km(distance)+' total this week';
    const heading=last?'RACE WEEK':taper?'TAPER':cutback?'RECOVERY WEEK':'BUILD';
    html+='<section class="week"><h3>WEEK '+w+' · '+heading+'</h3><p class="week-volume">'+volume+
      (last?' · Keep the days before the event easy.':
       ' · Suggested days; adjust to your schedule and allow recovery.')+'</p>'+runs+'</section>';
  }
  $('res').innerHTML=html;
  $('res').classList.add('on');
  $('res').scrollIntoView({behavior:'smooth',block:'start'});
}
$('buildPlanBtn').addEventListener('click',build);
})();