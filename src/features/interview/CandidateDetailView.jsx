import React from 'react';
import { Descriptions, List } from 'antd';

export default function CandidateDetailView({ candidate }) {
  if (!candidate) return null;
  return (
    <div>
      <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Name">{candidate.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{candidate.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{candidate.phone}</Descriptions.Item>
        <Descriptions.Item label="Final Score">{candidate.score}</Descriptions.Item>
        <Descriptions.Item label="AI Summary">{candidate.summary || '—'}</Descriptions.Item>
        <Descriptions.Item label="Status">{candidate.status}</Descriptions.Item>
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


