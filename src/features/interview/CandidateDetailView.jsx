import React from 'react';
import { Button, Descriptions, Input, List, Space, Tag } from 'antd';
import jsPDF from 'jspdf';

export default function CandidateDetailView({ candidate }) {
  if (!candidate) return null;
  
  // Remove Redux dispatch and replace with local state or context if needed
  // For now, we'll just remove the functionality since it's not critical
  
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(candidate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `candidate-${candidate.name || candidate.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportPDF = () => {
    const doc = new jsPDF();
    const line = (text, y) => { doc.text(String(text), 10, y); };
    let y = 10;
    line(`Candidate: ${candidate.name}`, y += 10);
    line(`Email: ${candidate.email}`, y += 8);
    line(`Phone: ${candidate.phone}`, y += 8);
    line(`Role: ${candidate.role || '—'}`, y += 8);
    line(`Final Score: ${candidate.score}`, y += 8);
    line(`Summary: ${candidate.summary || '—'}`, y += 8);
    y += 6; line('Questions:', y += 8);
    (candidate.questions || []).forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 10; }
      line(`${i + 1}. [${q.difficulty} ${q.time}s] ${q.text}`, y += 8);
      const answer = (q.answer || '').slice(0, 150);
      if (answer) { line(`Ans: ${answer}`, y += 8); }
      line(`Score: ${q.score}`, y += 8);
    });
    doc.save(`candidate-${candidate.name || candidate.id}.pdf`);
  };
  
  return (
    <div>
      <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Name">{candidate.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{candidate.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{candidate.phone}</Descriptions.Item>
        <Descriptions.Item label="Role">{candidate.role || '—'}</Descriptions.Item>
        <Descriptions.Item label="Final Score">{candidate.score}</Descriptions.Item>
        <Descriptions.Item label="AI Summary">{candidate.summary || '—'}</Descriptions.Item>
        <Descriptions.Item label="Status">{candidate.status}</Descriptions.Item>
        <Descriptions.Item label="Tags">
          <Space wrap>
            {(candidate.tags || []).map(t => <Tag key={t}>{t}</Tag>)}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Notes">
          <Input.TextArea rows={3} defaultValue={candidate.notes || ''} placeholder="Add reviewer notes..." />
        </Descriptions.Item>
        <Descriptions.Item label="Edit Tags">
          <Input defaultValue={(candidate.tags || []).join(', ')} placeholder="tag1, tag2" />
        </Descriptions.Item>
        <Descriptions.Item label="Export">
          <Space>
            <Button onClick={exportJSON}>Export JSON</Button>
            <Button onClick={exportPDF}>Export PDF</Button>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <List
        header={<div>Questions and Answers</div>}
        bordered
        dataSource={candidate.questions}
        renderItem={(q, idx) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Q{idx + 1} ({q.difficulty}, {q.time}s)</div>
              <div style={{ marginBottom: 6 }}>{q.text}</div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>Answer: {q.answer || '—'}</div>
              <div style={{ marginTop: 6 }}>Score: {q.score}</div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}


