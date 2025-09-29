import React, { useEffect, useMemo, useState } from 'react';
import { Progress } from 'antd';

export default function QuestionTimer({ deadlineMs, totalSeconds, onExpire }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, (deadlineMs ?? Date.now()) - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const percent = useMemo(() => {
    if (!totalSeconds || totalSeconds <= 0) return 0;
    const used = totalSeconds - remainingSeconds;
    const p = Math.round((used / totalSeconds) * 100);
    return Math.min(100, Math.max(0, p));
  }, [totalSeconds, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0 && typeof onExpire === 'function') {
      onExpire();
    }
    // fire once at boundary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds <= 0]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Progress type="circle" percent={percent} size={44} />
      <div style={{ fontWeight: 600 }}>{remainingSeconds}s left</div>
    </div>
  );
}


