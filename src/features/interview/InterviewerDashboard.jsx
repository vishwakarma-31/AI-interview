import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Table, Button, Input, Modal, Typography, Alert, Tag, Dropdown } from 'antd';
import {
  SearchOutlined,
  RedoOutlined,
  CalendarOutlined,
  EyeOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import { useInterview } from '../../contexts/InterviewContext';
import { useToast } from '../../components/ToastContainer';
import SkeletonLoader from '../../components/SkeletonLoader';
import CandidateDetailView from './CandidateDetailView';
import ScheduleInterviewModal from './components/ScheduleInterviewModal';

// Status badge component for better visual representation
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { color: 'orange', icon: <ExclamationCircleOutlined />, text: 'Pending' },
    'in-progress': { color: 'blue', icon: <ClockCircleOutlined />, text: 'In Progress' },
    completed: { color: 'green', icon: <CheckCircleOutlined />, text: 'Completed' },
    scheduled: { color: 'purple', icon: <CalendarOutlined />, text: 'Scheduled' },
    cancelled: { color: 'red', icon: <CloseCircleOutlined />, text: 'Cancelled' },
  };

  const config = statusConfig[status] || { color: 'default', text: status };

  return (
    <Tag icon={config.icon} color={config.color} aria-label={`Status: ${config.text}`}>
      {config.text}
    </Tag>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['pending', 'in-progress', 'completed', 'scheduled', 'cancelled'])
    .isRequired,
};

// Lazy load components that are not immediately needed

export default function InterviewerDashboard() {
  const { candidates, loadingStates, error, clearError, fetchCandidates } = useInterview();
  const { addToast } = useToast();
  const [selected, setSelected] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [query, setQuery] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const searchInputRef = useRef(null);
  const refreshButtonRef = useRef(null);
  const modalRef = useRef(null);

  // Focus management for accessibility
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter candidates based on search query
  useEffect(() => {
    if (!candidates) return;

    const filtered = candidates.filter(candidate =>
      Object.values(candidate).some(
        value => value && String(value).toLowerCase().includes(query.toLowerCase())
      )
    );

    setFilteredCandidates(filtered);
  }, [candidates, query]);

  const handleRefresh = async () => {
    try {
      await fetchCandidates();
      addToast('Candidates list refreshed', 'success');
    } catch (err) {
      addToast('Failed to refresh candidates', 'error');
    }
  };

  const handleSearchChange = e => {
    setQuery(e.target.value);
  };

  const handleRowSelect = record => {
    setSelected(record);
  };

  const handleModalClose = () => {
    setSelected(null);
    setShowScheduleModal(false);
  };

  const handleScheduleClick = () => {
    setShowScheduleModal(true);
  };

  const handleScheduleSuccess = _updatedCandidate => {
    // Update the candidate in the list
    // This would typically be handled by the context/state management
    addToast('Interview scheduled successfully', 'success');
    handleModalClose();
  };

  const handleModalOpen = () => {
    // Additional logic when modal opens
  };

  // Columns configuration for the candidates table
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleRowSelect(record)}
          style={{ padding: 0, height: 'auto' }}
          aria-label={`View details for ${text || 'N/A'}`}
        >
          {text || 'N/A'}
        </Button>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'], // Hide on mobile
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['lg'], // Hide on smaller screens
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      responsive: ['md'],
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: score => (score ? `${Math.round(score)}/100` : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'In Progress', value: 'in-progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      render: status => <StatusBadge status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => handleRowSelect(record),
              },
              {
                key: 'schedule',
                icon: <CalendarOutlined />,
                label: 'Schedule Interview',
                onClick: () => {
                  setSelected(record);
                  handleScheduleClick();
                },
              },
            ],
          }}
        >
          <Button icon={<MoreOutlined />} aria-label="More actions" />
        </Dropdown>
      ),
    },
  ];

  // Render table content with loading and error states
  const renderTableContent = () => {
    if (loadingStates.fetchCandidates) {
      return <SkeletonLoader type="table" rows={5} />;
    }

    if (error) {
      return (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={clearError}>
              Dismiss
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      );
    }

    if (!filteredCandidates || filteredCandidates.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'var(--text-secondary)',
          }}
        >
          <ExclamationCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>No candidates found</p>
          <Button type="primary" onClick={handleRefresh} icon={<RedoOutlined />}>
            Refresh
          </Button>
        </div>
      );
    }

    return (
      <Table
        dataSource={filteredCandidates}
        columns={columns}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        scroll={{ x: 'max-content' }}
        onRow={record => ({
          onClick: e => {
            // Only select row if clicking on the row itself, not on interactive elements
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'svg') {
              e.preventDefault();
              handleRowSelect(record);
            }
          },
          tabIndex: 0,
          'aria-label': `Candidate: ${record.name || 'N/A'}, Email: ${record.email || 'N/A'}, Score: ${record.score || 'N/A'}, Status: ${record.status || 'N/A'}`,
        })}
        style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
      />
    );
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Candidate Info Widget */}
        <div className="card">
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              marginBottom: '16px',
              color: 'var(--text-main)',
              fontWeight: 600,
            }}
          >
            Candidates Overview
          </Typography.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Candidates</span>
              <span style={{ fontWeight: 600 }}>{candidates?.length || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>In Progress</span>
              <span style={{ fontWeight: 600, color: 'var(--warning-color)' }}>
                {candidates?.filter(c => c.status === 'in-progress').length || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Completed</span>
              <span style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>
                {candidates?.filter(c => c.status === 'completed').length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Widget */}
        <div className="card">
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              marginBottom: '16px',
              color: 'var(--text-main)',
              fontWeight: 600,
            }}
          >
            Interview Stats
          </Typography.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Avg. Score</span>
              <span style={{ fontWeight: 600 }}>
                {candidates && candidates.length > 0
                  ? Math.round(
                      candidates.reduce((sum, c) => sum + (c.score ?? 0), 0) / candidates.length
                    )
                  : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Scheduled</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                {candidates?.filter(c => c.status === 'scheduled').length || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pending</span>
              <span style={{ fontWeight: 600, color: 'var(--warning-color)' }}>
                {candidates?.filter(c => c.status === 'pending').length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question List Widget */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              color: 'var(--text-main)',
              fontWeight: 600,
            }}
          >
            Interview Candidates
          </Typography.Title>
          <Button
            icon={<RedoOutlined />}
            onClick={handleRefresh}
            loading={loadingStates.fetchCandidates}
            aria-label="Refresh candidates list"
            ref={refreshButtonRef}
            className="btn-primary"
          >
            Refresh
          </Button>
        </div>

        <Input
          placeholder="Search candidates..."
          value={query}
          onChange={handleSearchChange}
          style={{ marginBottom: 16, maxWidth: 300 }}
          aria-label="Search candidates"
          ref={searchInputRef}
          prefix={<SearchOutlined />}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              addToast(`Searching for: ${query}`, 'info');
            }
          }}
          className="input-modern"
        />

        {renderTableContent()}
      </div>

      <Modal
        title="Candidate Details"
        open={!!selected && !showScheduleModal}
        onCancel={handleModalClose}
        afterOpenChange={open => {
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
        focusTriggerAfterClose
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
