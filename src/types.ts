export interface User {
  id: string;
  name: string;
  profile_pic_url: string;
  created_at: string;
}

export interface Todo {
  id: string;
  title: string;
  owner_id: string;
  status: 'Offen' | 'In Arbeit' | 'Warte auf..' | 'Erledigt';
  created_at: string;
  updated_at: string;
}