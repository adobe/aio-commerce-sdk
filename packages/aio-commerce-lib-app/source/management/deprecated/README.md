# Deprecated management internals

This folder holds the pre-lifecycle installation engine, kept only so existing
consumers of the published `management` entrypoint keep working. Nothing new
should depend on it; the lifecycle modules under `source/management/lifecycle`
are the supported path. The whole folder is removed in the next major release.
