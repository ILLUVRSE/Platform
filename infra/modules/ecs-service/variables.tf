variable "name" {
  type = string
}

variable "cluster_arn" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "listener_arn" {
  type = string
}

variable "hostnames" {
  type = list(string)
}

variable "priority" {
  type = number
}

variable "container_port" {
  type = number
}

variable "health_check_path" {
  type    = string
  default = "/healthz"
}

variable "image" {
  type = string
}

variable "cpu" {
  type    = number
  default = 256
}

variable "memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "assign_public_ip" {
  type    = bool
  default = false
}

variable "env" {
  type    = map(string)
  default = {}
}

variable "secrets" {
  type    = map(string)
  default = {}
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "kms_key_arn" {
  type    = string
  default = ""
}

variable "task_policy_statements" {
  type = list(object({
    actions   = list(string)
    resources = list(string)
  }))
  default = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
