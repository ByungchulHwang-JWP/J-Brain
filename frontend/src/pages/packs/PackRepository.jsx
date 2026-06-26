import { useEffect, useState } from 'react';
import axios from 'axios';
import ShellPage from '../../components/common/ShellPage';

const PackRepository = () => {
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('ai_access_token');
    axios.get('/api/v1/intent-packs', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setPacks(res.data || [])).catch(() => setPacks([]));
  }, []);

  return (
    <ShellPage
      title="Pack Repository"
      eyebrow="Pack 제작/배포"
      description="검증된 Intent Pack과 버전을 관리합니다."
      statusItems={[
        { label: '등록 Pack', value: packs.length },
        { label: '저장 방식', value: 'Local Pack Repository' },
      ]}
    >
      <table>
        <thead>
          <tr>
            <th>Pack ID</th>
            <th>Version</th>
            <th>Service</th>
            <th>Path</th>
          </tr>
        </thead>
        <tbody>
          {packs.map((pack) => (
            <tr key={`${pack.pack_id}-${pack.pack_version}`}>
              <td>{pack.pack_id}</td>
              <td>{pack.pack_version}</td>
              <td>{pack.service_name || pack.service_id}</td>
              <td>{pack.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ShellPage>
  );
};

export default PackRepository;
