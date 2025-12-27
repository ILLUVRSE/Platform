output "certificate_arn" {
  value = aws_acm_certificate.main.arn
}

output "validation_records" {
  value = aws_acm_certificate.main.domain_validation_options
}
