provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
    }
  }
}

provider "cloudflare" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
  bucket_names = [
    "${local.name_prefix}-artifacts",
    "${local.name_prefix}-media",
    "${local.name_prefix}-avatars"
  ]
  ecr_repo_names = {
    kernel        = "${var.project_name}/kernel"
    sentinel      = "${var.project_name}/sentinel"
    agent_manager = "${var.project_name}/agent-manager"
  }
  ecr_repositories = values(local.ecr_repo_names)
  secret_prefix = "${var.project_name}/${var.environment}"
  database_url  = "postgresql://${var.db_username}:${urlencode(random_password.db_password.result)}@${module.rds.address}:${module.rds.port}/${var.db_name}?schema=public"
  service_domains = {
    kernel       = "kernel-${var.environment}.${var.domain_name}"
    sentinel     = "sentinel-${var.environment}.${var.domain_name}"
    agent_manager = "agent-${var.environment}.${var.domain_name}"
  }
}

module "network" {
  source = "../../modules/network"

  name                 = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  single_nat_gateway   = var.single_nat_gateway
  tags                 = local.tags
}

module "kms" {
  source = "../../modules/kms"

  name_prefix = local.name_prefix
  tags        = local.tags
}

module "acm" {
  source = "../../modules/acm"

  domain_name               = "*.${var.domain_name}"
  subject_alternative_names = [var.domain_name]
  tags                      = local.tags
}

resource "random_password" "db_password" {
  length  = 24
  special = true
}

resource "random_password" "nextauth_secret" {
  length  = 32
  special = true
}

resource "random_password" "internal_api_token" {
  length  = 32
  special = true
}

resource "random_password" "kernel_token" {
  length  = 32
  special = true
}

resource "random_password" "sentinel_token" {
  length  = 32
  special = true
}

resource "random_password" "marketplace_token" {
  length  = 32
  special = true
}

resource "random_password" "finance_token" {
  length  = 32
  special = true
}

resource "random_password" "artifact_publisher_token" {
  length  = 32
  special = true
}

resource "random_password" "agent_backend_token" {
  length  = 32
  special = true
}

resource "random_password" "memory_token" {
  length  = 32
  special = true
}

resource "random_password" "world_token" {
  length  = 32
  special = true
}

resource "random_password" "voice_token" {
  length  = 32
  special = true
}

module "secrets" {
  source = "../../modules/secrets"

  kms_key_id = module.kms.general_key_id
  tags       = local.tags

  secrets = {
    "${local.secret_prefix}/db/password" = { description = "RDS master password" }
    "${local.secret_prefix}/db/url" = { description = "Postgres connection URL" }
    "${local.secret_prefix}/nextauth/secret" = { description = "NextAuth secret" }
    "${local.secret_prefix}/internal-api/token" = { description = "Internal API token" }
    "${local.secret_prefix}/kernel/token" = { description = "Kernel service token" }
    "${local.secret_prefix}/sentinel/token" = { description = "Sentinel service token" }
    "${local.secret_prefix}/marketplace/token" = { description = "Marketplace service token" }
    "${local.secret_prefix}/finance/token" = { description = "Finance service token" }
    "${local.secret_prefix}/artifact-publisher/token" = { description = "ArtifactPublisher service token" }
    "${local.secret_prefix}/agent-backend/token" = { description = "AgentManager service token" }
    "${local.secret_prefix}/memory/token" = { description = "Memory service token" }
    "${local.secret_prefix}/world/token" = { description = "World state service token" }
    "${local.secret_prefix}/voice/token" = { description = "Voice service token" }
    "${local.secret_prefix}/openai/api-key" = { description = "OpenAI API key" }
    "${local.secret_prefix}/elevenlabs/api-key" = { description = "ElevenLabs API key" }
    "${local.secret_prefix}/deepgram/api-key" = { description = "Deepgram API key" }
    "${local.secret_prefix}/stripe/secret-key" = { description = "Stripe secret key" }
  }

