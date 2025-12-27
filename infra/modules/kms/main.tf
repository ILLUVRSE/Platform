data "aws_caller_identity" "current" {}

resource "aws_kms_key" "kernel" {
  description             = "Kernel signing key"
  deletion_window_in_days = var.deletion_window_in_days
  key_usage               = "SIGN_VERIFY"
  customer_master_key_spec = "RSA_4096"
  enable_key_rotation     = false

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "EnableRoot",
        Effect   = "Allow",
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
        Action   = "kms:*",
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_kms_alias" "kernel" {
  name          = "alias/${var.name_prefix}-kernel"
  target_key_id = aws_kms_key.kernel.key_id
}

resource "aws_kms_key" "general" {
  description             = "General secrets key"
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "EnableRoot",
        Effect   = "Allow",
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
        Action   = "kms:*",
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_kms_alias" "general" {
  name          = "alias/${var.name_prefix}-general"
  target_key_id = aws_kms_key.general.key_id
}
