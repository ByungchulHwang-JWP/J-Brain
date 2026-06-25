import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * DB에 등록된 프로젝트 목록을 조회하는 공통 훅
 * @returns {{ projects: Array, loading: boolean }}
 */
const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        const res = await axios.get('/api/v1/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data || []);
      } catch (err) {
        console.error('프로젝트 목록 조회 실패:', err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return { projects, loading };
};

export default useProjects;