  secret_values = {
    "${local.secret_prefix}/db/password" = random_password.db_password.result
    "${local.secret_prefix}/db/url" = local.database_url
    "${local.secret_prefix}/nextauth/secret" = random_password.nextauth_secret.result
    "${local.secret_prefix}/internal-api/token" = random_password.internal_api_token.result
    "${local.secret_prefix}/kernel/token" = random_password.kernel_token.result
    "${local.secret_prefix}/sentinel/token" = random_password.sentinel_token.result
    "${local.secret_prefix}/marketplace/token" = random_password.marketplace_token.result
    "${local.secret_prefix}/finance/token" = random_password.finance_token.result
    "${local.secret_prefix}/artifact-publisher/token" = random_password.artifact_publisher_token.result
    "${local.secret_prefix}/agent-backend/token" = random_password.agent_backend_token.result
    "${local.secret_prefix}/memory/token" = random_password.memory_token.result
    "${local.secret_prefix}/world/token" = random_password.world_token.result
    "${local.secret_prefix}/voice/token" = random_password.voice_token.result
  }
}

module "rds" {
  source = "../../modules/rds"

  name                  = local.name_prefix
  db_name               = var.db_name
  username              = var.db_username
  password              = random_password.db_password.result
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  engine_version        = var.db_engine_version
  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.private_subnet_ids
  kms_key_id            = module.kms.general_key_id
  allowed_cidr_blocks   = [var.vpc_cidr]
  deletion_protection   = false
  backup_retention_days = 7
  tags                  = local.tags
}

module "s3" {
  source = "../../modules/s3"

  bucket_names = local.bucket_names
  kms_key_id   = module.kms.general_key_id
  tags         = local.tags
}

module "sqs" {
  source = "../../modules/sqs"

  name = "${local.name_prefix}-agent-jobs"
  tags = local.tags
}

module "ecr" {
  source = "../../modules/ecr"

  repository_names = local.ecr_repositories
  tags             = local.tags
}

module "ecs" {
  source = "../../modules/ecs"

  name = "${local.name_prefix}-cluster"
  tags = local.tags
}

module "alb" {
  source = "../../modules/alb"

  name                  = "${local.name_prefix}-services"
  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.public_subnet_ids
  allowed_cidr_blocks   = ["0.0.0.0/0"]
  deletion_protection   = false
  certificate_arn       = module.acm.certificate_arn
  tags                  = local.tags

  depends_on = [aws_acm_certificate_validation.acm]
}

module "kernel_service" {
  source = "../../modules/ecs-service"

  name                 = "${local.name_prefix}-kernel"
  cluster_arn          = module.ecs.cluster_arn
  vpc_id               = module.network.vpc_id
  subnet_ids           = module.network.private_subnet_ids
  alb_security_group_id = module.alb.security_group_id
  listener_arn         = module.alb.listener_https_arn != "" ? module.alb.listener_https_arn : module.alb.listener_http_arn
  hostnames            = [local.service_domains.kernel]
  priority             = 10
  container_port       = 4000
  image                = "${module.ecr.repository_urls[local.ecr_repo_names.kernel]}:${var.environment}"
  cpu                  = 256
  memory               = 512
  env = {
    NODE_ENV          = "production"
    PORT              = "4000"
    AWS_REGION        = var.aws_region
    KERNEL_KMS_KEY_ID = module.kms.kernel_key_id
  }
  secrets = {
    KERNEL_TOKEN = module.secrets.secret_arns["${local.secret_prefix}/kernel/token"]
    DATABASE_URL = module.secrets.secret_arns["${local.secret_prefix}/db/url"]
  }
  kms_key_arn = module.kms.general_key_arn
  task_policy_statements = [
    {
      actions   = ["kms:Sign", "kms:Verify", "kms:GetPublicKey"]
      resources = [module.kms.kernel_key_arn]
    }
  ]
  tags = local.tags
}

module "sentinel_service" {
  source = "../../modules/ecs-service"

