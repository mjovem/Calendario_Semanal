#!/usr/bin/env python3
import requests
import json
import uuid
from datetime import datetime, timedelta
import sys
import time

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://6ec6f806-30d6-497e-958a-3e5b8d6a87a6.preview.emergentagent.com/api"

# Test data
test_project = {
    "name": "Test Project",
    "description": "A test project for API testing",
    "color": "#6D28D9"  # Purple color
}

test_sprint = {
    "name": "Sprint 1",
    "description": "First sprint for testing",
    "goal": "Complete API testing",
    "start_date": (datetime.now()).strftime("%Y-%m-%d"),
    "end_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
}

test_tasks = [
    {
        "title": "High Priority Task",
        "description": "This is a high priority task",
        "priority": "high",
        "status": "todo",
        "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
        "story_points": 5
    },
    {
        "title": "Medium Priority Task",
        "description": "This is a medium priority task",
        "priority": "medium",
        "status": "in_progress",
        "due_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
        "story_points": 3
    },
    {
        "title": "Low Priority Task",
        "description": "This is a low priority task",
        "priority": "low",
        "status": "review",
        "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "story_points": 2
    },
    {
        "title": "Urgent Task",
        "description": "This is an urgent task",
        "priority": "urgent",
        "status": "todo",
        "due_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "story_points": 8
    }
]

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "total": 0,
    "failures": []
}

def run_test(test_name, test_func):
    """Run a test and track results"""
    test_results["total"] += 1
    print(f"\n{'='*80}\nRunning test: {test_name}\n{'='*80}")
    try:
        result = test_func()
        if result:
            test_results["passed"] += 1
            print(f"✅ PASSED: {test_name}")
            return True
        else:
            test_results["failed"] += 1
            test_results["failures"].append(test_name)
            print(f"❌ FAILED: {test_name}")
            return False
    except Exception as e:
        test_results["failed"] += 1
        test_results["failures"].append(f"{test_name} - Exception: {str(e)}")
        print(f"❌ FAILED: {test_name} - Exception: {str(e)}")
        return False

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{BACKEND_URL}/health")
    if response.status_code == 200:
        data = response.json()
        print(f"Health check response: {data}")
        return "status" in data and data["status"] == "healthy"
    return False

def test_project_crud():
    """Test project CRUD operations"""
    # Create project
    response = requests.post(f"{BACKEND_URL}/projects", json=test_project)
    if response.status_code != 200:
        print(f"Failed to create project: {response.text}")
        return False
    
    project_data = response.json()
    project_id = project_data["id"]
    print(f"Created project with ID: {project_id}")
    
    # Get all projects
    response = requests.get(f"{BACKEND_URL}/projects")
    if response.status_code != 200:
        print(f"Failed to get projects: {response.text}")
        return False
    
    projects = response.json()
    print(f"Found {len(projects)} projects")
    
    # Get specific project
    response = requests.get(f"{BACKEND_URL}/projects/{project_id}")
    if response.status_code != 200:
        print(f"Failed to get project {project_id}: {response.text}")
        return False
    
    project = response.json()
    print(f"Retrieved project: {project['name']}")
    
    # Update project
    updated_project = {
        "name": "Updated Test Project",
        "description": "Updated description",
        "color": "#4C1D95"  # Darker purple
    }
    
    response = requests.put(f"{BACKEND_URL}/projects/{project_id}", json=updated_project)
    if response.status_code != 200:
        print(f"Failed to update project: {response.text}")
        return False
    
    updated = response.json()
    print(f"Updated project name: {updated['name']}")
    
    # Store project_id for other tests
    global test_project_id
    test_project_id = project_id
    
    return True

