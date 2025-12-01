import React from 'react';
import PropTypes from 'prop-types';

export default function SkeletonLoader({ type = 'card', rows = 3 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card" role="status" aria-label="Loading content">
            <div className="skeleton-header" />
            <div className="skeleton-content" />
            <div className="skeleton-footer" />
          </div>
        );
      case 'list':
        return (
          <div className="skeleton-list" role="status" aria-label="Loading list">
            {Array.from({ length: rows }, (_, index) => (
              <div key={`skeleton-${type}-${Date.now()}-${index}`} className="skeleton-list-item" />
            ))}
          </div>
        );
      case 'text':
        return (
          <div className="skeleton-text" role="status" aria-label="Loading text">
            <div className="skeleton-text-line" />
            <div className="skeleton-text-line short" />
          </div>
        );
      default:
        return (
          <div className="skeleton-default" role="status" aria-label="Loading">
            <div className="skeleton-default-item" />
          </div>
        );
    }
  };

  return renderSkeleton();
}

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['card', 'list', 'text']),
  rows: PropTypes.number,
};

SkeletonLoader.defaultProps = {
  type: 'card',
  rows: 3,
};
