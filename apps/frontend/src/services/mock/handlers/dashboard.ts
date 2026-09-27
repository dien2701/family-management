import type { DashboardResponse, CalendarOccurrence } from '@/types/api'
import { fromJdn, toJdn, type SolarDate } from '@/utils/lunar'
import { daysBetween, generateOccurrences, type Occurrence } from '@/utils/occurrences'
import type { HandlerContext } from '../context'
import type { MockRequest, MockRouter } from '../router'
import type { MockStore } from '../store'
import { generationsByMember } from '../treeGraph'
import { requireApproved } from './common'

const addDays = (date: SolarDate, days: number): SolarDate => fromJdn(toJdn(date) + days)

function toDto(o: Occurrence, today: SolarDate): CalendarOccurrence {
  return { ...o, daysUntil: daysBetween(today, o.solar) }
}

const sourcesOf = (store: MockStore) => ({ members: store.members, events: store.events ?? [] })

async function getDashboard(_: MockRequest, context: HandlerContext): Promise<DashboardResponse> {
  const user = await requireApproved(context)
  const store = context.store

  // Calculate member stats
  const totalMembers = store.members.length
  let living = 0
  let deceased = 0
  for (const m of store.members) {
    if (m.isDeceased) deceased++
    else living++
  }

  // Calculate tree stats
  const treeNodes = store.tree.nodes
  let onTree = 0
  let maxGeneration = 0
  if (treeNodes.length > 0) {
    const nodeMemberIds = new Set(treeNodes.map((n) => n.memberId))
    onTree = store.members.filter((m) => nodeMemberIds.has(m.id)).length
    maxGeneration = Math.max(0, ...generationsByMember(store).values())
  }

  // Calculate events
  const today = context.today()
  
  // Upcoming 30 days
  const upcomingOccurrences = generateOccurrences(sourcesOf(store), today, addDays(today, 30))
    .map((o) => toDto(o, today))
  
  const upcoming30 = upcomingOccurrences
  const nextEvent = upcomingOccurrences.length > 0 ? upcomingOccurrences[0] : undefined

  // Recent 10 events (past 365 days up to yesterday)
  const recentEvents = generateOccurrences(sourcesOf(store), addDays(today, -365), addDays(today, -1))
    .map((o) => toDto(o, today))
    .reverse()
    .slice(0, 10)

  // Pending counts for Admin
  let pendingAccounts = 0
  let pendingProposals = 0
  let pendingLinkRequests = 0

  if (user.systemRole === 'ADMIN') {
    try {
      const res = await fetch('/api/admin/accounts?approval=WAITING')
      if (res.ok) {
        const data = await res.json()
        pendingAccounts = data.totalElements ?? 0
      }
    } catch {
      // Backend not available, ignore
    }

    pendingProposals = store.proposals?.filter(p => p.status === 'PENDING').length ?? 0
    pendingLinkRequests = store.linkRequests?.filter((lr) => lr.status === 'PENDING').length ?? 0
  }

  return {
    totalMembers,
    living,
    deceased,
    onTree,
    maxGeneration,
    nextEvent,
    recentEvents,
    upcoming30,
    ...(user.systemRole === 'ADMIN' && {
      pendingAccounts,
      pendingProposals,
      pendingLinkRequests,
    }),
  }
}

export function registerDashboardHandlers(router: MockRouter): void {
  router.on('GET', '/dashboard', getDashboard)
}
