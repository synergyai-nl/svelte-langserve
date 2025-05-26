variable "REGISTRY" {
  default = "ghcr.io"
}

variable "REPO" {
  default = "synergyai-nl/svelte-langgraph"
}

variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["langgraph-backend", "svelte-frontend"]
}

target "langgraph-backend" {
  context = "."
  dockerfile = "./examples/langgraph-backend/Dockerfile"
  tags = [
    "${REGISTRY}/${REPO}/langgraph-backend:${TAG}",
    "${REGISTRY}/${REPO}/langgraph-backend:latest"
  ]
  cache-from = [
    "type=gha,scope=langgraph-backend"
  ]
  cache-to = [
    "type=gha,scope=langgraph-backend,mode=max"
  ]
  platforms = ["linux/amd64"]
}

target "svelte-frontend" {
  context = "."
  dockerfile = "./examples/dashboard/Dockerfile"
  tags = [
    "${REGISTRY}/${REPO}/svelte-frontend:${TAG}",
    "${REGISTRY}/${REPO}/svelte-frontend:latest"
  ]
  cache-from = [
    "type=gha,scope=svelte-frontend"
  ]
  cache-to = [
    "type=gha,scope=svelte-frontend,mode=max"
  ]
  platforms = ["linux/amd64"]
}

group "all" {
  targets = ["langgraph-backend", "svelte-frontend"]
}