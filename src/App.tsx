import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Confetti from "react-confetti";
import { 
  Camera, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  CircleDashed, 
  MessageCircle,
  Plus,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide
} from "lucide-react";
import { supabase, table } from './lib/supabase';
import type { User, Todo } from './types';

// Cookie handling functions
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Some sample statuses with icons
const STATUSES = [
  { label: "Offen", color: "#d3d3d3", icon: CircleDashed },
  { label: "In Arbeit", color: "#f1af54", icon: Clock },
  { label: "Warte auf..", color: "#cd404e", icon: AlertCircle },
  { label: "Erledigt", color: "#5ac57d", icon: CheckCircle2 },
];

export default function SharedTodoListApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [showWaitDialog, setShowWaitDialog] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Load saved user on initial mount
  useEffect(() => {
    const loadSavedUser = async () => {
      const savedUserId = getCookie('lastUserId');
      if (savedUserId) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', savedUserId)
          .single();
        
        if (user) {
          setCurrentUser(user);
          setShowSplash(false);
        }
      }
    };

    loadSavedUser();
  }, []);

  const sortedTodos = [...todos].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return (dateB - dateA) * direction;
  });

  useEffect(() => {
    fetchUsers();
    if (currentUser) {
      fetchTodos();
    }
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showStatusDropdown && statusDropdownRef.current) {
      const button = document.querySelector(`[data-todo-id="${showStatusDropdown}"]`);
      if (button) {
        const rect = button.getBoundingClientRect();
        const dropdown = statusDropdownRef.current;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom}px`;
      }
    }
  }, [showStatusDropdown]);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from(table('users'))
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setAllUsers(data);
  }

  async function fetchTodos() {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from(table('tasks'))
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching todos:', error);
      return;
    }

    setTodos(data);
  }

  async function createUser(name: string, profilePicUrl: string) {
    const { data, error } = await supabase
      .from(table('users'))
      .insert([
        { name, profile_pic_url: profilePicUrl }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  }

  async function createTodo(title: string) {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from(table('tasks'))
      .insert([
        {
          title,
          owner_id: currentUser.id,
          status: 'Offen'
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating todo:', error);
      return;
    }

    setTodos(prev => [data, ...prev]);
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    const { error } = await supabase
      .from(table('tasks'))
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating todo:', error);
      return;
    }

    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ));

    // Fetch todos again to get updated relationships
    if (updates.waiting_for_task_id) {
      fetchTodos();
    }
  }

  async function uploadProfilePic(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `profile-pics/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading profile picture:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  const handleUserSelect = (user: User | null) => {
    if (user) {
      setCurrentUser(user);
      setShowSplash(false);
      setCookie('lastUserId', user.id);
    } else {
      setIsCreatingNewUser(true);
    }
  };

  async function handleCreateUser() {
    if (!newUserName.trim() || !selectedFile) return;

    const profilePicUrl = await uploadProfilePic(selectedFile);
    if (!profilePicUrl) {
      console.error('Failed to upload profile picture');
      return;
    }

    const { data: newUser, error } = await supabase
      .from(table('users'))
      .insert([
        {
          name: newUserName.trim(),
          profile_pic_url: profilePicUrl
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    setCurrentUser(newUser);
    setShowSplash(false);
    setIsCreatingNewUser(false);
    setNewUserName("");
    setSelectedFile(null);
  }

  const addNewTodo = () => {
    createTodo("Neues ToDo");
  };

  const handleStatusChange = (todoId: string, newStatus: string) => {
    if (newStatus === "Erledigt") {
      setTriggerConfetti(true);
    }

    updateTodo(todoId, { status: newStatus });

    if (newStatus === "Warte auf..") {
      const todo = todos.find(t => t.id === todoId);
      if (todo) {
        setSelectedTodo(todo);
        setShowWaitDialog(true);
      }
    }
  };

  const handleTitleEdit = (todoId: string, newTitle: string) => {
    updateTodo(todoId, { title: newTitle });
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
  };

  const handleDescriptionChange = (id: string, description: string) => {
    updateTodo(id, { description });
    setSelectedTodo(prev => prev ? { ...prev, description } : null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <AnimatePresence>
        <Dialog open={showSplash} onOpenChange={setShowSplash}>
          <DialogContent className="sm:max-w-md">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">
                {isCreatingNewUser ? "Neuer Benutzer" : "Wähle deinen Benutzer"}
              </h2>
              
              {isCreatingNewUser ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <img
                        src={selectedFile ? URL.createObjectURL(selectedFile) : "/placeholder-avatar.png"}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <label
                        htmlFor="profile-pic"
                        className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        type="file"
                        id="profile-pic"
                        className="hidden"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                      />
                    </div>
                    <Input
                      placeholder="Dein Name"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingNewUser(false);
                        setNewUserName("");
                        setSelectedFile(null);
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={!newUserName.trim() || !selectedFile}
                    >
                      Speichern
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {allUsers.map(user => (
                    <Button
                      key={user.id}
                      variant="outline"
                      className="flex items-center gap-2 h-auto p-4"
                      onClick={() => handleUserSelect(user)}
                    >
                      <img
                        src={user.profile_pic_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <span>{user.name}</span>
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-auto p-4"
                    onClick={() => handleUserSelect(null)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-gray-500" />
                    </div>
                    <span>Neuer Benutzer</span>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </AnimatePresence>

      {triggerConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          onConfettiComplete={() => setTriggerConfetti(false)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {currentUser && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.profile_pic_url}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full cursor-pointer"
                  onClick={() => setShowSplash(true)}
                />
                <h1 className="text-2xl font-bold">
                  Willkommen, {currentUser.name}!
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="w-10 h-10 p-0"
                >
                  {sortDirection === 'asc' ? 
                    <ArrowUpNarrowWide className="h-5 w-5" /> : 
                    <ArrowDownNarrowWide className="h-5 w-5" />
                  }
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={addNewTodo}
                  className="w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {STATUSES.map(status => (
                <div key={status.label} className="space-y-4">
                  <h2 
                    className="font-semibold flex items-center gap-2"
                    style={{ color: status.color }}
                  >
                    {React.createElement(status.icon, { 
                      size: 16,
                      style: { color: status.color }
                    })}
                    {status.label}
                  </h2>
                  <div className="space-y-4">
                    {sortedTodos
                      .filter(todo => todo.status === status.label)
                      .map(todo => (
                        <motion.div
                          key={todo.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-lg shadow-sm p-4 cursor-pointer"
                          onClick={() => handleTodoClick(todo)}
                        >
                          <div className="space-y-3">
                            <div className="text-lg font-medium">
                              {todo.title}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={allUsers.find(u => u.id === todo.owner_id)?.profile_pic_url}
                                  alt="Owner"
                                  className="w-8 h-8 rounded-full"
                                />
                                <span className="text-sm text-gray-500">
                                  {new Date(todo.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div
                                className={`w-[110px] px-3 py-1.5 rounded-md text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                                  todo.status === "Offen" ? "bg-gray-100 text-gray-700" : "text-white"
                                }`}
                                style={{ backgroundColor: STATUSES.find(s => s.label === todo.status)?.color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowStatusDropdown(todo.id);
                                }}
                                data-todo-id={todo.id}
                              >
                                {React.createElement(
                                  STATUSES.find(s => s.label === todo.status)?.icon || CircleDashed,
                                  { 
                                    size: 14,
                                    className: todo.status === "Offen" ? "text-gray-700" : "text-white"
                                  }
                                )}
                                <span className="whitespace-nowrap">{todo.status}</span>
                              </div>
                            </div>
                            {todo.waiting_for_task_id && (
                              <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
                                <MessageCircle size={14} />
                                Wartet auf: {todos.find(t => t.id === todo.waiting_for_task_id)?.title}
                              </div>
                            )}
                          </div>

                          {showStatusDropdown === todo.id && (
                            <div 
                              ref={statusDropdownRef}
                              style={{
                                position: 'fixed',
                                transform: 'translateY(8px)'
                              }}
                              className="flex flex-col rounded-md overflow-hidden shadow-lg z-50 min-w-[110px] bg-white"
                            >
                              {STATUSES.map(status => (
                                <button
                                  key={status.label}
                                  type="button"
                                  className={`px-3 py-2 text-sm flex items-center gap-1.5 cursor-pointer transition-colors hover:opacity-90 ${
                                    status.label === "Offen" ? "bg-gray-100 text-gray-700" : "text-white"
                                  }`}
                                  style={{ backgroundColor: status.color }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(todo.id, status.label);
                                    setShowStatusDropdown(null);
                                  }}
                                >
                                  {React.createElement(status.icon, { 
                                    size: 14,
                                    className: status.label === "Offen" ? "text-gray-700" : "text-white"
                                  })}
                                  <span className="whitespace-nowrap">{status.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedTodo && !showWaitDialog} onOpenChange={(open) => {
        if (!open) setSelectedTodo(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTodo && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Input
                      value={selectedTodo.title}
                      onChange={e => handleTitleEdit(selectedTodo.id, e.target.value)}
                      className="text-xl font-bold border-none px-0 focus-visible:ring-0"
                    />
                    <textarea
                      value={selectedTodo.description || ''}
                      onChange={e => handleDescriptionChange(selectedTodo.id, e.target.value)}
                      placeholder="Beschreibung hinzufügen..."
                      className="w-full h-32 p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTodo && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={allUsers.find(u => u.id === selectedTodo.owner_id)?.profile_pic_url}
                    alt="Owner"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="text-sm">
                    <div className="font-medium">
                      {allUsers.find(u => u.id === selectedTodo.owner_id)?.name}
                    </div>
                    <div className="text-gray-500">
                      {new Date(selectedTodo.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div
                  className={`relative w-[110px] px-3 py-1.5 rounded-md text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    selectedTodo.status === "Offen" ? "bg-gray-100 text-gray-700" : "text-white"
                  }`}
                  style={{ backgroundColor: STATUSES.find(s => s.label === selectedTodo.status)?.color }}
                  onClick={() => setShowStatusDropdown(selectedTodo.id)}
                >
                  {React.createElement(
                    STATUSES.find(s => s.label === selectedTodo.status)?.icon || CircleDashed,
                    { 
                      size: 14,
                      className: selectedTodo.status === "Offen" ? "text-gray-700" : "text-white"
                    }
                  )}
                  <span className="whitespace-nowrap">{selectedTodo.status}</span>

                  {showStatusDropdown === selectedTodo.id && (
                    <div 
                      ref={statusDropdownRef}
                      style={{
                        position: 'fixed',
                        transform: 'translateY(8px)'
                      }}
                      className="flex flex-col rounded-md overflow-hidden shadow-lg z-50 min-w-[110px] bg-white"
                    >
                      {STATUSES.map(status => (
                        <button
                          key={status.label}
                          type="button"
                          className={`px-3 py-2 text-sm flex items-center gap-1.5 cursor-pointer transition-colors hover:opacity-90 ${
                            status.label === "Offen" ? "bg-gray-100 text-gray-700" : "text-white"
                          }`}
                          style={{ backgroundColor: status.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(selectedTodo.id, status.label);
                            setShowStatusDropdown(null);
                          }}
                        >
                          {React.createElement(status.icon, { 
                            size: 14,
                            className: status.label === "Offen" ? "text-gray-700" : "text-white"
                          })}
                          <span className="whitespace-nowrap">{status.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedTodo.waiting_for_task_id && (
                <div className="text-sm text-gray-500 flex items-center gap-1.5">
                  <MessageCircle size={14} />
                  Wartet auf: {todos.find(t => t.id === selectedTodo.waiting_for_task_id)?.title}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showWaitDialog} onOpenChange={setShowWaitDialog}>
        <DialogContent className="mx-5 w-[calc(100%-40px)] sm:mx-auto sm:w-[480px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <MessageCircle className="w-5 h-5" />
                Auf welche Aufgabe wartest du?
              </div>
            </DialogTitle>
          </DialogHeader>
          <div 
            className="mt-4 overflow-y-auto"
            style={{ height: 'calc(3 * 88px)' }} // Exactly 3 items height (80px + 8px margin)
          >
            <div className="space-y-2">
              {todos
                .filter(todo => 
                  todo.id !== selectedTodo?.id && 
                  todo.status !== 'Erledigt'
                )
                .map(todo => {
                  const owner = allUsers.find(u => u.id === todo.owner_id);
                  const status = STATUSES.find(s => s.label === todo.status);
                  return (
                    <button
                      key={todo.id}
                      className="w-full h-20 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-3 flex items-center gap-3"
                      onClick={() => {
                        if (selectedTodo) {
                          updateTodo(selectedTodo.id, {
                            waiting_for_task_id: todo.id
                          });
                        }
                        setShowWaitDialog(false);
                        setSelectedTodo(null);
                      }}
                    >
                      <img
                        src={owner?.profile_pic_url}
                        alt={owner?.name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{todo.title}</div>
                        <div 
                          className="text-sm mt-0.5 flex items-center gap-1"
                          style={{ color: status?.color }}
                        >
                          {React.createElement(status?.icon || CircleDashed, { 
                            size: 12,
                            className: "flex-shrink-0"
                          })}
                          <span className="truncate">{todo.status}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowWaitDialog(false)}
            >
              Abbrechen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}