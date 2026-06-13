export type ActivityType = 
  | 'task_created' 
  | 'task_completed' 
  | 'task_uncompleted'
  | 'node_created'
  | 'node_converted'
  | 'kpi_updated'
  | 'mindset_reflection';

export interface Activity {
  id: string;
  type: ActivityType;
  label: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
