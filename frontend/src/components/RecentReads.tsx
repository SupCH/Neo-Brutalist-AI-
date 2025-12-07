import React, { useState, useEffect } from 'react';
import './RecentReads.css';

interface ViewEvent {
    title: string;
    timestamp: string;
    id: number;
}

const RecentReads: React.FC = () => {
    const [latestView, setLatestView] = useState<ViewEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // 计算相对时间 (e.g., "刚刚", "2分钟前")
    const getRelativeTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

        if (diffInSeconds < 60) return '刚刚';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
        return `${Math.floor(diffInSeconds / 3600)}小时前`;
    };

    const fetchRecentViews = async () => {
        try {
            const response = await fetch('/api/analytics/recent-views');
            if (response.ok) {
                const data: ViewEvent[] = await response.json();
                if (data.length > 0) {
                    const newest = data[0];
                    // 如果是新的记录，或者之前没有记录，则更新显示
                    if (!latestView || newest.timestamp !== latestView.timestamp) {
                        setLatestView(newest);
                        setIsVisible(true);

                        // 5秒后自动隐藏，等待下一次轮询 update
                        setTimeout(() => setIsVisible(false), 8000);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch recent views', error);
        }
    };

    useEffect(() => {
        // 首次加载
        fetchRecentViews();

        // 每 30 秒轮询一次
        const interval = setInterval(fetchRecentViews, 30000);
        return () => clearInterval(interval);
    }, [latestView]);

    if (!latestView) return null;

    return (
        <div className={`recent-reads-container ${isVisible ? 'visible' : ''}`}>
            <div className="recent-reads-content">
                <span className="recent-reads-icon">👀</span>
                <span className="recent-reads-text">
                    有人{getRelativeTime(latestView.timestamp)}阅读了
                    <span className="recent-reads-title">《{latestView.title}》</span>
                </span>
            </div>
        </div>
    );
};

export default RecentReads;
