variable "domain_name" {
  type = string
}

variable "subject_alternative_names" {
  type    = list(string)
  default = []
}

variable "validation_method" {
  type    = string
  default = "DNS"
}

variable "tags" {
  type    = map(string)
  default = {}
}
