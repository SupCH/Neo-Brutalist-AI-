import React from 'react'
import './Pagination.css'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    loading?: boolean
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    loading = false
}) => {
    if (totalPages <= 1) return null

    // 生成页面范围
    const getPageRange = () => {
        const delta = 2 // 左右显示的页码数
        const range = []
        const rangeWithDots = []
        let l: number | undefined

        range.push(1)
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
            if (i < totalPages && i > 1) {
                range.push(i)
            }
        }
        range.push(totalPages)

        for (const i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1)
                } else if (i - l !== 1) {
                    rangeWithDots.push('...')
                }
            }
            rangeWithDots.push(i)
            l = i
        }

        return rangeWithDots
    }

    const pages = getPageRange()

    return (
        <div className="pagination-container">
            <button
                className="pagination-btn arrow"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                title="上一页"
            >
                &lt;
            </button>

            {pages.map((p, index) =>
                p === '...' ? (
                    <span key={`dots-${index}`} className="pagination-dots">...</span>
                ) : (
                    <button
                        key={p}
                        className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => onPageChange(p as number)}
                        disabled={loading}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className="pagination-btn arrow"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                title="下一页"
            >
                &gt;
            </button>
        </div>
    )
}

export default Pagination
