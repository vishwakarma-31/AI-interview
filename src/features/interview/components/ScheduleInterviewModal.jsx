import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, DatePicker, TimePicker, InputNumber, Button, message } from 'antd';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';

export default function ScheduleInterviewModal({ open, onCancel, candidate, onScheduleSuccess }) {
  const [form] = Form.useForm();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens or candidate changes
  useEffect(() => {
    if (open && candidate) {
      form.resetFields();
    }
  }, [open, candidate, form]);

  const handleSchedule = async values => {
    setLoading(true);
    try {
      // Combine date and time
      const scheduledDate = values.date.clone();
      scheduledDate.hour(values.time.hour());
      scheduledDate.minute(values.time.minute());

      // Format to ISO string
      const scheduledAt = scheduledDate.toISOString();

      // Call API to schedule interview
      const response = await api.scheduleInterview({
        candidateId: candidate.id,
        scheduledAt,
        duration: values.duration,
      });

      if (response.success) {
        addToast('Interview scheduled successfully', 'success');
        onScheduleSuccess(response.data.candidate);
        form.resetFields();
        onCancel();
      } else {
        throw new Error(response.error?.message || 'Failed to schedule interview');
      }
    } catch (error) {
      // console.error('Error scheduling interview:', error);
      message.error(error.message || 'Failed to schedule interview');
      addToast(error.message || 'Failed to schedule interview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = current => {
    // Can not select days before today
    return current && current < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <Modal
      title={`Schedule Interview - ${candidate?.name}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      aria-label="Schedule interview modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSchedule}
        aria-label="Schedule interview form"
      >
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker
            disabledDate={disabledDate}
            format="YYYY-MM-DD"
            aria-label="Select interview date"
          />
        </Form.Item>

        <Form.Item
          name="time"
          label="Time"
          rules={[{ required: true, message: 'Please select a time' }]}
        >
          <TimePicker format="HH:mm" aria-label="Select interview time" />
        </Form.Item>

        <Form.Item
          name="duration"
          label="Duration (minutes)"
          rules={[{ required: true, message: 'Please enter duration' }]}
          initialValue={30}
        >
          <InputNumber
            min={15}
            max={120}
            step={15}
            aria-label="Enter interview duration in minutes"
          />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={onCancel} aria-label="Cancel scheduling">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              aria-label="Schedule interview"
            >
              Schedule Interview
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

ScheduleInterviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  candidate: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  onScheduleSuccess: PropTypes.func.isRequired,
};
