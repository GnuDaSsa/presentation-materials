// Topic-specific speech cues, restricted to the matching slide and script IDs.
const negatives=new Set('not never no cannot cant dont doesnt isnt arent wont'.split(' '));
const alias={centres:'center',centre:'center',suppliers:'supplier',supply:'supplier',customers:'customer',companies:'company',businesses:'company',technologies:'technology',network:'networking',networks:'networking',projects:'project',proposals:'proposal',costs:'cost',facilities:'facility',testing:'test',equipments:'equipment',advancer:'advanced',advance:'advanced',shared:'sharing',share:'sharing',forums:'forum'};
const norm=w=>alias[w]||w;
const pair=(w,a,b)=>w.includes(a)&&w.includes(b);
const definitions={
 5:[
  ['v16-020',w=>pair(w,'development','support')||(pair(w,'support','center')&&w.includes('semiconductor'))],
  ['v16-021',w=>pair(w,'3','project')||pair(w,'major','project')],
 ],
 6:[
  ['v16-025',w=>w.includes('eda')||pair(w,'advanced','equipment')||pair(w,'test','facility')],
  ['v16-026',w=>w.includes('consulting')||w.includes('consultation')||pair(w,'technical','training')],
  ['v16-027',w=>pair(w,'development','cost')||pair(w,'lower','cost')||pair(w,'reduce','cost')],
 ],
 7:[
  ['v16-alliance-001',w=>pair(w,'infrastructure','alliance')||pair(w,'second','thing')],
  ['v16-alliance-006',w=>pair(w,'supplier','company')||pair(w,'supplier','technology')||pair(w,'alliance','connects')||pair(w,'supplier','customer')],
  ['v16-alliance-003',w=>w.includes('forum')],
  ['v16-alliance-004',w=>w.includes('networking')||pair(w,'small','group')],
  ['v16-alliance-005',w=>pair(w,'government','project')||pair(w,'joint','research')||pair(w,'joint','planning')],
  ['v16-alliance-002',w=>w.some(x=>['77','55','22'].includes(x))],
 ],
};
export function findInfrastructureKeywords(tokens,{cues,slide,offset=0,freshFrom=0,active=-1,indices=null,crossing=false}){
 const defs=definitions[slide];if(!defs)return null;
 const base=Math.max(offset,tokens.length-32),raw=tokens.slice(base);
 if(raw.some(w=>negatives.has(w)))return null;
 const candidates=[];
 for(const [id,predicate] of defs){
  const i=cues.findIndex(c=>c.id===id && c.slide===slide);if(i<0||i===active||(indices&&!indices.includes(i)))continue;
  for(let start=0;start<raw.length;start++){
   for(let end=start+1;end<=Math.min(raw.length,start+8);end++){
    const segment=raw.slice(start,end),words=segment.map(norm);
    const crossingCue=crossing && ((slide===7 && id==='v16-alliance-001' && words.includes('alliance') && (words.includes('infrastructure') || (words.includes('system') && words.includes('semiconductor')))) || (slide===5 && id==='v16-020' && words.includes('development') && words.includes('support') && words.includes('center')));
    if((crossing?!crossingCue:!predicate(words))||base+end<=freshFrom)continue;
    const numbers=raw.filter(w=>/^\d+$/.test(w));
    const expected=(cues[i].en.match(/\d+/g)||[]);
    if(numbers.some(n=>!expected.includes(n)&&!(n==='3'&&id==='v16-021')))continue;
    candidates.push({i,start:base+start,end:base+end,count:end-start,score:1,keyword:'infrastructure-'+id});break;
   }
  }
 }
 candidates.sort((a,b)=>a.end-b.end||a.start-b.start);
 return candidates[0]||null;
}
