export interface User {
  id: string;
  name: string;
  profile_pic_url: string;
  created_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  status: string;
  waiting_for_task_id?: string;
  created_at: string;
  updated_at: string;
}