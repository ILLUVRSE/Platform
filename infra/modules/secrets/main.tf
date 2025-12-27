resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets

  name        = each.key
  description = each.value.description
  kms_key_id  = var.kms_key_id

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "versions" {
  for_each = { for name, value in var.secret_values : name => value if contains(keys(var.secrets), name) }

  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = each.value
}
