#!/usr/bin/env bash
/**
 * taskfleet-docker.sh — Docker-based Parallel Task Execution
 * 
 * This script provides containerized parallel execution of knowledge graph
 * extension tasks. It uses Docker containers to isolate execution and
 * can run on the haeuser cluster.
 * 
 * Usage:
 *   # Run all tasks in parallel (default: 4 containers)
 *   ./scripts/taskfleet-docker.sh
 *   
 *   # Run with custom concurrency
 *   ./scripts/taskfleet-docker.sh --concurrency 8
 *   
 *   # Run specific task groups
 *   ./scripts/taskfleet-docker.sh --groups entity-enrichment,content-indexing
 *   
 *   # Run on haeuser cluster
 *   ./scripts/taskfleet-docker.sh --cluster haeuser
 *   
 *   # Dry run (show execution plan)
 *   ./scripts/taskfleet-docker.sh --dry-run
 *   
 * Architecture:
 *   - Each task runs in its own Docker container
 *   - Containers share the Neo4j network
 *   - Results are logged to a central location
 *   - Can scale to cluster execution via Docker Swarm/Kubernetes
 * 
 * @module taskfleet-docker
 */

set -euo pipefail

# ── Script Configuration ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/taskfleet"
TMP_DIR="$PROJECT_DIR/tmp/taskfleet"

# ── Default Configuration ───────────────────────────────────────────────
NEO4J_URI="${NEO4J_URI:-bolt://chemie-neo4j:7687}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-chemie_knowledge_2024}"
NEO4J_DATABASE="${NEO4J_DATABASE:-chemie}"

# Docker configuration
DOCKER_NETWORK="${NETWORK:-traefik-web}"
DOCKER_IMAGE="${DOCKER_IMAGE:-node:22-alpine}"
MAX_CONCURRENCY="${MAX_CONCURRENCY:-4}"

# ── CLI Arguments ────────────────────────────────────────────────────────
ARGS=("$@")
CONCURRENCY="$MAX_CONCURRENCY"
GROUPS=""
TASKS=""
DRY_RUN=false
VERBOSE=false
CLUSTER=""
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --concurrency=*)
      CONCURRENCY="${1#*=}"
      shift
      ;;
    --groups=*)
      GROUPS="${1#*=}"
      shift
      ;;
    --tasks=*)
      TASKS="${1#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --cluster=*)
      CLUSTER="${1#*=}"
      shift
      ;;
    --help|-h)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      print_help
      exit 1
      ;;
  esac
done

# ── Functions ────────────────────────────────────────────────────────────

print_help() {
  cat <<EOF
TaskFleet Docker — Parallel Task Execution for Knowledge Graph Extension

Usage:
  ./scripts/taskfleet-docker.sh [options]

Options:
  --concurrency=<n>    Number of parallel containers (default: $MAX_CONCURRENCY)
  --groups=<groups>    Comma-separated list of task groups
  --tasks=<tasks>      Comma-separated list of specific task IDs
  --dry-run            Show execution plan without running
  --verbose            Show detailed output
  --force              Force re-execution of tasks
  --cluster=<name>     Run on specific cluster (haeuser, docker-swarm)
  --help, -h           Show this help message

Available Task Groups:
  entity-enrichment    Anreichern von Entities mit Eigenschaften
  content-indexing     Import und Verknüpfung von Inhalten
  curriculum-linking   Verknüpfung von Lehrplänen mit Entities
  quality-assurance    Qualitätsprüfungen und Bereinigungen
  data-import          Import von Rohdaten
  index-search         Indexierung und Suche
  data-export          Export von Daten
  curricula-didaktik  Curricula und Didaktik
  marketing            Marketing- und Analysedaten
  maintenance          Wartungsaufgaben

Examples:
  # Run all entity enrichment tasks in parallel
  ./scripts/taskfleet-docker.sh --groups entity-enrichment

  # Run specific tasks with 8 containers
  ./scripts/taskfleet-docker.sh --tasks enrich-entity-descriptions,enrich-isolated-entities --concurrency 8

  # Dry run to see what would be executed
  ./scripts/taskfleet-docker.sh --dry-run

  # Run on haeuser cluster
  ./scripts/taskfleet-docker.sh --cluster haeuser --groups content-indexing

Environment Variables:
  NEO4J_URI           Neo4j server URI (default: $NEO4J_URI)
  NEO4J_USER          Neo4j username (default: $NEO4J_USER)
  NEO4J_PASSWORD      Neo4j password (default: from env)
  NEO4J_DATABASE      Neo4j database name (default: $NEO4J_DATABASE)
  DOCKER_IMAGE        Docker image to use (default: $DOCKER_IMAGE)
  DOCKER_NETWORK      Docker network (default: $DOCKER_NETWORK)
EOF
}

