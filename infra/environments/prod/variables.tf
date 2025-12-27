variable "project_name" {
  type    = string
  default = "illuvrse"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.20.0.0/20", "10.20.16.0/20"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.20.32.0/20", "10.20.48.0/20"]
}

variable "single_nat_gateway" {
  type    = bool
  default = false
}

variable "db_name" {
  type    = string
  default = "illuvrse"
}

variable "db_username" {
  type    = string
  default = "illuvrse_admin"
}

variable "db_instance_class" {
  type    = string
  default = "db.m6g.large"
}

variable "db_allocated_storage" {
  type    = number
  default = 100
}

variable "db_max_allocated_storage" {
  type    = number
  default = 500
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
