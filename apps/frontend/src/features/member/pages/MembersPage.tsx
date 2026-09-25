import { MemberFilters } from '../components/MemberFilters'
import { MemberList } from '../components/MemberList'
import { useMembers, useMemberFilters } from '../hooks'
import { memberStrings } from '../strings'

export function MembersPage() {
  const { filters, setFilters } = useMemberFilters()
  
  const { data, isLoading, isError } = useMembers(filters)
  
  const isFiltered = Object.keys(filters).some(k => 
    k !== 'page' && k !== 'size' && k !== 'sort' && filters[k as keyof typeof filters] !== undefined
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{memberStrings.list.title}</h1>
      </div>
      
      <MemberFilters filters={filters} onChange={setFilters} />
      
      <MemberList
        members={data?.content ?? []}
        totalPages={data?.page.totalPages ?? 0}
        currentPage={data?.page.number ?? 0}
        onPageChange={(page) => setFilters({ page })}
        isLoading={isLoading}
        isError={isError}
        isFiltered={isFiltered}
      />
    </div>
  )
}
