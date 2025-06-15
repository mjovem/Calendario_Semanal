import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Utility functions
const formatDate = (date) => {
  // Handle date string properly to avoid timezone issues
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-');
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    return dateObj.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  return new Date(date).toLocaleDateString('pt-BR', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getWeekDates = (startDate = new Date()) => {
  const dates = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  review: 'bg-purple-100 text-purple-800 border-purple-200',
  done: 'bg-green-100 text-green-800 border-green-200'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

const statusLabels = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Em Revisão',
  done: 'Concluído'
};

// Components
const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onDragStart, isDraggable = false }) => {
  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(e, task);
    }
  };

  return (
    <div 
      className={`task-card p-3 mb-2 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all ${
        isDraggable ? 'cursor-move hover:scale-105' : ''
      }`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
    >
      {/* Header with title and action buttons */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isDraggable && (
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
          <h4 className="font-medium text-gray-900 text-sm truncate">{task.title}</h4>
        </div>
        
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
            title="Editar tarefa"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Excluir tarefa"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}
      
      {/* Priority and Status badges */}
      <div className="flex gap-1 mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>
      
      {/* Status selector */}
      <select 
        value={task.status} 
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, e.target.value);
        }}
        className="w-full text-xs border rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
      >
        <option value="todo">A Fazer</option>
        <option value="in_progress">Em Progresso</option>
        <option value="review">Em Revisão</option>
        <option value="done">Concluído</option>
      </select>
      
      {/* Due date */}
      {task.due_date && (
        <div className="text-center">
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded text-center block">
            Vencimento: {formatDate(task.due_date)}
          </span>
        </div>
      )}
    </div>
  );
};

