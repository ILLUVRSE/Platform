output "endpoint" {
  value = module.db.db_instance_endpoint
}

output "address" {
  value = module.db.db_instance_address
}

output "port" {
  value = module.db.db_instance_port
}

output "security_group_id" {
  value = aws_security_group.db.id
}
