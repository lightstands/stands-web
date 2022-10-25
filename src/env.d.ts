// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LIGHTSTANDS_ENDPOINT_BASE: string;
    readonly VITE_LIGHTSTANDS_CLIENT_ID: string;
    readonly VITE_LIGHTSTANDS_CLIENT_SECRET: string;
    readonly PACKAGE_VERSION: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
