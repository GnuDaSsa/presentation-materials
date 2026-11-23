export const DECK_VERSION="2026-11-03-english-v1.6-alliance-restored";
export const SLIDE_COUNT=12;
export function migrateLegacyScript(value){if(value?.deckVersion&&value.deckVersion!==DECK_VERSION)throw new Error('이전 버전의 원고입니다. 얼라이언스가 포함된 최신 12장 원고를 사용해 주세요. 기존 저장 원고는 유지됩니다.');return value;}
