output "vpc_id" {
  value = module.network.vpc_id
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "rds_address" {
  value = module.rds.address
}

output "s3_buckets" {
  value = module.s3.bucket_ids
}

output "sqs_queue_url" {
  value = module.sqs.queue_url
}

output "kms_kernel_key_arn" {
  value = module.kms.kernel_key_arn
}

output "kms_general_key_arn" {
  value = module.kms.general_key_arn
}

output "secret_arns" {
  value = module.secrets.secret_arns
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "kernel_service_name" {
  value = module.kernel_service.service_name
}

output "sentinel_service_name" {
  value = module.sentinel_service.service_name
}

output "agent_manager_service_name" {
  value = module.agent_manager_service.service_name
}
