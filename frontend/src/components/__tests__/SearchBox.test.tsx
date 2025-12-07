import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchBox from '../SearchBox'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

describe('SearchBox', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderWithRouter = (component: React.ReactNode) => {
        return render(<BrowserRouter>{component}</BrowserRouter>)
    }

    // Mock result matching new API format
    const getMockResults = (keyword: string = 'test') => [
        {
            id: 1,
            title: 'Test Post',
            slug: 'test-post',
            excerpt: 'Test excerpt',
            tags: [{ id: 1, name: 'React', slug: 'react' }],
            matchType: 'title',
            matchSnippet: 'This is a Test Post about testing',
            matchKeyword: keyword
        },
        {
            id: 2,
            title: 'Another Post',
            slug: 'another-post',
            excerpt: 'Another excerpt',
            tags: [],
            matchType: 'content',
            matchSnippet: '...content contains test keyword...',
            matchKeyword: keyword
        }
    ]

    it('renders search button initially', () => {
        renderWithRouter(<SearchBox />)
        expect(screen.getByRole('button')).toBeInTheDocument()
        expect(screen.getByText('Ctrl+K')).toBeInTheDocument()
    })

    it('opens search input when button is clicked', () => {
        renderWithRouter(<SearchBox />)
        const button = screen.getByRole('button')
        fireEvent.click(button)
        expect(screen.getByPlaceholderText('搜索文章...')).toBeInTheDocument()
    })

    it('searches and displays results with match type badges', async () => {
        renderWithRouter(<SearchBox />)
        fireEvent.click(screen.getByRole('button'))
        const input = screen.getByPlaceholderText('搜索文章...')

            ; (global.fetch as any).mockResolvedValueOnce({
                json: async () => getMockResults()
            })

        fireEvent.change(input, { target: { value: 'test' } })

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/posts/search?q=test'))
        })

        // Wait for results - check for title containing the text (may be split by highlighting)
        await waitFor(() => {
            const resultItems = document.querySelectorAll('.search-result-item')
            expect(resultItems.length).toBeGreaterThan(0)
        })
        // Verify match type badge displayed
        expect(await screen.findByText('标题')).toBeInTheDocument()
        expect(await screen.findByText('内容')).toBeInTheDocument()
    })

    it('highlights keywords in results', async () => {
        renderWithRouter(<SearchBox />)
        fireEvent.click(screen.getByRole('button'))
        const input = screen.getByPlaceholderText('搜索文章...')

            ; (global.fetch as any).mockResolvedValueOnce({
                json: async () => getMockResults('Test')
            })

        fireEvent.change(input, { target: { value: 'Test' } })

        // Wait for results to render and check for highlight marks
        await waitFor(() => {
            const marks = document.querySelectorAll('.highlight-keyword')
            expect(marks.length).toBeGreaterThan(0)
        })
    })

    it('supports keyboard navigation', async () => {
        renderWithRouter(<SearchBox />)
        fireEvent.click(screen.getByRole('button'))
        const input = screen.getByPlaceholderText('搜索文章...')

            ; (global.fetch as any).mockResolvedValueOnce({
                json: async () => getMockResults()
            })

        fireEvent.change(input, { target: { value: 'test' } })

        // Wait for results to render
        await waitFor(() => {
            const resultItems = document.querySelectorAll('.search-result-item')
            expect(resultItems.length).toBeGreaterThan(0)
        })

        // Press ArrowDown to select first result
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        const selectedItems = document.querySelectorAll('.search-result-item.selected')
        expect(selectedItems.length).toBe(1)

        // Press ArrowDown again to select second result
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        const secondSelected = document.querySelectorAll('.search-result-item.selected')
        expect(secondSelected.length).toBe(1)
    })

    it('shows empty state when no results found', async () => {
        renderWithRouter(<SearchBox />)
        fireEvent.click(screen.getByRole('button'))
        const input = screen.getByPlaceholderText('搜索文章...')

            ; (global.fetch as any).mockResolvedValueOnce({
                json: async () => []
            })

        fireEvent.change(input, { target: { value: 'nothing' } })

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled()
        })

        expect(await screen.findByText('// 未找到相关文章')).toBeInTheDocument()
    })

    it('shows keyboard shortcuts hint when no query', () => {
        renderWithRouter(<SearchBox />)
        fireEvent.click(screen.getByRole('button'))

        expect(screen.getByText('提示：支持搜索标题、内容和标签')).toBeInTheDocument()
        expect(screen.getByText('选择')).toBeInTheDocument()
        expect(screen.getByText('跳转')).toBeInTheDocument()
    })
})

