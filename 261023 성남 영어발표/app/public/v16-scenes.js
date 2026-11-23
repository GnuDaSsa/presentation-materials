import {renderSpeakerIntro} from './speaker-intro-scene.js';
import {renderScene as renderOriginal,titles as originalTitles} from './final-scenes.js';
export const sourcePages=[1,null,2,3,4,5,6,7,8,9,10,11];
export const titles={ko:sourcePages.map(n=>n===null?'사진우 · AI 챔피언 블랙':originalTitles.ko[n-1]),en:[
 'Seongnam: The Heart of the System Semiconductor Cluster',
 'Jinwoo Sa · AI Champion Black',
 'Our vision and industrial strength',
 'Three main strategies',
 'System Semiconductor Development Support Center: Three major projects',
 'Advanced equipment, EDA tools and testing facilities',
 'Seongnam System Semiconductor Alliance',
 'Three-step semiconductor training',
 'Pangyo System Semiconductor Research Center',
 'Office space, research and technical support',
 'A strong industrial ecosystem',
 'Thank you',
]};
const englishCopy=[
 ['A hub for<br>system semiconductors','The Heart of the<br>System Semiconductor Cluster'],
 ['Jinwoo Sa · Semiconductor Team<br>AI Semiconductor Division · AI Innovation Bureau<br>Seongnam City','Jinwoo Sa · Semiconductor Team<br>AI Semiconductor Department · AI Division<br>Seongnam City Hall'],
 ['Seongnam: A concentration<br>of Korea’s fabless companies','Our vision and<br>industrial strength'],
 ['Strategy for supporting the<br>system semiconductor industry','Three main strategies'],
 ['Infrastructure development','Infrastructure'],
 ['Development Support Center<br>Three programs','System Semiconductor<br>Development Support Center<br>Three major projects'],
 ['System Semiconductor<br>Validation Support Center','System IC<br>Verification Center'],
 ['Advanced Defense<br>System Semiconductor<br>Component Demonstration','Semiconductor Testing Project<br>for the Advanced Defense Industry'],
 ['Shared Advanced Equipment<br>for Fabless Companies','Advanced Equipment Sharing<br>Program for Fabless Companies'],
 ['Support for design, validation<br>and commercialization','Advanced equipment, EDA tools<br>and testing facilities'],
 ['Talent development with universities','Three-step semiconductor training'],
 ['Specialist skills','Professional skills'],
 ['Advanced skills','Advanced expertise'],
 ['Digital Design Specialist Program','Specialized Course in<br>Digital Chip Design'],
 ['Global Semiconductor Design<br>Specialist Program','Advanced Semiconductor<br>Design Program'],
 ['Pangyo 3rd Techno Valley','Third Pangyo Techno Valley'],
 ['Connecting business premises,<br>research and technical support','Office space, research<br>and technical support'],
 ['Business premises and research space','Office and research space'],
 ['Business premises and research','Office space and research'],
 ['Growth for companies and talent','A strong industrial ecosystem'],
 ['Creation of quality jobs','Create high-quality jobs'],
 ['Stronger fabless competitiveness','Help fabless companies compete'],
 ['A sustainable industrial ecosystem','Build a strong industry network'],
];
export function renderScene(n,lang){
 if(n===2)return renderSpeakerIntro(lang,sourcePages.length);
 let html=renderOriginal(sourcePages[n-1],lang).replace(/data-scene="\d+"/,`data-scene="${n}"`).replace(/<footer class="scene-footer">.*?<\/footer>/,`<footer class="scene-footer">${String(n).padStart(2,'0')} / ${sourcePages.length}</footer>`);
 if(lang==='en')for(const [before,after] of englishCopy)html=html.replaceAll(before,after);
 if(n===1)html=html.replace('final-cover dark','final-cover dark v16-cover');
 if(sourcePages[n-1]===8){
  const en=lang==='en',root='/assets/research-video/';
  const label=en?'Presenter-created 3D model · Conceptual design':'직접 제작한 3D 모델 · 기획안';
  const media=`<div class="research-photo research-video reveal"><img src="${root}poster.png" alt="${label}"><video data-src="${root}research-center-orbit.mp4" poster="${root}poster.png" muted playsinline preload="metadata" aria-label="${label}"></video><button type="button" class="research-video-toggle" data-video-toggle>${en?'▶ Play':'▶ 재생'}</button><div class="image-credit"><a href="https://gnudassa.github.io/pangyo-3d-viewer/?v=0.7" target="_blank" rel="noopener noreferrer">${label} ↗</a><a class="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">Map data © OpenStreetMap contributors · ODbL</a></div></div>`;
  html=html.replace(/<div class="research-photo reveal">[\s\S]*?<\/div>/,media);
 }
 return html;
}
