export const OPENING_FADE_MS = 1200;
export const OPENING_KEY = 'seongnam-korean-opening-v1';
export const OPENING_SLIDE_KEY = 'workshop-slide-korean-opening-v1';

// Shared by the cover transition and its prepared subtitle. The speaker may
// change the introduction and ending, including "진행해 보도록 하겠습니다".
export function findEnglishHandoff(text) {
  const compact=String(text).normalize('NFKC').replace(/[^\p{L}\p{N}?？]/gu,'');
  const pattern=/영어로(?:는)?(?:발표를)?(?:진행|발표|말씀)/g;
  for(const match of compact.matchAll(pattern)){
    const rest=compact.slice(match.index+match[0].length,match.index+match[0].length+28);
    if(/^(?:을|를)?(?:안|못|하지않|하지못|하지말|하지는않|하지는못|할까요|하나요|합니까|할지)/.test(rest) || /^[^가-힣]*[?？]/.test(rest) || /^(?:하겠습니까|해볼까요|해보도록할까요)/.test(rest))continue;
    return {start:match.index,end:match.index+match[0].length};
  }
  return null;
}
export const isEnglishHandoff=text=>Boolean(findEnglishHandoff(text));

// One opening, two cover states. Speech and the Next key share this gate.
export class OpeningSequence {
  constructor(phase='ko'){this.revision=0;this.reset();if(phase==='en')this.skip();}
  reset(){this.revision++;this.phase='ko';this.item=null;this.text='';this.carry='';}
  skip(){this.revision++;this.phase='en';}
  begin(){if(this.phase!=='ko')return null;this.phase='changing';return ++this.revision;}
  finish(token){if(token!==this.revision)return false;this.phase='en';return true;}
  feed(text,{slide=1,item='utterance'}={}){
    if(slide!==1||this.phase!=='ko')return false;
    if(item!==this.item){this.carry=(this.carry+' '+this.text).slice(-180);this.item=item;}
    this.text=String(text);
    return isEnglishHandoff(this.carry+' '+this.text);
  }
}