# Create directories
setup_directories() {
  mkdir -p "$LOG_DIR"
  mkdir -p "$TMP_DIR"
}

# Get task list from config
get_task_list() {
  # Parse the JavaScript config file to extract task information
  # This is a simplified approach - for more complex configs, use node
  
  if [[ -n "$TASKS" ]]; then
    # Specific tasks requested
    echo "$TASKS" | tr ',' '\n'
    return
  fi
  
  if [[ -n "$GROUPS" ]]; then
    # Filter by groups - use node to parse the config
    node -e "
const { TASKS } = require('$PROJECT_DIR/scripts/taskfleet-config.mjs');
const groups = process.argv[1].split(',');
const filtered = TASKS.filter(t => groups.includes(t.group));
console.log(filtered.map(t => t.id).join('\n'));
" "$GROUPS"
    return
  fi
  
  # All tasks
  node -e "
const { TASKS } = require('$PROJECT_DIR/scripts/taskfleet-config.mjs');
console.log(TASKS.map(t => t.id).join('\n'));
"
}

# Get task details
get_task_command() {
  local task_id="$1"
  node -e "
const { TASKS } = require('$PROJECT_DIR/scripts/taskfleet-config.mjs');
const task = TASKS.find(t => t.id === '$task_id');
if (task) {
  console.log(task.command);
} else {
  console.error('Task not found: $task_id');
  process.exit(1);
}
"
}

# Get task dependencies
get_task_dependencies() {
  local task_id="$1"
  node -e "
const { TASKS } = require('$PROJECT_DIR/scripts/taskfleet-config.mjs');
const task = TASKS.find(t => t.id === '$task_id');
if (task && task.dependencies) {
  console.log(task.dependencies.join(' '));
}
"
}

# Check if all dependencies are completed
check_dependencies() {
  local task_id="$1"
  shift
  local completed+=("$@")
  
  local deps
  deps=$(get_task_dependencies "$task_id")
  
  if [[ -z "$deps" ]]; then
    return 0  # No dependencies
  fi
  
  for dep in $deps; do
    if [[ "${completed[@]}" != *"$dep"* ]]; then
      return 1  # Dependency not completed
    fi
  done
  
  return 0  # All dependencies completed
}

