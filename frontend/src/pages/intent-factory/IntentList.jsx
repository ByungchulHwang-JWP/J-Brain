import { useEffect, useState } from 'react';
import axios from 'axios';
import ShellPage from '../../components/common/ShellPage';

const IntentList = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('ai_access_token');
    axios.get('/api/v1/intent-packs/netzero-intent-pack-v0.1.0', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setSummary(res.data)).catch(() => setSummary(null));
  }, []);

  return (
    <ShellPage
      title="Intent 관리"
      eyebrow="Intent Factory"
      description="사용자 질문의 업무 의도를 정의하고 Action과 연결하는 관리 화면입니다."
      statusItems={[
        { label: 'Pack ID', value: summary?.pack_id || '-' },
        { label: 'Intent 수', value: summary?.counts?.intents ?? '-' },
        { label: 'Action 수', value: summary?.counts?.actions ?? '-' },
        { label: '검증 상태', value: summary?.validation?.valid ? '정상' : '-' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 현재 로컬 Intent Pack의 요약을 표시합니다. 다음 단계에서 Intent 목록, 예시 질문, Entity, Action 연결 편집 기능을 추가합니다.
      </p>
    </ShellPage>
  );
};

export default IntentList;
