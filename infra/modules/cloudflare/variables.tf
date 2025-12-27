variable "zone_name" {
  type = string
}

variable "zone_id" {
  type    = string
  default = ""
}

variable "plan" {
  type    = string
  default = "free"
}

variable "origin_cname" {
  type    = string
  default = "cname.vercel-dns.com"
}

variable "create_apex_record" {
  type    = bool
  default = true
}

variable "create_www_record" {
  type    = bool
  default = true
}

variable "ttl" {
  type    = number
  default = 1
}

variable "proxied" {
  type    = bool
  default = true
}
