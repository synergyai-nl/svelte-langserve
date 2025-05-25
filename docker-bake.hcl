variable "REGISTRY" {
  default = "ghcr.io"
}

variable "REPO" {
  default = "synergyai-nl/svelte-langserve"
}

variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["langserve-backend", "svelte-frontend"]
}

target "langserve-backend" {
  context = "./examples/langserve-backend"
  dockerfile = "Dockerfile"
  tags = [
    "${REGISTRY}/${REPO}/langserve-backend:${TAG}",
    "${REGISTRY}/${REPO}/langserve-backend:latest"
  ]
  cache-from = [
    "type=gha,scope=langserve-backend"
  ]
  cache-to = [
    "type=gha,scope=langserve-backend,mode=max"
  ]
  platforms = ["linux/amd64", "linux/arm64"]
}

target "svelte-frontend" {
  context = "./examples/dashboard"
  dockerfile = "Dockerfile"
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
  platforms = ["linux/amd64", "linux/arm64"]
}

group "all" {
  targets = ["langserve-backend", "svelte-frontend"]
}