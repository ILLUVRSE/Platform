variable "name" {
  type = string
}

variable "container_insights" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
