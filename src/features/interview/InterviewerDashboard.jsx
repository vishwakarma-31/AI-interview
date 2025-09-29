import React, { useMemo, useState } from 'react';
import { Card, Input, Modal, Table, Tag } from 'antd';
import { useSelector } from 'react-redux';
import CandidateDetailView from './CandidateDetailView.jsx';

export default function InterviewerDashboard() {
  const { candidates } = useSelector(s => s.interview);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const data = useMemo(() => {
    const base = candidates || [];
    const filtered = query
      ? base.filter(c => (c.name || '').toLowerCase().includes(query.toLowerCase()))
      : base;
    return filtered.map(c => ({
      key: c.id,
      name: c.name,
      email: c.email,
      score: c.score ?? 0,
      status: c.status,
      raw: c,
    }));
  }, [candidates, query]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Final Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const color = s === 'completed' ? 'green' : s === 'in-progress' ? 'blue' : s === 'abandoned' ? 'red' : 'default';
        return <Tag color={color}>{s}</Tag>;
      }
    }
  ];

  return (
    <div className="chat-container">
      <Card title="Interview Results" extra={<Input.Search placeholder="Search by name" allowClear onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} style={{ width: 260 }} />}>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 8 }}
          onRow={(record) => ({ onClick: () => setSelected(record.raw) })}
        />
      </Card>

      <Modal
        title={selected ? `Candidate: ${selected.name}` : ''}
        open={!!selected}
        onCancel={() => setSelected(null)}
        onOk={() => setSelected(null)}
        width={720}
      >
        {selected && <CandidateDetailView candidate={selected} />}
      </Modal>
    </div>
  );
}


