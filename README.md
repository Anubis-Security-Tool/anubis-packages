# Anubis package sources

Source collection for the independently hosted packages used by
[Anubis-Security-Tool](https://github.com/Anubis-Security-Tool/anubis).
Package names keep the established `@ai-security-tool` npm scope; the GitHub
organization is `Anubis-Security-Tool`.

| Directory | Package | Source version |
|---|---|---|
| `ftp-srv` | `@ai-security-tool/ftp-srv` | `1.0.6` |
| `icons` | `@ai-security-tool/icons` | `1.0.1` |
| `locales` | `@ai-security-tool/locales` | `2.3.34` |
| `nedb` | `@ai-security-tool/nedb` | `2.0.0` |
| `ssh2` | `@ai-security-tool/ssh2` | `1.22.1` |
| `ssh2-scp` | `@ai-security-tool/ssh2-scp` | `3.3.0` |
| `sync` | `@ai-security-tool/sync` | `2.1.0` |
| `themes` | `@ai-security-tool/themes` | `1.0.2` |
| `trzsz2` | `@ai-security-tool/trzsz2` | `1.2.0` |
| `xterm` | `@ai-security-tool/xterm` | `6.1.0-beta.292-electerm.2` |

Each package retains its own original license, copyright and upstream source
notices. Repository metadata points here; `anubisUpstreamRepository` records the
previous repository field where present. These packages declare MIT licensing;
consult each package's supplied notices rather than replacing them with an
umbrella license.

This collection is not a single npm workspace and is not an extra application
that must be installed. The main Desktop/Web source workflow resolves its
versioned packages through `https://npm.anubis.locker/`. Follow the main
repository's full-source instructions for a complete application build.
Changing repository metadata here does not replace an already published npm
version. Runtime changes require a new version, review and publication to the
owned registry; never overwrite an immutable release.

The managed-access SDK has its own repository:
[anubis-managed-access](https://github.com/Anubis-Security-Tool/anubis-managed-access).
Resource generation and branding live in
[anubis-resource](https://github.com/Anubis-Security-Tool/anubis-resource).
Operator publishing helpers, credentials and installed dependencies are not
part of this source collection. Any inherited test keys or sample fixtures are
test material, never production credentials.