const TaskModal = ({ isOpen, onClose, task, onSave, projects, sprints }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    project_id: '',
    sprint_id: '',
    due_date: '',
    story_points: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        project_id: task.project_id || '',
        sprint_id: task.sprint_id || '',
        due_date: task.due_date || '',
        story_points: task.story_points || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        project_id: '',
        sprint_id: '',
        due_date: '',
        story_points: ''
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const taskData = { ...formData };
    if (taskData.story_points) {
      taskData.story_points = parseInt(taskData.story_points);
    }
    onSave(taskData);
  };

  if (!isOpen) return null;

  const filteredSprints = sprints.filter(sprint => 
    !formData.project_id || sprint.project_id === formData.project_id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {task ? 'Editar Tarefa' : 'Criar Tarefa'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input-field"
              placeholder="Digite o título da tarefa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field"
              rows="3"
              placeholder="Digite a descrição da tarefa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="input-field"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="input-field"
              >
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Progresso</option>
                <option value="review">Em Revisão</option>
                <option value="done">Concluído</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({...formData, project_id: e.target.value, sprint_id: ''})}
              className="input-field"
            >
              <option value="">Nenhum Projeto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {formData.project_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sprint</label>
              <select
                value={formData.sprint_id}
                onChange={(e) => setFormData({...formData, sprint_id: e.target.value})}
                className="input-field"
              >
                <option value="">Nenhum Sprint</option>
                {filteredSprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pontos da História</label>
              <input
                type="number"
                min="1"
                max="21"
                value={formData.story_points}
                onChange={(e) => setFormData({...formData, story_points: e.target.value})}
                className="input-field"
                placeholder="1-21"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              {task ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WeekCalendar = ({ tasks, onTaskEdit, onTaskDelete, onTaskStatusChange, onTaskDateChange }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState(null);
  const weekDates = getWeekDates(currentWeek);

  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.due_date === dateStr);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (draggedTask) {
      const newDueDate = targetDate.toISOString().split('T')[0];
      if (draggedTask.due_date !== newDueDate) {
        onTaskDateChange(draggedTask.id, newDueDate);
      }
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  return (
    <div className="week-calendar bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mx-4 lg:mx-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Week Calendar</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateWeek(-1)}
            className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xl font-medium text-gray-900 min-w-[200px] text-center">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => navigateWeek(1)}
            className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="grid grid-cols-7 gap-6 min-w-[1500px]">
          {weekDates.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index} 
                className={`calendar-day p-5 rounded-2xl border-2 min-h-[550px] min-w-[200px] transition-all ${
                  isToday ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50'
                } ${draggedTask ? 'hover:border-purple-400 hover:bg-purple-100' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
              >
                <div className="font-semibold text-gray-900 mb-5 text-center">
                  <div className="text-sm text-gray-600 mb-2 font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className={`text-3xl font-bold ${isToday ? 'text-purple-600' : 'text-gray-900'} mb-1`}>
                    {date.getDate()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {dayTasks.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm font-medium">Solte tarefas aqui</p>
                    </div>
                  )}
                  {dayTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                      onStatusChange={onTaskStatusChange}
                      onDragStart={handleDragStart}
                      isDraggable={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tablet and Mobile view */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {weekDates.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index} 
                className={`calendar-day p-6 rounded-2xl border-2 min-h-[450px] transition-all ${
                  isToday ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50'
                } ${draggedTask ? 'hover:border-purple-400 hover:bg-purple-100' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
              >
                <div className="font-semibold text-gray-900 mb-6 text-center">
                  <div className="text-base text-gray-600 mb-2 font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className={`text-4xl font-bold ${isToday ? 'text-purple-600' : 'text-gray-900'} mb-1`}>
                    {date.getDate()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {dayTasks.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-base font-medium">Solte tarefas aqui</p>
                      <p className="text-sm text-gray-400 mt-2">ou crie novas</p>
                    </div>
                  )}
                  {dayTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                      onStatusChange={onTaskStatusChange}
                      onDragStart={handleDragStart}
                      isDraggable={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          💡 <strong>Dica:</strong> Arraste tarefas entre os dias para alterar suas datas de vencimento
        </p>
      </div>
    </div>
  );
};

const ProjectView = ({ 
  projects, 
  selectedProject, 
  onProjectSelect, 
  tasks, 
  onTaskEdit, 
  onTaskDelete, 
  onTaskStatusChange,
  onCreateProject 
}) => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', color: '#8B5CF6' });

  const handleCreateProject = async (e) => {
    e.preventDefault();
    await onCreateProject(projectForm);
    setProjectForm({ name: '', description: '', color: '#8B5CF6' });
    setShowProjectForm(false);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => 
      task.project_id === selectedProject?.id && task.status === status
    );
  };

  const columns = [
    { id: 'todo', title: 'To Do', tasks: getTasksByStatus('todo') },
    { id: 'in_progress', title: 'In Progress', tasks: getTasksByStatus('in_progress') },
    { id: 'review', title: 'Review', tasks: getTasksByStatus('review') },
    { id: 'done', title: 'Done', tasks: getTasksByStatus('done') }
  ];

  return (
    <div className="project-view">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowProjectForm(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
        
        {selectedProject && (
          <button
            onClick={() => onProjectSelect(null)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  className="input-field"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  className="input-field"
                  rows="3"
                  placeholder="Enter project description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={projectForm.color}
                  onChange={(e) => setProjectForm({...projectForm, color: e.target.value})}
                  className="input-field h-12"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!selectedProject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className="project-card p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="text-sm text-gray-500">
                {tasks.filter(task => task.project_id === project.id).length} tasks
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
            <h3 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map(column => (
              <div key={column.id} className="kanban-column bg-gray-50 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">{column.title}</h4>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {column.tasks.map(task => (
                    <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => onTaskEdit(task)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => onTaskDelete(task.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                          {task.priority.charAt(0).toUpperCase()}
                        </span>
                        {task.story_points && (
                          <span className="text-xs text-gray-500">{task.story_points} pts</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('calendar');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch data
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSprints = async () => {
    try {
      const response = await axios.get(`${API}/sprints`);
      setSprints(response.data);
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchSprints();
  }, []);

  // Task operations
  const handleCreateTask = async (taskData) => {
    try {
      setLoading(true);
      await axios.post(`${API}/tasks`, taskData);
      await fetchTasks();
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      setLoading(true);
      await axios.put(`${API}/tasks/${editingTask.id}`, taskData);
      await fetchTasks();
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API}/tasks/${taskId}`);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskDateChange = async (taskId, newDate) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { due_date: newDate });
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task date:', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  // Project operations
  const handleCreateProject = async (projectData) => {
    try {
      setLoading(true);
      await axios.post(`${API}/projects`, projectData);
      await fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSave = (taskData) => {
    if (editingTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TaskWeek Pro</h1>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentView('calendar')}
                className={`nav-item px-4 py-2 rounded-xl transition-colors ${
                  currentView === 'calendar' 
                    ? 'nav-item-active bg-purple-100 text-purple-700' 
                    : 'nav-item-inactive text-gray-600 hover:text-purple-600'
                }`}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <button
                onClick={() => setCurrentView('tasks')}
                className={`nav-item px-4 py-2 rounded-xl transition-colors ${
                  currentView === 'tasks' 
                    ? 'nav-item-active bg-purple-100 text-purple-700' 
                    : 'nav-item-inactive text-gray-600 hover:text-purple-600'
                }`}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Tasks
              </button>
              <button
                onClick={() => setCurrentView('projects')}
                className={`nav-item px-4 py-2 rounded-xl transition-colors ${
                  currentView === 'projects' 
                    ? 'nav-item-active bg-purple-100 text-purple-700' 
                    : 'nav-item-inactive text-gray-600 hover:text-purple-600'
                }`}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Projects
              </button>
              
              <button
                onClick={() => setShowTaskModal(true)}
                className="btn-primary ml-4 px-4 py-2"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'calendar' && (
          <WeekCalendar
            tasks={tasks}
            onTaskEdit={handleEditTask}
            onTaskDelete={handleDeleteTask}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDateChange={handleTaskDateChange}
          />
        )}

        {currentView === 'tasks' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleTaskStatusChange}
                    isDraggable={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'projects' && (
          <div className="max-w-7xl mx-auto">
            <ProjectView
              projects={projects}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              tasks={tasks}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleDeleteTask}
              onTaskStatusChange={handleTaskStatusChange}
              onCreateProject={handleCreateProject}
            />
          </div>
        )}
      </main>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleTaskSave}
        projects={projects}
        sprints={sprints}
      />

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
              <span className="text-gray-900">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;