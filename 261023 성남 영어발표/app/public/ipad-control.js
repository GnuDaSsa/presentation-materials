// A remote cue is a jump, not a pause: ASR resumes at the selected position.
export function applyIpadCue({selection,script,signature,running,captionMode,peer,currentSlide,setSlide,clearCaptions,replaceCaption,publishScript}) {
 if(!running || captionMode!=='script' || !peer || !script || selection.signature!==signature)return false;
 const index=script.cues.findIndex(c=>c.id===selection.id && c.slide===selection.slide);
 if(index<0)return false;
 const cue=script.cues[index];
 if(currentSlide!==cue.slide)setSlide(cue.slide-1);
 peer.seek(index);clearCaptions();
 for(const lang of ['vi','ko'])replaceCaption(lang,cue[lang],true,{cue:0,revision:0});
 publishScript({state:'manual',index,slide:cue.slide,ack:selection.requestId});
 return true;
}