def test_sprint_crud():
    """Test sprint CRUD operations"""
    global test_project_id, test_sprint_id
    
    # Add project_id to the sprint
    test_sprint["project_id"] = test_project_id
    
    # Create sprint
    response = requests.post(f"{BACKEND_URL}/sprints", json=test_sprint)
    if response.status_code != 200:
        print(f"Failed to create sprint: {response.text}")
        return False
    
    sprint_data = response.json()
    sprint_id = sprint_data["id"]
    test_sprint_id = sprint_id
    print(f"Created sprint with ID: {sprint_id}")
    
    # Get all sprints
    response = requests.get(f"{BACKEND_URL}/sprints")
    if response.status_code != 200:
        print(f"Failed to get sprints: {response.text}")
        return False
    
    sprints = response.json()
    print(f"Found {len(sprints)} sprints")
    
    # Get sprints by project
    response = requests.get(f"{BACKEND_URL}/sprints?project_id={test_project_id}")
    if response.status_code != 200:
        print(f"Failed to get sprints by project: {response.text}")
        return False
    
    project_sprints = response.json()
    print(f"Found {len(project_sprints)} sprints for project {test_project_id}")
    
    # Get specific sprint
    response = requests.get(f"{BACKEND_URL}/sprints/{sprint_id}")
    if response.status_code != 200:
        print(f"Failed to get sprint {sprint_id}: {response.text}")
        return False
    
    sprint = response.json()
    print(f"Retrieved sprint: {sprint['name']}")
    
    # Update sprint
    updated_sprint = {
        "name": "Updated Sprint 1",
        "description": "Updated sprint description",
        "project_id": test_project_id,
        "goal": "Updated goal",
        "start_date": (datetime.now()).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=21)).strftime("%Y-%m-%d")
    }
    
    response = requests.put(f"{BACKEND_URL}/sprints/{sprint_id}", json=updated_sprint)
    if response.status_code != 200:
        print(f"Failed to update sprint: {response.text}")
        return False
    
    updated = response.json()
    print(f"Updated sprint name: {updated['name']}")
    
    return True

def test_task_crud():
    """Test task CRUD operations"""
    global test_project_id, test_sprint_id, test_task_ids
    test_task_ids = []
    
    # Create tasks with different priorities and statuses
    for task in test_tasks:
        # Add project and sprint IDs
        task["project_id"] = test_project_id
        task["sprint_id"] = test_sprint_id
        
        response = requests.post(f"{BACKEND_URL}/tasks", json=task)
        if response.status_code != 200:
            print(f"Failed to create task: {response.text}")
            return False
        
        task_data = response.json()
        task_id = task_data["id"]
        test_task_ids.append(task_id)
        print(f"Created task with ID: {task_id}, Priority: {task['priority']}, Status: {task['status']}")
    
    # Get all tasks
    response = requests.get(f"{BACKEND_URL}/tasks")
    if response.status_code != 200:
        print(f"Failed to get tasks: {response.text}")
        return False
    
    tasks = response.json()
    print(f"Found {len(tasks)} tasks")
    
    # Get tasks by project
    response = requests.get(f"{BACKEND_URL}/tasks?project_id={test_project_id}")
    if response.status_code != 200:
        print(f"Failed to get tasks by project: {response.text}")
        return False
    
    project_tasks = response.json()
    print(f"Found {len(project_tasks)} tasks for project {test_project_id}")
    
    # Get tasks by sprint
    response = requests.get(f"{BACKEND_URL}/tasks?sprint_id={test_sprint_id}")
    if response.status_code != 200:
        print(f"Failed to get tasks by sprint: {response.text}")
        return False
    
    sprint_tasks = response.json()
    print(f"Found {len(sprint_tasks)} tasks for sprint {test_sprint_id}")
    
    # Get specific task
    task_id = test_task_ids[0]
    response = requests.get(f"{BACKEND_URL}/tasks/{task_id}")
    if response.status_code != 200:
        print(f"Failed to get task {task_id}: {response.text}")
        return False
    
    task = response.json()
    print(f"Retrieved task: {task['title']}")
    
    # Update task
    updated_task = {
        "title": "Updated Task",
        "description": "Updated task description",
        "status": "done",
        "priority": "high"
    }
    
    response = requests.put(f"{BACKEND_URL}/tasks/{task_id}", json=updated_task)
    if response.status_code != 200:
        print(f"Failed to update task: {response.text}")
        return False
    
    updated = response.json()
    print(f"Updated task title: {updated['title']}, status: {updated['status']}")
    
    # Delete a task
    task_to_delete = test_task_ids[-1]
    response = requests.delete(f"{BACKEND_URL}/tasks/{task_to_delete}")
    if response.status_code != 200:
        print(f"Failed to delete task: {response.text}")
        return False
    
    print(f"Deleted task {task_to_delete}")
    test_task_ids.pop()
    
    return True

def test_week_calendar():
    """Test the week calendar endpoint"""
    # Get tasks for the current week
    start_date = datetime.now().strftime("%Y-%m-%d")
    response = requests.get(f"{BACKEND_URL}/calendar/week?start_date={start_date}")
    
    if response.status_code != 200:
        print(f"Failed to get week calendar: {response.text}")
        return False
    
    calendar_data = response.json()
    print(f"Week calendar data: {json.dumps(calendar_data, indent=2)}")
    
    # Test with invalid date format
    response = requests.get(f"{BACKEND_URL}/calendar/week?start_date=invalid-date")
    if response.status_code != 400:
        print(f"Expected 400 error for invalid date, got: {response.status_code}")
        return False
    
    print("Week calendar endpoint correctly handles invalid date format")
    
    return True

