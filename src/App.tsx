import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Confetti from "react-confetti";
import {
  Camera,
  Clock,
  CircleDashed,
  CheckCircle2,
  MessageCircle,
  Plus,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Users2
} from "lucide-react";
import { supabase, table } from './lib/supabase';
import type { User, Todo } from './types';
import { Avatar } from './components/Avatar';
import { Tooltip } from './components/Tooltip';

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
  { label: "Warte auf..", color: "#cd404e", icon: MessageCircle },
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
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load saved user on initial mount
  useEffect(() => {
    const lastUserId = getCookie('lastUserId');
    if (lastUserId) {
      supabase
        .from(table('users'))
        .select('*')
        .eq('id', lastUserId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentUser(data);
            setShowSplash(false);
          }
        });
    }
  }, []);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (sortDirection === 'asc') {
        return STATUSES.findIndex(s => s.label === a.status) - STATUSES.findIndex(s => s.label === b.status);
      } else {
        return STATUSES.findIndex(s => s.label === b.status) - STATUSES.findIndex(s => s.label === a.status);
      }
    });
  }, [todos, sortDirection]);

  useEffect(() => {
    fetchUsers();
  }, []);

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
      .order('created_at', { ascending: sortDirection === 'asc' });

    if (error) {
      console.error('Error fetching todos:', error);
      return;
    }

    setTodos(data || []);
  }

  useEffect(() => {
    fetchTodos();
  }, [currentUser, sortDirection]);

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

  const handleStatusChange = async (todoId: string, newStatus: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      // If changing from "Warte auf.." to any other status, clear the waiting_for_task_id
      const updates: any = { status: newStatus };
      if (todo.status === "Warte auf.." && newStatus !== "Warte auf..") {
        updates.waiting_for_task_id = null;
      }

      // Show confetti for completed tasks
      if (newStatus === "Erledigt") {
        setTriggerConfetti(true);
      }

      // Show wait dialog for "Warte auf.." status
      if (newStatus === "Warte auf..") {
        setSelectedTodo(todo);
        setShowWaitDialog(true);
      }

      const { error } = await supabase
        .from('aisws_tasks')
        .update(updates)
        .eq('id', todoId);

      if (error) throw error;

      // Update local state
      setTodos(todos.map(t => 
        t.id === todoId 
          ? { ...t, ...updates }
          : t
      ));

      if (selectedTodo?.id === todoId) {
        setSelectedTodo(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const handleTitleEdit = async (todoId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('aisws_tasks')
        .update({ title: newTitle.trim() })
        .eq('id', todoId);

      if (error) throw error;

      // Update local state
      setTodos(todos.map(t => 
        t.id === todoId 
          ? { ...t, title: newTitle.trim() }
          : t
      ));

      if (selectedTodo?.id === todoId) {
        setSelectedTodo(prev => prev ? { ...prev, title: newTitle.trim() } : null);
      }

      setEditingTodoId(null);
    } catch (error) {
      console.error('Error updating todo title:', error);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
  };

  const handleDescriptionChange = (id: string, description: string) => {
    updateTodo(id, { description });
    setSelectedTodo(prev => prev ? { ...prev, description } : null);
  };

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setEditingTodoId(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (editingTodoId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTodoId]);

  useEffect(() => {
    // Subscribe to users table changes
    const usersSubscription = supabase
      .channel('users-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table('users')
        },
        (payload) => {
          console.log('Users change received!', payload);
          switch (payload.eventType) {
            case 'INSERT':
              setAllUsers(prev => [...prev, payload.new as User]);
              break;
            case 'UPDATE':
              setAllUsers(prev => 
                prev.map(user => 
                  user.id === payload.new.id ? { ...user, ...payload.new } : user
                )
              );
              // Update currentUser if it was modified
              if (currentUser?.id === payload.new.id) {
                setCurrentUser(prev => ({ ...prev, ...payload.new }));
              }
              break;
            case 'DELETE':
              setAllUsers(prev => prev.filter(user => user.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    // Subscribe to tasks table changes
    const tasksSubscription = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table('tasks')
        },
        (payload) => {
          console.log('Tasks change received!', payload);
          switch (payload.eventType) {
            case 'INSERT':
              setTodos(prev => [...prev, payload.new as Todo]);
              break;
            case 'UPDATE':
              setTodos(prev => 
                prev.map(todo => 
                  todo.id === payload.new.id ? { ...todo, ...payload.new } : todo
                )
              );
              // If this was the selected todo, update it
              if (selectedTodo?.id === payload.new.id) {
                setSelectedTodo(prev => ({ ...prev!, ...payload.new }));
              }
              break;
            case 'DELETE':
              setTodos(prev => prev.filter(todo => todo.id !== payload.old.id));
              // If this was the selected todo, close the dialog
              if (selectedTodo?.id === payload.old.id) {
                setSelectedTodo(null);
              }
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      usersSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, [currentUser?.id]); // Only re-run if current user changes

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow p-4">
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
                        <Avatar
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
                        <Avatar
                          src={user.profile_pic_url}
                          alt={user.name}
                          size="sm"
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
              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <Avatar
                      src={currentUser.profile_pic_url}
                      alt={currentUser.name}
                      className="border-2 border-white group-hover:opacity-75 transition-opacity"
                    />
                    <label 
                      htmlFor="profile-pic-upload" 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                    </label>
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && currentUser) {
                          // Show loading state
                          const avatar = document.querySelector(`[alt="${currentUser.name}"]`);
                          if (avatar) avatar.classList.add('opacity-50');
                          
                          const profilePicUrl = await uploadProfilePic(file);
                          if (profilePicUrl) {
                            const { error } = await supabase
                              .from(table('users'))
                              .update({ profile_pic_url: profilePicUrl })
                              .eq('id', currentUser.id);
                            
                            if (!error) {
                              setCurrentUser(prev => ({ ...prev, profile_pic_url: profilePicUrl }));
                            }
                          }
                          
                          // Remove loading state
                          if (avatar) avatar.classList.remove('opacity-50');
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Willkommen, {currentUser.name}!</h1>
                    <p className="text-sm text-gray-500">Klicke auf dein Profilbild, um es zu ändern</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSplash(true)}
                  >
                    <Users2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortDirection === 'asc' ? <ArrowUpNarrowWide className="w-5 h-5" /> : <ArrowDownNarrowWide className="w-5 h-5" />}
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
                {STATUSES.map(status => {
                  const statusTodos = sortedTodos.filter(todo => todo.status === status.label);
                  const isCompleted = status.label === "Erledigt";
                  
                  if (statusTodos.length === 0) return null;
                  
                  return (
                    <div key={status.label} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 
                          className="font-semibold flex items-center gap-2"
                          style={{ color: status.color }}
                        >
                          {React.createElement(status.icon, { 
                            size: 16,
                            style: { color: status.color }
                          })}
                          <span className="flex items-center gap-2">
                            {status.label}
                            <span className="text-sm text-gray-500">({statusTodos.length})</span>
                          </span>
                        </h2>
                        {isCompleted && statusTodos.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCompletedTasks(prev => !prev)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            {showCompletedTasks ? "Ausblenden" : "Anzeigen"}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {(!isCompleted || showCompletedTasks) && statusTodos.map(todo => (
                          <div
                            key={todo.id}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-4 cursor-pointer space-y-3" onClick={() => setSelectedTodo(todo)}>
                              {/* Title Row */}
                              <div className="w-full">
                                {editingTodoId === todo.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleTitleEdit(todo.id, editingTitle);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      ref={editInputRef}
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onBlur={() => handleTitleEdit(todo.id, editingTitle)}
                                      className="w-full text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                                    />
                                  </form>
                                ) : (
                                  <span 
                                    className="text-lg font-semibold text-gray-900 block hover:text-blue-600 cursor-text"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTodoId(todo.id);
                                      setEditingTitle(todo.title);
                                    }}
                                  >
                                    {todo.title}
                                  </span>
                                )}
                              </div>

                              {/* User and Status Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Tooltip content={allUsers.find(u => u.id === todo.owner_id)?.name || 'User'}>
                                    <Avatar
                                      src={allUsers.find(u => u.id === todo.owner_id)?.profile_pic_url}
                                      alt={allUsers.find(u => u.id === todo.owner_id)?.name || 'User'}
                                      size="sm"
                                    />
                                  </Tooltip>
                                </div>
                                <div className="flex items-center">
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
                              </div>

                              {/* Waiting Status Row */}
                              {todo.waiting_for_task_id && (
                                <div className="text-sm text-gray-500 flex items-center gap-1.5">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="h-[30px] flex items-center justify-center text-gray-400 text-xs space-x-2">
        <img 
          src="https://ik.imagekit.io/libralab/AIS/AI%20shift%20Logo%20Wide.png?updatedAt=1737896017901" 
          alt="AI-Shift Logo" 
          className="h-4 w-auto"
        />
        <span> 2025 - AI-Shift.de</span>
      </footer>

      <Dialog open={!!selectedTodo && !showWaitDialog} onOpenChange={(open) => {
        if (!open) setSelectedTodo(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTodo && (
                <div className="space-y-6">
                  {/* Title Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow">
                      <Tooltip content={allUsers.find(u => u.id === selectedTodo.owner_id)?.name || 'User'}>
                        <Avatar
                          src={allUsers.find(u => u.id === selectedTodo.owner_id)?.profile_pic_url}
                          alt={allUsers.find(u => u.id === selectedTodo.owner_id)?.name || 'User'}
                          size="sm"
                        />
                      </Tooltip>
                      {editingTodoId === selectedTodo.id ? (
                        <form
                          className="flex-grow"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleTitleEdit(selectedTodo.id, editingTitle);
                          }}
                        >
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleTitleEdit(selectedTodo.id, editingTitle)}
                            className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                          />
                        </form>
                      ) : (
                        <h1 
                          className="text-2xl font-bold text-gray-900 cursor-text hover:text-blue-600"
                          onClick={() => {
                            setEditingTodoId(selectedTodo.id);
                            setEditingTitle(selectedTodo.title);
                          }}
                        >
                          {selectedTodo.title}
                        </h1>
                      )}
                    </div>
                    
                    {/* Status Button */}
                    <div
                      className={`w-[110px] px-3 py-1.5 rounded-md text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
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
                    </div>
                  </div>

                  {/* Description */}
                  <textarea
                    value={selectedTodo.description || ''}
                    onChange={e => handleDescriptionChange(selectedTodo.id, e.target.value)}
                    placeholder="Beschreibung hinzufügen..."
                    className="w-full h-32 p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 hover:bg-white transition-colors"
                  />

                  {/* Waiting Status */}
                  {selectedTodo.waiting_for_task_id && (
                    <div className="text-sm text-gray-500 flex items-center gap-1.5">
                      <MessageCircle size={14} />
                      Wartet auf: {todos.find(t => t.id === selectedTodo.waiting_for_task_id)?.title}
                    </div>
                  )}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
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
                      <Avatar
                        src={owner?.profile_pic_url}
                        alt={owner?.name || 'User'}
                        size="sm"
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