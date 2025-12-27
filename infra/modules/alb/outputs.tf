output "alb_arn" {
  value = aws_lb.main.arn
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_zone_id" {
  value = aws_lb.main.zone_id
}

output "listener_http_arn" {
  value = aws_lb_listener.http.arn
}

output "listener_https_arn" {
  value = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : ""
}

output "security_group_id" {
  value = aws_security_group.alb.id
}
