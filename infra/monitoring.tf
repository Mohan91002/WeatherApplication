# ---------------------------------------------------------------------------
# Observability: CloudWatch dashboard + alarms for the App Runner API.
# App Runner publishes metrics under AWS/AppRunner with dimensions
# ServiceName + ServiceID.
# ---------------------------------------------------------------------------

locals {
  ar_dimensions = {
    ServiceName = aws_apprunner_service.api.service_name
    ServiceID   = aws_apprunner_service.api.service_id
  }
}

# --- Notifications (optional email) ---
resource "aws_sns_topic" "alarms" {
  name = "${var.project}-alarms"
}

resource "aws_sns_topic_subscription" "alarms_email" {
  count     = var.alarm_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# --- Alarms ---
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project}-api-5xx"
  alarm_description   = "App Runner 5xx responses in a 5-minute window."
  namespace           = "AWS/AppRunner"
  metric_name         = "5xxStatusResponses"
  dimensions          = local.ar_dimensions
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_latency_p95" {
  alarm_name          = "${var.project}-api-latency-p95"
  alarm_description   = "App Runner p95 request latency is high."
  namespace           = "AWS/AppRunner"
  metric_name         = "RequestLatency"
  dimensions          = local.ar_dimensions
  extended_statistic  = "p95"
  period              = 300
  evaluation_periods  = 3
  threshold           = var.latency_p95_threshold_ms
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}

resource "aws_cloudwatch_metric_alarm" "api_cpu" {
  alarm_name          = "${var.project}-api-cpu-high"
  alarm_description   = "App Runner CPU utilization sustained high."
  namespace           = "AWS/AppRunner"
  metric_name         = "CPUUtilization"
  dimensions          = local.ar_dimensions
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alarms.arn]
}

# --- Dashboard ---
resource "aws_cloudwatch_dashboard" "api" {
  dashboard_name = "${var.project}-api"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "text", x = 0, y = 0, width = 24, height = 2,
        properties = {
          markdown = "# ${var.project} API — App Runner\nRequest latency, status codes, throughput and resource use. (Cache hit-rate requires a custom app metric — see note below.)"
        }
      },
      {
        type = "metric", x = 0, y = 2, width = 12, height = 6,
        properties = {
          title  = "Request latency (p50 / p95 / p99)"
          region = var.aws_region
          view   = "timeSeries"
          metrics = [
            ["AWS/AppRunner", "RequestLatency", "ServiceName", aws_apprunner_service.api.service_name, "ServiceID", aws_apprunner_service.api.service_id, { stat = "p50", label = "p50" }],
            ["...", { stat = "p95", label = "p95" }],
            ["...", { stat = "p99", label = "p99" }]
          ]
        }
      },
      {
        type = "metric", x = 12, y = 2, width = 12, height = 6,
        properties = {
          title  = "Responses by status"
          region = var.aws_region
          view   = "timeSeries"
          stacked = true
          metrics = [
            ["AWS/AppRunner", "2xxStatusResponses", "ServiceName", aws_apprunner_service.api.service_name, "ServiceID", aws_apprunner_service.api.service_id, { stat = "Sum", label = "2xx" }],
            ["...", "4xxStatusResponses", ".", ".", ".", ".", { stat = "Sum", label = "4xx" }],
            ["...", "5xxStatusResponses", ".", ".", ".", ".", { stat = "Sum", label = "5xx" }]
          ]
        }
      },
      {
        type = "metric", x = 0, y = 8, width = 12, height = 6,
        properties = {
          title  = "Requests & active instances"
          region = var.aws_region
          view   = "timeSeries"
          metrics = [
            ["AWS/AppRunner", "Requests", "ServiceName", aws_apprunner_service.api.service_name, "ServiceID", aws_apprunner_service.api.service_id, { stat = "Sum", label = "Requests" }],
            ["...", "ActiveInstances", ".", ".", ".", ".", { stat = "Average", label = "Active instances" }]
          ]
        }
      },
      {
        type = "metric", x = 12, y = 8, width = 12, height = 6,
        properties = {
          title  = "CPU & memory utilization (%)"
          region = var.aws_region
          view   = "timeSeries"
          metrics = [
            ["AWS/AppRunner", "CPUUtilization", "ServiceName", aws_apprunner_service.api.service_name, "ServiceID", aws_apprunner_service.api.service_id, { stat = "Average", label = "CPU" }],
            ["...", "MemoryUtilization", ".", ".", ".", ".", { stat = "Average", label = "Memory" }]
          ]
        }
      }
    ]
  })
}

output "dashboard_name" { value = aws_cloudwatch_dashboard.api.dashboard_name }
output "alarms_topic_arn" { value = aws_sns_topic.alarms.arn }