  name                 = "${local.name_prefix}-sentinel"
  cluster_arn          = module.ecs.cluster_arn
  vpc_id               = module.network.vpc_id
  subnet_ids           = module.network.private_subnet_ids
  alb_security_group_id = module.alb.security_group_id
  listener_arn         = module.alb.listener_https_arn != "" ? module.alb.listener_https_arn : module.alb.listener_http_arn
  hostnames            = [local.service_domains.sentinel]
  priority             = 20
  container_port       = 4105
  image                = "${module.ecr.repository_urls[local.ecr_repo_names.sentinel]}:${var.environment}"
  cpu                  = 256
  memory               = 512
  env = {
    NODE_ENV   = "production"
    PORT       = "4105"
    AWS_REGION = var.aws_region
  }
  secrets = {
    SENTINEL_TOKEN = module.secrets.secret_arns["${local.secret_prefix}/sentinel/token"]
  }
  kms_key_arn = module.kms.general_key_arn
  tags        = local.tags
}

module "agent_manager_service" {
  source = "../../modules/ecs-service"

  name                 = "${local.name_prefix}-agent-manager"
  cluster_arn          = module.ecs.cluster_arn
  vpc_id               = module.network.vpc_id
  subnet_ids           = module.network.private_subnet_ids
  alb_security_group_id = module.alb.security_group_id
  listener_arn         = module.alb.listener_https_arn != "" ? module.alb.listener_https_arn : module.alb.listener_http_arn
  hostnames            = [local.service_domains.agent_manager]
  priority             = 30
  container_port       = 4040
  image                = "${module.ecr.repository_urls[local.ecr_repo_names.agent_manager]}:${var.environment}"
  cpu                  = 512
  memory               = 1024
  env = {
    NODE_ENV              = "production"
    PORT                  = "4040"
    AWS_REGION            = var.aws_region
    AGENT_QUEUE_URL       = module.sqs.queue_url
    AGENT_POLL_INTERVAL_MS = "2000"
    AGENT_MAX_STATUS      = "20"
  }
  secrets = {
    AGENT_BACKEND_TOKEN = module.secrets.secret_arns["${local.secret_prefix}/agent-backend/token"]
    DATABASE_URL        = module.secrets.secret_arns["${local.secret_prefix}/db/url"]
    WORLD_TOKEN         = module.secrets.secret_arns["${local.secret_prefix}/world/token"]
  }
  kms_key_arn = module.kms.general_key_arn
  task_policy_statements = [
    {
      actions = [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl"
      ]
      resources = [module.sqs.queue_arn]
    }
  ]
  tags = local.tags
}

module "cloudflare" {
  source = "../../modules/cloudflare"

  zone_name          = var.domain_name
  zone_id            = var.cloudflare_zone_id
  plan               = var.cloudflare_plan
  proxied            = var.cloudflare_proxied
  origin_cname       = "cname.vercel-dns.com"
  create_apex_record = true
  create_www_record  = true
}

resource "cloudflare_record" "service_records" {
  for_each = local.service_domains

  zone_id = module.cloudflare.zone_id
  name    = replace(each.value, ".${var.domain_name}", "")
  type    = "CNAME"
  value   = module.alb.alb_dns_name
  ttl     = 300
  proxied = var.cloudflare_proxied
}

resource "cloudflare_record" "acm_validation" {
  for_each = { for dvo in module.acm.validation_records : dvo.domain_name => {
    name  = trimsuffix(dvo.resource_record_name, ".")
    type  = dvo.resource_record_type
    value = trimsuffix(dvo.resource_record_value, ".")
  } }

  zone_id = module.cloudflare.zone_id
  name    = each.value.name
  type    = each.value.type
  value   = each.value.value
  ttl     = 300
  proxied = false
}

resource "aws_acm_certificate_validation" "acm" {
  certificate_arn         = module.acm.certificate_arn
  validation_record_fqdns = [for record in cloudflare_record.acm_validation : record.hostname]
}