# Execute a task in Docker
execute_task_docker() {
  local task_id="$1"
  local log_file="$LOG_DIR/${task_id}_$(date +%Y%m%d_%H%M%S).log"
  local tmp_file="$TMP_DIR/${task_id}.status"
  
  echo "Starting task: $task_id"
  echo "Log file: $log_file"
  
  # Get the command
  local cmd
  cmd=$(get_task_command "$task_id")
  
  # Create a wrapper script for the task
  cat > "$TMP_DIR/${task_id}.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail

cd /workspace

export NEO4J_URI="$NEO4J_URI"
export NEO4J_USER="$NEO4J_USER"
export NEO4J_PASSWORD="$NEO4J_PASSWORD"
export NEO4J_DATABASE="$NEO4J_DATABASE"

echo "$(date) — Starting task: $task_id"
echo "$(date) — Command: $cmd"

# Execute the command
if $cmd; then
  echo "$(date) — Task completed successfully: $task_id"
  echo "SUCCESS" > /tmp_status
  exit 0
else
  echo "$(date) — Task failed: $task_id"
  echo "FAILED" > /tmp_status
  exit 1
fi
EOF
  
  chmod +x "$TMP_DIR/${task_id}.sh"
  
  # Run in Docker
  echo "[docker] Running: $task_id"
  
  docker run --rm \
    --name "taskfleet-$task_id" \
    --network "$DOCKER_NETWORK" \
    -e "NEO4J_URI=$NEO4J_URI" \
    -e "NEO4J_USER=$NEO4J_USER" \
    -e "NEO4J_PASSWORD=$NEO4J_PASSWORD" \
    -e "NEO4J_DATABASE=$NEO4J_DATABASE" \
    -e "TASK_ID=$task_id" \
    -v "$PROJECT_DIR:/workspace" \
    -v "$TMP_DIR/${task_id}.status:/tmp_status" \
    -v "$TMP_DIR/${task_id}.sh:/task.sh" \
    -v "$LOG_DIR:/logs" \
    -w /workspace \
    "$DOCKER_IMAGE" \
    /bin/sh -c "/task.sh 2>&1 | tee /logs/${task_id}_\(date +%Y%m%d_%H%M%S\).log" || true
  
  # Check status
  if [[ -f "$TMP_DIR/${task_id}.status" ]]; then
    local status
    status=$(cat "$TMP_DIR/${task_id}.status")
    if [[ "$status" == "SUCCESS" ]]; then
      echo "✅ Completed: $task_id"
      return 0
    else
      echo "❌ Failed: $task_id"
      return 1
    fi
  fi
  
  echo "⚠️ Unknown status: $task_id"
  return 1
}

# Execute task directly (without Docker)
execute_task_direct() {
  local task_id="$1"
  local log_file="$LOG_DIR/${task_id}_$(date +%Y%m%d_%H%M%S).log"
  
  echo "Starting task: $task_id"
  echo "Log file: $log_file"
  
  local cmd
  cmd=$(get_task_command "$task_id")
  
  echo "[direct] Running: $task_id"
  echo "[direct] Command: $cmd"
  
  if $cmd 2>&1 | tee "$log_file"; then
    echo "✅ Completed: $task_id"
    return 0
  else
    echo "❌ Failed: $task_id"
    return 1
  fi
}

# Determine execution method
should_use_docker() {
  # Use Docker if:
  # - We're running on a system with Docker
  # - We're running on a cluster
  # - We're not in a container already
  
  if [[ -n "$CLUSTER" ]]; then
    return 0  # Use Docker for cluster execution
  fi
  
  if [[ -f "/.dockerenv" ]]; then
    return 1  # Already in Docker, run directly
  fi
  
  if command -v docker &>/dev/null; then
    return 0  # Docker is available
  fi
  
  return 1  # Fall back to direct execution
}

