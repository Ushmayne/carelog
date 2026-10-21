import type { Metadata } from 'next'
import { getUserCareGroup, getGroupMembers } from '@/app/actions/care-group'
import { getTasks } from '@/app/actions/tasks'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { TasksClient } from '@/components/tasks/TasksClient'

export const metadata: Metadata = { title: 'Tasks' }

export default async function TasksPage() {
  const user = await getCurrentUser()

  const group = await getUserCareGroup()
  if (!group) redirect('/dashboard')

  const [tasks, members] = await Promise.all([
    getTasks(group.id),
    getGroupMembers(group.id),
  ])

  return <TasksClient careGroupId={group.id} tasks={tasks} members={members} currentUserId={user?.id ?? ''} />
}
