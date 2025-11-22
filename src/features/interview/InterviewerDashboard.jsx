import React, { lazy, Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Card, Input, Modal, Spin, Table, Tag, Button, message, Result, Typography } from 'antd';
import { RedoOutlined, CalendarOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useInterview } from '../../contexts/InterviewContext.jsx';
import DashboardErrorBoundary from '../../components/DashboardErrorBoundary.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import { useToast } from '../../components/ToastContainer.jsx';

// Lazy load CandidateDetailView since it's only used in a modal
const CandidateDetailView = lazy(() => import('./CandidateDetailView.jsx'));
const ScheduleInterviewModal = lazy(() => import('./components/ScheduleInterviewModal.jsx'));

export default function InterviewerDashboard() {
  return (
    <DashboardErrorBoundary>
      <InterviewerDashboardContent />
    </DashboardErrorBoundary>
  );
}

function InterviewerDashboardContent() {
  const { candidates, loadingStates, fetchCandidates, errors } = useInterview();
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  
  // Refs for focus management
  const searchInputRef = useRef(null);
  const refreshButtonRef = useRef(null);
  const tableRef = useRef(null);
  const modalRef = useRef(null);

  // Fetch candidates when component mounts
  useEffect(() => {
    fetchCandidates().catch(err => {
      console.error('Failed to fetch candidates:', err);
      addToast('Failed to load candidates. Please try again.', 'error');
    });
  }, [fetchCandidates, addToast]);

  // Handle fetch candidates errors with retry option
  useEffect(() => {
    if (errors.fetchCandidates) {
      message.error({
        content: (
          <div>
            <div>Failed to load candidates: {errors.fetchCandidates}</div>
            <Button 
              type="link" 
              icon={<RedoOutlined />} 
              onClick={fetchCandidates} 
              size="small"
              style={{ padding: 0, marginTop: 4 }}
              aria-label="Retry loading candidates"
            >
              Retry
            </Button>
          </div>
        ),
        duration: 0, // Keep the message until manually closed
        key: 'fetchCandidatesError'
      });
      addToast(`Failed to load candidates: ${errors.fetchCandidates}`, 'error');
    }
  }, [errors.fetchCandidates, fetchCandidates, addToast]);

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

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  // Handle row selection
  const handleRowSelect = useCallback((record) => {
    setSelected(record.raw);
    addToast(`Viewing details for ${record.name}`, 'info');
  }, [addToast]);

  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {text || 'N/A'}
        </div>
      )
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email)
    },
    { 
      title: 'Score', 
      dataIndex: 'score', 
      key: 'score',
      render: (score) => score ? `${score}/100` : 'N/A',
      sorter: (a, b) => (a.score ?? 0) - (b.score ?? 0)
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'completed' ? 'green' : 
          status === 'in-progress' ? 'orange' : 
          status === 'scheduled' ? 'blue' : 
          status === 'pending' ? 'gold' : 
          'default'
        }>
          {status || 'N/A'}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Abandoned', value: 'abandoned' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            type="link" 
            onClick={() => handleRowSelect(record)}
            aria-label={`View details for ${record.name}`}
          >
            View Details
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="link" 
              icon={<CalendarOutlined />}
              onClick={() => {
                setSelected(record.raw);
                setShowScheduleModal(true);
              }}
              aria-label={`Schedule interview for ${record.name}`}
            >
              Schedule
            </Button>
          )}
        </div>
      ),
    },
  ];

  // State for scheduling modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Handle scheduling success
  const handleScheduleSuccess = useCallback((updatedCandidate) => {
    // Update the candidate in the list
    fetchCandidates();
    addToast('Interview scheduled successfully', 'success');
  }, [fetchCandidates, addToast]);

  // Focus management for modal
  const handleModalOpen = useCallback(() => {
    // When modal opens, focus should be trapped within the modal
    setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, 100);
  }, []);

  const handleModalClose = useCallback(() => {
    // When modal closes, return focus to the triggering element
    setSelected(null);
    setShowScheduleModal(false);
    addToast('Closed candidate details modal', 'info');
  }, [addToast]);

  // Focus management when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchCandidates();
    addToast('Refreshing candidates list', 'info');
  }, [fetchCandidates, addToast]);

  // Render loading state
  if (loadingStates.fetchCandidates && !candidates) {
    return (
      <div className="dashboard-container">
        <Card className="dashboard-card">
          <SkeletonLoader type="list" rows={5} />
        </Card>
      </div>
    );
  }

  // Render error state
  if (errors.fetchCandidates && !candidates) {
    return (
      <div className="dashboard-container">
        <Card className="dashboard-card">
          <Result
            status="error"
            title="Failed to Load Candidates"
            subTitle={errors.fetchCandidates}
            extra={[
              <Button 
                type="primary" 
                key="retry" 
                onClick={handleRefresh}
                icon={<RedoOutlined />}
                loading={loadingStates.fetchCandidates}
              >
                Retry
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Card 
        className="dashboard-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Interview Candidates</span>
            <Button 
              icon={<RedoOutlined />} 
              onClick={handleRefresh} 
              loading={loadingStates.fetchCandidates}
              aria-label="Refresh candidates list"
              ref={refreshButtonRef}
            >
              Refresh
            </Button>
          </div>
        }
      >
        <Input
          placeholder="Search candidates..."
          value={query}
          onChange={handleSearchChange}
          style={{ marginBottom: 16, maxWidth: 300 }}
          aria-label="Search candidates"
          ref={searchInputRef}
          prefix={<SearchOutlined />}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addToast(`Searching for: ${query}`, 'info');
            }
          }}
        />
        
        {loadingStates.fetchCandidates ? (
          <SkeletonLoader type="list" rows={5} />
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Typography.Title level={4}>No candidates found</Typography.Title>
            <Typography.Text type="secondary">
              {query ? 'Try adjusting your search' : 'No interview candidates available'}
            </Typography.Text>
          </div>
        ) : (
          <Table 
            dataSource={data} 
            columns={columns} 
            pagination={{ pageSize: 10 }}
            rowKey="key"
            locale={{
              emptyText: (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div>No candidates found</div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(0,0,0,0.45)' }}>
                    {query ? 'Try adjusting your search' : 'No interview candidates available'}
                  </div>
                </div>
              )
            }}
            aria-label="Candidates table"
            ref={tableRef}
            onRow={(record) => ({
              onClick: () => handleRowSelect(record),
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowSelect(record);
                }
              },
              tabIndex: 0,
              'aria-label': `Candidate: ${record.name || 'N/A'}, Email: ${record.email || 'N/A'}, Score: ${record.score || 'N/A'}, Status: ${record.status || 'N/A'}`
            })}
            className="dashboard-table"
          />
        )}
      </Card>
      
      <Modal
        title="Candidate Details"
        open={!!selected && !showScheduleModal}
        onCancel={handleModalClose}
        afterOpenChange={(open) => {
          if (open) {
            handleModalOpen();
            addToast('Opened candidate details modal', 'info');
          }
        }}
        footer={null}
        width={800}
        aria-label="Candidate details modal"
        aria-modal="true"
        role="dialog"
        // Focus management
        focusTriggerAfterClose={true}
        ref={modalRef}
      >
        {selected && (
          <Suspense fallback={<SkeletonLoader type="card" />}>
            <CandidateDetailView candidate={selected} />
          </Suspense>
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        title="Schedule Interview"
        open={showScheduleModal}
        onCancel={handleModalClose}
        footer={null}
        width={500}
        aria-label="Schedule interview modal"
        aria-modal="true"
        role="dialog"
      >
        {selected && (
          <Suspense fallback={<SkeletonLoader type="card" />}>
            <ScheduleInterviewModal
              open={showScheduleModal}
              onCancel={handleModalClose}
              candidate={selected}
              onScheduleSuccess={handleScheduleSuccess}
            />
          </Suspense>
        )}
      </Modal>
    </div>
  );
}