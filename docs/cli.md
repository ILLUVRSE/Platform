# CLI Guide

## illuvrse

### up
Starts local services. If a Docker Compose file exists and Docker Compose is available, it will be used.

Usage:
```
./illuvrse up
```

Example:
```
./illuvrse up --detach
```

### down
Stops services that were started with `--detach` (or stops containers when using Docker Compose).

Usage:
```
./illuvrse down
```

Example:
```
./illuvrse down --all
```

### status
Shows service status and basic health (port checks) when possible.

Usage:
```
./illuvrse status
```

Example:
```
./illuvrse status
```

### doctor
Checks required binaries, env files, and ports, and prints actionable fixes.

Usage:
```
./illuvrse doctor [--json]
```

Example:
```
./illuvrse doctor
```

Example (JSON):
```
./illuvrse doctor --json
```

### logs
Tails recent logs for a service when available. If Docker Compose is used, this maps to `docker compose logs`.

Usage:
```
./illuvrse logs [service] [--tail N]
```

Example:
```
./illuvrse logs web --tail 200
```

### test
Runs the repo's standard test command.

Usage:
```
./illuvrse test
```

Example:
```
./illuvrse test
```

## Notes
- macOS/Linux supported. Windows is not officially supported due to process management and shell assumptions.
