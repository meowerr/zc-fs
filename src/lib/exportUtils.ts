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
    let str = String(val);
    // Neutralize Excel formula injection (=, +, -, @, tabs)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = tasks.map((task) => {
    const groupName = subTeams.find((g) => g.id === task.group_id)?.name || 'General';
    const assigneesStr = task.assignees?.map((a) => a.full_name).join('; ') || 'Unassigned';

    return [
      escapeCSV(task.id),
      escapeCSV(groupName),
      escapeCSV(task.title),
      escapeCSV(task.task_type ? task.task_type.toUpperCase() : ''),
      escapeCSV(task.priority ? task.priority.toUpperCase() : ''),
      escapeCSV(task.status ? task.status.toUpperCase() : ''),
      escapeCSV(task.deadline ? new Date(task.deadline).toISOString() : ''),
      escapeCSV(assigneesStr),
      escapeCSV(task.created_at ? new Date(task.created_at).toISOString() : ''),
    ].join(',');
  });

  // Prepend \uFEFF UTF-8 BOM so Excel properly displays international and Arabic characters
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
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
  const sanitized = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    task_type: t.task_type,
    deadline: t.deadline,
    created_at: t.created_at,
    assignees: t.assignees?.map((a) => ({
      id: a.id,
      full_name: a.full_name,
    })),
  }));

  const jsonContent = JSON.stringify(sanitized, null, 2);
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
