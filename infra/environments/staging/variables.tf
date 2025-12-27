variable "project_name" {
  type    = string
  default = "illuvrse"
}

variable "environment" {
  type    = string
  default = "staging"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.30.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.30.0.0/20", "10.30.16.0/20"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.30.32.0/20", "10.30.48.0/20"]
}

variable "single_nat_gateway" {
  type    = bool
  default = true
}

variable "db_name" {
  type    = string
  default = "illuvrse_staging"
}

variable "db_username" {
  type    = string
  default = "illuvrse_admin"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

variable "db_allocated_storage" {
  type    = number
  default = 50
}

variable "db_max_allocated_storage" {
  type    = number
  default = 200
}

variable "db_engine_version" {
  type    = string
  default = "15.7"
}

variable "domain_name" {
  type    = string
  default = "illuvrse.com"
}

variable "cloudflare_zone_id" {
  type    = string
  default = ""
}

variable "cloudflare_plan" {
  type    = string
  default = "pro"
}

variable "cloudflare_proxied" {
  type    = bool
  default = true
}
