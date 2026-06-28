/**
 * A generated module for NotesApi functions
 *
 * This module has been generated via dagger init and serves as a reference to
 * basic module structure as you get started with Dagger.
 *
 * Two functions have been pre-created. You can modify, delete, or add to them,
 * as needed. They demonstrate usage of arguments and return types using simple
 * echo and grep commands. The functions can be called from the dagger CLI or
 * from one of the SDKs.
 *
 * The first line in this comment block is a short description line and the
 * rest is a long description with more detail on the module's purpose or usage,
 * if appropriate. All modules should have a short description.
 */

import { dag, Container, Directory, object, func } from "@dagger.io/dagger"

@object()
export class NotesApi {
  @func()
  async ci(source: Directory): Promise<string> {
    const postgres = dag
      .container()
      .from("postgres:16-alpine")
      .withEnvVariable("POSTGRES_DB", "notes_api_test")
      .withEnvVariable("POSTGRES_USER", "postgres")
      .withEnvVariable("POSTGRES_PASSWORD", "postgres")
      .withExposedPort(5432)
      .asService()

    const base = dag
      .container()
      .from("node:22-alpine")
      .withMountedDirectory("/app", source)
      .withWorkdir("/app")
      .withServiceBinding("db", postgres)
      .withEnvVariable("DB_HOST", "db")
      .withEnvVariable("DB_PORT", "5432")
      .withEnvVariable("DB_USER", "postgres")
      .withEnvVariable("DB_PASSWORD", "postgres")
      .withEnvVariable("DB_NAME", "notes_api_test")
      .withEnvVariable("DB_TEST_HOST", "db")
      .withEnvVariable("DB_TEST_PORT", "5432")
      .withEnvVariable("DB_TEST_NAME", "notes_api_test")
      .withEnvVariable("DB_TEST_USER", "postgres")
      .withEnvVariable("DB_TEST_PASSWORD", "postgres")
      .withExec(["npm", "install"])

    const withDb = base.withExec([
      "sh", "-c",
      "apk add --no-cache postgresql-client && until pg_isready -h db -U postgres; do sleep 1; done && echo 'PostgreSQL is ready!'"
    ])

    const build = withDb.withExec(["npm", "run", "build"])
    const buildOut = await build.stdout()

    const lint = build.withExec(["npm", "run", "lint", "--", "--fix"])
    const lintOut = await lint.stdout()

    const test = build.withExec(["npm", "run", "test"])
    const testOut = await test.stdout()

    return [
      "##CI Pipeline",
      "",
      buildOut,
      "Linter: ",
      lintOut,
      "test: ",
      testOut
    ].join("\n")
  }

  @func()
  async publish(source: Directory): Promise<string> {
    const build = dag
      .container()
      .from("node:22-alpine")
      .withMountedDirectory("/app", source)
      .withWorkdir("/app")
      .withExec(["npm", "install"])
      .withExec(["npm", "run", "build"])

    const prod = dag
      .container()
      .from("node:22-alpine")
      .withWorkdir("/app")
      .withFile("package.json", build.file("/app/package.json"))
      .withFile("package-lock.json", build.file("/app/package-lock.json"))
      .withExec(["npm", "ci", "--omit=dev"])
      .withDirectory("dist", build.directory("/app/dist"))
      .withExposedPort(3000)
      .withDefaultArgs(["node", "dist/index.js"])

    const ref = await prod.publish(`ttl.sh/notesapi-${Date.now()}`)
    return ref
  }
}


