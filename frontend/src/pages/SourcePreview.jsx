import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

const SourcePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const fgRef = useRef();

  const token = () => localStorage.getItem('ai_access_token');

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await axios.get(`/api/v1/sources/${id}/graph`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setGraphData(res.data);
      } catch (err) {
        console.error(err);
        alert('그래프 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGraph();
  }, [id]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    
    // 클릭된 노드를 중심으로 카메라 이동
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  };

  const getNodeColor = (type) => {
    switch (type) {
      case 'CONCEPT': return '#f1c40f'; // 노란색
      case 'STANDARD': return '#e74c3c'; // 빨간색
      case 'METRIC': return '#2ecc71'; // 초록색
      case 'ORGANIZATION': return '#9b59b6'; // 보라색
      default: return '#3498db'; // 파란색
    }
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'} <span onClick={() => navigate('/admin/sources')} style={{cursor:'pointer', textDecoration:'underline'}}>Source 목록</span> {'>'} <span onClick={() => navigate(`/admin/sources/${id}`)} style={{cursor:'pointer', textDecoration:'underline'}}>Source 상세</span> {'>'} <span>Source Preview</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>{id} - Graph Preview</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => navigate(`/admin/sources/${id}`)}>상세로 돌아가기</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
        {/* 왼쪽: 그래프 시각화 영역 */}
        <div style={{ flex: 2, background: '#1e1e1e', borderRadius: '8px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>그래프 데이터 로딩 중...</div>
          ) : graphData.nodes.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>추출된 GraphRAG 엔티티가 없습니다.</div>
          ) : (
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel="name"
              nodeColor={(node) => getNodeColor(node.type)}
              nodeVal={(node) => node.val || 1}
              linkColor={() => 'rgba(255,255,255,0.2)'}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              backgroundColor="#1e1e1e"
              width={undefined} // auto resize
            />
          )}
        </div>

        {/* 오른쪽: 상세 정보 패널 */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #eee', background: '#f8f9fa', fontWeight: 600 }}>
            선택된 노드 정보
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {selectedNode ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Entity Name</h4>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#031B4B' }}>{selectedNode.name}</div>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Type</h4>
                  <span className="badge active" style={{ background: getNodeColor(selectedNode.type) }}>{selectedNode.type || 'UNKNOWN'}</span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Description</h4>
                  <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    {selectedNode.description || '설명이 없습니다.'}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>Connected Relations</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.6 }}>
                    {graphData.links
                      .filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id || l.source === selectedNode.id || l.target === selectedNode.id)
                      .map((l, i) => {
                        const isSource = l.source.id === selectedNode.id || l.source === selectedNode.id;
                        const relatedNodeId = isSource ? (l.target.id || l.target) : (l.source.id || l.source);
                        const relatedNode = graphData.nodes.find(n => n.id === relatedNodeId);
                        return (
                          <li key={i}>
                            <strong style={{ color: '#031B4B' }}>{l.label}</strong> {isSource ? '->' : '<-'} {relatedNode ? relatedNode.name : relatedNodeId}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </>
            ) : (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
                왼쪽 그래프에서 노드를 클릭하면 상세 정보가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcePreview;
