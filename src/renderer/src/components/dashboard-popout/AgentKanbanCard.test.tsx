// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { DashboardCard } from '../../../../shared/dashboard-snapshot'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AgentKanbanCard, CARD_DOUBLE_CLICK_DELAY_MS } from './AgentKanbanCard'

const agent: DashboardCard = {
  paneKey: 'pk-1',
  ptyId: 'p1',
  agentType: 'claude',
  bucket: 'working',
  dotState: 'working',
  task: 'task text',
  repoId: 'r1',
  worktreeId: 'w1',
  tabId: 'tab1',
  leafId: 'l1',
  repoName: 'Repo',
  worktreeName: 'wt-name',
  startedAt: 0,
  finishedAt: null,
  stateChangedAt: 0,
  unseen: false
}

function renderCard(): {
  onOpenTerminal: ReturnType<typeof vi.fn>
  onOpenWorktree: ReturnType<typeof vi.fn>
} {
  const onOpenTerminal = vi.fn()
  const onOpenWorktree = vi.fn()
  render(
    <TooltipProvider>
      <AgentKanbanCard
        card={agent}
        now={0}
        onOpenTerminal={onOpenTerminal}
        onOpenWorktree={onOpenWorktree}
      />
    </TooltipProvider>
  )
  return { onOpenTerminal, onOpenWorktree }
}

function headingButton(): HTMLElement {
  const button = screen.getByText('wt-name').closest('button')
  if (!button) {
    throw new Error('card heading button is missing')
  }
  return button
}

describe('AgentKanbanCard open gestures', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('opens the terminal preview after a single click settles', () => {
    const { onOpenTerminal, onOpenWorktree } = renderCard()
    fireEvent.click(headingButton(), { detail: 1 })
    expect(onOpenTerminal).not.toHaveBeenCalled()
    vi.advanceTimersByTime(CARD_DOUBLE_CLICK_DELAY_MS)
    expect(onOpenTerminal).toHaveBeenCalledWith(agent)
    expect(onOpenWorktree).not.toHaveBeenCalled()
  })

  it('opens the worktree on double click without the preview', () => {
    const { onOpenTerminal, onOpenWorktree } = renderCard()
    const button = headingButton()
    fireEvent.click(button, { detail: 1 })
    fireEvent.click(button, { detail: 2 })
    fireEvent.doubleClick(button, { detail: 2 })
    vi.advanceTimersByTime(CARD_DOUBLE_CLICK_DELAY_MS * 2)
    expect(onOpenWorktree).toHaveBeenCalledTimes(1)
    expect(onOpenWorktree).toHaveBeenCalledWith(agent)
    expect(onOpenTerminal).not.toHaveBeenCalled()
  })

  it('opens the preview immediately on keyboard activation', () => {
    const { onOpenTerminal } = renderCard()
    fireEvent.click(headingButton(), { detail: 0 })
    expect(onOpenTerminal).toHaveBeenCalledWith(agent)
  })

  it('opens the worktree immediately on the platform modifier click', () => {
    const { onOpenTerminal, onOpenWorktree } = renderCard()
    const modifier = navigator.userAgent.includes('Mac') ? { metaKey: true } : { ctrlKey: true }
    fireEvent.click(headingButton(), { detail: 1, ...modifier })
    expect(onOpenWorktree).toHaveBeenCalledWith(agent)
    vi.advanceTimersByTime(CARD_DOUBLE_CLICK_DELAY_MS)
    expect(onOpenTerminal).not.toHaveBeenCalled()
  })
})
