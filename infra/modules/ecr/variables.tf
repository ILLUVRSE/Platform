variable "repository_names" {
  type = list(string)
}

variable "scan_on_push" {
  type    = bool
  default = true
}

variable "force_delete" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
