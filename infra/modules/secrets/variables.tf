variable "secrets" {
  type = map(object({ description = string }))
}

variable "secret_values" {
  type    = map(string)
  default = {}
}

variable "kms_key_id" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
