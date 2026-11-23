// The English welcome has a Korean opening with a similar English translation.
// Select the spoken welcome by its subject, never by "Thank you (for)" alone.
export function isWelcomeCue(tokens) {
 return tokens.includes('seongnam') && tokens.includes('schedule') && (tokens.includes('delegation') || tokens.includes('ministry'));
}
function closeWord(a,b){
 if(a===b)return true;
 if(Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1)return false;
 let row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}
 return row[b.length]<=1;
}
function wordType(word){
 if(['visit','visiting','visited'].includes(word))return 'visit';
 if(['take','taking'].includes(word))return 'taking';
 if(word==='timeout')return 'time';
 if(word==='schedules')return 'schedule';
 for(const expected of ['schedule','delegation','ministry','science','technology'])if(closeWord(word,expected))return expected;
 return word;
}
export function findWelcomeKeywords(tokens,{offset=0,freshFrom=0,active=-1,profiles}){
 if(profiles.length!==1||profiles[0].i===active)return null;
 const base=Math.max(offset,tokens.length-45),raw=tokens.slice(base),words=raw.map(wordType),hits=[];
 if(raw.some(w=>['not','never','no','cannot','cant','dont','doesnt','isnt','arent','wont'].includes(w)))return null;
 for(let at=0;at<words.length;at++){
  if(words[at]==='delegation')hits.push({start:at,end:at+1});
  for(let next=at+1;next<Math.min(words.length,at+6);next++){
   const pair=[words[at],words[next]];
   if([['busy','schedule'],['taking','time'],['visit','seongnam'],['ministry','science'],['science','technology']].some(([a,b])=>pair.includes(a)&&pair.includes(b)))hits.push({start:at,end:next+1});
  }
 }
 const hit=hits.filter(h=>base+h.end>freshFrom).sort((a,b)=>a.start-b.start||b.end-a.end)[0];
 return hit?{i:profiles[0].i,start:base+hit.start,end:base+hit.end,count:hit.end-hit.start,score:1,keyword:'english-welcome'}:null;
}
