from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, time
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class SprintStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"

# Models
class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    project_id: Optional[str] = None
    sprint_id: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)
    story_points: Optional[int] = None
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    project_id: Optional[str] = None
    sprint_id: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    story_points: Optional[int] = None
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    project_id: Optional[str] = None
    sprint_id: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    story_points: Optional[int] = None
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    color: str = "#8B5CF6"  # Default purple
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#8B5CF6"

class Sprint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    project_id: str
    status: SprintStatus = SprintStatus.PLANNING
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    goal: Optional[str] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }
    
    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        if d.get('start_date'):
            d['start_date'] = d['start_date'].isoformat() if isinstance(d['start_date'], date) else d['start_date']
        if d.get('end_date'):
            d['end_date'] = d['end_date'].isoformat() if isinstance(d['end_date'], date) else d['end_date']
        return d

class SprintCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    goal: Optional[str] = None
    
    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

# Task endpoints
@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    task_dict = task.dict()
    task_obj = Task(**task_dict)
    await db.tasks.insert_one(task_obj.dict())
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(project_id: Optional[str] = None, sprint_id: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if sprint_id:
        query["sprint_id"] = sprint_id
    
    tasks = await db.tasks.find(query).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: TaskUpdate):
    existing_task = await db.tasks.find_one({"id": task_id})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.dict(exclude_unset=True)
    update_data["updated_date"] = datetime.utcnow()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# Project endpoints
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_dict = project.dict()
    project_obj = Project(**project_dict)
    await db.projects.insert_one(project_obj.dict())
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: ProjectCreate):
    existing_project = await db.projects.find_one({"id": project_id})
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.dict()
    update_data["updated_date"] = datetime.utcnow()
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    updated_project = await db.projects.find_one({"id": project_id})
    return Project(**updated_project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # Also delete all tasks associated with this project
    await db.tasks.delete_many({"project_id": project_id})
    await db.sprints.delete_many({"project_id": project_id})
    
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project and associated tasks deleted successfully"}

# Sprint endpoints
@api_router.post("/sprints", response_model=Sprint)
async def create_sprint(sprint: SprintCreate):
    sprint_dict = sprint.dict()
    sprint_obj = Sprint(**sprint_dict)
    await db.sprints.insert_one(sprint_obj.dict())
    return sprint_obj

@api_router.get("/sprints", response_model=List[Sprint])
async def get_sprints(project_id: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    sprints = await db.sprints.find(query).to_list(1000)
    return [Sprint(**sprint) for sprint in sprints]

@api_router.get("/sprints/{sprint_id}", response_model=Sprint)
async def get_sprint(sprint_id: str):
    sprint = await db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return Sprint(**sprint)

@api_router.put("/sprints/{sprint_id}", response_model=Sprint)
async def update_sprint(sprint_id: str, sprint_update: SprintCreate):
    existing_sprint = await db.sprints.find_one({"id": sprint_id})
    if not existing_sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    update_data = sprint_update.dict()
    update_data["updated_date"] = datetime.utcnow()
    
    await db.sprints.update_one({"id": sprint_id}, {"$set": update_data})
    updated_sprint = await db.sprints.find_one({"id": sprint_id})
    return Sprint(**updated_sprint)

# Week calendar endpoint
@api_router.get("/calendar/week")
async def get_week_calendar(start_date: str):
    # Parse start_date and get tasks for the week
    try:
        week_start = datetime.strptime(start_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get all tasks for the week
    tasks = await db.tasks.find({
        "due_date": {
            "$gte": week_start.isoformat(),
            "$lt": (week_start.replace(day=week_start.day + 7)).isoformat()
        }
    }).to_list(1000)
    
    return {
        "week_start": week_start.isoformat(),
        "tasks": [Task(**task) for task in tasks]
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()