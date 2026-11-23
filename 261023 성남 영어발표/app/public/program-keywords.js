// The three project names are known in advance. Within their own slide, a
// distinctive word from the name is enough; list numbers never select a cue.
const ordinals={first:0,'1st':0,second:1,'2nd':1,third:2,thrid:2,'3rd':2};
const links=new Set('the a an and or but now next well so then uh um er ah you know is are was were this that it one of for to about not never no cannot cant dont doesnt isnt arent wont'.split(' '));
const negatives=new Set('not never no cannot cant dont doesnt isnt arent wont'.split(' '));
const unrelated=new Set('floor floors time times party parties person'.split(' '));
const aliases={centre:'center',advance:'advanced',advancer:'advanced',equipments:'equipment',sharing:'sharing',share:'sharing',shared:'sharing',shares:'sharing',testing:'test',tested:'test',tests:'test',projects:'project',chips:'chip',defence:'defense'};
function closeWord(a,b){
 if(a===b)return true;
 if(a.length<5||Math.abs(a.length-b.length)>1)return false;
 let row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}
 return row[b.length]<=1;
}
function wordType(word){
 word=aliases[word]||word;
 if(['verification','verify','validation','validate'].some(w=>closeWord(word,w)))return 'verification';
 if(closeWord(word,'defense'))return 'defense';
 if(closeWord(word,'equipment'))return 'equipment';
 return word;
}
export function projectProfile(target){
 if(target.includes('first')&&target.includes('ic')&&target.some(w=>['verification','validation'].includes(w)))return 0;
 if(target.includes('second')&&target.includes('testing')&&target.includes('defense'))return 1;
 if(target.includes('third')&&target.includes('equipment')&&target.includes('sharing')&&target.includes('fabless'))return 2;
 return -1;
}
export function isProjectReferenceNumber(tokens,at){
 return /^[123]$/.test(tokens[at])&&['number','item','project'].includes(tokens[at-1]);
}
function markers(tokens){
 const found=[];
 for(let at=0;at<tokens.length;at++){
  const profile=ordinals[tokens[at]] ?? (isProjectReferenceNumber(tokens,at)?Number(tokens[at])-1:undefined);
  if(profile===undefined)continue;
  let start=isProjectReferenceNumber(tokens,at)?at-1:at;
  const end=at+1;
  while(start>0&&links.has(tokens[start-1]))start--;
  found.push({profile,start,end,at});
 }
 return found;
}
export function projectClauseEnd(tokens,start){
 return markers(tokens).find(m=>m.at>start&&m.start>start)?.start ?? tokens.length;
}
export function findProjectKeywords(tokens,{offset=0,freshFrom=0,active=-1,profiles}){
 if(new Set(profiles.map(p=>p.profile)).size!==3)return null;
 const base=Math.max(offset,tokens.length-90),raw=tokens.slice(base),words=raw.map(wordType),ord=markers(raw),signals=[];
 // Expand the initials before looking for pairs, keeping original token offsets.
 for(let at=0;at<words.length-1;at++)if(words[at]==='i'&&words[at+1]==='c')words[at]='ic';
 for(let at=0;at<words.length;at++){
  const word=words[at];
  if(['verification','defense','sharing'].includes(word))signals.push({profile:['verification','defense','sharing'].indexOf(word),start:at,end:at+1,at});
  for(let next=at+1;next<Math.min(words.length,at+7);next++){
   const pair=[words[at],words[next]];
   let profile=-1;
   if(pair.includes('ic')&&pair.some(w=>['system','center'].includes(w)))profile=0;
   if(pair.includes('test')&&pair.some(w=>['semiconductor','chip','project','defense'].includes(w)))profile=1;
   if(pair.includes('equipment')&&pair.some(w=>['advanced','sharing','fabless'].includes(w)))profile=2;
   if(profile>=0)signals.push({profile,start:at,end:next+1+(words[next]==='ic'&&raw[next]==='i'?1:0),at});
  }
 }
 const matches=[];
 for(const signal of signals){
  const target=profiles.find(p=>p.profile===signal.profile);
  if(!target||target.i===active||base+signal.end<=freshFrom)continue;
  const preceding=ord.filter(m=>m.at<=signal.at).at(-1),following=ord.find(m=>m.at>signal.at);
  const begin=preceding?.start ?? 0,end=following?.start ?? raw.length;
  const region=raw.slice(begin,end);
  if(region.some((word,i)=>negatives.has(word)||unrelated.has(word)||(/^\d+$/.test(word)&&!isProjectReferenceNumber(region,i)&&!(word==='1'&&ordinals[region[i-1]]!==undefined))))continue;
  // Ordinals only delimit clauses. The name chooses the project, even when
  // the speaker changes the order or uses a different list number.
  matches.push({i:target.i,start:base+signal.start,end:base+signal.end,count:signal.end-signal.start,score:1,keyword:'program-'+signal.profile});
 }
 matches.sort((a,b)=>a.start-b.start||b.end-a.end);
 return matches[0]||null;
}
