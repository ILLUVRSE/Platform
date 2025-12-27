output "bucket_ids" {
  value = { for name, bucket in aws_s3_bucket.buckets : name => bucket.id }
}

output "bucket_arns" {
  value = { for name, bucket in aws_s3_bucket.buckets : name => bucket.arn }
}
