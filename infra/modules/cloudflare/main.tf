locals {
  create_zone = var.zone_id == ""
}

resource "cloudflare_zone" "zone" {
  count = local.create_zone ? 1 : 0
  zone  = var.zone_name
  plan  = var.plan
}

data "cloudflare_zone" "existing" {
  count = local.create_zone ? 0 : 1
  zone  = var.zone_name
}

locals {
  zone_id = local.create_zone ? cloudflare_zone.zone[0].id : data.cloudflare_zone.existing[0].id
}

resource "cloudflare_record" "apex" {
  count   = var.create_apex_record ? 1 : 0
  zone_id = local.zone_id
  name    = "@"
  type    = "CNAME"
  value   = var.origin_cname
  ttl     = var.ttl
  proxied = var.proxied
}

resource "cloudflare_record" "www" {
  count   = var.create_www_record ? 1 : 0
  zone_id = local.zone_id
  name    = "www"
  type    = "CNAME"
  value   = var.origin_cname
  ttl     = var.ttl
  proxied = var.proxied
}