def test_project_cascade_delete():
    """Test that deleting a project cascades to tasks and sprints"""
    global test_project_id
    
    # First, verify we have tasks and sprints for this project
    response = requests.get(f"{BACKEND_URL}/tasks?project_id={test_project_id}")
    if response.status_code != 200:
        print(f"Failed to get tasks for project: {response.text}")
        return False
    
    project_tasks = response.json()
    task_count = len(project_tasks)
    print(f"Project has {task_count} tasks before deletion")
    
    response = requests.get(f"{BACKEND_URL}/sprints?project_id={test_project_id}")
    if response.status_code != 200:
        print(f"Failed to get sprints for project: {response.text}")
        return False
    
    project_sprints = response.json()
    sprint_count = len(project_sprints)
    print(f"Project has {sprint_count} sprints before deletion")
    
    # Now delete the project
    response = requests.delete(f"{BACKEND_URL}/projects/{test_project_id}")
    if response.status_code != 200:
        print(f"Failed to delete project: {response.text}")
        return False
    
    print(f"Deleted project {test_project_id}")
    
    # Verify tasks are gone
    response = requests.get(f"{BACKEND_URL}/tasks?project_id={test_project_id}")
    if response.status_code != 200:
        print(f"Failed to get tasks after project deletion: {response.text}")
        return False
    
    remaining_tasks = response.json()
    print(f"Project has {len(remaining_tasks)} tasks after deletion")
    
    # Verify sprints are gone
    response = requests.get(f"{BACKEND_URL}/sprints?project_id={test_project_id}")
    if response.status_code != 200:
        print(f"Failed to get sprints after project deletion: {response.text}")
        return False
    
    remaining_sprints = response.json()
    print(f"Project has {len(remaining_sprints)} sprints after deletion")
    
    # Check if cascade deletion worked
    if len(remaining_tasks) > 0 or len(remaining_sprints) > 0:
        print("Cascade deletion failed - tasks or sprints still exist")
        return False
    
    return True

def test_error_handling():
    """Test error handling for invalid IDs and data"""
    # Test invalid task ID
    invalid_id = str(uuid.uuid4())
    response = requests.get(f"{BACKEND_URL}/tasks/{invalid_id}")
    if response.status_code != 404:
        print(f"Expected 404 for invalid task ID, got: {response.status_code}")
        return False
    
    print("Task endpoint correctly handles invalid ID")
    
    # Test invalid project ID
    response = requests.get(f"{BACKEND_URL}/projects/{invalid_id}")
    if response.status_code != 404:
        print(f"Expected 404 for invalid project ID, got: {response.status_code}")
        return False
    
    print("Project endpoint correctly handles invalid ID")
    
    # Test invalid sprint ID
    response = requests.get(f"{BACKEND_URL}/sprints/{invalid_id}")
    if response.status_code != 404:
        print(f"Expected 404 for invalid sprint ID, got: {response.status_code}")
        return False
    
    print("Sprint endpoint correctly handles invalid ID")
    
    return True

def run_all_tests():
    """Run all tests in sequence"""
    # Initialize global variables
    global test_project_id, test_sprint_id, test_task_ids
    test_project_id = None
    test_sprint_id = None
    test_task_ids = []
    
    # Run tests
    run_test("Health Check", test_health_check)
    
    # Project tests
    project_success = run_test("Project CRUD", test_project_crud)
    
    # Only run dependent tests if project creation succeeded
    if project_success:
        sprint_success = run_test("Sprint CRUD", test_sprint_crud)
        
        if sprint_success:
            run_test("Task CRUD", test_task_crud)
            run_test("Week Calendar", test_week_calendar)
        
        # Run cascade delete test last
        run_test("Project Cascade Delete", test_project_cascade_delete)
    
    # Error handling tests can run independently
    run_test("Error Handling", test_error_handling)
    
    # Print summary
    print("\n" + "="*80)
    print(f"TEST SUMMARY: {test_results['passed']}/{test_results['total']} tests passed")
    
    if test_results['failed'] > 0:
        print("\nFAILED TESTS:")
        for failure in test_results['failures']:
            print(f"  - {failure}")
    
    print("="*80)
    
    return test_results['failed'] == 0

if __name__ == "__main__":
    print(f"Testing backend API at: {BACKEND_URL}")
    success = run_all_tests()
    sys.exit(0 if success else 1)