# Guardrails

RYAN enforces command and file-edit policies for `ryan do`.

## Command Policy

### Denylist (blocked)
These commands are blocked and will not run:
- `rm -rf`
- `sudo`
- `mkfs`
- `dd`
- `chmod -R 777`
- deleting `.git`

Example:
```
./ryan do "cleanup" --test
# If a command resolves to "rm -rf ...", it will be denied.
```

### Require-confirm
These commands require confirmation (or `--yes`):
- `git push`
- deleting branches (`git branch -d/-D`)
- commands mentioning `.env` or `secrets`
- stopping deploy scripts (e.g., `deploy stop`, `production down`)

Example:
```
./ryan do "publish" --test
# If the command includes git push, you will be prompted.
```

## File Edit Policy

Editing sensitive paths requires confirmation:
- `.env*`
- `secrets/`
- credentials or keystores
- key material (e.g., `.pem`, `.p12`, `.jks`)

Example:
```
./ryan do "Update env" --yes
```

## Auto-Approve
Use `--yes` to auto-approve confirmations when you are confident.

Example:
```
./ryan do "Run tests" --test --yes
```
