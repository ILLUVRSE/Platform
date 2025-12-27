output "kernel_key_id" {
  value = aws_kms_key.kernel.key_id
}

output "kernel_key_arn" {
  value = aws_kms_key.kernel.arn
}

output "general_key_id" {
  value = aws_kms_key.general.key_id
}

output "general_key_arn" {
  value = aws_kms_key.general.arn
}
