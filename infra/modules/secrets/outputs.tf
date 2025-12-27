output "secret_arns" {
  value = { for name, secret in aws_secretsmanager_secret.secrets : name => secret.arn }
}
