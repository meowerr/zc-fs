import { Task } from './database.types';

export function exportTasksToCSV(tasks: Task[], subTeams: Array<{ id: string; name: string }>) {
  const headers = [
    'Task ID',
    'Sub-Team',
    'Title',
    'Task Type',
    'Priority',
    'Status',
    'Deadline (UTC)',
    'Assignees',
    'Created At'
  ];

  const escapeCSV = (val: string | null | undefined) => {
    if (!val) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = tasks.map((task) => {
    const groupName = subTeams.find((g) => g.id === task.group_id)?.name || 'General';
    const assigneesStr = task.assignees?.map((a) => a.full_name).join('; ') || 'Unassigned';

    return [
      escapeCSV(task.id),
      escapeCSV(groupName),
      escapeCSV(task.title),
      escapeCSV(task.task_type.toUpperCase()),
      escapeCSV(task.priority.toUpperCase()),
      escapeCSV(task.status.toUpperCase()),
      escapeCSV(new Date(task.deadline).toISOString()),
      escapeCSV(assigneesStr),
      escapeCSV(new Date(task.created_at).toISOString()),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `zc_formula_student_tasks_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTasksToJSON(tasks: Task[]) {
  const jsonContent = JSON.stringify(tasks, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `zc_formula_student_telemetry_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