# Main execution loop
main() {
  setup_directories
  
  # Get task list
  echo "Getting task list..."
  local task_list
  task_list=$(get_task_list)
  
  if [[ -z "$task_list" ]]; then
    echo "No tasks found. Check your configuration."
    exit 1
  fi
  
  local tasks
  mapfile -t tasks <<< "$task_list"
  
  echo "Found ${#tasks[@]} tasks to execute:"
  for task in "${tasks[@]}"; do
    local cmd
    cmd=$(get_task_command "$task")
    echo "  - $task"
  done
  echo ""
  
  if [[ "$DRY_RUN" == true ]]; then
    echo "DRY RUN — No tasks will be executed. Add --dry-run=false to run."
    exit 0
  fi
  
  # Build task map for dependency tracking
  declare -A task_map
  local index=0
  for task in "${tasks[@]}"; do
    task_map["$task"]=0  # 0 = not completed, 1 = completed, 2 = failed
  done
  
  # Track execution
  local active_tasks=()
  local completed_tasks=()
  local failed_tasks=()
  local in_progress=0
  
  echo "Starting execution with concurrency: $CONCURRENCY"
  echo ""
  
  # Main loop
  while true; do
    # Check for available slots
    local available_slots=$((CONCURRENCY - in_progress))
    
    if [[ $available_slots -gt 0 ]]; then
      # Find tasks that can be executed (dependencies met, not already running/completed)
      local ready_tasks=()
      for task in "${tasks[@]}"; do
        local task_status=${task_map["$task"]}
        
        # Skip if already completed or in progress
        if [[ "$task_status" != "0" ]]; then
          continue
        fi
        
        # Check dependencies
        local deps
        deps=$(get_task_dependencies "$task")
        
        local can_run=true
        if [[ -n "$deps" ]]; then
          for dep in $deps; do
            local dep_status=${task_map["$dep"]}
            if [[ "$dep_status" != "1" ]]; then
              can_run=false
              break
            fi
          done
        fi
        
        if [[ "$can_run" == true ]]; then
          ready_tasks+=("$task")
        fi
      done
      
      # Sort by priority
      # For now, just sort alphabetically (proper priority sorting would require more complex parsing)
      IFS=$'\n' ready_tasks=($(sort <<<"${ready_tasks[*]}"))
      unset IFS
      
      # Start new tasks
      for task in "${ready_tasks[@]}"; do
        if [[ $available_slots -le 0 ]]; then
          break
        fi
        
        task_map["$task"]=2  # Mark as in progress
        in_progress=$((in_progress + 1))
        active_tasks+=("$task")
        available_slots=$((available_slots - 1))
        
        # Execute task in background
        if should_use_docker; then
          ( 
            execute_task_docker "$task" && task_map["$task"]=1 || task_map["$task"]=3
            in_progress=$((in_progress - 1))
            if [[ ${task_map["$task"]} -eq 1 ]]; then
              completed_tasks+=("$task")
              echo "🎉 Task completed: $task"
            else
              failed_tasks+=("$task")
              echo "💥 Task failed: $task"
            fi
          ) &
        else
          ( 
            execute_task_direct "$task" && task_map["$task"]=1 || task_map["$task"]=3
            in_progress=$((in_progress - 1))
            if [[ ${task_map["$task"]} -eq 1 ]]; then
              completed_tasks+=("$task")
              echo "🎉 Task completed: $task"
            else
              failed_tasks+=("$task")
              echo "💥 Task failed: $task"
            fi
          ) &
        fi
      done
    fi
    
    # Check if all tasks are completed
    local all_done=true
    for task in "${tasks[@]}"; do
      local status=${task_map["$task"]}
      if [[ "$status" != "1" && "$status" != "3" ]]; then
        all_done=false
        break
      fi
    done
    
    if [[ "$all_done" == true ]]; then
      break
    fi
    
    # Small delay before checking again
    sleep 1
  done
  
  # Wait for all background tasks to complete
  wait
  
  # Print summary
  echo ""
  echo "${'='.repeat(60)}"
  echo "EXECUTION SUMMARY"
  echo "${'='.repeat(60)}"
  echo "Total tasks:    ${#tasks[@]}"
  echo "Completed:      ${#completed_tasks[@]}"
  echo "Failed:         ${#failed_tasks[@]}"
  echo ""
  
  if [[ ${#failed_tasks[@]} -gt 0 ]]; then
    echo "Failed tasks:"
    for task in "${failed_tasks[@]}"; do
      echo "  ❌ $task"
    done
    echo ""
    echo "⚠️  Some tasks failed."
    exit 1
  else
    echo "✅ All tasks completed successfully!"
  fi
  
  echo "${'='.repeat(60)}"
}

# ── Entry Point ───────────────────────────────────────────────────────────

# Set up signal handling
cleanup() {
  echo ""
  echo "🛑 Received interrupt signal. Cleaning up..."
  
  # Kill all background processes
  pkill -P $$ || true
  
  # Remove temporary files
  rm -rf "$TMP_DIR"
  
  echo "Cleanup complete."
  exit 1
}

trap cleanup SIGINT SIGTERM

# Validate environment
if [[ -z "$NEO4J_PASSWORD" && -f "$PROJECT_DIR/.env" ]]; then
  # Load from .env file
  set -o allexport
  source "$PROJECT_DIR/.env"
  set +o allexport
fi

if [[ -z "$NEO4J_PASSWORD" ]]; then
  echo "Error: NEO4J_PASSWORD is required."
  echo "Set it as an environment variable or create a .env file."
  exit 1
fi

# Run main
main
