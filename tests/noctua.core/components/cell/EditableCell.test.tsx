import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditableCell from '@/@noctua.core/components/cell/EditableCell'

describe('EditableCell — comment affordance (#231)', () => {
  it('renders the comment button with a count when commentCount > 0', () => {
    render(
      <EditableCell label="Term" onComment={() => {}} commentCount={3}>
        content
      </EditableCell>
    )
    expect(screen.getByLabelText('Comments (3)')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('labels the comment button "Add comment" when there are none', () => {
    render(
      <EditableCell label="Term" onComment={() => {}} commentCount={0}>
        content
      </EditableCell>
    )
    expect(screen.getByLabelText('Add comment')).toBeInTheDocument()
  })

  it('fires onComment when the comment button is clicked', async () => {
    const onComment = vi.fn()
    render(
      <EditableCell label="Term" onComment={onComment} commentCount={1}>
        content
      </EditableCell>
    )
    await userEvent.click(screen.getByLabelText('Comments (1)'))
    expect(onComment).toHaveBeenCalledTimes(1)
  })

  // Curators found the hover-only affordance too subtle, so the icon is always
  // on screen — grey when the cell has no comments (#289).
  it('shows the comment button without hovering the cell, even when empty', () => {
    render(
      <EditableCell label="Term" onComment={() => {}} commentCount={0}>
        content
      </EditableCell>
    )
    const button = screen.getByLabelText('Add comment')
    expect(button.className).not.toContain('opacity-0')
    expect(button.className).not.toContain('group-hover')
    expect(button.className).toContain('text-gray-400')
  })

  it('keeps the edit pencil hover-only', () => {
    render(
      <EditableCell label="Term" onComment={() => {}} onEdit={() => {}} commentCount={0}>
        content
      </EditableCell>
    )
    const pencil = screen.getByLabelText('Add comment').parentElement?.querySelector('button:last-of-type')
    expect(pencil?.className).toContain('group-hover/cell:opacity-100')
  })

  it('renders no comment button when onComment is not provided', () => {
    render(<EditableCell label="Term">content</EditableCell>)
    expect(screen.queryByLabelText(/comment/i)).not.toBeInTheDocument()
  })
})
