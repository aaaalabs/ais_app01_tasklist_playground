import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Confetti from "react-confetti";
import { Camera } from "lucide-react";
import { supabase, table } from './lib/supabase';
import type { User, Todo } from './types';

// Some sample statuses
const STATUSES = [
  { label: "Offen", color: "#d3d3d3" },
  { label: "In Arbeit", color: "#f1af54" },
  { label: "Warte auf..", color: "#cd404e" },
  { label: "Erledigt", color: "#5ac57d" },
];

export default function SharedTodoListApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [userPic, setUserPic] = useState<string | File>("");
  const [isWaitDialogOpen, setIsWaitDialogOpen] = useState(false);
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (currentUser) {
      fetchTodos();
    }
  }, [currentUser]);

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
  }

  const handleSplashContinue = async () => {
    if (selectedUser && selectedUser !== "new") {
      const user = allUsers.find(u => u.name === selectedUser);
      if (user) {
        setCurrentUser(user);
        setShowSplash(false);
      }
      return;
    }

    if (userName.trim() === "") return;

    const newUser = await createUser(
      userName,
      typeof userPic === "string" ? userPic : `https://i.pravatar.cc/64?u=${encodeURIComponent(userName)}`
    );

    if (newUser) {
      setCurrentUser(newUser);
      await fetchUsers();
      setShowSplash(false);
    }
  };

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
        setActiveTodo(todo);
        setIsWaitDialogOpen(true);
      }
    }
  };

  const handleTitleEdit = (todoId: string, newTitle: string) => {
    updateTodo(todoId, { title: newTitle });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-white z-50 flex items-center justify-center"
          >
            <div className="max-w-md w-full p-8 space-y-6">
              <h1 className="text-3xl font-bold text-center mb-8">Willkommen!</h1>
              
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  {selectedUser || "Wähle einen Benutzer"}
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Neuer Benutzer</SelectItem>
                </SelectContent>
              </Select>

              {selectedUser === "new" && (
                <div className="space-y-4">
                  <Input
                    placeholder="Dein Name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                  />
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                      {userPic ? (
                        <img
                          src={typeof userPic === "string" ? userPic : URL.createObjectURL(userPic)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && setUserPic(e.target.files[0])}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSplashContinue}
                disabled={!selectedUser || (selectedUser === "new" && !userName)}
              >
                Weiter
              </Button>
            </div>
          </motion.div>
        )}
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

      <div className="max-w-4xl mx-auto space-y-8">
        {currentUser && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.profile_pic_url}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full"
                />
                <h1 className="text-2xl font-bold">
                  Willkommen, {currentUser.name}!
                </h1>
              </div>
              <Button onClick={addNewTodo}>+ Neues ToDo</Button>
            </div>

            <div className="space-y-4">
              {todos.map(todo => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <div className="flex items-center gap-4">
                    <Input
                      value={todo.title}
                      onChange={e => handleTitleEdit(todo.id, e.target.value)}
                      className="flex-1 text-lg font-medium"
                    />
                    <Select
                      value={todo.status}
                      onValueChange={value => handleStatusChange(todo.id, value)}
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: STATUSES.find(s => s.label === todo.status)?.color
                            }}
                          />
                          {todo.status}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(status => (
                          <SelectItem key={status.label} value={status.label}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={isWaitDialogOpen} onOpenChange={setIsWaitDialogOpen}>
        <DialogContent>
          <h2 className="text-xl font-bold mb-4">Wer soll benachrichtigt werden?</h2>
          <div className="grid grid-cols-2 gap-4">
            {allUsers
              .filter(user => user.id !== currentUser?.id)
              .map(user => (
                <Button
                  key={user.id}
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (activeTodo) {
                      updateTodo(activeTodo.id, {
                        waiting_for: user.id
                      });
                    }
                    setIsWaitDialogOpen(false);
                  }}
                >
                  <img
                    src={user.profile_pic_url}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                  {user.name}
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}