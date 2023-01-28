// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LIGHTSTANDS_ENDPOINT_BASE: string;
    readonly VITE_LIGHTSTANDS_CLIENT_ID: string;
    readonly VITE_LIGHTSTANDS_CLIENT_SECRET: string;
    readonly VITE_APP_LOG_LEVEL: string;
    readonly VITE_LIGHTSTANDS_USER_PANEL_BASE: string;
    readonly PACKAGE_VERSION: string;
    readonly BUILD_AT: number;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
