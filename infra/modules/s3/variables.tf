variable "bucket_names" {
  type = list(string)
}

variable "kms_key_id" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
