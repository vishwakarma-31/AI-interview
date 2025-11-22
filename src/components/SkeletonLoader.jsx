import React from 'react';

const SkeletonLoader = ({ type = 'card', rows = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card" role="status" aria-label="Loading content">
            <div className="skeleton-header"></div>
            <div className="skeleton-content"></div>
            <div className="skeleton-footer"></div>
          </div>
        );
      case 'list':
        return (
          <div className="skeleton-list" role="status" aria-label="Loading list">
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="skeleton-list-item"></div>
            ))}
          </div>
        );
      case 'text':
        return (
          <div className="skeleton-text" role="status" aria-label="Loading text">
            <div className="skeleton-text-line"></div>
            <div className="skeleton-text-line short"></div>
          </div>
        );
      default:
        return (
          <div className="skeleton-default" role="status" aria-label="Loading">
            <div className="skeleton-default-item"></div>
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;