function fill(id,a,b,s){let e=document.getElementById(id);for(let i=a;i<=b;i++){let o=document.createElement('option');o.value=i;o.textContent=i;if(i===s)o.selected=true;e.appendChild(o)}}function time(p){return +document.getElementById(p+'h').value*3600 + +document.getElementById(p+'m').value*60 + +document.getElementById(p+'s').value}function tp(p){let h='<div class=timepick>';[['h',24,'HOURS'],['m',60,'MIN'],['s',60,'SEC']].forEach(x=>{h+='<div><select id="'+p+x[0]+'">';for(let i=0;i<x[1];i++)h+='<option value="'+i+'">'+String(i).padStart(2,'0')+'</option>';h+='</select><small>'+x[2]+'</small></div>'});return h+'</div>'}
function bindRange(id,out,suffix){let e=document.getElementById(id),o=document.getElementById(out);function u(){o.textContent=e.value+(suffix||'')}e.addEventListener('input',u);u()}
function addExports(resultId,barId,fileName){let b=document.getElementById(barId);if(!b)return;b.innerHTML='<button type="button" onclick="window.print()">SAVE / PDF</button><button type="button" onclick="saveResultImage(\''+resultId+'\',\''+fileName+'\')">SAVE IMAGE</button>'}
async function saveResultImage(id,name){
  const result=document.getElementById(id);
  if(!result || !result.classList.contains('on'))return;
  if(!window.html2canvas){
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    document.head.appendChild(script);
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject});
  }
  const wrapper=document.createElement('div');
  wrapper.style.cssText='position:fixed;left:-20000px;top:0;box-sizing:border-box;width:870px;padding:28px;background:#17191b;color:#fff;font:16px/1.55 Helvetica,Arial,sans-serif;';
  const resultCopy=result.cloneNode(true);
  resultCopy.removeAttribute('id');
  resultCopy.style.display='block';
  wrapper.appendChild(resultCopy);
  const warning=document.createElement('div');
  warning.style.cssText='margin:25px 0 0;padding:17px 19px;background:#242126;color:#e7e7e7;border-left:5px solid #ee4823;font:17px/1.5 Helvetica,Arial,sans-serif;overflow-wrap:anywhere;';
  const strong=document.createElement('strong');
  strong.textContent='RUNLAB safety: ';
  warning.appendChild(strong);
  warning.appendChild(document.createTextNode('These calculations are general estimates - not a diagnosis, medical advice or individual coaching. Seek qualified advice when needed, and stop activity if you experience concerning symptoms.'));
  const reference=document.createElement('div');
  reference.style.cssText='margin-top:8px;color:#ffb49e;font-size:15px;';
  reference.textContent='https://updates.wadadarunclub.com/policies/health/';
  warning.appendChild(reference);
  wrapper.appendChild(warning);
  document.body.appendChild(wrapper);
  try {
    const canvas=await html2canvas(wrapper,{backgroundColor:'#17191b',scale:2,logging:false});
    const anchor=document.createElement('a');
    anchor.download=name+'.png';
    anchor.href=canvas.toDataURL('image/png');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {wrapper.remove();}
}
