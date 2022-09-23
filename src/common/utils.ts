// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

export function error2explain(e: Error): string {
    const value =
        e.name +
        ": " +
        e.message +
        (e.stack ? "\nStacktrace:\n" + e.stack : "") +
        (e.cause ? "\nCause:\n" + e.cause : "");
    return value.replace("\n", "\n\n");
}
