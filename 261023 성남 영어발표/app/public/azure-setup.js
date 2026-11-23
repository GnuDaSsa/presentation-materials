const status = document.getElementById('setup-status'), detail = document.getElementById('setup-detail');
async function check() {
  try {
    const health = await fetch('/api/health').then(response => response.json());
    const azure = health.providers?.azure;
    status.textContent = azure?.available ? 'Azure 키 설정됨' : '다음 단계: Azure 리소스 만들기';
    detail.textContent = azure?.available ? `지역: ${azure.region} · 설정 존재 여부입니다. 실제 연결은 발표 화면의 자막 시작으로 확인하세요.` : 'Azure 리소스와 키는 아직 설정되지 않았습니다. 아래 1~4단계를 진행해 주세요.';
  } catch { status.textContent = '발표 서버 연결 필요'; detail.textContent = '발표시작.cmd를 실행하고 http://127.0.0.1:3230/azure-setup.html 주소로 열어 주세요.'; }
}
document.getElementById('check-status').addEventListener('click', check);
void check();
