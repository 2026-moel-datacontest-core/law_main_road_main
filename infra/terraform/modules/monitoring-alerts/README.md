# Monitoring Alerts Module

Creates Cloud Monitoring metric-threshold alert policies for Phase 6.

This module deliberately does not create notification channels. Receiver choice
and verification are administrator-owned gates. Pass existing, approved channel
IDs through `notification_channels` only after the receiver has been selected and
approved.

Use conservative dev thresholds first and tune after smoke/demo traffic. Do not
treat an alert policy without an incident owner as production incident response
readiness.
