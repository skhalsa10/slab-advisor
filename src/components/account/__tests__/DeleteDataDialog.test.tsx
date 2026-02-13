import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteDataDialog from '../DeleteDataDialog'

describe('DeleteDataDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <DeleteDataDialog
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.queryByText('Delete All Your Data?')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Delete All Your Data?')).toBeInTheDocument()
    expect(screen.getByText(/This will permanently delete/)).toBeInTheDocument()
    expect(screen.getByText(/Your account will remain active/)).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('should have Delete button disabled initially', () => {
    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /Delete My Data/i })
    expect(deleteButton).toBeDisabled()
  })

  it('should enable Delete button when user types DELETE', async () => {
    const user = userEvent.setup()

    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const input = screen.getByPlaceholderText('DELETE')
    const deleteButton = screen.getByRole('button', { name: /Delete My Data/i })

    expect(deleteButton).toBeDisabled()

    await user.type(input, 'DELETE')

    expect(deleteButton).not.toBeDisabled()
  })

  it('should keep Delete button disabled with partial confirmation', async () => {
    const user = userEvent.setup()

    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const input = screen.getByPlaceholderText('DELETE')
    const deleteButton = screen.getByRole('button', { name: /Delete My Data/i })

    await user.type(input, 'DELE')

    expect(deleteButton).toBeDisabled()
  })

  it('should call onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    // Click the backdrop (the first div with fixed inset-0)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
    if (backdrop) {
      await user.click(backdrop)
    }

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when Delete button is clicked after typing DELETE', async () => {
    const user = userEvent.setup()
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const input = screen.getByPlaceholderText('DELETE')
    await user.type(input, 'DELETE')

    const deleteButton = screen.getByRole('button', { name: /Delete My Data/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })
  })

  it('should show loading state during deletion', async () => {
    const user = userEvent.setup()

    // Create a promise that we can control
    let resolveConfirm: () => void
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve
    })
    mockOnConfirm.mockReturnValue(confirmPromise)

    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    const input = screen.getByPlaceholderText('DELETE')
    await user.type(input, 'DELETE')

    const deleteButton = screen.getByRole('button', { name: /Delete My Data/i })
    await user.click(deleteButton)

    // Check for loading state
    expect(screen.getByRole('button', { name: /Deleting.../i })).toBeInTheDocument()

    // Resolve the promise
    resolveConfirm!()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete My Data/i })).toBeInTheDocument()
    })
  })

  it('should display error message when error prop is provided', () => {
    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        error="Something went wrong"
      />
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should list what will be deleted', () => {
    render(
      <DeleteDataDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/All your collection cards/)).toBeInTheDocument()
    expect(screen.getByText(/All card gradings/)).toBeInTheDocument()
    expect(screen.getByText(/All sealed products/)).toBeInTheDocument()
    expect(screen.getByText(/Your portfolio history/)).toBeInTheDocument()
    expect(screen.getByText(/Your profile information/)).toBeInTheDocument()
  })
})
