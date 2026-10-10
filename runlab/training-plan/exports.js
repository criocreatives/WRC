/* RUNLAB plan exports — PDF for entire plan, JPEG for selected week. */
(function () {
  'use strict';
  const root = document.getElementById('exports');
  if (!root) return;
  root.innerHTML = '<div class="export-heading">SAVE YOUR TRAINING PLAN</div>' +
    '<p class="export-intro">The PDF contains every training week. For WhatsApp, select a week and save its JPEG image.</p>' +
    '<div class="export-controls">' +
    '<button id="downloadPlanPdf" type="button">DOWNLOAD PDF · ALL WEEKS</button>' +
    '<label class="export-select-label" for="exportWeek">JPEG IMAGE <select id="exportWeek" aria-label="Choose week for JPEG export"></select></label>' +
    '<button id="downloadPlanJpeg" type="button">DOWNLOAD JPEG · SELECTED WEEK</button>' +
    '<button id="printPlan" type="button" class="export-print">PRINT / SAVE AS PDF</button></div>' +
    '<p id="exportStatus" class="export-status" role="status" aria-live="polite"></p>';
  const select = document.getElementById('exportWeek');
  const status = document.getElementById('exportStatus');
  const weekNodes = () => Array.from(document.querySelectorAll('#res .week'));
  function notify(message) { status.textContent = message; }
  function updateWeeks() {
    const weeks = weekNodes();
    select.textContent = '';
    weeks.forEach((week,i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = 'WEEK ' + (i+1);
      select.appendChild(option);
    });
    select.disabled = weeks.length === 0;
    notify(weeks.length ? weeks.length + ' weeks ready to export.' : '');
  }
  document.addEventListener('runlab:planready',updateWeeks);
  function extractWeek(el) {
    return {
      title: (el.querySelector('h3')?.textContent || '').trim(),
      volume: (el.querySelector('.week-volume')?.textContent || '').trim(),
      runs: Array.from(el.querySelectorAll('.run')).map(node => ({
        title:(node.querySelector('.session-top strong')?.textContent || '').trim(),
        amount:(node.querySelector('.session-top span:last-child')?.textContent || '').trim(),
        effort:(node.querySelector('.session-pace')?.textContent || '').replace(/\s+/g,' ').trim(),
        details:(node.querySelector('.session-detail')?.textContent || '').replace(/\s+/g,' ').trim()
      }))
    };
  }
  const getWeeks = () => weekNodes().map(extractWeek);
  function filename(suffix) {
    return 'RUNLAB_Training_Plan_' + new Date().toISOString().slice(0,10) + suffix;
  }
  function downloadBlob(blob,name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url),60000);
  }
  function wrapCanvas(ctx,text,maxWidth) {
    const words=String(text).split(/\s+/), lines=[];let current='';
    for(const word of words) {
      const candidate=current?current+' '+word:word;
      if(current && ctx.measureText(candidate).width>maxWidth) {lines.push(current);current=word}
      else current=candidate;
    }
    if(current)lines.push(current);
    return lines.length?lines:[''];
  }
  function drawText(ctx,lines,x,y,lineHeight) {
    for (const line of lines) { ctx.fillText(line,x,y);y+=lineHeight }
    return y;
  }
  async function jpegForWeek(week,index) {
    const width=1120, margin=64, inner=width-margin*2;
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('This browser cannot create JPEG images.');
    ctx.font='24px Helvetica,Arial,sans-serif';
    const volumeLines=wrapCanvas(ctx,week.volume,inner-40);
    const rendered=week.runs.map(run=>{
      ctx.font='24px Helvetica,Arial,sans-serif';
      const effortLines=wrapCanvas(ctx,run.effort,inner-48);
      const detailLines=wrapCanvas(ctx,run.details,inner-48);
      const titleLines=wrapCanvas(ctx,run.title,inner-220);
      return {run,effortLines,detailLines,titleLines,
        height:38+titleLines.length*34+22+effortLines.length*33+14+detailLines.length*35+38};
    });
    const height=Math.ceil(260+volumeLines.length*34+rendered.reduce((sum,run)=>sum+run.height+20,0)+100);
    if(height>15000)throw Error('That image exceeds the mobile browser limit.');
    canvas.width=width;canvas.height=height;
    ctx.fillStyle='#17191b';ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#ee4823';ctx.fillRect(0,0,width,12);
    ctx.fillStyle='#ee4823';ctx.font='bold 25px Helvetica,Arial,sans-serif';
    ctx.fillText('RUNLAB  /  WADADA RUN CLUB',margin,82);
    ctx.fillStyle='#fff';ctx.font='bold 55px Helvetica,Arial,sans-serif';
    ctx.fillText(week.title || 'WEEK '+(index+1),margin,158);
    ctx.fillStyle='#c4c5c6';ctx.font='24px Helvetica,Arial,sans-serif';
    let y=204;
    y=drawText(ctx,volumeLines,margin,y,34)+26;
    for(const entry of rendered) {
      const cardY=y,cardH=entry.height;
      ctx.fillStyle='#242628';ctx.fillRect(margin-14,cardY,inner+28,cardH);
      ctx.fillStyle='#ee4823';ctx.fillRect(margin-14,cardY,5,cardH);
      y=cardY+45;
      ctx.fillStyle='#fff';ctx.font='bold 27px Helvetica,Arial,sans-serif';
      y=drawText(ctx,entry.titleLines,margin+16,y,34)+14;
      ctx.fillStyle='#ee9276';ctx.font='bold 23px Helvetica,Arial,sans-serif';
      y=drawText(ctx,entry.effortLines,margin+16,y,33)+12;
      ctx.fillStyle='#d9dbdc';ctx.font='24px Helvetica,Arial,sans-serif';
      y=drawText(ctx,entry.detailLines,margin+16,y,35);
      ctx.fillStyle='#fff';ctx.font='bold 22px Helvetica,Arial,sans-serif';
      ctx.textAlign='right';ctx.fillText(entry.run.amount,margin+inner-15,cardY+45);ctx.textAlign='left';
      y=cardY+cardH+20;
    }
    ctx.fillStyle='#777e81';ctx.font='18px Helvetica,Arial,sans-serif';
    ctx.fillText('Training guidance, not a medical clearance. Adjust to effort, conditions and recovery.',margin,height-40);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.92));
    if(!blob)throw Error('Unable to create JPEG.');
    downloadBlob(blob,filename('_Week_'+String(index+1).padStart(2,'0')+'.jpg'));
  }
  let pdfLoader;
  function ensurePDF() {
    if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
    if(pdfLoader)return pdfLoader;
    pdfLoader=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async=true;
      script.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(Error('PDF engine did not load.'));
      script.onerror=()=>reject(Error('Could not load the PDF engine. Try Print / Save as PDF.'));
      document.head.appendChild(script);
    }).catch(e=>{pdfLoader=null;throw e});
    return pdfLoader;
  }
  async function pdfForPlan(weeks) {
    const jsPDF=await ensurePDF();
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=210,H=297,edge=17,maxWidth=W-2*edge;
    let y=20,page=1;
    function nextPage() {
      pdf.addPage();page++;y=20;
    }
    function enough(n) {if(y+n>H-22)nextPage()}
    function wrapped(text,size,color,weight,lineheight) {
      pdf.setFont('helvetica',weight||'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      const lines=pdf.splitTextToSize(String(text),maxWidth);
      const h=lines.length*lineheight;
      enough(h+5);
      pdf.text(lines,edge,y);y+=h+5;
    }
    pdf.setFillColor(238,72,35);pdf.rect(0,0,W,5,'F');
    pdf.setTextColor(238,72,35);pdf.setFont('helvetica','bold');pdf.setFontSize(13);
    pdf.text('RUNLAB  /  WADADA RUN CLUB',edge,y);y+=16;
    wrapped('PERSONALIZED TRAINING PLAN',23,[24,26,28],'bold',10);
    wrapped('Complete running schedule · Generated '+new Date().toLocaleDateString('en-GB'),11,[90,95,99],'normal',5);
    wrapped('Run the sessions in order, allowing recovery between hard and long runs. Training paces are estimates; slow down when needed.',10,[50,55,58],'normal',5);
    weeks.forEach((week,index)=>{
      enough(45);
      y+=5;
      pdf.setDrawColor(220,222,225);pdf.line(edge,y,W-edge,y);y+=9;
      wrapped(week.title||'WEEK '+(index+1),15,[238,72,35],'bold',7);
      wrapped(week.volume,9,[90,95,99],'normal',4.5);
      week.runs.forEach(run=>{
        enough(27);
        wrapped(run.title+'  ·  '+run.amount,11,[22,25,28],'bold',5.4);
        wrapped(run.effort,9,[204,75,40],'bold',4.5);
        wrapped(run.details,9,[60,63,67],'normal',4.7);
      });
    });
    const pageCount=pdf.internal.getNumberOfPages();
    for(let p=1;p<=pageCount;p++){
      pdf.setPage(p);pdf.setDrawColor(220,222,225);
      pdf.line(edge,H-15,W-edge,H-15);
      pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(125,125,125);
      pdf.text('RUNLAB · Run smart. Run together.',edge,H-10);
      pdf.text(p+' / '+pageCount,W-edge,H-10,{align:'right'});
    }
    pdf.save(filename('.pdf'));
  }
  document.getElementById('downloadPlanJpeg').addEventListener('click',async()=>{
    const weeks=getWeeks(),index=Number(select.value);
    if(!weeks.length||!weeks[index])return notify('Build your plan before exporting.');
    notify('Creating JPEG image...');
    try {await jpegForWeek(weeks[index],index);notify('JPEG downloaded for Week '+(index+1)+'.');}
    catch(e){notify('JPEG export failed: '+e.message);}
  });
  document.getElementById('downloadPlanPdf').addEventListener('click',async()=>{
    const weeks=getWeeks();if(!weeks.length)return notify('Build your plan before exporting.');
    notify('Preparing your full-plan PDF...');
    try {await pdfForPlan(weeks);notify('Full-plan PDF downloaded.');}
    catch(e){notify('PDF export failed: '+e.message);}
  });
  document.getElementById('printPlan').addEventListener('click',()=>{
    if(!weekNodes().length)return notify('Build your plan first.');
    window.print();
  });
})();